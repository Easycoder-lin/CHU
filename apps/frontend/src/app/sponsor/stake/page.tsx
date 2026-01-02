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
    Lock,
    Zap,
    Coins
} from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { WalletButton } from "@/components/shared/wallet-button"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/shared/navbar"
import { useSponsor } from "@/features/sponsor/hooks/use-sponsor"
import { cn } from "@/lib/utils"

export default function SponsorStakePage() {
    const router = useRouter()
    const { walletConnected, user } = useAuth()
    const { stake, isStaking, isSponsor } = useSponsor()
    const STAKE_AMOUNT = 20 // SUI tokens required

    const handleStake = async () => {
        try {
            await stake(STAKE_AMOUNT)
            router.push("/sponsor/create")
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div className="min-h-screen bg-[#FFF8F0]">
            <Navbar activeTab="Sponsor" />

            <main className="max-w-5xl mx-auto px-6 py-12">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                    {/* Left Column: Value Prop */}
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 border border-orange-200 text-orange-700 text-sm font-semibold">
                            <Shield className="w-4 h-4" />
                            <span>Verified Sponsor Program</span>
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                                Build Trust with <br />
                                <span className="text-[#FF6B6B]">
                                    Secure Staking
                                </span>
                            </h1>
                            <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
                                To protect our community, sponsors stake a security deposit.
                                This insurance mechanism prevents abuse and ensures high-quality service for all members.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <FeatureRow
                                icon={<Lock className="w-5 h-5 text-emerald-600" />}
                                title="100% Refundable"
                                desc="Your stake is returned automatically when you close your offers."
                            />
                            <FeatureRow
                                icon={<Zap className="w-5 h-5 text-amber-500" />}
                                title="Instant Activation"
                                desc="Gain immediate access to publish unlimited subscription offers."
                            />
                            <FeatureRow
                                icon={<Coins className="w-5 h-5 text-blue-500" />}
                                title="Earn Fees"
                                desc="Sponsors earn 98% of the subscription fees paid by members."
                            />
                        </div>
                    </div>

                    {/* Right Column: Interactive Card */}
                    <div>
                        <div className="bg-white rounded-3xl border border-orange-100 shadow-xl shadow-orange-100/50 p-8 md:p-10 relative overflow-hidden">
                            {/* Decorator */}
                            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53]" />

                            {/* Card Header */}
                            <div className="text-center mb-10">
                                <div className="w-20 h-20 mx-auto mb-6 bg-orange-50 rounded-full flex items-center justify-center">
                                    <Shield className="w-10 h-10 text-[#FF6B6B]" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Sponsor Deposit</h3>
                                <div className="flex items-center justify-center gap-2 text-gray-500">
                                    <span>Required Amount:</span>
                                    <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-sm">
                                        {STAKE_AMOUNT} SUI
                                    </span>
                                </div>
                            </div>

                            {/* Card Body & Actions */}
                            <div className="space-y-6">
                                {isSponsor ? (
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center">
                                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <p className="text-emerald-900 font-bold text-lg mb-1">Status: Active</p>
                                        <p className="text-emerald-700 text-sm mb-6">
                                            Your security deposit is active. You are cleared to publish offers.
                                        </p>
                                        <Button
                                            onClick={() => router.push("/sponsor/create")}
                                            className="w-full py-6 text-lg bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-lg shadow-emerald-200"
                                        >
                                            Create New Offer
                                            <ArrowRight className="w-5 h-5 ml-2" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        {!walletConnected ? (
                                            <div className="space-y-4">
                                                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-center">
                                                    <p className="text-gray-600 mb-4">Connect wallet to initiate setup</p>
                                                    <WalletButton variant="primary" size="lg" fullWidth className="justify-center py-6 text-lg" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex gap-3 text-sm text-orange-800">
                                                    <Info className="w-5 h-5 shrink-0 text-orange-600" />
                                                    <p>
                                                        This transaction locks {STAKE_AMOUNT} SUI in the smart contract.
                                                        You retain full ownership.
                                                    </p>
                                                </div>
                                                <Button
                                                    onClick={handleStake}
                                                    disabled={isStaking}
                                                    className="w-full py-6 text-lg bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] hover:opacity-90 text-white rounded-xl font-semibold shadow-lg shadow-orange-200 transition-all hover:-translate-y-0.5"
                                                >
                                                    {isStaking ? (
                                                        <div className="flex items-center gap-2">
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                            Processing Stake...
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <Wallet className="w-5 h-5" />
                                                            Stake {STAKE_AMOUNT} SUI
                                                        </div>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Footer Note */}
                            <div className="mt-8 text-center">
                                <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    Powered by SUI Smart Contracts
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

function FeatureRow({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="flex gap-4 p-4 rounded-2xl hover:bg-white transition-colors border border-transparent hover:border-orange-100">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-gray-100">
                {icon}
            </div>
            <div>
                <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
        </div>
    )
}
