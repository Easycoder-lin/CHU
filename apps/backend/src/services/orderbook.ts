import type { Repository } from "typeorm";
import { In } from "typeorm";

import type { OrderbookOrderActor } from "../entities/OrderbookOrder.js";

import { buildOrderbookSeeds } from "../data/orderbook-seeds.js";
import { AppDataSource, initializeDataSource } from "../db/data-source.js";
import { Offer, OfferStatus } from "../entities/Offer.js";
import { ensureOfferDeadlines } from "./offer-lifecycle.js";
import {
  OrderbookOrder,
  OrderbookOrderLockStatus,
  OrderbookOrderSide,
  OrderbookOrderStatus,
} from "../entities/OrderbookOrder.js";
import { OrderbookTrade, OrderbookTradeStatus } from "../entities/OrderbookTrade.js";
import {
  computeMatches,
  revertOrdersForFailedTrade,
  type MatchOrder,
} from "./orderbook-matching.js";

export type OrderSide = "BUY" | "SELL";
export type OrderStatus = "OPEN" | "PARTIAL" | "FILLED" | "CANCELLED";
export type OrderActor = "SPONSOR" | "MEMBER";
export const PRODUCT_IDS = [
  "NETFLIX_ANNUAL",
  "SPOTIFY_ANNUAL",
  "CHATGPT_ANNUAL",
  "GEMINI_ANNUAL",
  "YOUTUBE_PREMIUM_ANNUAL",
  "DISNEY_BUNDLE_ANNUAL",
  "APPLE_ONE_ANNUAL",
  "PRIME_VIDEO_ANNUAL",
] as const;
export type ProductId = typeof PRODUCT_IDS[number];

export type AllocationState = "ACTIVE" | "EXITED" | "TERMINATED";
export type PendingSettlement = {
  tradeId: string;
  product: ProductId;
  price: number;
  quantity: number;
  baseAmount: number;
  feeBps: number;
  feeAmount: number;
  totalAmount: number;
  offerId?: string;
  offerObjectId?: string;
  lockObjectId?: string;
  lockTxDigest?: string;
  createdAt: string;
};

export type Order = {
  id: string;
  product: ProductId;
  side: OrderSide;
  price: number;
  quantity: number;
  remaining: number;
  status: OrderStatus;
  actor: OrderActor;
  walletAddress?: string;
  lockAmount?: number;
  lockUsedAmount?: number;
  lockAsset?: string;
  lockTxDigest?: string;
  lockObjectId?: string;
  lockStatus?: OrderbookOrderLockStatus;
  createdAt: string;
  updatedAt: string;
};

export type Trade = {
  id: string;
  product: ProductId;
  buyOrderId: string;
  sellOrderId: string;
  price: number;
  quantity: number;
  createdAt: string;
};

export type Allocation = {
  id: string;
  marketId: ProductId;
  offerId: string;
  bidId: string;
  buyerWallet?: string;
  sellerWallet?: string;
  price: number;
  qty: number;
  state: AllocationState;
  createdAt: string;
};

export type MarketSummary = {
  id: ProductId;
  name: string;
  bestBid?: number;
  bestAsk?: number;
  spread?: number;
  canCross: boolean;
};

export type OrderLevel = {
  price: number;
  size: number;
  orderCount: number;
};

export type OrderBookSnapshot = {
  product: ProductId;
  bids: OrderLevel[];
  asks: OrderLevel[];
  bestBid?: number;
  bestAsk?: number;
  spread?: number;
  lastTrade?: Trade;
  timestamp: string;
};

type PlaceOrderInput = {
  product: ProductId;
  side: OrderSide;
  price: number;
  quantity: number;
  actor: OrderActor;
  walletAddress?: string;
  lockAmount?: number;
  lockAsset?: string;
  lockTxDigest?: string;
  lockObjectId?: string;
};

const DEFAULT_PRODUCT: ProductId = PRODUCT_IDS[0];
const EXECUTION_TIMEOUT_MS = 5 * 60 * 1000;

