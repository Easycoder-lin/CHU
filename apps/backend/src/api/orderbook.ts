import express from "express";
import { z } from "zod";

import type ErrorResponse from "../interfaces/error-response.js";
import type { OrderActor, OrderSide, OrderStatus } from "../services/orderbook.js";

import { orderBookService, PRODUCT_IDS } from "../services/orderbook.js";

const router = express.Router();

const placeOrderSchema = z.object({
  product: z.enum(PRODUCT_IDS),
  side: z.enum(["BUY", "SELL"] satisfies OrderSide[]),
  price: z.preprocess(val => (typeof val === "string" ? Number(val) : val), z.number().positive()),
  quantity: z.preprocess(val => (typeof val === "string" ? Number(val) : val), z.number().int().positive()),
  actor: z.enum(["SPONSOR", "MEMBER"] satisfies OrderActor[]).default("MEMBER"),
  walletAddress: z.string().optional(),
  lockAmount: z.preprocess(val => (typeof val === "string" ? Number(val) : val), z.number().int().positive()).optional(),
  lockAsset: z.string().optional(),
  lockTxDigest: z.string().optional(),
  lockObjectId: z.string().optional(),
}).superRefine((value, ctx) => {
  if (value.actor === "MEMBER" && !value.walletAddress) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "walletAddress is required for member orders",
      path: ["walletAddress"],
    });
  }
  if (value.actor === "MEMBER" && value.side === "BUY") {
    if (!value.lockAmount || !value.lockTxDigest || !value.lockObjectId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "lockAmount, lockTxDigest, and lockObjectId are required for buy orders",
        path: ["lockAmount"],
      });
    }
  }
});

const orderQuerySchema = z.object({
  product: z.enum(PRODUCT_IDS),
  side: z.enum(["BUY", "SELL"] satisfies OrderSide[]).optional(),
  status: z.enum(["OPEN", "PARTIAL", "FILLED", "CANCELLED"] satisfies OrderStatus[]).optional(),
});

const pendingSettlementsQuerySchema = z.object({
  wallet: z.string().min(1),
});

const confirmSettlementSchema = z.object({
  walletAddress: z.string().min(1),
  txDigest: z.string().min(1).optional(),
});

router.get("/book", async (req, res) => {
  const parsed = orderQuerySchema.pick({ product: true }).safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "product is required and must be valid", issues: parsed.error.issues });
  }
  res.json(await orderBookService.getSnapshot(parsed.data.product));
});

router.get("/orders", async (req, res) => {
  const parsed = orderQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid query params",
      issues: parsed.error.issues,
    });
  }

  const orders = await orderBookService.getOrders(parsed.data.product, parsed.data);
  res.json({ orders });
});

router.get("/trades", async (req, res) => {
  const parsed = orderQuerySchema.pick({ product: true }).safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "product is required and must be valid", issues: parsed.error.issues });
  }
  res.json({ trades: await orderBookService.getTrades(parsed.data.product) });
});

router.get("/pending-settlements", async (req, res) => {
  const parsed = pendingSettlementsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "wallet is required", issues: parsed.error.issues });
  }
  const settlements = await orderBookService.getPendingSettlements(parsed.data.wallet);
  res.json({ settlements });
});

router.post<{ id: string }, object | ErrorResponse, unknown>("/trades/:id/settle", async (req, res) => {
  const parsed = confirmSettlementSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid settlement payload", issues: parsed.error.issues });
  }
  try {
    const trade = await orderBookService.confirmTradeSettlement({
      tradeId: req.params.id,
      walletAddress: parsed.data.walletAddress,
      txDigest: parsed.data.txDigest,
    });
    res.json({ tradeId: trade.id, status: trade.status, txDigest: trade.txDigest });
  }
  catch (error) {
    const message = error instanceof Error ? error.message : "Unable to confirm payment";
    res.status(400).json({ message });
  }
});

router.post<object, object | ErrorResponse, unknown>("/orders", async (req, res) => {
  const parsed = placeOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid order payload",
      issues: parsed.error.issues,
    });
  }

  try {
    const result = await orderBookService.placeOrder(parsed.data);
    res.status(201).json(result);
  }
  catch (error) {
    const message = error instanceof Error ? error.message : "Unable to place order";
    const status = message.includes("Only sponsors") ? 403 : 400;
    res.status(status).json({ message });
  }
});

router.post<{ id: string }, object | ErrorResponse, unknown>("/orders/:id/cancel", async (req, res) => {
  const parsedProduct = orderQuerySchema.pick({ product: true }).safeParse(req.query);
  if (!parsedProduct.success) {
    return res.status(400).json({ message: "product is required and must be valid", issues: parsedProduct.error.issues });
  }
  try {
    const order = await orderBookService.cancelOrder(parsedProduct.data.product, req.params.id);
    res.json({ order });
  }
  catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : "Unable to cancel order",
    });
  }
});

export default router;
