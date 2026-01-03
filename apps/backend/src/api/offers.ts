import express from "express";
import { z } from "zod/v4";

import { AppDataSource } from "../db/data-source.js";
import { Offer, OfferStatus } from "../entities/Offer.js";
import { MemberLock, MemberLockStatus } from "../entities/MemberLock.js";
import { OrderbookOrder, OrderbookOrderActor, OrderbookOrderSide, OrderbookOrderStatus } from "../entities/OrderbookOrder.js";
import { env } from "../env.js";
import { getTransactionBlock, verifyOfferCreation } from "../services/sui-rpc.js";
import { orderBookService } from "../services/orderbook.js";
import { buildCredentialRecord, ensureOfferDeadlines } from "../services/offer-lifecycle.js";
import type { ProductId } from "../services/orderbook.js";

const router = express.Router();

const createOfferSchema = z.object({
  sponsorAddress: z.string().min(1),
  service: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  seatCap: z.number().int().positive(),
  pricePerSeat: z.coerce.number().positive().transform((value) => Math.max(1, Math.round(value))),
  period: z.enum(["mo", "yr"]),
  currency: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  sponsorName: z.string().optional().nullable(),
  sponsorAvatar: z.string().optional().nullable(),
  orderHash: z.string().optional().nullable(),
  platformFeeBps: z.number().int().min(0).max(10_000).optional(),
  stakeLocked: z.number().int().min(0).optional(),
});

const updateTxSchema = z.object({
  txDigest: z.string().min(1).optional(),
  status: z.nativeEnum(OfferStatus).optional(),
  offerObjectId: z.string().min(1).optional(),
  poolObjectId: z.string().min(1).optional(),
  seatsSold: z.number().int().min(0).optional(),
  credentials: z.object({
    username: z.string().min(1),
    password: z.string().min(1),
  }).optional(),
});

const joinOfferSchema = z.object({
  memberAddress: z.string().min(1),
  lockedAmount: z.number().int().positive(),
  asset: z.string().min(1).default("SUI"),
  lockTxDigest: z.string().min(1),
  lockObjectId: z.string().min(1).optional(),
});

