"use client"

import React, { useState } from "react"
import { Copy, Eye, EyeOff, ShieldCheck, Clock, AlertCircle, CheckCircle2, MessageSquareWarning, Loader2 } from "lucide-react"
import type { Offer } from "@/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useMember } from "../hooks/use-member"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface SubscriptionCardProps {
    offer: Offer
}

export function SubscriptionCard({ offer }: SubscriptionCardProps) {
    const { toast } = useToast()
    const { raiseDispute, isRaisingDispute } = useMember()
    const [isRevealed, setIsRevealed] = useState(false)
    const [showDisputeDialog, setShowDisputeDialog] = useState(false)
    const [disputeReason, setDisputeReason] = useState("")

    const isExpired = offer.status === "CLOSED" || new Date() > new Date(offer.credentialDeadline)
    const hasCredentials = offer.status === "CREDENTIAL_SUBMITTED" && !!offer.credentials
    const isDisputed = offer.status === "DISPUTE_OPEN"

    // Service-specific styling
    const getServiceStyle = (service: string) => {
        switch (service) {
            case "Netflix":
                return "from-red-600/90 to-red-900/90 shadow-red-900/20"
            case "Spotify":
                return "from-green-500/90 to-green-800/90 shadow-green-900/20"
            case "YouTube":
                return "from-red-500/90 to-pink-600/90 shadow-pink-900/20"
            case "Disney+":
                return "from-blue-600/90 to-indigo-900/90 shadow-blue-900/20"
            default:
                return "from-slate-700 to-slate-900 shadow-slate-900/20"
        }
    }

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast({ title: "Copied!", description: `${label} copied to clipboard.` })
    }

    const handleRaiseDispute = async () => {
        if (!disputeReason) return
        try {
            await raiseDispute({
                offerId: offer.id,
                backendOfferId: offer.backendId,
                reason: disputeReason
            })
            setShowDisputeDialog(false)
            setDisputeReason("")
        } catch (error) {
            console.error(error)
        }
    }

    // Determine current status badge
    const renderStatusBadge = () => {
        if (isDisputed) {
            return (
                <div className="flex items-center gap-1 bg-amber-500/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-amber-500/30 text-white animate-pulse">
                    <MessageSquareWarning className="w-3 h-3" /> Under Dispute
                </div>
            )
        }
        if (isExpired) {
            return (
                <div className="flex items-center gap-1 bg-red-500/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-red-500/30 text-white">
                    <AlertCircle className="w-3 h-3" /> Expired
                </div>
            )
        }
        return (
            <div className="flex items-center gap-1 bg-emerald-500/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30 text-white">
                <CheckCircle2 className="w-3 h-3" /> Active
            </div>
        )
    }

    return (
        <div className="group relative w-full perspective-1000">
            {/* Main Card Container */}
            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-slate-900/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">

                {/* 1. Header Section (Service Brand) */}
                <div className={cn(
                    "relative h-32 p-6 flex flex-col justify-between bg-gradient-to-br text-white",
                    getServiceStyle(offer.service)
                )}>
                    {/* Glass Pattern Overlay */}
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                    <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>

                    <div className="relative z-10 flex justify-between items-start">
                        <div className="bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/10 uppercase tracking-wider">
                            {offer.period === 'mo' ? 'Monthly' : 'Annual'} Pass
                        </div>
                        {renderStatusBadge()}
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-2xl font-black tracking-tight">{offer.service}</h3>
                        <p className="text-white/80 text-sm font-medium opacity-90">{offer.title}</p>
                    </div>
                </div>

                {/* 2. Content Body */}
                <div className="p-6">
                    {/* Access Credentials Section */}
                    <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-1 border border-slate-100 dark:border-slate-800 mb-6">
                        {!isRevealed ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                                <ShieldCheck className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                                <div className="space-y-1">
                                    <p className="font-semibold text-slate-900 dark:text-slate-200">Credentials Protected</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 px-4">
                                        Click below to reveal username & password.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setIsRevealed(true)}
                                    className="bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500 rounded-xl px-6 h-10 font-semibold shadow-lg shadow-slate-200 dark:shadow-none"
                                >
                                    Access Credentials
                                </Button>
                            </div>
                        ) : (
                            <div className="p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Access Details</span>
                                    <button
                                        onClick={() => setIsRevealed(false)}
                                        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1"
                                    >
                                        <EyeOff className="w-3 h-3" /> Hide
                                    </button>
                                </div>

                                {/* Username Field */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Username / Email</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-700 dark:text-slate-200 truncate">
                                            {offer.credentials?.username || "user@example.com"}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => copyToClipboard(offer.credentials?.username || "", "Username")}
                                            className="shrink-0 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        >
                                            <Copy className="w-4 h-4 text-slate-500" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Password</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-700 dark:text-slate-200 truncate">
                                            {offer.credentials?.password || "••••••••"}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => copyToClipboard(offer.credentials?.password || "", "Password")}
                                            className="shrink-0 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        >
                                            <Copy className="w-4 h-4 text-slate-500" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Report Problem Button (Visible only when credentials are submitted and not expired/closed) */}
                    {hasCredentials && !isExpired && !isDisputed && (
                        <div className="mb-4">
                            <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 h-auto py-2 text-sm"
                                    >
                                        <MessageSquareWarning className="w-4 h-4 mr-2" />
                                        Report a Problem
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 text-rose-600">
                                            <ShieldCheck className="w-5 h-5" />
                                            Raise a Dispute
                                        </DialogTitle>
                                        <DialogDescription>
                                            If the credentials provided are invalid or stopped working, you can raise a formal dispute. This will freeze the sponsor's funds until resolved.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="reason">Reason for Dispute</Label>
                                            <Textarea
                                                id="reason"
                                                placeholder="e.g. Password incorrect, Account suspended..."
                                                value={disputeReason}
                                                onChange={(e) => setDisputeReason(e.target.value)}
                                                className="min-h-[100px]"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="evidence">Evidence Video</Label>
                                            <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                                <input
                                                    id="evidence"
                                                    type="file"
                                                    accept="video/*"
                                                    className="w-full text-sm text-slate-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 dark:file:bg-rose-900/20 dark:file:text-rose-400"
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                                * The platform will only intervene if more than 1/2 of the members submit video evidence.
                                            </p>
                                        </div>

                                        <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg text-xs text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-900">
                                            <strong>Warning:</strong> False disputes may result in a penalty to your account reputation.
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setShowDisputeDialog(false)}>Cancel</Button>
                                        <Button
                                            onClick={handleRaiseDispute}
                                            disabled={!disputeReason || isRaisingDispute}
                                            className="bg-rose-600 hover:bg-rose-700 text-white"
                                        >
                                            {isRaisingDispute ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                "Submit Dispute"
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}

                    {/* Footer Info */}
                    <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-4">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Expires {new Date(offer.credentialDeadline).toLocaleDateString()}</span>
                        </div>
                        <div className="font-medium text-slate-900 dark:text-slate-300">
                            ${offer.price} / {offer.period}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