type SettlementResult =
  | { ok: true; txDigest?: string }
  | { ok: false; errorReason: string };

function isValidProduct(product?: string): product is ProductId {
  return !!product && PRODUCT_IDS.includes(product as ProductId);
}

const PRODUCT_META: Record<ProductId, string> = {
  NETFLIX_ANNUAL: "Netflix 年度會員",
  SPOTIFY_ANNUAL: "Spotify 年度會員",
  CHATGPT_ANNUAL: "ChatGPT Plus 年度",
  GEMINI_ANNUAL: "Gemini Advanced 年度",
  YOUTUBE_PREMIUM_ANNUAL: "YouTube Premium 年度",
  DISNEY_BUNDLE_ANNUAL: "Disney+ Bundle 年度",
  APPLE_ONE_ANNUAL: "Apple One 年度",
  PRIME_VIDEO_ANNUAL: "Prime Video 年度",
};

class OrderBookService {
  private seedPromise: Promise<void> | null = null;

  async getSnapshot(product: string = DEFAULT_PRODUCT): Promise<OrderBookSnapshot> {
    const productId = isValidProduct(product) ? product : DEFAULT_PRODUCT;
    const orders = await this.getOrders(productId);
    const resting = orders.filter(order => order.status === "OPEN" || order.status === "PARTIAL");
    const bids = this.aggregateLevels(resting, "BUY");
    const asks = this.aggregateLevels(resting, "SELL");
    const bestBid = bids[0]?.price;
    const bestAsk = asks[0]?.price;
    const lastTrade = await this.getLastTrade(productId);

    return {
      product: productId,
      bids,
      asks,
      bestBid,
      bestAsk,
      spread: bestBid && bestAsk ? Number((bestAsk - bestBid).toFixed(2)) : undefined,
      lastTrade,
      timestamp: new Date().toISOString(),
    };
  }

  async getOrders(product: string = DEFAULT_PRODUCT, params?: { side?: OrderSide; status?: OrderStatus }): Promise<Order[]> {
    const productId = isValidProduct(product) ? product : DEFAULT_PRODUCT;
    await this.ensureSeeded();
    const repository = AppDataSource.getRepository(OrderbookOrder);
    const qb = repository.createQueryBuilder("order");
    qb.where("order.product = :product", { product: productId });
    if (params?.side)
      qb.andWhere("order.side = :side", { side: params.side });
    if (params?.status)
      qb.andWhere("order.status = :status", { status: params.status });
    qb.orderBy("order.createdAt", "ASC");
    const orders = await qb.getMany();
    return orders.map(order => this.mapEntityToOrder(order));
  }

  async getTrades(_product: string = DEFAULT_PRODUCT): Promise<Trade[]> {
    const productId = isValidProduct(_product) ? _product : DEFAULT_PRODUCT;
    await this.ensureSeeded();
    const repository = AppDataSource.getRepository(OrderbookTrade);
    const trades = await repository.find({
      where: { product: productId, status: OrderbookTradeStatus.SETTLED },
      order: { createdAt: "ASC" },
    });
    return trades.map(trade => this.mapEntityToTrade(trade));
  }

  async getAllocationsByWallet(_wallet?: string, _product?: string): Promise<Allocation[]> {
    await this.ensureSeeded();
    if (!_wallet) return [];
    const repository = AppDataSource.getRepository(OrderbookTrade);
    const qb = repository.createQueryBuilder("trade");
    qb.where("trade.status = :status", { status: OrderbookTradeStatus.SETTLED });
    qb.andWhere("trade.buyWalletAddress = :wallet", { wallet: _wallet });
    if (_product && isValidProduct(_product)) {
      qb.andWhere("trade.product = :product", { product: _product });
    }
    qb.orderBy("trade.createdAt", "DESC");
    const trades = await qb.getMany();
    return trades.map(trade => ({
      id: trade.id,
      marketId: trade.product as ProductId,
      offerId: trade.offerId || trade.sellOrderId,
      bidId: trade.buyOrderId,
      buyerWallet: trade.buyWalletAddress || undefined,
      sellerWallet: trade.sellWalletAddress || undefined,
      price: trade.price,
      qty: trade.quantity,
      state: trade.status === OrderbookTradeStatus.SETTLED ? "ACTIVE" : "TERMINATED",
      createdAt: trade.createdAt.toISOString(),
    }));
  }

