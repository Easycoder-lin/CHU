"use client"

import { useCallback, useEffect, useMemo, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowDownUp, ArrowRightLeft, BarChart3, RefreshCw, Loader2, Search, Filter } from "lucide-react"
import { Navbar } from "@/components/shared/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/auth-context"
import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit"
import { Transaction } from "@mysten/sui/transactions"
import { SuiClient } from "@mysten/sui/client"
import { useToast } from "@/hooks/use-toast"
import { fetchAllocations, fetchMarkets } from "@/lib/market-api"
import { cancelOrder, fetchOrderBook, fetchOrders, fetchTrades, placeOrder } from "@/lib/orderbook-api"
import { cn } from "@/lib/utils"
import type { Allocation, MarketSummary, Order, OrderBookSnapshot, OrderSide, ProductId, Trade } from "@/types"
import { PriceHistoryChart } from "@/components/shared/price-history-chart"
import { buildLockFundsPTB, buildRefundLockPTB } from "@/lib/ptb/vault"
import { CONTRACT_CONFIG } from "@/lib/contracts/config"

import { PRODUCT_OPTIONS } from "@/lib/shared-constants"

function generateMockHistory(basePrice: number, days = 30) {
    const data = []
    let currentPrice = basePrice
    const now = new Date()
    const oneDay = 24 * 60 * 60 * 1000

    for (let i = days; i >= 0; i--) {
        const time = new Date(now.getTime() - i * oneDay).toISOString().split('T')[0] // YYYY-MM-DD
        const change = (Math.random() - 0.5) * (basePrice * 0.05) // +/- 2.5% volatility
        currentPrice += change
        // Ensure price stays positive and realistic
        currentPrice = Math.max(currentPrice, basePrice * 0.5)
        data.push({ time, value: parseFloat(currentPrice.toFixed(2)) })
    }
    return data
}

