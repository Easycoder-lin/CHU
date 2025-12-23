"use client"

import React, { useState } from "react"
import {
    Wallet,
    Loader2,
    CheckCircle2,
    XCircle,
    FileSignature,
    ExternalLink,
} from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { Offer } from "@/types"
import { Button } from "@/components/ui/button"

export function ServiceAccessCard({ offer }: { offer: Offer }) {
    const { walletConnected, connectWallet } = useAuth()
    const [accessStep, setAccessStep] = useState<
        "initial" | "connecting" | "signing" | "success" | "failed"
    >("initial")
    const [isProcessing, setIsProcessing] = useState(false)

    const handleConnectWallet = async () => {
        setIsProcessing(true)
        setAccessStep("connecting")
        try {
            await connectWallet()
            // After wallet connected, move to signing step
            setTimeout(() => {
                setAccessStep("signing")
                setIsProcessing(false)
            }, 1000)
        } catch (error) {
            setAccessStep("failed")
            setIsProcessing(false)
        }
    }

    const handleSignToken = async () => {
        setIsProcessing(true)
        // Simulate signing membership token
        await new Promise((resolve) => setTimeout(resolve, 1500))
        // Mock: 95% success rate
        const success = Math.random() > 0.05
        setAccessStep(success ? "success" : "failed")
        setIsProcessing(false)
    }

    const handleAccessService = () => {
        const serviceUrls: Record<string, string> = {
            Netflix: "https://netflix.com",
            YouTube: "https://youtube.com/premium",
            Spotify: "https://spotify.com",
            "Disney+": "https://disneyplus.com",
            "HBO Max": "https://max.com",
            "Apple One": "https://apple.com/apple-one",
        }
        window.open(serviceUrls[offer.service] || "https://netflix.com", "_blank")
    }

    const getServiceIcon = (service: string): string => {
        const icons: Record<string, string> = {
            Netflix: "🎬",
            YouTube: "▶️",
            Spotify: "🎵",
            "Disney+": "🏰",
            "HBO Max": "📺",
            "Apple One": "🍎",
        }
        return icons[service] || "📱"
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
                        {getServiceIcon(offer.service)}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{offer.service}</h3>
                        <p className="text-sm text-gray-500">{offer.title}</p>
                    </div>
                </div>

                {/* Initial State - Show Connect Wallet */}
                {accessStep === "initial" && (
                    <div className="space-y-3">
                        <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700 mb-4">
                            <p className="font-medium mb-1">🔐 Verification Required</p>
                            <p className="text-blue-600">
                                Connect wallet and sign to verify your membership token
                            </p>
                        </div>
                        <Button
                            onClick={handleConnectWallet}
                            className="w-full py-3 h-auto bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <Wallet className="w-5 h-5" />
                            Connect Wallet to Verify
                        </Button>
                    </div>
                )}

                {/* Connecting State */}
                {accessStep === "connecting" && (
                    <div className="text-center py-6">
                        <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">Connecting wallet...</p>
                    </div>
                )}

                {/* Signing State - Show Sign Button */}
                {accessStep === "signing" && (
                    <div className="space-y-3">
                        <div className="bg-emerald-50 rounded-xl p-4 mb-4">
                            <div className="flex items-center gap-2 text-emerald-700 mb-2">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="font-medium">Wallet Connected</span>
                            </div>
                            <p className="text-sm text-emerald-600">
                                Now sign the membership token to verify ownership
                            </p>
                        </div>
                        <Button
                            onClick={handleSignToken}
                            disabled={isProcessing}
                            className="w-full py-3 h-auto bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Signing Token...
                                </>
                            ) : (
                                <>
                                    <FileSignature className="w-5 h-5" />
                                    Sign Membership Token
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* Success State - Show Access Button */}
                {accessStep === "success" && (
                    <div className="space-y-4">
                        <div className="bg-emerald-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-emerald-700 mb-2">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="font-medium">Verification Successful!</span>
                            </div>
                            <p className="text-sm text-emerald-600">
                                Your membership has been verified. Click below to access the
                                service.
                            </p>
                        </div>
                        <Button
                            onClick={handleAccessService}
                            className="w-full py-4 h-auto bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-lg"
                        >
                            <ExternalLink className="w-5 h-5" />
                            Access {offer.service}
                        </Button>
                    </div>
                )}

                {/* Failed State */}
                {accessStep === "failed" && (
                    <div className="space-y-4">
                        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                            <div className="flex items-center gap-2 text-red-700 mb-2">
                                <XCircle className="w-5 h-5" />
                                <span className="font-medium">Verification Failed</span>
                            </div>
                            <p className="text-sm text-red-600">
                                Unable to verify your membership. Your seat token may be invalid
                                or expired.
                            </p>
                        </div>
                        <Button
                            onClick={() => setAccessStep("initial")}
                            variant="outline"
                            className="w-full py-3 h-auto border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                        >
                            Try Again
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