const listQuerySchema = z.object({
  status: z.nativeEnum(OfferStatus).optional(),
  sponsorAddress: z.string().optional(),
  memberAddress: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const PRODUCT_BY_SERVICE_PERIOD: Record<string, ProductId> = {
  "Netflix:yr": "NETFLIX_ANNUAL",
  "Spotify:yr": "SPOTIFY_ANNUAL",
  "ChatGPT:yr": "CHATGPT_ANNUAL",
  "Gemini:yr": "GEMINI_ANNUAL",
  "YouTube:yr": "YOUTUBE_PREMIUM_ANNUAL",
  "Disney+:yr": "DISNEY_BUNDLE_ANNUAL",
  "Apple One:yr": "APPLE_ONE_ANNUAL",
  "Amazon Prime:yr": "PRIME_VIDEO_ANNUAL",
};

const ORDERBOOK_VISIBLE_STATUSES = new Set<OfferStatus>([
  OfferStatus.CONFIRMED,
  OfferStatus.OPEN,
  OfferStatus.FULL,
  OfferStatus.WAITING_FOR_CREDENTIAL,
  OfferStatus.CREDENTIALS_SUBMITTED,
  OfferStatus.SETTLED,
  OfferStatus.SLASHED,
]);

function mapOfferToProductId(offer: Offer): ProductId | null {
  const key = `${offer.service}:${offer.period}`;
  return PRODUCT_BY_SERVICE_PERIOD[key] ?? null;
}

function mapOfferStatusToOrderStatus(status: OfferStatus, remaining: number): OrderbookOrderStatus {
  if (status === OfferStatus.FAILED || status === OfferStatus.SLASHED || status === OfferStatus.SETTLED) {
    return OrderbookOrderStatus.CANCELLED;
  }
  if (
    remaining <= 0
    || status === OfferStatus.FULL
    || status === OfferStatus.WAITING_FOR_CREDENTIAL
    || status === OfferStatus.CREDENTIALS_SUBMITTED
  ) {
    return OrderbookOrderStatus.FILLED;
  }
  return OrderbookOrderStatus.OPEN;
}

function canViewCredentials(offer: Offer, viewer: { memberAddress?: string; sponsorAddress?: string }): boolean {
  if (viewer.sponsorAddress && offer.sponsorAddress === viewer.sponsorAddress) return true;
  if (viewer.memberAddress && (offer.members ?? []).includes(viewer.memberAddress)) return true;
  return false;
}

function sanitizeOffer(offer: Offer, viewer: { memberAddress?: string; sponsorAddress?: string }): Offer {
  if (canViewCredentials(offer, viewer)) return offer;
  if (!offer.credentials) return offer;
  return { ...offer, credentials: null };
}

async function syncOrderbookFromOffer(offer: Offer): Promise<OrderbookOrder | null> {
  const productId = mapOfferToProductId(offer);
  if (!productId) return null;

  const repository = AppDataSource.getRepository(OrderbookOrder);
  const orderHash = `offer:${offer.id}`;
  if (offer.status === OfferStatus.FAILED) {
    await repository.delete({ orderHash });
    return null;
  }
  if (!ORDERBOOK_VISIBLE_STATUSES.has(offer.status)) return null;
  const remaining = Math.max(offer.seatCap - offer.seatsSold, 0);
  const status = mapOfferStatusToOrderStatus(offer.status, remaining);

  const existing = await repository.findOneBy({ orderHash });
  if (existing) {
    existing.product = productId;
    existing.side = OrderbookOrderSide.SELL;
    existing.price = offer.pricePerSeat;
    existing.quantity = offer.seatCap;
    existing.remaining = remaining;
    existing.status = status;
    existing.actor = OrderbookOrderActor.SPONSOR;
    existing.walletAddress = offer.sponsorAddress;
    return await repository.save(existing);
  }

  return await repository.save(
    repository.create({
      product: productId,
      side: OrderbookOrderSide.SELL,
      price: offer.pricePerSeat,
      quantity: offer.seatCap,
      remaining,
      status,
      actor: OrderbookOrderActor.SPONSOR,
      walletAddress: offer.sponsorAddress,
      orderHash,
    }),
  );
}

async function removeFailedOffer(offer: Offer): Promise<void> {
  const orderRepository = AppDataSource.getRepository(OrderbookOrder);
  await orderRepository.delete({ orderHash: `offer:${offer.id}` });
  const offerRepository = AppDataSource.getRepository(Offer);
  await offerRepository.delete({ id: offer.id });
}

router.post("/", async (req, res, next) => {
  try {
    const payload = createOfferSchema.parse(req.body);
    const repository = AppDataSource.getRepository(Offer);

    const offer = repository.create({
      sponsorAddress: payload.sponsorAddress,
      service: payload.service,
      title: payload.title,
      description: payload.description ?? null,
      seatCap: payload.seatCap,
      pricePerSeat: payload.pricePerSeat,
      period: payload.period,
      currency: payload.currency ?? "USD",
      tags: payload.tags ?? [],
      sponsorName: payload.sponsorName ?? null,
      sponsorAvatar: payload.sponsorAvatar ?? null,
      orderHash: payload.orderHash ?? null,
      platformFeeBps: payload.platformFeeBps ?? 0,
      stakeLocked: payload.stakeLocked ?? 0,
      status: OfferStatus.DRAFT,
      seatsSold: 0,
      members: [],
      packageId: env.SUI_PACKAGE_ID,
      chainNetwork: env.SUI_NETWORK,
      rpcUrl: env.SUI_RPC_URL,
    });

    const created = await repository.save(offer);
    res.status(201).json({
      offerId: created.id,
      chainConfig: {
        packageId: created.packageId,
        rpcUrl: created.rpcUrl,
        network: created.chainNetwork,
      },
      draft: created,
    });
  }
  catch (error) {
    next(error);
  }
});

router.post("/:id/join", async (req, res, next) => {
  try {
    const payload = joinOfferSchema.parse(req.body);
    const offerRepository = AppDataSource.getRepository(Offer);
    const offer = await offerRepository.findOneBy({ id: req.params.id });
    if (!offer) {
      res.status(404).json({ message: "Offer not found" });
      return;
    }

    const lockRepository = AppDataSource.getRepository(MemberLock);
    const existing = await lockRepository.findOneBy({ lockTxDigest: payload.lockTxDigest });
    if (existing) {
      res.json(existing);
      return;
    }

    const lock = lockRepository.create({
      offerId: offer.id,
      memberAddress: payload.memberAddress,
      lockedAmount: payload.lockedAmount,
      asset: payload.asset,
      lockTxDigest: payload.lockTxDigest,
      lockObjectId: payload.lockObjectId ?? null,
      status: MemberLockStatus.LOCKED,
    });

    const created = await lockRepository.save(lock);
    res.status(201).json(created);
  }
  catch (error) {
    next(error);
  }
});

router.patch("/:id/tx", async (req, res, next) => {
  try {
    const payload = updateTxSchema.parse(req.body);
    const repository = AppDataSource.getRepository(Offer);
    const offer = await repository.findOneBy({ id: req.params.id });

    if (!offer) {
      res.status(404).json({ message: "Offer not found" });
      return;
    }

    if (payload.txDigest !== undefined) offer.txDigest = payload.txDigest;
    if (payload.status !== undefined) offer.status = payload.status;
    if (payload.offerObjectId !== undefined) offer.offerObjectId = payload.offerObjectId;
    if (payload.poolObjectId !== undefined) offer.poolObjectId = payload.poolObjectId;
    if (payload.seatsSold !== undefined) offer.seatsSold = payload.seatsSold;

    if (
      payload.status === undefined
      && (payload.txDigest || payload.offerObjectId || payload.poolObjectId)
      && offer.status === OfferStatus.DRAFT
    ) {
      offer.status = OfferStatus.SUBMITTED;
    }

    const nowMs = Date.now();
    if ([OfferStatus.WAITING_FOR_CREDENTIAL, OfferStatus.FULL].includes(offer.status)) {
      ensureOfferDeadlines(offer, nowMs);
    }

    if (payload.credentials) {
      ensureOfferDeadlines(offer, nowMs);
      offer.credentials = buildCredentialRecord(offer, payload.credentials, nowMs);
      if (payload.status === undefined) {
        offer.status = OfferStatus.CREDENTIALS_SUBMITTED;
      }
    }

    if (payload.status === OfferStatus.FAILED) {
      await removeFailedOffer(offer);
      res.json({ message: "Offer removed after failure" });
      return;
    }

    const updated = await repository.save(offer);
    const order = await syncOrderbookFromOffer(updated);
    if (order?.status === OrderbookOrderStatus.OPEN || order?.status === OrderbookOrderStatus.PARTIAL) {
      await orderBookService.matchExistingOrder(order.id);
    }
    res.json(updated);
  }
  catch (error) {
    next(error);
  }
});

router.post("/:id/confirm", async (req, res, next) => {
  try {
    const repository = AppDataSource.getRepository(Offer);
    const offer = await repository.findOneBy({ id: req.params.id });

    if (!offer) {
      res.status(404).json({ message: "Offer not found" });
      return;
    }

    if (!offer.txDigest) {
      res.status(400).json({ message: "Offer is missing txDigest" });
      return;
    }

    let tx;
    try {
      tx = await getTransactionBlock(offer.rpcUrl || env.SUI_RPC_URL, offer.txDigest);
    }
    catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch transaction";
      offer.status = OfferStatus.FAILED;
      offer.errorReason = message;
      const updated = await repository.save(offer);
      await syncOrderbookFromOffer(updated);
      res.status(400).json({ message });
      return;
    }

    const verification = verifyOfferCreation({
      tx,
      packageId: offer.packageId || env.SUI_PACKAGE_ID,
      sponsorAddress: offer.sponsorAddress,
      offerObjectId: offer.offerObjectId,
    });

    if (!verification.ok) {
      const message = verification.errorReason || "Offer confirmation failed";
      offer.status = OfferStatus.FAILED;
      offer.errorReason = message;
      const updated = await repository.save(offer);
      await syncOrderbookFromOffer(updated);
      res.status(400).json({ message });
      return;
    }

    offer.status = OfferStatus.CONFIRMED;
    if (!offer.packageId) offer.packageId = env.SUI_PACKAGE_ID;
    if (!offer.chainNetwork) offer.chainNetwork = env.SUI_NETWORK;
    if (!offer.rpcUrl) offer.rpcUrl = env.SUI_RPC_URL;
    if (!offer.offerObjectId && verification.offerObjectId) {
      offer.offerObjectId = verification.offerObjectId;
    }
    if (!offer.poolObjectId && verification.poolObjectId) {
      offer.poolObjectId = verification.poolObjectId;
    }

    const updated = await repository.save(offer);
    const order = await syncOrderbookFromOffer(updated);
    if (order?.status === OrderbookOrderStatus.OPEN || order?.status === OrderbookOrderStatus.PARTIAL) {
      await orderBookService.matchExistingOrder(order.id);
    }
    res.json(updated);
  }
  catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const repository = AppDataSource.getRepository(Offer);
    const qb = repository.createQueryBuilder("offer");

    if (query.status) qb.andWhere("offer.status = :status", { status: query.status });
    if (query.sponsorAddress) qb.andWhere("offer.sponsorAddress = :sponsorAddress", { sponsorAddress: query.sponsorAddress });
    if (query.memberAddress) qb.andWhere("offer.members @> :member", { member: JSON.stringify([query.memberAddress]) });
    if (query.cursor) qb.andWhere("offer.createdAt < :cursor", { cursor: new Date(query.cursor) });

    qb.orderBy("offer.createdAt", "DESC").take(query.limit);

    const offers = await qb.getMany();
    const nextCursor = offers.length ? offers[offers.length - 1].createdAt.toISOString() : null;

    const viewer = { memberAddress: query.memberAddress, sponsorAddress: query.sponsorAddress };
    res.json({ data: offers.map((offer) => sanitizeOffer(offer, viewer)), nextCursor });
  }
  catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const repository = AppDataSource.getRepository(Offer);
    const offer = await repository.findOneBy({ id: req.params.id });

    if (!offer) {
      res.status(404).json({ message: "Offer not found" });
      return;
    }

    const viewer = {
      memberAddress: typeof req.query.memberAddress === "string" ? req.query.memberAddress : undefined,
      sponsorAddress: typeof req.query.sponsorAddress === "string" ? req.query.sponsorAddress : undefined,
    };
    res.json(sanitizeOffer(offer, viewer));
  }
  catch (error) {
    next(error);
  }
});

export default router;
