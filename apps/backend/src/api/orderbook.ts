import express from "express";
import { z } from "zod";

import type ErrorResponse from "../interfaces/error-response.js";
import { PRODUCT_IDS, orderBookService, type OrderActor, type OrderSide, type OrderStatus } from "../services/orderbook.js";

const router = express.Router();

const placeOrderSchema = z.object({
  product: z.enum(PRODUCT_IDS, { required_error: "product is required" }),
  side: z.enum(["BUY", "SELL"] satisfies OrderSide[]),
  price: z.preprocess((val) => (typeof val === "string" ? Number(val) : val), z.number().positive()),
  quantity: z.preprocess((val) => (typeof val === "string" ? Number(val) : val), z.number().int().positive()),
  actor: z.enum(["SPONSOR", "MEMBER"] satisfies OrderActor[]).default("MEMBER"),
  walletAddress: z.string().optional(),
});

const orderQuerySchema = z.object({
  product: z.enum(PRODUCT_IDS, { required_error: "product is required" }),
  side: z.enum(["BUY", "SELL"] satisfies OrderSide[]).optional(),
  status: z.enum(["OPEN", "PARTIAL", "FILLED", "CANCELLED"] satisfies OrderStatus[]).optional(),
});

router.get("/book", (req, res) => {
  const parsed = orderQuerySchema.pick({ product: true }).safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "product is required and must be valid", issues: parsed.error.issues });
  }
  res.json(orderBookService.getSnapshot(parsed.data.product));
});

router.get("/orders", (req, res) => {
  const parsed = orderQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid query params",
      issues: parsed.error.issues,
    });
  }

  const orders = orderBookService.getOrders(parsed.data.product, parsed.data);
  res.json({ orders });
});

router.get("/trades", (req, res) => {
  const parsed = orderQuerySchema.pick({ product: true }).safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "product is required and must be valid", issues: parsed.error.issues });
  }
  res.json({ trades: orderBookService.getTrades(parsed.data.product) });
});

router.post<object, object | ErrorResponse, unknown>("/orders", (req, res) => {
  const parsed = placeOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid order payload",
      issues: parsed.error.issues,
    });
  }

  try {
    const result = orderBookService.placeOrder(parsed.data);
    res.status(201).json(result);
  }
  catch (error) {
    const message = error instanceof Error ? error.message : "Unable to place order";
    const status = message.includes("Only sponsors") ? 403 : 400;
    res.status(status).json({ message });
  }
});

router.post<{ id: string }, object | ErrorResponse, unknown>("/orders/:id/cancel", (req, res) => {
  const parsedProduct = orderQuerySchema.pick({ product: true }).safeParse(req.query);
  if (!parsedProduct.success) {
    return res.status(400).json({ message: "product is required and must be valid", issues: parsedProduct.error.issues });
  }
  try {
    const order = orderBookService.cancelOrder(parsedProduct.data.product, req.params.id);
    res.json({ order });
  }
  catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : "Unable to cancel order",
    });
  }
});

export default router;
