import express from "express";
import { z } from "zod";

import { PRODUCT_IDS, orderBookService } from "../services/orderbook.js";

const router = express.Router();

router.get("/", (_req, res) => {
  const markets = orderBookService.getMarketSummaries();
  res.json({ markets });
});

const allocationsQuery = z.object({
  wallet: z.string().min(1, "wallet is required"),
  product: z.enum(PRODUCT_IDS).optional(),
});

router.get("/allocations", (req, res) => {
  const parsed = allocationsQuery.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query params", issues: parsed.error.issues });
  }
  const allocations = orderBookService.getAllocationsByWallet(parsed.data.wallet, parsed.data.product);
  res.json({ allocations });
});

export default router;
