import { apiRequest } from "@/lib/api"
import { Order, OrderBookSnapshot, OrderSide, OrderStatus, PendingSettlement, ProductId, Trade } from "@/types"

export interface PlaceOrderPayload {
    side: OrderSide
    price: number
    quantity: number
    actor: "SPONSOR" | "MEMBER"
    walletAddress?: string | null
    product: ProductId
    lockAmount?: number
    lockAsset?: string
    lockTxDigest?: string
    lockObjectId?: string
}

export function fetchOrderBook(product: ProductId) {
    return apiRequest<OrderBookSnapshot>(`/orderbook/book?product=${product}`)
}

export function fetchOrders(params: { product: ProductId; side?: OrderSide; status?: OrderStatus }) {
    const query = new URLSearchParams()
    query.set("product", params.product)
    if (params?.side) query.set("side", params.side)
    if (params?.status) query.set("status", params.status)
    const suffix = query.toString() ? `?${query.toString()}` : ""
    return apiRequest<{ orders: Order[] }>(`/orderbook/orders${suffix}`)
}

export function fetchTrades(product: ProductId) {
    return apiRequest<{ trades: Trade[] }>(`/orderbook/trades?product=${product}`)
}

export function fetchPendingSettlements(walletAddress: string) {
    const query = new URLSearchParams()
    query.set("wallet", walletAddress)
    return apiRequest<{ settlements: PendingSettlement[] }>(`/orderbook/pending-settlements?${query.toString()}`)
}

export function placeOrder(payload: PlaceOrderPayload) {
    return apiRequest<{ order: Order; trades: Trade[] }>("/orderbook/orders", {
        method: "POST",
        body: JSON.stringify({
            ...payload,
            walletAddress: payload.walletAddress || undefined,
        }),
    })
}

export function cancelOrder(product: ProductId, orderId: string) {
    return apiRequest<{ order: Order }>(`/orderbook/orders/${orderId}/cancel?product=${product}`, {
        method: "POST",
    })
}

export function confirmTradeSettled(tradeId: string, walletAddress: string, txDigest?: string) {
    return apiRequest<{ tradeId: string; status: string; txDigest?: string }>(`/orderbook/trades/${tradeId}/settle`, {
        method: "POST",
        body: JSON.stringify({ walletAddress, txDigest }),
    })
}
