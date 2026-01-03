"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, LogIn } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useMember } from "@/features/member/hooks/use-member"
import { WalletButton } from "@/components/shared/wallet-button"
import { ServiceAccessCard } from "@/features/auth/components/service-access-card"

export default function LoginPage() {
    const router = useRouter()
    const { walletConnected } = useAuth()
    const { subscriptions, isLoadingSubscriptions, isErrorSubscriptions, subscriptionsError } = useMember()

    const offers = subscriptions
    // Filter to only show offers with credentials
    const accessibleOffers = offers.filter(
        (o) =>
            o.status === "CREDENTIAL_SUBMITTED" ||
            o.status === "RELEASABLE" ||
            o.status === "CLOSED"
    )

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
                    <div className="w-20" />
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-200">
                        <LogIn className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Access Your Services
                    </h1>
                    <p className="text-lg text-gray-600 max-w-md mx-auto">
                        Connect your wallet to verify ownership and access your subscriptions.
                    </p>
                </div>

                {!walletConnected ? (
                    <div className="bg-white rounded-3xl p-8 shadow-xl shadow-orange-100/50 text-center">
                        <p className="text-gray-600 mb-6">
                            Connect your wallet to see your available services.
                        </p>
                        <WalletButton variant="primary" size="lg" />
                    </div>
                ) : isLoadingSubscriptions ? (
                    <div className="bg-white rounded-3xl p-8 shadow-xl shadow-orange-100/50 text-center text-gray-600">
                        Loading your services...
                    </div>
                ) : isErrorSubscriptions ? (
                    <div className="bg-red-50 rounded-3xl p-8 shadow-xl shadow-red-100/50 text-center text-red-700">
                        {subscriptionsError instanceof Error ? subscriptionsError.message : "Failed to load subscriptions."}
                    </div>
                ) : accessibleOffers.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 shadow-xl shadow-orange-100/50 text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🔒</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            No Active Services
                        </h3>
                        <p className="text-gray-600 mb-6">
                            You don't have any active subscriptions yet. Join an offer to get
                            started.
                        </p>
                        <button
                            onClick={() => router.push("/marketplace")}
                            className="px-6 py-3 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white rounded-xl font-semibold shadow-lg shadow-orange-200"
                        >
                            Browse Marketplace
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-500 text-center mb-6">
                            Select a service to access
                        </p>
                        {accessibleOffers.map((offer) => (
                            <ServiceAccessCard key={offer.id} offer={offer} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