  async getPendingSettlements(walletAddress: string): Promise<PendingSettlement[]> {
    await this.ensureSeeded();
    const tradeRepository = AppDataSource.getRepository(OrderbookTrade);
    const trades = await tradeRepository.find({
      where: {
        buyWalletAddress: walletAddress,
        status: OrderbookTradeStatus.AWAITING_SETTLEMENT,
      },
      order: { createdAt: "DESC" },
    });
    if (trades.length === 0) return [];

    const offerIds = trades
      .map(trade => trade.offerId)
      .filter((id): id is string => Boolean(id));
    const offerRepository = AppDataSource.getRepository(Offer);
    const offers = offerIds.length > 0 ? await offerRepository.findBy({ id: In(offerIds) }) : [];
    const offerById = new Map(offers.map(offer => [offer.id, offer]));

    return trades.map(trade => {
      const offer = trade.offerId ? offerById.get(trade.offerId) : undefined;
      return {
        tradeId: trade.id,
        product: trade.product as ProductId,
        price: trade.price,
        quantity: trade.quantity,
        baseAmount: trade.baseAmount,
        feeBps: trade.feeBps,
        feeAmount: trade.feeAmount,
        totalAmount: trade.totalAmount,
        offerId: trade.offerId ?? undefined,
        offerObjectId: offer?.offerObjectId ?? undefined,
        lockObjectId: trade.lockObjectId ?? undefined,
        lockTxDigest: trade.lockTxDigest ?? undefined,
        createdAt: trade.createdAt.toISOString(),
      };
    });
  }

  async getMarketSummaries(): Promise<MarketSummary[]> {
    const summaries: MarketSummary[] = [];
    for (const pid of PRODUCT_IDS) {
      const orders = await this.getOrders(pid);
      const resting = orders.filter(order => order.status === "OPEN" || order.status === "PARTIAL");
      const bids = this.aggregateLevels(resting, "BUY");
      const asks = this.aggregateLevels(resting, "SELL");
      const bestBid = bids[0]?.price;
      const bestAsk = asks[0]?.price;
      const spread = bestBid && bestAsk ? Number((bestAsk - bestBid).toFixed(2)) : undefined;
      summaries.push({
        id: pid,
        name: PRODUCT_META[pid],
        bestBid,
        bestAsk,
        spread,
        canCross: typeof bestBid === "number" && typeof bestAsk === "number" ? bestBid >= bestAsk : false,
      });
    }
    return summaries;
  }

  async placeOrder(input: PlaceOrderInput): Promise<{ order: Order; trades: Trade[] }> {
    await this.ensureSeeded();
    if (input.side === "SELL" && input.actor !== "SPONSOR") {
      throw new Error("Only sponsors can place sell orders.");
    }
    if (input.actor === "MEMBER" && !input.walletAddress) {
      throw new Error("Member wallet address required.");
    }
    if (input.actor === "MEMBER" && input.side === "BUY") {
      if (!input.lockTxDigest || !input.lockObjectId || !input.lockAmount) {
        throw new Error("Buy orders require a pre-funded escrow lock.");
      }
      const requiredAmount = Math.round(input.price) * Math.max(1, Math.floor(input.quantity));
      if (input.lockAmount < requiredAmount) {
        throw new Error("Escrow lock amount does not cover order total.");
      }
    }

    if (!isValidProduct(input.product)) {
      throw new Error("Invalid product");
    }
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let created: OrderbookOrder;
    let trades: OrderbookTrade[] = [];

    try {
      const repository = queryRunner.manager.getRepository(OrderbookOrder);
      created = await repository.save(
        repository.create({
          product: input.product,
          side: input.side,
          price: Math.round(input.price),
          quantity: Math.max(1, Math.floor(input.quantity)),
          remaining: Math.max(1, Math.floor(input.quantity)),
          status: OrderbookOrderStatus.OPEN,
          actor: input.actor,
          walletAddress: input.walletAddress || null,
          lockAmount: input.lockAmount ?? null,
          lockUsedAmount: 0,
          lockAsset: input.lockAsset ?? null,
          lockTxDigest: input.lockTxDigest ?? null,
          lockObjectId: input.lockObjectId ?? null,
          lockStatus: input.lockAmount ? OrderbookOrderLockStatus.LOCKED : null,
        }),
      );
      trades = await this.matchOrder(queryRunner, created);
      await queryRunner.commitTransaction();
    }
    catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
    finally {
      await queryRunner.release();
    }

    const executedTrades = await this.executeTrades(trades);
    const fresh = await AppDataSource.getRepository(OrderbookOrder).findOneBy({ id: created.id });
    return {
      order: this.mapEntityToOrder(fresh ?? created),
      trades: executedTrades.map(trade => this.mapEntityToTrade(trade)),
    };
  }

