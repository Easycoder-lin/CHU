"use client"

import React from "react"
import { Sparkles, Lock, Shield, Zap } from "lucide-react"
import { WalletButton } from "@/components/shared/wallet-button"

export function LandingView() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
            <div className="max-w-4xl mx-auto text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-full text-[#FF6B6B] font-medium text-sm mb-6">
                    <Sparkles className="w-4 h-4" />
                    <span>Powered by Sui Blockchain</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                    Share Subscriptions,
                    <br />
                    <span className="bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] bg-clip-text text-transparent">
                        Save Together
                    </span>
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-10">
                    A decentralized marketplace for sharing subscription services. Connect your wallet to start saving securely.
                </p>

                {/* Primary Call to Action */}
                <div className="flex justify-center">
                    <WalletButton size="lg" className="shadow-xl shadow-orange-200/50" />
                </div>
            </div>

            {/* Features Grid */}
            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-6 h-6 text-[#FF6B6B]" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                        Secure & Trustless
                    </h4>
                    <p className="text-sm text-gray-600">
                        Smart contracts ensure fair transactions without intermediaries
                    </p>
                </div>
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-6 h-6 text-[#FF6B6B]" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                        Dispute Protection
                    </h4>
                    <p className="text-sm text-gray-600">
                        3-day verification period protects both sponsors and members
                    </p>
                </div>
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                        <Zap className="w-6 h-6 text-[#FF6B6B]" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                        Instant Access
                    </h4>
                    <p className="text-sm text-gray-600">
                        Get credentials immediately after subscription is confirmed
                    </p>
                </div>
            </div>
        </div>
    )
}
