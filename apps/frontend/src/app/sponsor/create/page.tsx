"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowLeft,
    Plus,
    Calendar,
    Clock,
    DollarSign,
    Users,
    Info,
    Loader2,
} from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useSponsor } from "@/features/sponsor/hooks/use-sponsor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ServiceType } from "@/types"
import { cn } from "@/lib/utils"
// Import shared constants for consistent Product IDs
import { PRODUCT_OPTIONS } from "@/lib/shared-constants"

export default function SponsorCreateOfferPage() {
    const router = useRouter()
    const { walletConnected } = useAuth()
    const { publishOffer, isPublishing } = useSponsor()

    // Initialize with the first product in our shared list
    const [selectedProductId, setSelectedProductId] = useState(PRODUCT_OPTIONS[0].id)

    const [formData, setFormData] = useState({
        title: PRODUCT_OPTIONS[0].name,
        description: PRODUCT_OPTIONS[0].desc,
        totalSeats: PRODUCT_OPTIONS[0].seats,
        price: String(PRODUCT_OPTIONS[0].defaultPrice),
    })

    const selectedProduct = PRODUCT_OPTIONS.find(p => p.id === selectedProductId) || PRODUCT_OPTIONS[0]

    const [previewDates, setPreviewDates] = useState<{
        createdAt: Date
        credentialDeadline: Date
    } | null>(null)

    useEffect(() => {
        const createdAt = new Date()
        setPreviewDates({
            createdAt,
            credentialDeadline: new Date(createdAt.getTime() + 86400000), // +24 hours
        })
    }, [])

    // When product selection changes, update the form defaults
    const handleProductSelect = (productId: string) => {
        const product = PRODUCT_OPTIONS.find(p => p.id === productId)
        if (!product) return

        setSelectedProductId(product.id)
        setFormData({
            title: product.name,
            description: product.desc,
            totalSeats: product.seats,
            price: String(product.defaultPrice),
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!walletConnected) return

        try {
            const priceValue = Number(formData.price);
            await publishOffer({
                // Directly map the selected product's service type
                service: selectedProduct.service as ServiceType,
                totalSeats: formData.totalSeats,
                pricePerSeat: Number.isFinite(priceValue) ? priceValue : 0,
                // Period is fixed by the product definition (e.g., NETFLIX_ANNUAL is always 'yr')
                period: selectedProduct.period,
                title: formData.title,
                description: formData.description,
                tags: [selectedProduct.period === 'mo' ? 'Monthly' : 'Annual', selectedProduct.badge]
            })
            router.push("/sponsor/manage")
        } catch (error) {
            console.error(error)
        }
    }

    if (!walletConnected) {
        return (
            <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">
                        Connect your wallet to create offers.
                    </p>
                    <Button
                        onClick={() => router.push("/")}
                        className="px-6 py-3 h-auto bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white rounded-xl font-semibold"
                    >
                        Back to Home
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#FFF8F0]">
            {/* Header */}
            <header className="w-full px-6 py-4 border-b border-orange-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => router.push("/sponsor/manage")}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back to Manage</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] flex items-center justify-center text-white font-bold">
                            S
                        </div>
                        <span className="text-xl font-bold text-gray-900">ShareMarket</span>
                    </div>
                    <div className="w-32" />
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Publish New Offer
                    </h1>
                    <p className="text-gray-600">
                        Select a standardized product from the Orderbook to list your service.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Product Selection */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <Label className="block text-sm font-semibold text-gray-900 mb-4">
                            Select Standard Product
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {PRODUCT_OPTIONS.map((product) => {
                                const isSelected = selectedProductId === product.id
                                return (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => handleProductSelect(product.id)}
                                        className={cn(
                                            "p-4 rounded-xl border-2 text-left transition-all h-full flex flex-col justify-between",
                                            isSelected
                                                ? "border-[#FF6B6B] bg-orange-50"
                                                : "border-gray-100 hover:border-gray-200 bg-white"
                                        )}
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                    {product.badge}
                                                </span>
                                                {isSelected && (
                                                    <span className="text-[#FF6B6B]">●</span>
                                                )}
                                            </div>
                                            <h3 className={cn(
                                                "font-bold mb-1",
                                                isSelected ? "text-[#FF6B6B]" : "text-gray-900"
                                            )}>
                                                {product.name}
                                            </h3>
                                            <p className="text-xs text-gray-500 line-clamp-2">
                                                {product.desc}
                                            </p>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs font-medium">
                                            <span className="text-gray-600">
                                                {product.period === 'yr' ? 'Annual Plan' : 'Monthly Plan'}
                                            </span>
                                            <span className="text-gray-400">
                                                ~${product.defaultPrice}
                                            </span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Offer Details */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Custom Details</h3>
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg border border-blue-100">
                                You can override the defaults below
                            </span>
                        </div>

                        {/* Title */}
                        <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                Display Title
                            </Label>
                            <Input
                                type="text"
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        title: e.target.value,
                                    }))
                                }
                                className="w-full px-4 py-3 h-auto rounded-xl border border-gray-200 focus:border-[#FF6B6B] focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        description: e.target.value,
                                    }))
                                }
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#FF6B6B] focus:ring-2 focus:ring-orange-100 outline-none transition-all resize-none"
                            />
                        </div>

                        {/* Seats and Price */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Users className="w-4 h-4 inline mr-1" />
                                    Total Seats (including you)
                                </Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={formData.totalSeats}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            totalSeats: parseInt(e.target.value) || 1,
                                        }))
                                    }
                                    className="w-full px-4 py-3 h-auto rounded-xl border border-gray-200 focus:border-[#FF6B6B] focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <Label className="block text-sm font-medium text-gray-700 mb-2">
                                    <DollarSign className="w-4 h-4 inline mr-1" />
                                    Price per Seat (USD)
                                </Label>
                                <Input
                                    type="number"
                                    min={0.01}
                                    step={0.01}
                                    value={formData.price}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            price: e.target.value.replace(/^0+(?=\d)/, ""),
                                        }))
                                    }
                                    className="w-full px-4 py-3 h-auto rounded-xl border border-gray-200 focus:border-[#FF6B6B] focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Auto-filled Info (Read Only) */}
                        <div className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-700">Period: <strong>{selectedProduct.period === "yr" ? "Annual" : "Monthly"}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-700">Service: <strong>{selectedProduct.service}</strong></span>
                            </div>
                        </div>

                    </div>

                    {/* Auto-generated Info */}
                    <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    <span className="text-blue-800">
                                        <strong>Created:</strong>{" "}
                                        {previewDates
                                            ? previewDates.createdAt.toLocaleDateString()
                                            : "--"}{" "}
                                        {previewDates
                                            ? previewDates.createdAt.toLocaleTimeString()
                                            : "--"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-blue-600" />
                                    <span className="text-blue-800">
                                        <strong>Credential Deadline:</strong>{" "}
                                        {previewDates
                                            ? previewDates.credentialDeadline.toLocaleDateString()
                                            : "--"}{" "}
                                        {previewDates
                                            ? previewDates.credentialDeadline.toLocaleTimeString()
                                            : "--"}
                                    </span>
                                </div>
                                <p className="text-blue-600">
                                    You must submit valid credentials within 24 hours after the
                                    offer is fully booked.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={isPublishing}
                        className="w-full py-4 h-auto bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white rounded-xl font-semibold text-lg shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                    >
                        {isPublishing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Publishing...
                            </>
                        ) : (
                            <>
                                <Plus className="w-5 h-5" />
                                Publish Offer
                            </>
                        )}
                    </Button>
                </form>
            </main>
        </div>
    )
}
