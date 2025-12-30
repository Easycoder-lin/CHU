import { randomUUID } from "node:crypto";

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

export interface Order {
  id: string;
  product: ProductId;
  side: OrderSide;
  price: number;
  quantity: number;
  remaining: number;
  status: OrderStatus;
  actor: OrderActor;
  walletAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Trade {
  id: string;
  product: ProductId;
  buyOrderId: string;
  sellOrderId: string;
  price: number;
  quantity: number;
  createdAt: string;
}

export interface Allocation {
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
}

export interface MatchEvent {
  id: string;
  marketId: ProductId;
  bidId: string;
  offerId: string;
  price: number;
  qty: number;
  createdAt: string;
}

export interface MarketSummary {
  id: ProductId;
  name: string;
  bestBid?: number;
  bestAsk?: number;
  spread?: number;
  canCross: boolean;
}

export interface OrderLevel {
  price: number;
  size: number;
  orderCount: number;
}

export interface OrderBookSnapshot {
  product: ProductId;
  bids: OrderLevel[];
  asks: OrderLevel[];
  bestBid?: number;
  bestAsk?: number;
  spread?: number;
  lastTrade?: Trade;
  timestamp: string;
}

interface PlaceOrderInput {
  product: ProductId;
  side: OrderSide;
  price: number;
  quantity: number;
  actor: OrderActor;
  walletAddress?: string;
}

type BookState = {
  orders: Order[];
  trades: Trade[];
  allocations: Allocation[];
  matchEvents: MatchEvent[];
};

const DEFAULT_PRODUCT: ProductId = PRODUCT_IDS[0];

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
  private books: Map<string, BookState> = new Map();

  constructor() {
    this.seedOrders();
  }

  getSnapshot(product: string = DEFAULT_PRODUCT): OrderBookSnapshot {
    const productId = isValidProduct(product) ? product : DEFAULT_PRODUCT;
    const { trades } = this.ensureProduct(productId);
    const bids = this.aggregateLevels(productId, "BUY");
    const asks = this.aggregateLevels(productId, "SELL");
    const bestBid = bids[0]?.price;
    const bestAsk = asks[0]?.price;

    return {
      product: productId,
      bids,
      asks,
      bestBid,
      bestAsk,
      spread: bestBid && bestAsk ? Number((bestAsk - bestBid).toFixed(2)) : undefined,
      lastTrade: trades.at(-1),
      timestamp: new Date().toISOString(),
    };
  }

  getOrders(product: string = DEFAULT_PRODUCT, params?: { side?: OrderSide; status?: OrderStatus }): Order[] {
    const productId = isValidProduct(product) ? product : DEFAULT_PRODUCT;
    const { orders } = this.ensureProduct(productId);
    return orders.filter((order) => {
      if (params?.side && order.side !== params.side) return false;
      if (params?.status && order.status !== params.status) return false;
      return true;
    });
  }

  getTrades(product: string = DEFAULT_PRODUCT): Trade[] {
    const productId = isValidProduct(product) ? product : DEFAULT_PRODUCT;
    const { trades } = this.ensureProduct(productId);
    return trades;
  }

  getAllocationsByWallet(wallet?: string, product?: string): Allocation[] {
    const productId = isValidProduct(product) ? product : undefined;
    const allocations: Allocation[] = [];
    for (const pid of PRODUCT_IDS) {
      if (productId && pid !== productId) continue;
      const book = this.ensureProduct(pid);
      allocations.push(...book.allocations.filter((a) => a.buyerWallet === wallet));
    }
    return allocations;
  }

  getMarketSummaries(): MarketSummary[] {
    return PRODUCT_IDS.map((pid) => {
      const bids = this.aggregateLevels(pid, "BUY");
      const asks = this.aggregateLevels(pid, "SELL");
      const bestBid = bids[0]?.price;
      const bestAsk = asks[0]?.price;
      const spread = bestBid && bestAsk ? Number((bestAsk - bestBid).toFixed(2)) : undefined;
      return {
        id: pid,
        name: PRODUCT_META[pid],
        bestBid,
        bestAsk,
        spread,
        canCross: typeof bestBid === "number" && typeof bestAsk === "number" ? bestBid >= bestAsk : false,
      };
    });
  }

