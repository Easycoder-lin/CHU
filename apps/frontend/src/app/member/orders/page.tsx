"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useOffers } from "@/context/offers-context"
import { OrderCard } from "@/features/member/components/order-card"
import { Button } from "@/components/ui/button"

export default function MemberOrdersPage() {
  const router = useRouter()
  const { walletConnected } = useAuth()
  const { getUserJoinedOffers, joinedOffers } = useOffers()

  const offers = getUserJoinedOffers()

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {/* Header */}
      <header className="w-full px-6 py-4 border-b border-orange-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push("/marketplace")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Marketplace</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] flex items-center justify-center text-white font-bold">
              S
            </div>
            <span className="text-xl font-bold text-gray-900">ShareMarket</span>
          </div>
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">
            View and manage your subscription memberships.
          </p>
        </div>

        {!walletConnected ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <p className="text-gray-600 mb-4">
              Connect your wallet to view your orders.
            </p>
            <Button
              onClick={() => router.push("/marketplace")}
              className="px-6 py-3 h-auto bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white rounded-xl font-semibold"
            >
              Go to Marketplace
            </Button>
          </div>
        ) : offers.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🛒</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Orders Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Browse the marketplace to find subscriptions to join.
            </p>
            <Button
              onClick={() => router.push("/marketplace")}
              className="px-6 py-3 h-auto bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white rounded-xl font-semibold shadow-lg shadow-orange-200"
            >
              Browse Marketplace
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {offers.map((offer) => {
              const joinedOffer = joinedOffers.find(
                (jo) => jo.offerId === offer.id
              )
              return (
                <OrderCard
                  key={offer.id}
                  offer={offer}
                  hasReportedProblem={joinedOffer?.hasReportedProblem || false}
                />
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
