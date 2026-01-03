"use client"

import React, { useState } from "react"
import { Wallet, Loader2, CreditCard, CheckCircle2 } from "lucide-react"
import { Offer } from "@/types"
import { useAuth } from "@/context/auth-context"
import { useMember } from "@/features/member/hooks/use-member"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"

interface JoinOfferModalProps {
    offer: Offer
    onClose: () => void
    onSuccess: () => void
}

export function JoinOfferModal({
    offer,
    onClose,
    onSuccess,
}: JoinOfferModalProps) {
    const { connectWallet, walletConnected } = useAuth()
    const { joinOffer, isJoining } = useMember()
    const queryClient = useQueryClient()
    const [paymentStep, setPaymentStep] = useState<
        "connect" | "payment" | "success"
    >(walletConnected ? "payment" : "connect")
    const [isProcessing, setIsProcessing] = useState(false)

    const handleConnectWallet = async () => {
        setIsProcessing(true)
        try {
            await connectWallet()
            setPaymentStep("payment")
        } finally {
            setIsProcessing(false)
        }
    }

    const handlePayment = async () => {
        setIsProcessing(true)
        try {
            // Simulate payment processing
            await new Promise((resolve) => setTimeout(resolve, 2000))
            await joinOffer({ offerId: offer.id, backendOfferId: offer.backendId, amount: offer.price })
            queryClient.invalidateQueries({ queryKey: ["market-offers"] })
            queryClient.invalidateQueries({ queryKey: ["my-subscriptions"] })
            setPaymentStep("success")
            // Auto-close modal after showing success
            setTimeout(() => {
                onSuccess()
                onClose()
            }, 2000)
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Step 1: Connect Wallet */}
                {paymentStep === "connect" && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                            <Wallet className="w-8 h-8 text-[#FF6B6B]" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                            Connect Your Wallet
                        </h3>
                        <p className="text-gray-600 mb-6 text-center">
                            Connect your wallet to proceed with payment
                        </p>
                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-600">Subscription</span>
                                <span className="font-medium">{offer.title}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Price</span>
                                <span className="font-bold text-lg">
                                    ${offer.price}/{offer.period}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="flex-1 py-3 h-auto"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConnectWallet}
                                disabled={isProcessing}
                                className="flex-1 py-3 h-auto bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <Wallet className="w-4 h-4 mr-2" />
                                        Connect Wallet
                                    </>
                                )}
                            </Button>
                        </div>
                    </>
                )}

                {/* Step 2: Lock Funds */}
                {paymentStep === "payment" && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                            <CreditCard className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                            Lock Funds
                        </h3>
                        <p className="text-gray-600 mb-6 text-center">
                            Review and lock your escrow for this subscription
                        </p>
                        <div className="bg-gray-50 rounded-xl p-4 mb-4">
                            <div className="flex justify-between mb-3 pb-3 border-b border-gray-200">
                                <span className="text-gray-600">Subscription</span>
                                <span className="font-medium">{offer.title}</span>
                            </div>
                            <div className="flex justify-between mb-3">
                                <span className="text-gray-600">Price per month</span>
                                <span className="font-medium">${offer.price}</span>
                            </div>
                            <div className="flex justify-between mb-3">
                                <span className="text-gray-600">Platform fee</span>
                                <span className="font-medium">$0.00</span>
                            </div>
                            <div className="flex justify-between pt-3 border-t border-gray-200">
                                <span className="font-semibold text-gray-900">Total</span>
                                <span className="font-bold text-xl text-gray-900">
                                    ${offer.price}
                                </span>
                            </div>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-3 mb-6 text-sm text-blue-700">
                            💡 Funds lock immediately in escrow until credentials are verified
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="flex-1 py-3 h-auto"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handlePayment}
                                disabled={isProcessing}
                                className="flex-1 py-3 h-auto bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className="w-4 h-4 mr-2" />
                                        Lock ${offer.price}
                                    </>
                                )}
                            </Button>
                        </div>
                    </>
                )}

                {/* Step 3: Success */}
                {paymentStep === "success" && (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Escrow Locked!
                        </h3>
                        <p className="text-gray-600 mb-4">
                            You now have a seat in this subscription
                        </p>
                        <div className="bg-emerald-50 rounded-xl p-4 text-sm text-emerald-700">
                            ✓ You'll receive credentials once the sponsor submits them
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