  async cancelOrder(product: string, id: string): Promise<Order> {
    const productId = isValidProduct(product) ? product : DEFAULT_PRODUCT;
    await this.ensureSeeded();
    const repository = AppDataSource.getRepository(OrderbookOrder);
    const order = await repository.findOneBy({ id, product: productId });
    if (!order) {
      throw new Error("Order not found");
    }
    if (order.status === OrderbookOrderStatus.FILLED || order.status === OrderbookOrderStatus.CANCELLED) {
      throw new Error("Order can no longer be cancelled");
    }
    order.status = OrderbookOrderStatus.CANCELLED;
    order.remaining = 0;
    if (order.lockAmount) {
      order.lockStatus = order.lockUsedAmount > 0
        ? OrderbookOrderLockStatus.PARTIALLY_USED
        : OrderbookOrderLockStatus.REFUNDED;
    }
    const updated = await repository.save(order);
    return this.mapEntityToOrder(updated);
  }

  async matchExistingOrder(orderId: string): Promise<Trade[]> {
    await this.ensureSeeded();
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let trades: OrderbookTrade[] = [];
    try {
      const repository = queryRunner.manager.getRepository(OrderbookOrder);
      const order = await repository.findOne({
        where: { id: orderId },
        lock: { mode: "pessimistic_write" },
      });
      if (
        !order
        || order.remaining <= 0
        || order.status === OrderbookOrderStatus.CANCELLED
        || order.status === OrderbookOrderStatus.FILLED
      ) {
        await queryRunner.commitTransaction();
        return [];
      }
      trades = await this.matchOrder(queryRunner, order);
      await queryRunner.commitTransaction();
    }
    catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
    finally {
      await queryRunner.release();
    }
    const executedTrades = await this.executeTrades(trades);
    return executedTrades.map(trade => this.mapEntityToTrade(trade));
  }

  async confirmTradeSettlement(params: { tradeId: string; walletAddress: string; txDigest?: string }): Promise<OrderbookTrade> {
    await this.ensureSeeded();
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let trade: OrderbookTrade | null = null;
    try {
      const tradeRepository = queryRunner.manager.getRepository(OrderbookTrade);
      trade = await tradeRepository.findOne({
        where: { id: params.tradeId },
        lock: { mode: "pessimistic_write" },
      });
      if (!trade) {
        throw new Error("Trade not found");
      }
      if (trade.buyWalletAddress !== params.walletAddress) {
        throw new Error("Wallet address does not match trade buyer");
      }
      if (trade.status === OrderbookTradeStatus.SETTLED) {
        await queryRunner.commitTransaction();
        return trade;
      }
      if (trade.status !== OrderbookTradeStatus.AWAITING_SETTLEMENT) {
        throw new Error("Trade is not awaiting settlement");
      }

      trade.status = OrderbookTradeStatus.EXECUTING;
      if (params.txDigest) trade.txDigest = params.txDigest;
      trade.errorReason = null;
      await tradeRepository.save(trade);
      await queryRunner.commitTransaction();
    }
    catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
    finally {
      await queryRunner.release();
    }

    const settled = await this.applyTradeResult(trade.id, { ok: true, txDigest: params.txDigest });
    if (!settled) {
      throw new Error("Unable to settle trade");
    }
    return settled;
  }

