"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Plus, Wallet } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useSponsor } from "@/features/sponsor/hooks/use-sponsor"
import { OfferManageCard } from "@/features/sponsor/components/offer-manage-card"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/shared/navbar"

export default function SponsorManagePage() {
    const router = useRouter()
    const { user, walletConnected } = useAuth()
    const { myOffers: offers } = useSponsor()

    if (!walletConnected || !user?.isSponsor) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0b0f1a] flex items-center justify-center transition-colors">
                <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <p className="text-slate-600 dark:text-slate-400 mb-6 text-lg">
                        You need to be a sponsor to manage offers.
                    </p>
                    <Button
                        onClick={() => router.push("/sponsor/stake")}
                        className="px-8 py-4 h-auto bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all"
                    >
                        Become a Sponsor
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0b0f1a] transition-colors duration-300">
            <Navbar activeTab="My Offers" />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                            <Wallet className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                            Manage Offers
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            Track your active listings and manage credentials.
                        </p>
                    </div>

                    <Button
                        onClick={() => router.push("/sponsor/create")}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 h-auto bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white rounded-full font-bold shadow-lg shadow-orange-200 dark:shadow-none hover:shadow-xl hover:scale-105 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        New Offer
                    </Button>
                </div>

                {offers.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 text-center shadow-sm border border-dashed border-slate-300 dark:border-slate-700">
                        <div className="w-20 h-20 rounded-full bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center mx-auto mb-6">
                            <Plus className="w-10 h-10 text-[#FF6B6B]" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                            No Offers Yet
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                            You haven't listed any subscriptions yet. Create your first offer to start earning.
                        </p>
                        <Button
                            onClick={() => router.push("/sponsor/create")}
                            className="px-8 py-4 h-auto bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white rounded-xl font-bold shadow-lg shadow-orange-200 dark:shadow-none transition-transform hover:scale-105"
                        >
                            Create First Offer
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {offers.map((offer) => (
                            <OfferManageCard key={offer.id} offer={offer} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
