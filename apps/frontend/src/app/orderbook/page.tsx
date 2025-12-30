"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowDownUp, ArrowRightLeft, BarChart3, RefreshCw } from "lucide-react"
import { Navbar } from "@/components/shared/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { fetchAllocations, fetchMarkets } from "@/lib/market-api"
import { cancelOrder, fetchOrderBook, fetchOrders, fetchTrades, placeOrder } from "@/lib/orderbook-api"
import { cn } from "@/lib/utils"
import type { Allocation, MarketSummary, Order, OrderBookSnapshot, OrderSide, ProductId, Trade } from "@/types"

const PRODUCT_OPTIONS: Array<{ id: ProductId; name: string; desc: string; badge: string }> = [
    { id: "NETFLIX_ANNUAL", name: "Netflix Annual", desc: "4K / family plan, annual", badge: "Streaming" },
    { id: "SPOTIFY_ANNUAL", name: "Spotify Annual", desc: "Family music plan, annual", badge: "Music" },
    { id: "YOUTUBE_PREMIUM_ANNUAL", name: "YouTube Premium Annual", desc: "Ad-free + background play", badge: "Streaming" },
    { id: "PRIME_VIDEO_ANNUAL", name: "Prime Video Annual", desc: "Series, movies, member perks", badge: "Streaming" },
    { id: "DISNEY_BUNDLE_ANNUAL", name: "Disney+ Bundle Annual", desc: "Disney+ / Hulu / ESPN+ bundle", badge: "Streaming" },
    { id: "APPLE_ONE_ANNUAL", name: "Apple One Annual", desc: "Family iCloud+ / Music / TV+ / Fitness+", badge: "Bundle" },
    { id: "CHATGPT_ANNUAL", name: "ChatGPT Plus Annual", desc: "AI assistant annual plan", badge: "AI" },
    { id: "GEMINI_ANNUAL", name: "Gemini Advanced Annual", desc: "Search + AI assistant annual", badge: "AI" },
]