  private async matchOrder(queryRunner: ReturnType<typeof AppDataSource.createQueryRunner>, order: OrderbookOrder): Promise<OrderbookTrade[]> {
    const repository = queryRunner.manager.getRepository(OrderbookOrder);
    const tradeRepository = queryRunner.manager.getRepository(OrderbookTrade);
    const incoming = await repository.findOne({
      where: { id: order.id },
      lock: { mode: "pessimistic_write" },
    });
    if (
      !incoming
      || incoming.remaining <= 0
      || incoming.status === OrderbookOrderStatus.CANCELLED
      || incoming.status === OrderbookOrderStatus.FILLED
    ) {
      return [];
    }

    const oppositeSide = incoming.side === OrderbookOrderSide.BUY ? OrderbookOrderSide.SELL : OrderbookOrderSide.BUY;
    const oppositeCondition = incoming.side === OrderbookOrderSide.BUY
      ? "order.price <= :price"
      : "order.price >= :price";
    const priceDirection = incoming.side === OrderbookOrderSide.BUY ? "ASC" : "DESC";

    const candidates = await repository.createQueryBuilder("order")
      .setLock("pessimistic_write")
      .where("order.product = :product", { product: incoming.product })
      .andWhere("order.side = :side", { side: oppositeSide })
      .andWhere("order.status IN (:...statuses)", { statuses: [OrderbookOrderStatus.OPEN, OrderbookOrderStatus.PARTIAL] })
      .andWhere("order.remaining > 0")
      .andWhere(oppositeCondition, { price: incoming.price })
      .orderBy("order.price", priceDirection)
      .addOrderBy("order.createdAt", "ASC")
      .getMany();

    if (candidates.length === 0) return [];

    const matchInput = this.mapEntityToMatchOrder(incoming);
    const matchCandidates = candidates.map(order => this.mapEntityToMatchOrder(order));
    const { trades, updatedOrders } = computeMatches(matchInput, matchCandidates);

    const updatedIncoming = updatedOrders.get(incoming.id);
    if (updatedIncoming) {
      incoming.remaining = updatedIncoming.remaining;
      incoming.status = updatedIncoming.status as OrderbookOrderStatus;
    }

    const updatedCandidates: OrderbookOrder[] = [];
    for (const candidate of candidates) {
      const updated = updatedOrders.get(candidate.id);
      if (!updated) continue;
      candidate.remaining = updated.remaining;
      candidate.status = updated.status as OrderbookOrderStatus;
      updatedCandidates.push(candidate);
    }

    if (trades.length === 0) return [];

    await repository.save([incoming, ...updatedCandidates]);

    const orderById = new Map<string, OrderbookOrder>();
    orderById.set(incoming.id, incoming);
    for (const candidate of candidates) {
      orderById.set(candidate.id, candidate);
    }

    const offerIds = trades
      .map(trade => trade.offerId)
      .filter((id): id is string => Boolean(id));
    const offers = offerIds.length > 0
      ? await queryRunner.manager.getRepository(Offer).findBy({ id: In(offerIds) })
      : [];
    const offerById = new Map(offers.map(offer => [offer.id, offer]));

    const tradeEntities = trades.map(trade => {
      const buyOrder = orderById.get(trade.buyOrderId);
      const baseAmount = trade.price * trade.quantity;
      const offer = trade.offerId ? offerById.get(trade.offerId) : undefined;
      const feeBps = offer?.platformFeeBps ?? 0;
      const feeAmount = Math.round((baseAmount * feeBps) / 10_000);
      const totalAmount = baseAmount + feeAmount;
      return tradeRepository.create({
        product: incoming.product,
        buyOrderId: trade.buyOrderId,
        sellOrderId: trade.sellOrderId,
        price: trade.price,
        quantity: trade.quantity,
        baseAmount,
        feeBps,
        feeAmount,
        totalAmount,
        status: OrderbookTradeStatus.PENDING_EXECUTION,
        buyWalletAddress: trade.buyWalletAddress ?? null,
        sellWalletAddress: trade.sellWalletAddress ?? null,
        offerId: trade.offerId ?? null,
        lockObjectId: buyOrder?.lockObjectId ?? null,
        lockTxDigest: buyOrder?.lockTxDigest ?? null,
      });
    });

    const savedTrades = await tradeRepository.save(tradeEntities);
    return savedTrades;
  }

