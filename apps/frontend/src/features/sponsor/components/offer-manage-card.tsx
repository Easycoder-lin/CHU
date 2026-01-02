"use client"

import React, { useState } from "react"
import {
    Clock,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    Key,
    DollarSign,
} from "lucide-react"

function getServiceIcon(service: string): string {
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
import { useSponsor } from "@/features/sponsor/hooks/use-sponsor"
import { useMember } from "@/features/member/hooks/use-member"
import { Offer } from "@/types"
import { OfferStatusBadge } from "@/components/shared/offer-status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

export function OfferManageCard({ offer }: { offer: Offer }) {
    const { submitCredentials, withdraw, isSubmittingCredentials: isSubmitting, isWithdrawing } = useSponsor()
    const { slashOffer, isSlashingOffer, claimSlash, isClaimingSlash } = useMember()
    const [showCredentialForm, setShowCredentialForm] = useState(false)
    const [credentials, setCredentials] = useState({
        username: "",
        password: "",
    })
    const [confirmed, setConfirmed] = useState(false)

    const handleSubmitCredentials = async () => {
        if (!confirmed || !credentials.username || !credentials.password) return

        try {
            await submitCredentials({
                offerId: offer.id,
                backendOfferId: offer.backendId,
                credentials: { username: credentials.username, password: credentials.password },
            })
            setShowCredentialForm(false)
        } catch (error) {
            console.error(error)
        }
    }

    const handleWithdraw = async () => {
        try {
            await withdraw({ offerId: offer.id, backendOfferId: offer.backendId })
        } catch (error) {
            console.error(error)
        }
    }

    const handleSlashOffer = async () => {
        try {
            await slashOffer({ offerId: offer.id, backendOfferId: offer.backendId })
        } catch (error) {
            console.error(error)
        }
    }

    const handleClaimSlash = async () => {
        try {
            await claimSlash({ backendOfferId: offer.backendId })
        } catch (error) {
            console.error(error)
        }
    }

    const canSubmitCredentials = offer.status === "FULL_PENDING_CREDENTIAL"
    const canWithdraw = offer.status === "RELEASABLE"
    const canSlashOffer =
        offer.status === "FULL_PENDING_CREDENTIAL" &&
        !!offer.credentialDeadline &&
        new Date() > new Date(offer.credentialDeadline)
    const showCredentials =
        offer.status === "CREDENTIAL_SUBMITTED" && offer.credentials

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden text-left transition-colors">
            {/* Card Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{getServiceIcon(offer.service)}</span>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{offer.title}</h3>
                        </div>
                        <OfferStatusBadge status={offer.status} />
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">${offer.price}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">per seat / {offer.period}</p>
                    </div>
                </div>

                {/* Seats Progress */}
                <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600 dark:text-slate-400">Seats Filled</span>
                        <span className="font-medium text-slate-900 dark:text-slate-200">
                            {offer.takenSeats} / {offer.totalSeats}
                        </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] rounded-full transition-all"
                            style={{
                                width: `${(offer.takenSeats / offer.totalSeats) * 100}%`,
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Action Section */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950/50">
                {/* Show credential submission form */}
                {canSubmitCredentials && !showCredentialForm && (
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-500 mb-4">
                            <Clock className="w-5 h-5" />
                            <span className="font-medium">
                                Credential submission required
                            </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Deadline: {offer.credentialDeadline?.toLocaleDateString()}{" "}
                            {offer.credentialDeadline?.toLocaleTimeString()}
                        </p>
                        <Button
                            onClick={() => setShowCredentialForm(true)}
                            className="px-6 py-3 h-auto bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white rounded-xl font-semibold shadow-md dark:shadow-none hover:opacity-90 transition-opacity"
                        >
                            Submit Credentials
                        </Button>
                        {canSlashOffer && (
                            <Button
                                onClick={handleSlashOffer}
                                disabled={isSlashingOffer}
                                variant="outline"
                                className="mt-3 px-6 py-3 h-auto border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                            >
                                {isSlashingOffer ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Slashing...
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle className="w-4 h-4 mr-2" />
                                        Slash Offer
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                )}

                {/* Credential Form */}
                {canSubmitCredentials && showCredentialForm && (
                    <div className="space-y-4">
                        <div>
                            <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Username / Email
                            </Label>
                            <Input
                                type="text"
                                value={credentials.username}
                                onChange={(e) =>
                                    setCredentials((prev) => ({
                                        ...prev,
                                        username: e.target.value,
                                    }))
                                }
                                className="w-full px-4 py-3 h-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-[#FF6B6B] focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900 outline-none"
                                placeholder="Enter account username or email"
                            />
                        </div>
                        <div>
                            <Label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Password
                            </Label>
                            <Input
                                type="password"
                                value={credentials.password}
                                onChange={(e) =>
                                    setCredentials((prev) => ({
                                        ...prev,
                                        password: e.target.value,
                                    }))
                                }
                                className="w-full px-4 py-3 h-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-[#FF6B6B] focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900 outline-none"
                                placeholder="Enter account password"
                            />
                        </div>
                        <label className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900 cursor-pointer">
                            <Checkbox
                                checked={confirmed}
                                onCheckedChange={(checked) => setConfirmed(!!checked)}
                                className="mt-0.5 border-amber-300 dark:border-amber-700 text-[#FF6B6B] data-[state=checked]:bg-[#FF6B6B] data-[state=checked]:border-[#FF6B6B]"
                            />
                            <div>
                                <p className="font-medium text-amber-800 dark:text-amber-400">
                                    I confirm these credentials are correct and working
                                </p>
                                <p className="text-sm text-amber-600 dark:text-amber-500/80">
                                    Providing invalid credentials may result in disputes and loss of
                                    stake.
                                </p>
                            </div>
                        </label>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowCredentialForm(false)}
                                className="flex-1 py-3 h-auto border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmitCredentials}
                                disabled={
                                    !confirmed ||
                                    !credentials.username ||
                                    !credentials.password ||
                                    isSubmitting
                                }
                                className="flex-1 py-3 h-auto bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Key className="w-4 h-4" />
                                        Submit
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Show submitted credentials info */}
                {showCredentials && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-medium">Credentials submitted</span>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 text-sm border border-blue-100 dark:border-blue-900">
                            <p className="text-blue-800 dark:text-blue-300">
                                <strong>Submitted:</strong>{" "}
                                {offer.credentials?.submittedAt.toLocaleDateString()}{" "}
                                {offer.credentials?.submittedAt.toLocaleTimeString()}
                            </p>
                            <p className="text-blue-800 dark:text-blue-300 mt-1">
                                <strong>Unlock Date:</strong>{" "}
                                {offer.credentials?.unlockAt.toLocaleDateString()}{" "}
                                {offer.credentials?.unlockAt.toLocaleTimeString()}
                            </p>
                            <p className="text-blue-600 dark:text-blue-400 mt-2">
                                Funds will be available for withdrawal after the 3-day
                                verification period.
                            </p>
                        </div>
                    </div>
                )}

                {/* Withdraw button */}
                {canWithdraw && (
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 mb-4">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-medium">Verification period complete!</span>
                        </div>
                        <Button
                            onClick={handleWithdraw}
                            disabled={isWithdrawing}
                            className="px-8 py-4 h-auto bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-200 dark:shadow-none hover:shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
                        >
                            {isWithdrawing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <DollarSign className="w-5 h-5" />
                                    Withdraw Funds
                                </>
                            )}
                        </Button>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
                            You'll receive your stake + all member payments
                        </p>
                    </div>
                )}

                {/* Dispute status */}
                {offer.status === "DISPUTE_OPEN" && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900">
                            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
                            <div>
                                <p className="font-medium text-red-800 dark:text-red-300">Dispute in Progress</p>
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    A member has reported an issue with the credentials.
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handleClaimSlash}
                            disabled={isClaimingSlash}
                            className="w-full py-3 h-auto rounded-xl font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isClaimingSlash ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Claiming...
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="w-4 h-4" />
                                    Claim Slash
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* Closed status */}
                {offer.status === "CLOSED" && (
                    <div className="flex items-center gap-3 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        <CheckCircle2 className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                        <div>
                            <p className="font-medium text-slate-700 dark:text-slate-300">Offer Completed</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Funds have been withdrawn successfully.
                            </p>
                        </div>
                    </div>
                )}

                {/* Listed status */}
                {offer.status === "LISTED" && (
                    <div className="text-center text-slate-500 dark:text-slate-400">
                        <p>Waiting for members to join...</p>
                        <p className="text-sm mt-1">
                            {offer.totalSeats - offer.takenSeats} seats remaining
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