export default function OrderBookPage() {
    const { toast } = useToast()
    const { currentMode, walletAddress, walletConnected, user } = useAuth()
    const isSponsor = user?.isSponsor
    const searchParams = useSearchParams()
    const router = useRouter()
    const [book, setBook] = useState<OrderBookSnapshot | null>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const [trades, setTrades] = useState<Trade[]>([])
    const [side, setSide] = useState<OrderSide>("BUY")
    const [price, setPrice] = useState("120")
    const [quantity, setQuantity] = useState("1")
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [search, setSearch] = useState("")
    const [markets, setMarkets] = useState<MarketSummary[]>([])
    const [allocations, setAllocations] = useState<Allocation[]>([])
    const [product, setProduct] = useState<ProductId>(
        (searchParams.get("product") as ProductId) || "NETFLIX_ANNUAL",
    )

    const actor = currentMode === "sponsor" ? "SPONSOR" : "MEMBER"
    const canSell = actor === "SPONSOR"
    const selectedProduct = PRODUCT_OPTIONS.find((p) => p.id === product) ?? PRODUCT_OPTIONS[0]
    const marketMap = useMemo(() => Object.fromEntries(markets.map((m) => [m.id, m])), [markets])
    const filteredProducts = useMemo(
        () =>
            PRODUCT_OPTIONS.filter((opt) =>
                opt.name.toLowerCase().includes(search.toLowerCase()) || opt.id.toLowerCase().includes(search.toLowerCase()),
            ),
        [search],
    )

    useEffect(() => {
        router.replace(`/orderbook?product=${product}`)
    }, [product, router])

    useEffect(() => {
        fetchMarkets()
            .then((res) => setMarkets(res.markets))
            .catch((err) => console.error(err))
    }, [])

    const loadAllocations = useCallback(async () => {
        if (!walletAddress) {
            setAllocations([])
            return
        }
        try {
            const res = await fetchAllocations(walletAddress, product)
            setAllocations(res.allocations)
        } catch (error) {
            console.error(error)
        }
    }, [walletAddress, product])

    const loadData = useCallback(async () => {
        try {
            setRefreshing(true)
            const [bookRes, orderRes, tradeRes] = await Promise.all([
                fetchOrderBook(product),
                fetchOrders({ product }),
                fetchTrades(product),
            ])
            setBook(bookRes)
            // Guard: only accept data for current product
            setOrders(orderRes.orders.filter((o) => o.product === product))
            setTrades(tradeRes.trades.filter((t) => t.product === product))
        } catch (error) {
            console.error(error)
            toast({
                title: "Failed to load order book",
                description: "Ensure backend is running and CORS is allowed.",
                variant: "destructive",
            })
        } finally {
            setRefreshing(false)
        }
    }, [product, toast])

    useEffect(() => {
        loadData()
        const id = setInterval(loadData, 8000)
        return () => clearInterval(id)
    }, [loadData])

    useEffect(() => {
        loadAllocations()
    }, [loadAllocations])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!walletConnected) {
            toast({
                title: "Connect wallet first",
                description: "You need a wallet connected before trading.",
                variant: "destructive",
            })
            return
        }

        const numericPrice = Number(price)
        const numericQty = Number(quantity)
        if (Number.isNaN(numericPrice) || Number.isNaN(numericQty) || numericQty <= 0 || numericPrice <= 0) {
            toast({
                title: "Invalid input",
                description: "Enter a valid price and quantity.",
                variant: "destructive",
            })
            return
        }

        if (side === "SELL" && !canSell) {
            toast({
                title: "Only sponsors can place asks",
                description: "Switch to sponsor mode or place a bid instead.",
                variant: "destructive",
            })
            return
        }

        if (side === "SELL" && !isSponsor) {
            toast({
                title: "Sponsor status required",
                description: "Stake to become a sponsor before placing an ask.",
                variant: "destructive",
            })
            return
        }

        try {
            setLoading(true)
            await placeOrder({
                product,
                side,
                price: numericPrice,
                quantity: numericQty,
                actor,
                walletAddress,
            })
            toast({
                title: side === "BUY" ? "Bid submitted" : "Ask submitted",
                description: "Added to the order book; it will match immediately if prices cross.",
            })
            setQuantity("1")
            loadData()
            loadAllocations()
        } catch (error) {
            console.error(error)
            toast({
                title: "Order failed",
                description: "Check backend connectivity or try again later.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const bestBid = book?.bestBid
    const bestAsk = book?.bestAsk
    const spread = book?.spread
    const canCross = typeof bestBid === "number" && typeof bestAsk === "number" && bestBid >= bestAsk

    const openOrders = useMemo(
        () =>
            orders
                .filter((o) => o.product === product && (o.status === "OPEN" || o.status === "PARTIAL"))
                .slice(0, 8),
        [orders, product],
    )

    const myOrders = useMemo(
        () =>
            walletAddress
                ? orders.filter((o) => o.walletAddress === walletAddress && (o.status === "OPEN" || o.status === "PARTIAL"))
                : [],
        [orders, walletAddress],
    )

    const recentTrades = useMemo(() => trades.slice(-6).reverse(), [trades])

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0d1024] via-[#0b0f1d] to-[#0b141f] text-white">
            <Navbar activeTab="Browse" />
            <main className="max-w-7xl mx-auto px-4 pb-16 pt-6 space-y-8">
                <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-xl shadow-indigo-900/30">
                    <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <ArrowRightLeft className="w-4 h-4" />
                            Select Product
                        </h2>
                        <p className="text-sm text-indigo-100/70">Pick a product to view its order book.</p>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search services (Netflix, Spotify, ChatGPT…)"
                            className="bg-white/5 border-white/10 text-white placeholder:text-indigo-100/60"
                        />
                        <span className="text-xs text-indigo-100/70">
                            {filteredProducts.length} results
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {filteredProducts.map((opt) => {
                            const active = opt.id === product
                            const summary = marketMap[opt.id]
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => {
                                        setProduct(opt.id)
                                        setSide("BUY")
                                    }}
                                    className={cn(
                                        "text-left rounded-2xl border px-4 py-3 transition-all",
                                        active
                                            ? "border-indigo-400/60 bg-indigo-500/20 shadow-lg shadow-indigo-800/30"
                                            : "border-white/10 bg-white/5 hover:border-indigo-400/40 hover:bg-white/10"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-indigo-100">
                                            {opt.badge}
                                        </span>
                                        {active && <span className="text-xs text-emerald-300">Active</span>}
                                    </div>
                                    <p className="text-sm font-semibold text-white mt-2">{opt.name}</p>
                                    <p className="text-xs text-indigo-100/70 mt-1">{opt.desc}</p>
                                    {summary && (
                                        <p className="text-[11px] text-indigo-100/80 mt-2">
                                            Best bid {formatPrice(summary.bestBid)} / ask {formatPrice(summary.bestAsk)}
                                        </p>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </section>

                <header className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 shadow-xl shadow-indigo-900/30">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div className="space-y-3">
                                <p className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-200 bg-indigo-500/20 px-3 py-1 rounded-full">
                                    <ArrowRightLeft className="w-4 h-4" />
                                    Two-sided Order Book
                                </p>
                                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                                {selectedProduct.name} — Live Order Book
                            </h1>
                            <p className="text-indigo-100/80 max-w-2xl">
                                Sponsors post asks, members place bids. Price/time priority; crossing prices match immediately.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <MetricCard label="Best Bid" value={formatPrice(bestBid)} tone="buy" />
                            <MetricCard label="Best Ask" value={formatPrice(bestAsk)} tone="sell" />
                            <MetricCard label="Spread" value={spread ? `${spread.toFixed(2)} USD` : "--"} tone="neutral" />
                            <MetricCard label="Last Trade" value={book?.lastTrade ? formatPrice(book.lastTrade.price) : "--"} tone="neutral" />
                            {canCross && (
                                <div className="col-span-2 text-sm text-emerald-200 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
                                    Crossable now: best bid ≥ best ask, orders will match instantly.
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <section className="grid lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 border-white/10 bg-white/5 backdrop-blur">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl text-white">Order Book (Bids / Asks)</CardTitle>
                                <CardDescription className="text-indigo-100/80">
                                    Aggregated by price; darker bar = more seats.
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                className="text-indigo-50 border-indigo-300/50 bg-indigo-600/30 hover:bg-indigo-500/40"
                                size="sm"
                                onClick={loadData}
                                disabled={refreshing}
                            >
                                <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
                                Refresh
                            </Button>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-4">
                            <OrderSideTable
                                title="Asks"
                                rows={book?.asks ?? []}
                                side="SELL"
                                onSelect={(p) => {
                                    setSide("BUY")
                                    setPrice(p.toString())
                                }}
                            />
                            <OrderSideTable
                                title="Bids"
                                rows={book?.bids ?? []}
                                side="BUY"
                                onSelect={(p) => {
                                    setSide("SELL")
                                    setPrice(p.toString())
                                }}
                            />
                            <div className="md:col-span-2">
                                <DepthMeter bids={book?.bids ?? []} asks={book?.asks ?? []} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-gradient-to-br from-indigo-600/30 via-indigo-500/10 to-slate-900/60 text-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5" />
                                Place Order
                            </CardTitle>
                            <CardDescription className="text-indigo-50/80">
                                {actor === "SPONSOR" ? "You are placing asks as a Sponsor" : "You are bidding as a Member"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 mb-3 text-sm text-indigo-100/70">
                                <span>Market buy/sell auto-fills the best price:</span>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-white/20 text-emerald-200 hover:bg-white/10"
                                        onClick={() => {
                                            if (bestAsk) {
                                                setSide("BUY");
                                                setPrice(bestAsk.toString());
                                            }
                                        }}
                                        disabled={!bestAsk}
                                    >
                                        Buy at best ask
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-white/20 text-rose-200 hover:bg-white/10"
                                        onClick={() => {
                                            if (bestBid && canSell && isSponsor) {
                                                setSide("SELL");
                                                setPrice(bestBid.toString());
                                            }
                                        }}
                                        disabled={!bestBid || !canSell || !isSponsor}
                                    >
                                        Sell at best bid
                                    </Button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mb-4">
                                <TogglePill active={side === "BUY"} onClick={() => setSide("BUY")} label="Buy (Bid)" tone="buy" />
                                <TogglePill
                                    active={side === "SELL"}
                                    onClick={() => canSell && setSide("SELL")}
                                    label="Sell (Ask)"
                                    tone="sell"
                                    disabled={!canSell}
                                />
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-indigo-50">Price (USD)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        className="bg-white/5 border-white/20 text-white"
                                        placeholder="e.g. 120"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-indigo-50">Quantity (seats)</Label>
                                    <Input
                                        type="number"
                                        step="1"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        className="bg-white/5 border-white/20 text-white"
                                        placeholder="1"
                                    />
                                </div>
                                <p className="text-sm text-indigo-100/70">
                                    Orders cross immediately if prices match; remainder stays in the book (price/time priority).
                                </p>
                                <Button
                                    type="submit"
                                    className={cn(
                                        "w-full font-semibold",
                                        side === "BUY"
                                            ? "bg-emerald-500 hover:bg-emerald-400 text-white"
                                            : "bg-rose-500 hover:bg-rose-400 text-white",
                                    )}
                                    disabled={loading}
                                >
                                    {loading ? "Submitting..." : side === "BUY" ? "Submit bid" : "Submit ask"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid md:grid-cols-2 gap-6">
                    <Card className="border-white/10 bg-white/5 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <ArrowDownUp className="w-5 h-5" />
                                Recent Trades
                            </CardTitle>
                            <CardDescription className="text-indigo-100/80">Latest 6 fills</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {recentTrades.length === 0 && <p className="text-sm text-indigo-100/70">No trades yet.</p>}
                            {recentTrades.map((trade) => (
                                <div
                                    key={trade.id}
                                    className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2"
                                >
                                    <div>
                                        <p className="text-sm text-indigo-50">
                                            {formatPrice(trade.price)} · {trade.quantity} seats
                                        </p>
                                        <p className="text-xs text-indigo-200/70">
                                            {new Date(trade.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <span className="text-xs text-indigo-100/80">
                                        #{trade.buyOrderId.slice(0, 6)} / #{trade.sellOrderId.slice(0, 6)}
                                    </span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-white/10 bg-white/5 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="text-white">Open Orders Queue</CardTitle>
                            <CardDescription className="text-indigo-100/80">
                                Open or partial orders (latest 6)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {openOrders.length === 0 && <p className="text-sm text-indigo-100/70">No open orders.</p>}
                            {openOrders.map((order) => {
                                const isMine = walletAddress && order.walletAddress === walletAddress
                                return (
                                    <div
                                        key={order.id}
                                        className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold">
                                                <span className={order.side === "BUY" ? "text-emerald-400" : "text-rose-400"}>
                                                    {order.side === "BUY" ? "Bid" : "Ask"}
                                                </span>
                                                {" · "}
                                                {formatPrice(order.price)} · {order.remaining} / {order.quantity} seats
                                            </p>
                                            <p className="text-xs text-indigo-200/70">
                                                {order.actor} · {new Date(order.createdAt).toLocaleString()}
                                                {isMine && " · my order"}
                                            </p>
                                        </div>
                                        {/* Queue view is read-only; no cancel here */}
                                        <span className="text-[11px] px-2 py-1 rounded-md bg-white/10 text-indigo-100/80">
                                            {isMine ? "My order" : "Queued"}
                                        </span>
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-white/5 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="text-white">My Orders</CardTitle>
                            <CardDescription className="text-indigo-100/80">
                                Only orders from the connected wallet; cancel here
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {!walletAddress && <p className="text-sm text-indigo-100/70">Connect your wallet to view.</p>}
                            {walletAddress && myOrders.length === 0 && <p className="text-sm text-indigo-100/70">No orders for this product.</p>}
                            {myOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2"
                                >
                                    <div>
                                        <p className="text-sm font-semibold">
                                            <span className={order.side === "BUY" ? "text-emerald-400" : "text-rose-400"}>
                                                {order.side === "BUY" ? "Bid" : "Ask"}
                                            </span>
                                            {" · "}
                                            {formatPrice(order.price)} · {order.remaining} / {order.quantity} seats
                                        </p>
                                        <p className="text-xs text-indigo-200/70">{new Date(order.createdAt).toLocaleString()}</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-rose-200/60 text-rose-100 hover:bg-rose-500/20"
                                        onClick={async () => {
                                            try {
                                                await cancelOrder(product, order.id)
                                                toast({ title: "Order cancelled" })
                                                loadData()
                                            } catch (error) {
                                                toast({ title: "Cancel failed", variant: "destructive" })
                                            }
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card className="border-white/10 bg-white/5 backdrop-blur md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-white">My Seats (Subscriptions)</CardTitle>
                            <CardDescription className="text-indigo-100/80">
                                Seat allocations after matches for this product
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {!walletAddress && <p className="text-sm text-indigo-100/70">Connect wallet to view.</p>}
                            {walletAddress && allocations.length === 0 && (
                                <p className="text-sm text-indigo-100/70">No seat allocations yet.</p>
                            )}
                            {allocations
                                .filter((a) => a.marketId === product)
                                .map((a) => (
                                    <div
                                        key={a.id}
                                        className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold text-emerald-200">
                                                Seats {a.qty} × {formatPrice(a.price)} · {a.state}
                                            </p>
                                            <p className="text-xs text-indigo-200/70">{new Date(a.createdAt).toLocaleString()}</p>
                                        </div>
                                        <span className="text-[11px] text-indigo-100/80">
                                            from {a.sellerWallet?.slice(0, 6) ?? "n/a"}
                                        </span>
                                    </div>
                                ))}
                        </CardContent>
                    </Card>
                </section>
            </main>
        </div>
    )
}

function OrderSideTable({
    title,
    rows,
    side,
    onSelect,
}: {
    title: string
    rows: OrderBookSnapshot["bids"]
    side: OrderSide
    onSelect?: (price: number, side: OrderSide) => void
}) {
    const maxSize = rows.length ? Math.max(...rows.map((r) => r.size)) : 0
    return (
        <div className="rounded-2xl border border-white/5 bg-white/5 p-4 shadow-inner shadow-black/30">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-indigo-50">{title}</h3>
                <span className="text-xs text-indigo-100/70">Price / total seats</span>
            </div>
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {rows.length === 0 && <p className="text-sm text-indigo-100/60">No orders</p>}
                {rows.slice(0, 12).map((row) => (
                    <div
                        key={`${side}-${row.price}`}
                        onClick={() => onSelect?.(row.price, side)}
                        className={cn(
                            "flex items-center justify-between rounded-lg px-3 py-2 text-sm border border-white/5 relative overflow-hidden cursor-pointer transition-colors hover:border-white/20",
                            side === "BUY" ? "bg-emerald-500/10 hover:bg-emerald-500/15" : "bg-rose-500/10 hover:bg-rose-500/15",
                        )}
                    >
                        {maxSize > 0 && (
                            <div
                                className={cn(
                                    "absolute inset-y-0 left-0 opacity-30",
                                    side === "BUY" ? "bg-emerald-400" : "bg-rose-400",
                                )}
                                style={{ width: `${Math.min(100, (row.size / maxSize) * 100)}%` }}
                            />
                        )}
                        <span className="font-semibold z-10">{formatPrice(row.price)}</span>
                        <span className="font-mono text-indigo-50 z-10">{row.size.toFixed(2)} seats</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function DepthMeter({ bids, asks }: { bids: OrderBookSnapshot["bids"]; asks: OrderBookSnapshot["asks"] }) {
    const totalBids = bids.reduce((sum, b) => sum + b.size, 0)
    const totalAsks = asks.reduce((sum, a) => sum + a.size, 0)
    const total = totalBids + totalAsks
    const bidPct = total ? (totalBids / total) * 100 : 0
    const askPct = 100 - bidPct

    return (
        <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-indigo-100/80 mb-1">
                <span>Bids {totalBids.toFixed(2)} seats</span>
                <span>Asks {totalAsks.toFixed(2)} seats</span>
            </div>
            <div className="h-3 w-full rounded-full overflow-hidden border border-white/10 bg-white/5 flex">
                <div className="bg-emerald-500" style={{ width: `${bidPct}%` }} />
                <div className="bg-rose-500" style={{ width: `${askPct}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-indigo-100/70 mt-1">
                <span>{bidPct.toFixed(1)}% bids</span>
                <span>{askPct.toFixed(1)}% asks</span>
            </div>
        </div>
    )
}

function TogglePill({ active, onClick, label, tone, disabled }: { active: boolean; onClick: () => void; label: string; tone: "buy" | "sell"; disabled?: boolean }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-all",
                active
                    ? tone === "buy"
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                        : "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                    : "bg-white/5 text-indigo-100/80 border border-white/10 hover:bg-white/10",
                disabled && "opacity-50 cursor-not-allowed",
            )}
        >
            {label}
        </button>
    )
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: "buy" | "sell" | "neutral" }) {
    const toneClass =
        tone === "buy" ? "text-emerald-300" : tone === "sell" ? "text-rose-300" : "text-indigo-100"
    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-lg shadow-black/20">
            <p className="text-xs text-indigo-100/70">{label}</p>
            <p className={cn("text-lg font-semibold", toneClass)}>{value}</p>
        </div>
    )
}

function formatPrice(value?: number) {
    if (value === undefined) return "--"
    return `$${value.toFixed(2)}`
}