function OrderBookContent() {
    const { toast } = useToast()
    const { currentMode, walletAddress, walletConnected, user } = useAuth()
    const account = useCurrentAccount()
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction()
    const suiClient = useMemo(() => {
        return new SuiClient({
            url: process.env.NEXT_PUBLIC_SUI_NODE_URL || "https://fullnode.testnet.sui.io:443"
        })
    }, [])
    const searchParams = useSearchParams()
    const router = useRouter()
    const [book, setBook] = useState<OrderBookSnapshot | null>(null)
    const [orders, setOrders] = useState<Order[]>([])
    const [trades, setTrades] = useState<Trade[]>([])
    const [side, setSide] = useState<OrderSide>("BUY")
    const [price, setPrice] = useState("")
    const [quantity, setQuantity] = useState("1")
    const [loading, setLoading] = useState(false)
    const [refreshing, setRefreshing] = useState(false)
    const [search, setSearch] = useState("")
    const [markets, setMarkets] = useState<MarketSummary[]>([])
    const [allocations, setAllocations] = useState<Allocation[]>([])
    const [product, setProduct] = useState<ProductId>(
        (searchParams.get("product") as ProductId) || "NETFLIX_ANNUAL",
    )
    const [historyData, setHistoryData] = useState<{ time: string, value: number }[]>([])

    // Update history when product changes
    useEffect(() => {
        // Simple mock base prices based on product
        const basePrices: Record<ProductId, number> = {
            "NETFLIX_ANNUAL": 120,
            "SPOTIFY_ANNUAL": 45,
            "YOUTUBE_PREMIUM_ANNUAL": 50,
            "PRIME_VIDEO_ANNUAL": 30,
            "DISNEY_BUNDLE_ANNUAL": 80,
            "APPLE_ONE_ANNUAL": 60,
            "CHATGPT_ANNUAL": 200,
            "GEMINI_ANNUAL": 180,
        }
        const base = basePrices[product] || 100
        setHistoryData(generateMockHistory(base))
    }, [product])

    const actor = currentMode === "sponsor" ? "SPONSOR" : "MEMBER"
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
            // 防呆：只接收當前標的的資料
            setOrders(orderRes.orders.filter((o) => o.product === product))
            setTrades(tradeRes.trades.filter((t) => t.product === product))
        } catch (error) {
            console.error(error)
            toast({
                title: "載入訂單簿失敗",
                description: "請確認後端是否已啟動並允許 CORS。",
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

    const extractLockObjectId = (result: any): string | undefined => {
        const changes = Array.isArray(result?.objectChanges)
            ? result.objectChanges
            : Array.isArray(result?.effects?.objectChanges)
                ? result.effects.objectChanges
                : []
        if (changes.length === 0) return undefined
        const lockType = `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULES.VAULT}::MemberLock`
        const created = changes.find((change) => {
            if (change?.type !== "created") return false
            if (change?.objectType === lockType) return true
            return typeof change?.objectType === "string"
                && change.objectType.endsWith("::vault::MemberLock")
        })
        return created?.objectId
    }

    const fetchObjectChangesForDigest = async (digest: string) => {
        let lastError: unknown = null
        for (let attempt = 0; attempt < 6; attempt += 1) {
            try {
                return await suiClient.getTransactionBlock({
                    digest,
                    options: {
                        showEffects: true,
                        showObjectChanges: true,
                        showInput: true,
                    },
                })
            } catch (error) {
                lastError = error
                await new Promise((resolve) => setTimeout(resolve, 800))
            }
        }
        throw lastError
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!walletConnected) {
            toast({
                title: "請先連接錢包",
                description: "買賣前需要連接錢包。",
                variant: "destructive",
            })
            return
        }

        const numericPrice = Number(price)
        const numericQty = Number(quantity)
        if (Number.isNaN(numericPrice) || Number.isNaN(numericQty) || numericQty <= 0 || numericPrice <= 0) {
            toast({
                title: "輸入數值有誤",
                description: "請輸入有效的價格與數量。",
                variant: "destructive",
            })
            return
        }

        try {
            setLoading(true)
            let lockPayload: {
                lockAmount?: number
                lockAsset?: string
                lockTxDigest?: string
                lockObjectId?: string
            } = {}

            if (side === "BUY" && actor === "MEMBER") {
                if (!account?.address) {
                    throw new Error("Wallet address required to lock funds")
                }
                const baseAmount = Math.round(numericPrice) * Math.max(1, Math.floor(numericQty))
                const tx = new Transaction()
                buildLockFundsPTB(tx, BigInt(baseAmount), account.address)
                const lockResult = await signAndExecuteTransaction({
                    transaction: tx,
                    options: { showObjectChanges: true, showEffects: true }
                })
                console.log("lockResult", lockResult)
                let lockObjectId = extractLockObjectId(lockResult)
                if (!lockObjectId && lockResult?.digest) {
                    try {
                        const txBlock = await fetchObjectChangesForDigest(lockResult.digest)
                        console.log("lockResult txBlock", txBlock)
                        lockObjectId = extractLockObjectId(txBlock)
                    } catch (error) {
                        console.warn("Failed to fetch lock tx changes", error)
                    }
                }
                if (!lockObjectId) {
                    throw new Error("Failed to locate escrow lock object")
                }
                lockPayload = {
                    lockAmount: baseAmount,
                    lockAsset: "SUI",
                    lockTxDigest: lockResult.digest,
                    lockObjectId
                }
            }

            const orderSide: OrderSide = "BUY"
            await placeOrder({
                product,
                side: orderSide,
                price: numericPrice,
                quantity: numericQty,
                actor,
                walletAddress,
                ...lockPayload,
            })
            toast({
                title: "買單已送出",
                description: "已寫入訂單簿，若價格可成交會即時撮合。",
            })
            setQuantity("1")
            loadData()
            loadAllocations()
        } catch (error) {
            console.error(error)
            toast({
                title: "下單失敗",
                description: "請確認後端 API 連線或稍後再試。",
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
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0b0f1a] text-slate-900 dark:text-slate-50 transition-colors duration-300">
            <Navbar activeTab="Browse" />
            <main className="max-w-7xl mx-auto px-4 pb-16 pt-8 space-y-8">
                {/* Product Selection Section */}
                <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <ArrowRightLeft className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            選擇標的 (Choose Market)
                        </h2>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="搜尋服務..."
                                className="pl-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-50 transition-colors"
                            />
                        </div>
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
                                        "text-left rounded-2xl border px-4 py-3 transition-all duration-200",
                                        active
                                            ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 shadow-md shadow-indigo-100 dark:shadow-indigo-900/20 ring-1 ring-indigo-200 dark:ring-indigo-800"
                                            : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-sm"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={cn(
                                            "text-xs px-2 py-1 rounded-full font-medium",
                                            active
                                                ? "bg-white dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200"
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                        )}>
                                            {opt.badge}
                                        </span>
                                        {active && <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Active</span>}
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2">{opt.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{opt.desc}</p>
                                    {summary && (
                                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[11px] font-mono">
                                            <span className="text-emerald-600 dark:text-emerald-400">Buy: {formatPrice(summary.bestBid)}</span>
                                            <span className="text-rose-600 dark:text-rose-400">Sell: {formatPrice(summary.bestAsk)}</span>
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </section>

                {/* Price History Chart */}
                <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg">
                                <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Price History</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Past 30 days performance</p>
                            </div>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <PriceHistoryChart data={historyData} />
                    </div>
                </section>

                {/* Market Header Stats */}
                <header className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900">
                                <BarChart3 className="w-4 h-4" />
                                Live Order Book
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                    {selectedProduct.name}
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl text-lg">
                                    Real-time matchmaking for shared subscriptions.
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 min-w-[320px]">
                            <MetricCard label="Best Bid" value={formatPrice(bestBid)} tone="buy" />
                            <MetricCard label="Best Ask" value={formatPrice(bestAsk)} tone="sell" />
                            <MetricCard label="Spread" value={spread ? `${spread.toFixed(2)}` : "--"} tone="neutral" />
                            <MetricCard label="Last Trade" value={book?.lastTrade ? formatPrice(book.lastTrade.price) : "--"} tone="neutral" />
                            {canCross && (
                                <div className="col-span-2 text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl px-4 py-3 font-medium flex items-center justify-center">
                                    ✨ Market is crossable! Orders will fill instantly.
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <section className="grid lg:grid-cols-3 gap-8">
                    {/* Order Book Depth */}
                    <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                                <CardTitle className="text-xl text-slate-900 dark:text-white">Order Book</CardTitle>
                                <CardDescription className="text-slate-500 dark:text-slate-400">
                                    Market liquidity and depth
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                className="text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                                size="sm"
                                onClick={loadData}
                                disabled={refreshing}
                            >
                                <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
                                Refresh
                            </Button>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6 pt-6">
                            <OrderSideTable
                                title="Asks (Sellers)"
                                rows={book?.asks ?? []}
                                side="SELL"
                                onSelect={(p) => {
                                    setSide("BUY")
                                    setPrice(p.toString())
                                }}
                            />
                            <OrderSideTable
                                title="Bids (Buyers)"
                                rows={book?.bids ?? []}
                                side="BUY"
                                onSelect={(p) => {
                                    setSide("BUY")
                                    setPrice(p.toString())
                                }}
                            />
                            <div className="md:col-span-2 pt-2">
                                <DepthMeter bids={book?.bids ?? []} asks={book?.asks ?? []} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Order Entry Form */}
                    <Card className="border-slate-200 dark:border-slate-800 shadow-lg bg-white dark:bg-slate-900 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                                Place Order
                            </CardTitle>
                            <CardDescription className="text-slate-500 dark:text-slate-400">
                                {actor === "SPONSOR" ? "Buying as Sponsor" : "Buying as Member"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 mb-4">
                                <TogglePill active onClick={() => setSide("BUY")} label="Buy (Bid)" tone="buy" />
                            </div>

                            <div className="mb-6 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase mb-2">Market Quick Actions</div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 bg-white dark:bg-slate-900"
                                        onClick={() => {
                                            if (bestAsk) {
                                                setSide("BUY");
                                                setPrice(bestAsk.toString());
                                            }
                                        }}
                                        disabled={!bestAsk}
                                    >
                                        Buy @ Best Ask
                                    </Button>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-slate-700 dark:text-slate-300 font-medium">Price (USD)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            className="pl-7 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-indigo-500"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-700 dark:text-slate-300 font-medium">Quantity (Seats)</Label>
                                    <Input
                                        type="number"
                                        step="1"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-indigo-500"
                                        placeholder="1"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className={cn(
                                        "w-full h-12 text-lg font-bold shadow-md transition-all hover:scale-[1.02]",
                                        "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-200",
                                    )}
                                    disabled={loading}
                                >
                                    {loading ? "Processing..." : "Place Buy Order"}
                                </Button>
                                {actor === "MEMBER" && (
                                    <p className="text-xs text-emerald-700">
                                        Buy orders lock funds immediately in on-chain escrow.
                                    </p>
                                )}
                            </form>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid md:grid-cols-2 gap-8">
                    {/* Recent Trades */}
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                                <ArrowDownUp className="w-5 h-5 text-slate-400" />
                                Recent Trades
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-0">
                            {recentTrades.length === 0 && <p className="text-sm text-slate-400 italic py-4">No recent trades.</p>}
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {recentTrades.map((trade) => (
                                    <div
                                        key={trade.id}
                                        className="flex items-center justify-between py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors px-2 rounded-lg -mx-2"
                                    >
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-50">
                                                {formatPrice(trade.price)} <span className="text-slate-400 font-normal">×</span> {trade.quantity}
                                            </p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                                {new Date(trade.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <span className="text-xs font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                            #{trade.buyOrderId.slice(0, 4)}…
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Open Orders Queue */}
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-slate-900 dark:text-white">Order Queue / My Orders</CardTitle>
                            <CardDescription className="text-slate-500 dark:text-slate-400">
                                Active liquidity in the book
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Tabs could go here, for now just merged list */}
                            <div className="space-y-3">
                                {openOrders.length === 0 && <p className="text-sm text-slate-400 italic">No open orders.</p>}
                                {openOrders.map((order) => {
                                    const isMine = walletAddress && order.walletAddress === walletAddress
                                    return (
                                        <div
                                            key={order.id}
                                            className={cn(
                                                "flex items-center justify-between rounded-xl border px-4 py-3",
                                                isMine
                                                    ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900"
                                                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                                            )}
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "text-xs font-bold uppercase px-1.5 py-0.5 rounded",
                                                        order.side === "BUY"
                                                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                                                            : "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400"
                                                    )}>
                                                        {order.side === "BUY" ? "Buy" : "Sell"}
                                                    </span>
                                                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                        {formatPrice(order.price)} · {order.remaining}/{order.quantity}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                                    {new Date(order.createdAt).toLocaleString()}
                                                </p>
                                            </div>

                                            {isMine ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                                    onClick={async () => {
                                                        try {
                                                            await cancelOrder(product, order.id)
                                                            if (
                                                                order.side === "BUY"
                                                                && order.lockObjectId
                                                                && order.lockStatus !== "SETTLED"
                                                                && account?.address
                                                            ) {
                                                                const refundTx = new Transaction()
                                                                buildRefundLockPTB(refundTx, order.lockObjectId, account.address)
                                                                await signAndExecuteTransaction({ transaction: refundTx })
                                                            }
                                                            toast({ title: "Order Cancelled" })
                                                            loadData()
                                                        } catch (error) {
                                                            toast({ title: "Failed to cancel", variant: "destructive" })
                                                        }
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 px-2">Queue</span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* My Allocations */}
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-slate-900 dark:text-white">Filled Allocations</CardTitle>
                            <CardDescription className="text-slate-500 dark:text-slate-400">
                                Your successful matches for this market
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {!walletAddress && <p className="text-sm text-slate-400 text-center py-4">Connect wallet to view history.</p>}
                            {walletAddress && allocations.length === 0 && (
                                <p className="text-sm text-slate-400 text-center py-4">No allocations yet.</p>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {allocations
                                    .filter((a) => a.marketId === product)
                                    .map((a) => (
                                        <div
                                            key={a.id}
                                            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                                    FROM {a.sellerWallet?.slice(0, 6) ?? "n/a"}
                                                </span>
                                                <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                                                    {a.state}
                                                </span>
                                            </div>
                                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                                {a.qty} Seats <span className="text-slate-400 font-normal">@</span> {formatPrice(a.price)}
                                            </p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                                                {new Date(a.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))}
                            </div>
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
        <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 p-4">
            <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                <span>Price</span>
                <span>Size</span>
            </div>
            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                {rows.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Empty</p>}
                {rows.slice(0, 12).map((row) => (
                    <div
                        key={`${side}-${row.price}`}
                        onClick={() => onSelect?.(row.price, side)}
                        className={cn(
                            "flex items-center justify-between rounded px-3 py-1.5 text-sm relative overflow-hidden cursor-pointer transition-all group",
                            "hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                    >
                        {/* Size Bar Background */}
                        <div
                            className={cn(
                                "absolute inset-y-0 right-0 opacity-10 transition-all group-hover:opacity-20",
                                side === "BUY" ? "bg-emerald-600" : "bg-rose-600",
                            )}
                            style={{ width: `${Math.min(100, (row.size / maxSize) * 100)}%` }}
                        />

                        <span className={cn(
                            "font-mono font-medium z-10",
                            side === "BUY" ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                        )}>
                            {formatPrice(row.price)}
                        </span>
                        <span className="font-mono text-slate-600 dark:text-slate-400 z-10">{row.size.toFixed(2)}</span>
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
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
                <span>Bid Vol: {totalBids.toFixed(2)}</span>
                <span>Ask Vol: {totalAsks.toFixed(2)}</span>
            </div>
            <div className="h-2.5 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex">
                <div className="bg-emerald-500" style={{ width: `${bidPct}%` }} />
                <div className="bg-rose-500" style={{ width: `${askPct}%` }} />
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
                "flex-1 rounded-lg px-3 py-2 text-sm font-bold transition-all shadow-sm",
                active
                    ? tone === "buy"
                        ? "bg-emerald-600 text-white shadow-emerald-200"
                        : "bg-rose-600 text-white shadow-rose-200"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700",
                disabled && "opacity-50 cursor-not-allowed",
            )}
        >
            {label}
        </button>
    )
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: "buy" | "sell" | "neutral" }) {
    const toneClass =
        tone === "buy"
            ? "text-emerald-600 dark:text-emerald-400"
            : tone === "sell"
                ? "text-rose-600 dark:text-rose-400"
                : "text-slate-900 dark:text-white"
    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 px-4 py-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">{label}</p>
            <p className={cn("text-lg font-bold font-mono", toneClass)}>{value}</p>
        </div>
    )
}

function formatPrice(value?: number) {
    if (value === undefined) return "--"
    return `$${value.toFixed(2)}`
}

export default function OrderBookPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0b0f1a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    <p className="text-slate-500 font-medium">Loading Market...</p>
                </div>
            </div>
        }>
            <OrderBookContent />
        </Suspense>
    )
}