  private async executeTrades(trades: OrderbookTrade[]): Promise<OrderbookTrade[]> {
    const executed: OrderbookTrade[] = [];
    for (const trade of trades) {
      const result = await this.executeTrade(trade.id);
      if (result) executed.push(result);
    }
    return executed;
  }

  private async executeTrade(tradeId: string): Promise<OrderbookTrade | null> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let trade: OrderbookTrade | null = null;

    try {
      const tradeRepository = queryRunner.manager.getRepository(OrderbookTrade);
      trade = await tradeRepository.findOne({
        where: { id: tradeId },
        lock: { mode: "pessimistic_write" },
      });
      if (!trade) {
        await queryRunner.commitTransaction();
        return null;
      }
      if (trade.status === OrderbookTradeStatus.SETTLED || trade.status === OrderbookTradeStatus.FAILED) {
        await queryRunner.commitTransaction();
        return trade;
      }
      if (trade.status === OrderbookTradeStatus.AWAITING_SETTLEMENT) {
        await queryRunner.commitTransaction();
        return trade;
      }
      const isStale = trade.status === OrderbookTradeStatus.EXECUTING
        && Date.now() - trade.updatedAt.getTime() > EXECUTION_TIMEOUT_MS;
      if (trade.status === OrderbookTradeStatus.EXECUTING && !isStale) {
        await queryRunner.commitTransaction();
        return trade;
      }
      if (trade.buyWalletAddress && !trade.lockObjectId) {
        trade.status = OrderbookTradeStatus.FAILED;
        trade.errorReason = "Missing escrow lock for buy order";
        await tradeRepository.save(trade);
        await queryRunner.commitTransaction();
        return trade;
      }

      trade.status = OrderbookTradeStatus.AWAITING_SETTLEMENT;
      trade.errorReason = null;
      await tradeRepository.save(trade);
      console.info("[orderbook] trade awaiting escrow settlement", {
        tradeId: trade.id,
        buyOrderId: trade.buyOrderId,
        sellOrderId: trade.sellOrderId,
        totalAmount: trade.totalAmount,
      });
      await queryRunner.commitTransaction();
    }
    catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
    finally {
      await queryRunner.release();
    }

    if (!trade) return null;

