"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Shield,
    Wallet,
    CheckCircle2,
    ArrowRight,
    Loader2,
    Info,
    ArrowLeft,
} from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { WalletButton } from "@/components/shared/wallet-button"
import { Button } from "@/components/ui/button"

export default function SponsorStakePage() {
    const router = useRouter()
    const { walletConnected, user, stakeToBecomeSponsors } = useAuth()
    const [isStaking, setIsStaking] = useState(false)
    const STAKE_AMOUNT = 100 // SUI tokens required

    const handleStake = async () => {
        setIsStaking(true)
        try {
            await stakeToBecomeSponsors()
        } finally {
            setIsStaking(false)
        }
    }

    const isSponsor = user?.isSponsor

    return (
        <div className="min-h-screen bg-[#FFF8F0]">
            {/* Header */}
            <header className="w-full px-6 py-4 border-b border-orange-100 bg-white/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] flex items-center justify-center text-white font-bold">
                            S
                        </div>
                        <span className="text-xl font-bold text-gray-900">ShareMarket</span>
                    </div>
                    <div className="w-20" /> {/* Spacer for centering */}
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-6 py-16">
                <div className="text-center mb-12">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-200">
                        <Shield className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Become a Sponsor
                    </h1>
                    <p className="text-lg text-gray-600 max-w-md mx-auto">
                        Stake tokens to verify your identity and start sharing your
                        subscriptions with the community.
                    </p>
                </div>

                {/* Stake Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-orange-100/50 overflow-hidden">
                    {/* Stake Amount Section */}
                    <div className="p-8 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">
                                    Required Stake Amount
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-gray-900">
                                        {STAKE_AMOUNT}
                                    </span>
                                    <span className="text-xl text-gray-500 font-medium">SUI</span>
                                </div>
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                                <img
                                    src="https://cryptologos.cc/logos/sui-sui-logo.png"
                                    alt="SUI"
                                    className="w-10 h-10"
                                    onError={(e) => {
                                        e.currentTarget.src =
                                            'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💎</text></svg>'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 rounded-xl p-4 flex gap-3">
                            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">Why stake?</p>
                                <p className="text-blue-600">
                                    Your stake acts as collateral to ensure you provide valid
                                    credentials. It will be returned along with member payments
                                    after the 3-day verification period.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Section */}
                    <div className="p-8">
                        {isSponsor ? (
                            // Already a sponsor
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    You're a Sponsor!
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    Your stake of {user?.stakedAmount} SUI is active. You can now
                                    create offers.
                                </p>
                                <Button
                                    onClick={() => router.push("/sponsor/manage")} // Redirect to manage instead of create directly? Page flow says create in original but manage seems better hub
                                    className="inline-flex items-center gap-2 px-6 py-3 h-auto bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white rounded-xl font-semibold shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:-translate-y-0.5 transition-all"
                                >
                                    Create Your First Offer
                                    <ArrowRight className="w-5 h-5" />
                                </Button>
                            </div>
                        ) : !walletConnected ? (
                            // Need to connect wallet
                            <div className="text-center">
                                <p className="text-gray-600 mb-6">
                                    Connect your wallet to stake tokens and become a sponsor.
                                </p>
                                <WalletButton variant="primary" size="lg" />
                            </div>
                        ) : (
                            // Ready to stake
                            <div className="text-center">
                                <p className="text-gray-600 mb-6">
                                    Your wallet is connected. Stake {STAKE_AMOUNT} SUI to become a
                                    sponsor.
                                </p>
                                <Button
                                    onClick={handleStake}
                                    disabled={isStaking}
                                    className="inline-flex items-center gap-2 px-8 py-4 h-auto bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white rounded-xl font-semibold text-lg shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                >
                                    {isStaking ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Staking...
                                        </>
                                    ) : (
                                        <>
                                            <Wallet className="w-5 h-5" />
                                            Stake to Become Sponsor
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Benefits */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                            <span className="text-xl">💰</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                            Earn Passive Income
                        </h4>
                        <p className="text-sm text-gray-600">
                            Share unused subscription seats and earn from each member.
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                            <span className="text-xl">🔒</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                            Secure Transactions
                        </h4>
                        <p className="text-sm text-gray-600">
                            Smart contracts handle all payments automatically.
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                            <span className="text-xl">⚡</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">Quick Payouts</h4>
                        <p className="text-sm text-gray-600">
                            Receive funds 3 days after credential verification.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}
