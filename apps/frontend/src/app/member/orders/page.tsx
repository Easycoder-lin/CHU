"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Wallet } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useMember } from "@/features/member/hooks/use-member"
import { SubscriptionCard } from "@/features/member/components/subscription-card"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/shared/navbar"

export default function MemberOrdersPage() {
  const router = useRouter()
  const { walletConnected } = useAuth()
  const { subscriptions: offers } = useMember()

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar activeTab="My Subscriptions" />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Wallet className="w-8 h-8 text-indigo-600" />
              Subscription Wallet
            </h1>
            <p className="text-gray-600">
              Your active digital membership cards. Click "Access" to reveal credentials.
            </p>
          </div>
          {walletConnected && offers.length > 0 && (
            <div className="hidden md:block">
              <span className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-semibold text-sm">
                {offers.length} Active Pass{offers.length !== 1 ? 'es' : ''}
              </span>
            </div>
          )}
        </div>

        {!walletConnected ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-lg border border-gray-100 max-w-2xl mx-auto mt-12">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-10 h-10 text-indigo-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Please connect your wallet to view your purchased subscriptions and access credentials.
            </p>
            <Button
              onClick={() => router.push("/orderbook")} // Should probably trigger wallet connect but redirection works for now
              className="px-8 py-6 h-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-indigo-200"
            >
              Go to Marketplace
            </Button>
          </div>
        ) : offers.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-dashed border-gray-300 max-w-2xl mx-auto mt-8">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl opacity-50">📭</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Your Wallet is Empty
            </h3>
            <p className="text-gray-500 mb-8">
              You haven't joined any shared plans yet.
            </p>
            <Button
              onClick={() => router.push("/orderbook")}
              className="px-6 py-3 h-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
            >
              Browse Subscriptions
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {offers.map((offer) => {
              return (
                <SubscriptionCard
                  key={offer.id}
                  offer={offer}
                />
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