    return trade;
  }

  private async applyTradeResult(tradeId: string, settlement: SettlementResult): Promise<OrderbookTrade | null> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const tradeRepository = queryRunner.manager.getRepository(OrderbookTrade);
      const orderRepository = queryRunner.manager.getRepository(OrderbookOrder);
      const offerRepository = queryRunner.manager.getRepository(Offer);
      const trade = await tradeRepository.findOne({
        where: { id: tradeId },
        lock: { mode: "pessimistic_write" },
      });
      if (!trade) {
        await queryRunner.commitTransaction();
        return null;
      }
      if (trade.status !== OrderbookTradeStatus.EXECUTING) {
        await queryRunner.commitTransaction();
        return trade;
      }

      if (settlement.ok) {
        trade.status = OrderbookTradeStatus.SETTLED;
        trade.txDigest = settlement.txDigest ?? trade.txDigest ?? null;
        trade.errorReason = null;
        await tradeRepository.save(trade);
        const buyOrder = await orderRepository.findOne({
          where: { id: trade.buyOrderId },
          lock: { mode: "pessimistic_write" },
        });
        if (buyOrder && buyOrder.lockAmount) {
          const nextUsed = Math.min(buyOrder.lockAmount, buyOrder.lockUsedAmount + trade.totalAmount);
          buyOrder.lockUsedAmount = nextUsed;
          buyOrder.lockStatus = nextUsed >= buyOrder.lockAmount
            ? OrderbookOrderLockStatus.SETTLED
            : OrderbookOrderLockStatus.PARTIALLY_USED;
          await orderRepository.save(buyOrder);
        }
        await this.applySettlementToOffer(offerRepository, trade);
        console.info("[orderbook] trade settled", {
          tradeId: trade.id,
          buyOrderId: trade.buyOrderId,
          sellOrderId: trade.sellOrderId,
          quantity: trade.quantity,
          txDigest: trade.txDigest,
        });
        await queryRunner.commitTransaction();
        return trade;
      }

      const buyOrder = await orderRepository.findOne({
        where: { id: trade.buyOrderId },
        lock: { mode: "pessimistic_write" },
      });
      const sellOrder = await orderRepository.findOne({
        where: { id: trade.sellOrderId },
        lock: { mode: "pessimistic_write" },
      });

      if (buyOrder && sellOrder) {
        const restored = revertOrdersForFailedTrade(
          this.mapEntityToMatchOrder(buyOrder),
          this.mapEntityToMatchOrder(sellOrder),
          trade.quantity,
        );
        buyOrder.remaining = restored.buyOrder.remaining;
        buyOrder.status = restored.buyOrder.status as OrderbookOrderStatus;
        sellOrder.remaining = restored.sellOrder.remaining;
        sellOrder.status = restored.sellOrder.status as OrderbookOrderStatus;
        await orderRepository.save([buyOrder, sellOrder]);
      }

      trade.status = OrderbookTradeStatus.FAILED;
      trade.errorReason = settlement.errorReason;
      await tradeRepository.save(trade);
      console.warn("[orderbook] trade failed", {
        tradeId: trade.id,
        buyOrderId: trade.buyOrderId,
        sellOrderId: trade.sellOrderId,
        quantity: trade.quantity,
        errorReason: settlement.errorReason,
      });
      await queryRunner.commitTransaction();
      return trade;
    }
    catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
    finally {
      await queryRunner.release();
    }
  }

  private async applySettlementToOffer(repository: Repository<Offer>, trade: OrderbookTrade): Promise<void> {
    if (!trade.offerId) return;
    const offer = await repository.findOne({
      where: { id: trade.offerId },
      lock: { mode: "pessimistic_write" },
    });
    if (!offer) return;
    const nextSeatsSold = Math.min(offer.seatCap, offer.seatsSold + trade.quantity);
    offer.seatsSold = nextSeatsSold;
    if (trade.buyWalletAddress) {
      const members = new Set(offer.members ?? []);
      members.add(trade.buyWalletAddress);
      offer.members = Array.from(members);
    }
    if (![OfferStatus.FAILED, OfferStatus.SLASHED, OfferStatus.SETTLED].includes(offer.status)) {
      const isFull = nextSeatsSold >= offer.seatCap;
      offer.status = isFull ? OfferStatus.WAITING_FOR_CREDENTIAL : OfferStatus.OPEN;
      if (isFull) {
        ensureOfferDeadlines(offer, Date.now());
      }
    }
    await repository.save(offer);
  }


  private aggregateLevels(orders: Order[], side: OrderSide): OrderLevel[] {
    const openOrders = orders.filter(order => order.side === side && order.remaining > 0);
    const aggregated = new Map<number, { size: number; count: number }>();

    for (const order of openOrders) {
      if (order.remaining <= 0)
        continue;
      const current = aggregated.get(order.price) ?? { size: 0, count: 0 };
      aggregated.set(order.price, {
        size: Number((current.size + order.remaining).toFixed(4)),
        count: current.count + 1,
      });
    }

    const levels: OrderLevel[] = Array.from(aggregated.entries()).map(([price, data]) => ({
      price,
      size: data.size,
      orderCount: data.count,
    }));

    return levels.sort((a, b) => {
      return side === "BUY" ? b.price - a.price : a.price - b.price;
    });
  }

  private async ensureSeeded(): Promise<void> {
    if (this.seedPromise)
      return this.seedPromise;
    this.seedPromise = this.seedOrders();
    return this.seedPromise;
  }

  private async seedOrders(): Promise<void> {
    await initializeDataSource();
    const seedByProduct = buildOrderbookSeeds(new Date());

    const repository = AppDataSource.getRepository(OrderbookOrder);
    const seedOrders = PRODUCT_IDS.flatMap(product =>
      (seedByProduct[product] ?? []).map((seed) => {
        const orderHash = `orderbook-seed:${product}:${seed.side}:${seed.walletAddress || "unknown"}:${seed.price}:${seed.quantity}`;
        return {
          product,
          orderHash,
          seed,
        };
      }),
    );

    const existing = await repository.find({
      where: { orderHash: In(seedOrders.map(seed => seed.orderHash)) },
    });
    const existingHashes = new Set(existing.map(order => order.orderHash));

    const inserts = seedOrders
      .filter(seed => !existingHashes.has(seed.orderHash))
      .map(({ seed, orderHash, product }) =>
        repository.create({
          product,
          side: seed.side as OrderbookOrderSide,
          price: Math.round(seed.price),
          quantity: Math.max(1, Math.floor(seed.quantity)),
          remaining: Math.max(1, Math.floor(seed.remaining)),
          status: seed.status as OrderbookOrderStatus,
          actor: seed.actor as OrderbookOrderActor,
          walletAddress: seed.walletAddress || null,
          orderHash,
          createdAt: new Date(seed.createdAt),
          updatedAt: new Date(seed.updatedAt),
        }),
      );

    if (inserts.length > 0) {
      await repository.save(inserts);
    }
  }

  private async getLastTrade(product: ProductId): Promise<Trade | undefined> {
    const repository = AppDataSource.getRepository(OrderbookTrade);
    const trade = await repository.findOne({
      where: { product, status: OrderbookTradeStatus.SETTLED },
      order: { createdAt: "DESC" },
    });
    return trade ? this.mapEntityToTrade(trade) : undefined;
  }

  private mapEntityToMatchOrder(order: OrderbookOrder): MatchOrder {
    return {
      id: order.id,
      side: order.side as MatchOrder["side"],
      price: order.price,
      quantity: order.quantity,
      remaining: order.remaining,
      status: order.status as MatchOrder["status"],
      walletAddress: order.walletAddress ?? null,
      orderHash: order.orderHash ?? null,
      createdAt: order.createdAt,
    };
  }

  private mapEntityToOrder(order: OrderbookOrder): Order {
    return {
      id: order.id,
      product: order.product as ProductId,
      side: order.side as OrderSide,
      price: Number(order.price),
      quantity: order.quantity,
      remaining: order.remaining,
      status: order.status as OrderStatus,
      actor: order.actor as OrderActor,
      walletAddress: order.walletAddress || undefined,
      lockAmount: order.lockAmount ?? undefined,
      lockUsedAmount: order.lockUsedAmount ?? undefined,
      lockAsset: order.lockAsset ?? undefined,
      lockTxDigest: order.lockTxDigest ?? undefined,
      lockObjectId: order.lockObjectId ?? undefined,
      lockStatus: order.lockStatus ?? undefined,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  private mapEntityToTrade(trade: OrderbookTrade): Trade {
    return {
      id: trade.id,
      product: trade.product as ProductId,
      buyOrderId: trade.buyOrderId,
      sellOrderId: trade.sellOrderId,
      price: trade.price,
      quantity: trade.quantity,
      createdAt: trade.createdAt.toISOString(),
    };
  }
}

export const orderBookService = new OrderBookService();
