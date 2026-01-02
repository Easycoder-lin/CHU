import express from "express";
import { z } from "zod/v4";

import { AppDataSource } from "../db/data-source.js";
import { Offer, OfferStatus } from "../entities/Offer.js";

const router = express.Router();

const createOfferSchema = z.object({
  sponsorAddress: z.string().min(1),
  service: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  seatCap: z.number().int().positive(),
  pricePerSeat: z.number().int().positive(),
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
  chainOfferObjectId: z.string().min(1).optional(),
  seatsSold: z.number().int().min(0).optional(),
  lastError: z.string().optional(),
});

const listQuerySchema = z.object({
  status: z.nativeEnum(OfferStatus).optional(),
  sponsorAddress: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

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
      status: OfferStatus.PENDING,
      seatsSold: 0,
      members: [],
    });

    const created = await repository.save(offer);
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
    if (payload.chainOfferObjectId !== undefined) offer.chainOfferObjectId = payload.chainOfferObjectId;
    if (payload.seatsSold !== undefined) offer.seatsSold = payload.seatsSold;
    if (payload.lastError !== undefined) offer.lastError = payload.lastError;

    const updated = await repository.save(offer);
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
    if (query.cursor) qb.andWhere("offer.createdAt < :cursor", { cursor: new Date(query.cursor) });

    qb.orderBy("offer.createdAt", "DESC").take(query.limit);

    const offers = await qb.getMany();
    const nextCursor = offers.length ? offers[offers.length - 1].createdAt.toISOString() : null;

    res.json({ data: offers, nextCursor });
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

    res.json(offer);
  }
  catch (error) {
    next(error);
  }
});

export default router;
