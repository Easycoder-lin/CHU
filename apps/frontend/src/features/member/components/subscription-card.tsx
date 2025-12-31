"use client"

import React, { useState } from "react"
import { Copy, Eye, EyeOff, ShieldCheck, Clock, AlertCircle, CheckCircle2 } from "lucide-react"
import type { Offer } from "@/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface SubscriptionCardProps {
    offer: Offer
}

export function SubscriptionCard({ offer }: SubscriptionCardProps) {
    const { toast } = useToast()
    const [isRevealed, setIsRevealed] = useState(false)

    const isExpired = offer.status === "CLOSED" || new Date() > new Date(offer.credentialDeadline)
    const isPending = offer.status === "FULL_PENDING_CREDENTIAL"

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
                        {isExpired ? (
                            <div className="flex items-center gap-1 bg-red-500/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-red-500/30 text-white">
                                <AlertCircle className="w-3 h-3" /> Expired
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 bg-emerald-500/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30 text-white">
                                <CheckCircle2 className="w-3 h-3" /> Active
                            </div>
                        )}
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
