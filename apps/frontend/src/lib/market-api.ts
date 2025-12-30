import { apiRequest } from "@/lib/api"
import type { Allocation, MarketSummary, ProductId } from "@/types"

export function fetchMarkets() {
    return apiRequest<{ markets: MarketSummary[] }>("/markets")
}

export function fetchAllocations(wallet: string, product?: ProductId) {
    const params = new URLSearchParams({ wallet })
    if (product) params.set("product", product)
    return apiRequest<{ allocations: Allocation[] }>(`/markets/allocations?${params.toString()}`)
}
