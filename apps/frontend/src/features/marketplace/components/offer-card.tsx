"use client"

import React, { useState } from "react"
import { Users } from "lucide-react"
import { Offer } from "@/types"
import { useOffers } from "@/context/offers-context"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { JoinOfferModal } from "./join-offer-modal"

interface OfferCardProps {
    offer: Offer
}

const SERVICE_CONFIG: Record<
    string,
    { color: string; bg: string; text: string }
> = {
    Netflix: {
        color: "#E50914",
        bg: "bg-red-50",
        text: "text-red-600",
    },
    YouTube: {
        color: "#FF0000",
        bg: "bg-red-50",
        text: "text-red-600",
    },
    Spotify: {
        color: "#1DB954",
        bg: "bg-green-50",
        text: "text-green-600",
    },
    "Disney+": {
        color: "#113CCF",
        bg: "bg-blue-50",
        text: "text-blue-600",
    },
    "HBO Max": {
        color: "#5822B4",
        bg: "bg-purple-50",
        text: "text-purple-600",
    },
    "Apple One": {
        color: "#000000",
        bg: "bg-gray-50",
        text: "text-gray-900",
    },
}

export function OfferCard({ offer }: OfferCardProps) {
    const { joinedOffers } = useOffers()
    const [showJoinModal, setShowJoinModal] = useState(false)

    const config =
        SERVICE_CONFIG[offer.service] || SERVICE_CONFIG["Netflix"]

    const availability = offer.totalSeats - offer.takenSeats
    const progressPercent = (offer.takenSeats / offer.totalSeats) * 100
    const isAlmostFull = availability === 1
    const isFull = availability === 0

    const hostName = offer.sponsorName || "Unknown"
    const hostAvatar =
        offer.sponsorAvatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Unknown"

    // Check if user already joined this offer
    const alreadyJoined = joinedOffers.some((jo) => jo.offerId === offer.id)

    const handleJoinClick = () => {
        setShowJoinModal(true)
    }

    return (
        <>
            <div className="group relative bg-white rounded-2xl border border-orange-100/50 shadow-sm hover:shadow-xl hover:shadow-orange-100/50 transition-all duration-300 overflow-hidden flex flex-col h-full transform hover:-translate-y-1">
                {/* Card Header */}
                <div
                    className={cn(
                        "h-24 relative p-6 flex items-start justify-between",
                        config.bg
                    )}
                >
                    <div className="flex flex-col">
                        <span
                            className={cn(
                                "text-xs font-bold uppercase tracking-wider opacity-80 mb-1",
                                config.text
                            )}
                        >
                            {offer.service}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-[#FF6B6B] transition-colors">
                            {offer.title}
                        </h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-lg font-bold shrink-0">
                        {offer.service[0]}
                    </div>
                </div>

                {/* Card Body */}
                <div className="p-6 flex-1 flex flex-col">
                    {/* Host Info */}
                    <div className="flex items-center gap-2 mb-4">
                        <img
                            src={hostAvatar}
                            alt={hostName}
                            className="w-6 h-6 rounded-full object-cover ring-2 ring-white"
                        />
                        <span className="text-sm text-gray-500">
                            Hosted by{" "}
                            <span className="font-medium text-gray-700">{hostName}</span>
                        </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {offer.tags.map((tag) => (
                            <span
                                key={tag}
                                className="px-2 py-1 rounded-md bg-gray-50 text-xs font-medium text-gray-600 border border-gray-100"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    <div className="mt-auto space-y-4">
                        {/* Seat Progress */}
                        <div>
                            <div className="flex justify-between text-sm mb-1.5">
                                <span className="text-gray-600 font-medium flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5" />
                                    {availability} spots left
                                </span>
                                <span className="text-gray-400 text-xs">
                                    {offer.takenSeats}/{offer.totalSeats} filled
                                </span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-500",
                                        isAlmostFull ? "bg-orange-400" : "bg-[#FF6B6B]"
                                    )}
                                    style={{
                                        width: `${progressPercent}%`,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Price and CTA */}
                        <div className="flex items-end justify-between pt-2 border-t border-gray-50">
                            <div>
                                <p className="text-xs text-gray-500 mb-0.5">Price per month</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-gray-900">
                                        ${offer.price}
                                    </span>
                                    <span className="text-sm text-gray-400 font-medium">
                                        /{offer.period}
                                    </span>
                                </div>
                            </div>

                            {alreadyJoined ? (
                                <div className="px-5 py-2.5 rounded-xl bg-emerald-100 text-emerald-700 font-semibold text-sm">
                                    ✓ You have a seat
                                </div>
                            ) : (
                                <Button
                                    onClick={handleJoinClick}
                                    disabled={isFull}
                                    className={cn(
                                        "px-5 py-2.5 h-auto rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm",
                                        isFull
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100"
                                            : "bg-[#FF6B6B] text-white hover:bg-[#FF5252] hover:shadow-md hover:shadow-orange-200 active:scale-95"
                                    )}
                                >
                                    {isFull ? "Full" : "Join Now"}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showJoinModal && (
                <JoinOfferModal
                    offer={offer}
                    onClose={() => setShowJoinModal(false)}
                    onSuccess={() => {
                        // Handle success logic if additional action needed
                    }}
                />
            )}
        </>
    )
}
