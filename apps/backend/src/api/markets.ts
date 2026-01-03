import express from "express";
import { z } from "zod";

import { orderBookService, PRODUCT_IDS } from "../services/orderbook.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  const markets = await orderBookService.getMarketSummaries();
  res.json({ markets });
});

const allocationsQuery = z.object({
  wallet: z.string().min(1, "wallet is required"),
  product: z.enum(PRODUCT_IDS).optional(),
});

router.get("/allocations", async (req, res) => {
  const parsed = allocationsQuery.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query params", issues: parsed.error.issues });
  }
  const allocations = await orderBookService.getAllocationsByWallet(parsed.data.wallet, parsed.data.product);
  res.json({ allocations });
});

export default router;
