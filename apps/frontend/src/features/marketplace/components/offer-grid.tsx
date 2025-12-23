import React from "react"
import { Offer } from "@/types"
import { OfferCard } from "./offer-card"

interface OfferGridProps {
    offers: Offer[]
}

export function OfferGrid({ offers }: OfferGridProps) {
    if (offers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6">
                    <span className="text-4xl">🔍</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No offers found
                </h3>
                <p className="text-gray-500 max-w-md">
                    Try adjusting your filters or search criteria to find what you're
                    looking for.
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {offers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
            ))}
        </div>
    )
}
