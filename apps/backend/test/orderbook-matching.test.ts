import { describe, expect, it } from "vitest";

import {
  computeMatches,
  revertOrdersForFailedTrade,
  type MatchOrder,
} from "../src/services/orderbook-matching.js";

const now = new Date("2024-01-01T00:00:00.000Z");

function makeOrder(partial: Partial<MatchOrder> & Pick<MatchOrder, "id" | "side" | "price" | "quantity">): MatchOrder {
  return {
    id: partial.id,
    side: partial.side,
    price: partial.price,
    quantity: partial.quantity,
    remaining: partial.remaining ?? partial.quantity,
    status: partial.status ?? "OPEN",
    walletAddress: partial.walletAddress ?? null,
    orderHash: partial.orderHash ?? null,
    createdAt: partial.createdAt ?? now,
  };
}

describe("computeMatches", () => {
  it("matches exact price and fully fills both orders", () => {
    const buy = makeOrder({ id: "buy-1", side: "BUY", price: 100, quantity: 2 });
    const sell = makeOrder({ id: "sell-1", side: "SELL", price: 100, quantity: 2 });

    const { trades, updatedOrders } = computeMatches(buy, [sell]);

    expect(trades).toHaveLength(1);
    expect(trades[0]).toMatchObject({ buyOrderId: "buy-1", sellOrderId: "sell-1", price: 100, quantity: 2 });
    expect(updatedOrders.get("buy-1")?.remaining).toBe(0);
    expect(updatedOrders.get("buy-1")?.status).toBe("FILLED");
    expect(updatedOrders.get("sell-1")?.remaining).toBe(0);
    expect(updatedOrders.get("sell-1")?.status).toBe("FILLED");
  });

  it("uses resting order price when crossing", () => {
    const buy = makeOrder({ id: "buy-1", side: "BUY", price: 120, quantity: 1 });
    const sell = makeOrder({ id: "sell-1", side: "SELL", price: 110, quantity: 1 });

    const { trades } = computeMatches(buy, [sell]);

    expect(trades).toHaveLength(1);
    expect(trades[0].price).toBe(110);
  });

  it("handles partial fills across multiple makers", () => {
    const buy = makeOrder({ id: "buy-1", side: "BUY", price: 100, quantity: 5 });
    const sellA = makeOrder({ id: "sell-1", side: "SELL", price: 90, quantity: 2, createdAt: new Date(now.getTime() - 1000) });
    const sellB = makeOrder({ id: "sell-2", side: "SELL", price: 95, quantity: 2, createdAt: now });

    const { trades, updatedOrders } = computeMatches(buy, [sellA, sellB]);

    expect(trades).toHaveLength(2);
    expect(updatedOrders.get("buy-1")?.remaining).toBe(1);
    expect(updatedOrders.get("buy-1")?.status).toBe("PARTIAL");
    expect(updatedOrders.get("sell-1")?.status).toBe("FILLED");
    expect(updatedOrders.get("sell-2")?.status).toBe("FILLED");
  });
});

describe("revertOrdersForFailedTrade", () => {
  it("restores remaining quantity and status after failure", () => {
    const buy = makeOrder({ id: "buy-1", side: "BUY", price: 100, quantity: 2, remaining: 0, status: "FILLED" });
    const sell = makeOrder({ id: "sell-1", side: "SELL", price: 100, quantity: 2, remaining: 0, status: "FILLED" });

    const restored = revertOrdersForFailedTrade(buy, sell, 1);

    expect(restored.buyOrder.remaining).toBe(1);
    expect(restored.buyOrder.status).toBe("PARTIAL");
    expect(restored.sellOrder.remaining).toBe(1);
    expect(restored.sellOrder.status).toBe("PARTIAL");
  });
});