  placeOrder(input: PlaceOrderInput): { order: Order; trades: Trade[] } {
    if (input.side === "SELL" && input.actor !== "SPONSOR") {
      throw new Error("Only sponsors can place sell orders.");
    }

    if (!isValidProduct(input.product)) {
      throw new Error("Invalid product");
    }
    const productId = input.product;
    const { orders, trades, allocations, matchEvents } = this.ensureProduct(productId);
    const now = new Date().toISOString();
    const newOrder: Order = {
      id: randomUUID(),
      product: productId,
      side: input.side,
      price: Number(input.price.toFixed(2)),
      quantity: input.quantity,
      remaining: input.quantity,
      status: "OPEN",
      actor: input.actor,
      walletAddress: input.walletAddress,
      createdAt: now,
      updatedAt: now,
    };

    const fills: Trade[] = [];
    const bookSide = input.side === "BUY" ? "SELL" : "BUY";
    const restingOrders = this.getRestingOrders(productId, bookSide);

    for (const resting of restingOrders) {
      if (!this.isCrossing(newOrder, resting)) break;

      const fillSize = Math.min(newOrder.remaining, resting.remaining);
      const trade: Trade = {
        id: randomUUID(),
        product: input.product,
        buyOrderId: newOrder.side === "BUY" ? newOrder.id : resting.id,
        sellOrderId: newOrder.side === "SELL" ? newOrder.id : resting.id,
        price: resting.price,
        quantity: fillSize,
        createdAt: new Date().toISOString(),
      };
      fills.push(trade);
      trades.push(trade);

      const buyerWallet = newOrder.side === "BUY" ? newOrder.walletAddress : resting.walletAddress;
      const sellerWallet = newOrder.side === "SELL" ? newOrder.walletAddress : resting.walletAddress;
      allocations.push({
        id: randomUUID(),
        marketId: productId,
        offerId: trade.sellOrderId,
        bidId: trade.buyOrderId,
        buyerWallet,
        sellerWallet,
        price: trade.price,
        qty: fillSize,
        state: "ACTIVE",
        createdAt: trade.createdAt,
      });
      matchEvents.push({
        id: randomUUID(),
        marketId: productId,
        bidId: trade.buyOrderId,
        offerId: trade.sellOrderId,
        price: trade.price,
        qty: fillSize,
        createdAt: trade.createdAt,
      });

      // Update quantities and statuses on resting order
      resting.remaining -= fillSize;
      resting.updatedAt = trade.createdAt;
      resting.status = resting.remaining === 0 ? "FILLED" : "PARTIAL";

      // Update incoming order
      newOrder.remaining -= fillSize;
      newOrder.status = newOrder.remaining === 0 ? "FILLED" : "PARTIAL";
      newOrder.updatedAt = trade.createdAt;

      if (newOrder.remaining === 0) break;
    }

    orders.push(newOrder);

    return { order: newOrder, trades: fills };
  }

  cancelOrder(product: string, id: string): Order {
    const productId = isValidProduct(product) ? product : DEFAULT_PRODUCT;
    const { orders } = this.ensureProduct(productId);
    const order = orders.find((o) => o.id === id);
    if (!order) {
      throw new Error("Order not found");
    }
    if (order.status === "FILLED" || order.status === "CANCELLED") {
      throw new Error("Order can no longer be cancelled");
    }
    order.status = "CANCELLED";
    order.remaining = 0;
    order.updatedAt = new Date().toISOString();
    return order;
  }

  private ensureProduct(product: string = DEFAULT_PRODUCT): BookState {
    const productId = isValidProduct(product) ? product : DEFAULT_PRODUCT;
    if (!this.books.has(productId)) {
      this.books.set(productId, { orders: [], trades: [], allocations: [], matchEvents: [] });
    }
    return this.books.get(productId)!;
  }

