"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useOffers } from "@/context/offers-context"
import { OfferManageCard } from "@/features/sponsor/components/offer-manage-card"
import { Button } from "@/components/ui/button"

export default function SponsorManagePage() {
    const router = useRouter()
    const { user, walletConnected } = useAuth()
    const { getUserCreatedOffers } = useOffers()

    const offers = getUserCreatedOffers()

    if (!walletConnected || !user?.isSponsor) {
        return (
            <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">
                        You need to be a sponsor to manage offers.
                    </p>
                    <Button
                        onClick={() => router.push("/sponsor/stake")}
                        className="px-6 py-3 h-auto bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white rounded-xl font-semibold"
                    >
                        Become a Sponsor
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
                        onClick={() => router.push("/")}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Home</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] flex items-center justify-center text-white font-bold">
                            S
                        </div>
                        <span className="text-xl font-bold text-gray-900">ShareMarket</span>
                    </div>
                    <Button
                        onClick={() => router.push("/sponsor/create")}
                        className="flex items-center gap-2 px-4 py-2 h-auto bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white rounded-full font-medium shadow-md shadow-orange-200 hover:shadow-lg transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">New Offer</span>
                    </Button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Manage Your Offers
                    </h1>
                    <p className="text-gray-600">
                        View and manage all your subscription offers.
                    </p>
                </div>

                {offers.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                            <Plus className="w-8 h-8 text-[#FF6B6B]" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            No Offers Yet
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Create your first offer to start sharing subscriptions.
                        </p>
                        <Button
                            onClick={() => router.push("/sponsor/create")}
                            className="px-6 py-3 h-auto bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white rounded-xl font-semibold shadow-lg shadow-orange-200"
                        >
                            Create Your First Offer
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {offers.map((offer) => (
                            <OfferManageCard key={offer.id} offer={offer} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
