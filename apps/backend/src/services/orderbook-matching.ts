export type MatchSide = "BUY" | "SELL";
export type MatchStatus = "OPEN" | "PARTIAL" | "FILLED";

export type MatchOrder = {
  id: string;
  side: MatchSide;
  price: number;
  quantity: number;
  remaining: number;
  status: MatchStatus;
  walletAddress?: string | null;
  orderHash?: string | null;
  createdAt: Date;
};

export type MatchTrade = {
  buyOrderId: string;
  sellOrderId: string;
  price: number;
  quantity: number;
  buyWalletAddress?: string | null;
  sellWalletAddress?: string | null;
  offerId?: string | null;
};

export type MatchOutcome = {
  trades: MatchTrade[];
  updatedOrders: Map<string, MatchOrder>;
};

export function resolveOrderStatus(order: Pick<MatchOrder, "quantity" | "remaining">): MatchStatus {
  if (order.remaining <= 0) return "FILLED";
  if (order.remaining < order.quantity) return "PARTIAL";
  return "OPEN";
}

export function getOfferIdFromOrderHash(orderHash?: string | null): string | null {
  if (!orderHash) return null;
  if (!orderHash.startsWith("offer:")) return null;
  const id = orderHash.slice("offer:".length);
  return id || null;
}

export function computeMatches(input: MatchOrder, candidates: MatchOrder[]): MatchOutcome {
  const incoming: MatchOrder = { ...input };
  const book = candidates.map(order => ({ ...order }));
  const trades: MatchTrade[] = [];

  book.sort((a, b) => {
    if (incoming.side === "BUY") {
      if (a.price !== b.price) return a.price - b.price;
    }
    else {
      if (a.price !== b.price) return b.price - a.price;
    }
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  for (const maker of book) {
    if (incoming.remaining <= 0) break;
    const crosses = incoming.side === "BUY"
      ? incoming.price >= maker.price
      : incoming.price <= maker.price;
    if (!crosses) break;
    if (maker.remaining <= 0) continue;

    const qty = Math.min(incoming.remaining, maker.remaining);
    if (qty <= 0) continue;

    const buyOrder = incoming.side === "BUY" ? incoming : maker;
    const sellOrder = incoming.side === "SELL" ? incoming : maker;

    incoming.remaining -= qty;
    maker.remaining -= qty;
    incoming.status = resolveOrderStatus(incoming);
    maker.status = resolveOrderStatus(maker);

    trades.push({
      buyOrderId: buyOrder.id,
      sellOrderId: sellOrder.id,
      price: maker.price,
      quantity: qty,
      buyWalletAddress: buyOrder.walletAddress ?? null,
      sellWalletAddress: sellOrder.walletAddress ?? null,
      offerId: getOfferIdFromOrderHash(sellOrder.orderHash),
    });
  }

  const updatedOrders = new Map<string, MatchOrder>();
  updatedOrders.set(incoming.id, incoming);
  for (const order of book) {
    updatedOrders.set(order.id, order);
  }

  return { trades, updatedOrders };
}

export function revertOrdersForFailedTrade(
  buyOrder: MatchOrder,
  sellOrder: MatchOrder,
  quantity: number,
): { buyOrder: MatchOrder; sellOrder: MatchOrder } {
  const restoredBuy: MatchOrder = { ...buyOrder };
  const restoredSell: MatchOrder = { ...sellOrder };

  restoredBuy.remaining = Math.min(restoredBuy.quantity, restoredBuy.remaining + quantity);
  restoredSell.remaining = Math.min(restoredSell.quantity, restoredSell.remaining + quantity);
  restoredBuy.status = resolveOrderStatus(restoredBuy);
  restoredSell.status = resolveOrderStatus(restoredSell);

  return { buyOrder: restoredBuy, sellOrder: restoredSell };
}