  private aggregateLevels(product: string, side: OrderSide): OrderLevel[] {
    const productId = isValidProduct(product) ? product : DEFAULT_PRODUCT;
    const openOrders = this.getRestingOrders(productId, side);
    const aggregated = new Map<number, { size: number; count: number }>();

    for (const order of openOrders) {
      if (order.remaining <= 0) continue;
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

  private getRestingOrders(product: string = DEFAULT_PRODUCT, side: OrderSide): Order[] {
    const productId = isValidProduct(product) ? product : DEFAULT_PRODUCT;
    const { orders } = this.ensureProduct(productId);
    return orders
      .filter(
        (order) =>
          order.side === side &&
          (order.status === "OPEN" || order.status === "PARTIAL") &&
          order.remaining > 0,
      )
      .sort((a, b) => {
        if (side === "BUY") {
          if (a.price === b.price) return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          return b.price - a.price;
        }
        if (a.price === b.price) return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return a.price - b.price;
      });
  }

  private isCrossing(incoming: Order, resting: Order): boolean {
    if (incoming.side === "BUY") {
      return incoming.price >= resting.price;
    }
    return incoming.price <= resting.price;
  }

  private seedOrders() {
    const now = new Date();
    const pad = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();

    const seedByProduct: Record<ProductId, Array<Omit<Order, "id">>> = {
      NETFLIX_ANNUAL: [
        { product: "NETFLIX_ANNUAL", side: "SELL", price: 130, quantity: 2, remaining: 2, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorA", createdAt: pad(40), updatedAt: pad(40) },
        { product: "NETFLIX_ANNUAL", side: "SELL", price: 128, quantity: 1, remaining: 1, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorB", createdAt: pad(35), updatedAt: pad(35) },
        { product: "NETFLIX_ANNUAL", side: "SELL", price: 126, quantity: 3, remaining: 3, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorC", createdAt: pad(30), updatedAt: pad(30) },
        { product: "NETFLIX_ANNUAL", side: "SELL", price: 134, quantity: 2, remaining: 2, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorD", createdAt: pad(50), updatedAt: pad(50) },
        { product: "NETFLIX_ANNUAL", side: "SELL", price: 132, quantity: 1, remaining: 1, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorE", createdAt: pad(45), updatedAt: pad(45) },
        { product: "NETFLIX_ANNUAL", side: "SELL", price: 125, quantity: 2, remaining: 2, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorF", createdAt: pad(28), updatedAt: pad(28) },
        { product: "NETFLIX_ANNUAL", side: "BUY", price: 120, quantity: 2, remaining: 2, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberA", createdAt: pad(25), updatedAt: pad(25) },
        { product: "NETFLIX_ANNUAL", side: "BUY", price: 118, quantity: 2, remaining: 2, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberB", createdAt: pad(20), updatedAt: pad(20) },
        { product: "NETFLIX_ANNUAL", side: "BUY", price: 115, quantity: 4, remaining: 4, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberC", createdAt: pad(15), updatedAt: pad(15) },
        { product: "NETFLIX_ANNUAL", side: "BUY", price: 112, quantity: 3, remaining: 3, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberD", createdAt: pad(12), updatedAt: pad(12) },
        { product: "NETFLIX_ANNUAL", side: "BUY", price: 110, quantity: 2, remaining: 2, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberE", createdAt: pad(9), updatedAt: pad(9) },
      ],
      SPOTIFY_ANNUAL: [
        { product: "SPOTIFY_ANNUAL", side: "SELL", price: 95, quantity: 2, remaining: 2, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorD", createdAt: pad(30), updatedAt: pad(30) },
        { product: "SPOTIFY_ANNUAL", side: "SELL", price: 92, quantity: 1, remaining: 1, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorE", createdAt: pad(24), updatedAt: pad(24) },
        { product: "SPOTIFY_ANNUAL", side: "SELL", price: 98, quantity: 1, remaining: 1, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorF", createdAt: pad(32), updatedAt: pad(32) },
        { product: "SPOTIFY_ANNUAL", side: "BUY", price: 85, quantity: 3, remaining: 3, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberD", createdAt: pad(18), updatedAt: pad(18) },
        { product: "SPOTIFY_ANNUAL", side: "BUY", price: 82, quantity: 2, remaining: 2, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberE", createdAt: pad(12), updatedAt: pad(12) },
        { product: "SPOTIFY_ANNUAL", side: "BUY", price: 80, quantity: 2, remaining: 2, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberF", createdAt: pad(10), updatedAt: pad(10) },
      ],
      CHATGPT_ANNUAL: [
        { product: "CHATGPT_ANNUAL", side: "SELL", price: 180, quantity: 1, remaining: 1, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorF", createdAt: pad(22), updatedAt: pad(22) },
        { product: "CHATGPT_ANNUAL", side: "SELL", price: 176, quantity: 2, remaining: 2, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorG", createdAt: pad(18), updatedAt: pad(18) },
        { product: "CHATGPT_ANNUAL", side: "SELL", price: 184, quantity: 1, remaining: 1, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorH", createdAt: pad(26), updatedAt: pad(26) },
        { product: "CHATGPT_ANNUAL", side: "BUY", price: 168, quantity: 1, remaining: 1, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberF", createdAt: pad(14), updatedAt: pad(14) },
        { product: "CHATGPT_ANNUAL", side: "BUY", price: 165, quantity: 2, remaining: 2, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberG", createdAt: pad(10), updatedAt: pad(10) },
        { product: "CHATGPT_ANNUAL", side: "BUY", price: 160, quantity: 2, remaining: 2, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberH", createdAt: pad(8), updatedAt: pad(8) },
      ],
      GEMINI_ANNUAL: [
        { product: "GEMINI_ANNUAL", side: "SELL", price: 140, quantity: 1, remaining: 1, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorH", createdAt: pad(25), updatedAt: pad(25) },
        { product: "GEMINI_ANNUAL", side: "SELL", price: 145, quantity: 1, remaining: 1, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorI", createdAt: pad(30), updatedAt: pad(30) },
        { product: "GEMINI_ANNUAL", side: "BUY", price: 125, quantity: 2, remaining: 2, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberH", createdAt: pad(16), updatedAt: pad(16) },
        { product: "GEMINI_ANNUAL", side: "BUY", price: 120, quantity: 1, remaining: 1, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberI", createdAt: pad(12), updatedAt: pad(12) },
        { product: "GEMINI_ANNUAL", side: "BUY", price: 118, quantity: 2, remaining: 2, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberJ", createdAt: pad(9), updatedAt: pad(9) },
      ],
      YOUTUBE_PREMIUM_ANNUAL: [
        { product: "YOUTUBE_PREMIUM_ANNUAL", side: "SELL", price: 110, quantity: 3, remaining: 3, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorY1", createdAt: pad(34), updatedAt: pad(34) },
        { product: "YOUTUBE_PREMIUM_ANNUAL", side: "SELL", price: 108, quantity: 2, remaining: 2, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorY2", createdAt: pad(28), updatedAt: pad(28) },
        { product: "YOUTUBE_PREMIUM_ANNUAL", side: "BUY", price: 100, quantity: 2, remaining: 2, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberY1", createdAt: pad(20), updatedAt: pad(20) },
        { product: "YOUTUBE_PREMIUM_ANNUAL", side: "BUY", price: 98, quantity: 3, remaining: 3, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberY2", createdAt: pad(15), updatedAt: pad(15) },
      ],
      DISNEY_BUNDLE_ANNUAL: [
        { product: "DISNEY_BUNDLE_ANNUAL", side: "SELL", price: 150, quantity: 2, remaining: 2, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorD1", createdAt: pad(36), updatedAt: pad(36) },
        { product: "DISNEY_BUNDLE_ANNUAL", side: "SELL", price: 148, quantity: 2, remaining: 2, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorD2", createdAt: pad(30), updatedAt: pad(30) },
        { product: "DISNEY_BUNDLE_ANNUAL", side: "BUY", price: 138, quantity: 2, remaining: 2, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberD1", createdAt: pad(22), updatedAt: pad(22) },
        { product: "DISNEY_BUNDLE_ANNUAL", side: "BUY", price: 135, quantity: 3, remaining: 3, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberD2", createdAt: pad(18), updatedAt: pad(18) },
      ],
      APPLE_ONE_ANNUAL: [
        { product: "APPLE_ONE_ANNUAL", side: "SELL", price: 170, quantity: 2, remaining: 2, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorA1", createdAt: pad(38), updatedAt: pad(38) },
        { product: "APPLE_ONE_ANNUAL", side: "SELL", price: 165, quantity: 1, remaining: 1, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorA2", createdAt: pad(32), updatedAt: pad(32) },
        { product: "APPLE_ONE_ANNUAL", side: "BUY", price: 150, quantity: 2, remaining: 2, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberA1", createdAt: pad(24), updatedAt: pad(24) },
        { product: "APPLE_ONE_ANNUAL", side: "BUY", price: 146, quantity: 2, remaining: 2, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberA2", createdAt: pad(20), updatedAt: pad(20) },
      ],
      PRIME_VIDEO_ANNUAL: [
        { product: "PRIME_VIDEO_ANNUAL", side: "SELL", price: 105, quantity: 2, remaining: 2, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorP1", createdAt: pad(33), updatedAt: pad(33) },
        { product: "PRIME_VIDEO_ANNUAL", side: "SELL", price: 102, quantity: 1, remaining: 1, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorP2", createdAt: pad(27), updatedAt: pad(27) },
        { product: "PRIME_VIDEO_ANNUAL", side: "BUY", price: 95, quantity: 2, remaining: 2, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberP1", createdAt: pad(21), updatedAt: pad(21) },
        { product: "PRIME_VIDEO_ANNUAL", side: "BUY", price: 92, quantity: 3, remaining: 3, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberP2", createdAt: pad(17), updatedAt: pad(17) },
      ],
    };

    for (const product of PRODUCT_IDS) {
      const book = this.ensureProduct(product);
      const seeds = seedByProduct[product] ?? [];
      book.orders = seeds.map((seed) => ({ ...seed, id: randomUUID() }));
      book.trades = [
        {
          id: randomUUID(),
          product,
          buyOrderId: "historical-buy",
          sellOrderId: "historical-sell",
          price: seeds[0]?.price ?? 100,
          quantity: 1,
          createdAt: pad(45),
        },
      ];
      book.allocations = [];
      book.matchEvents = [];
    }
  }
}

export const orderBookService = new OrderBookService();
