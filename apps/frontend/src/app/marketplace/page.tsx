"use client"

import React, { useState } from "react"
import { Navbar } from "@/components/shared/navbar"
import { Sidebar } from "@/features/marketplace/components/sidebar"
import { OfferGrid } from "@/features/marketplace/components/offer-grid"
import { useOffers } from "@/context/offers-context"

export default function MarketplacePage() {
    const { offers } = useOffers()
    const [activeTab, setActiveTab] = useState("Browse")
    const [selectedServices, setSelectedServices] = useState<string[]>([])
    const [selectedStatus, setSelectedStatus] = useState("all")

    const handleTabChange = (tab: string) => {
        setActiveTab(tab)
        // Navigation logic handled in Navbar for now, or here if we want to change routes
    }

    const handleServiceChange = (service: string) => {
        setSelectedServices((prev) =>
            prev.includes(service)
                ? prev.filter((s) => s !== service)
                : [...prev, service]
        )
    }

    // Filter Logic - only show LISTED offers in marketplace
    const filteredOffers = offers.filter((offer) => {
        // Only show listed offers in marketplace
        if (offer.status !== "LISTED") return false

        // Service Filter
        if (
            selectedServices.length > 0 &&
            !selectedServices.includes(offer.service)
        ) {
            return false
        }

        // Status Filter
        if (selectedStatus === "available" && offer.totalSeats === offer.takenSeats)
            return false
        if (
            selectedStatus === "almost-full" &&
            offer.totalSeats - offer.takenSeats > 1
        )
            return false

        // 'new' filter not implemented logic in original
        return true
    })

    return (
        <div className="min-h-screen bg-[#FFF8F0] font-sans text-gray-900">
            <Navbar activeTab={activeTab} onTabChange={handleTabChange} />

            <main className="max-w-7xl mx-auto px-4 py-8 md:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filters */}
                    <Sidebar
                        selectedServices={selectedServices}
                        onServiceChange={handleServiceChange}
                        selectedStatus={selectedStatus}
                        onStatusChange={setSelectedStatus}
                    />

                    {/* Main Content */}
                    <div className="flex-1">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                                    Explore Subscriptions
                                </h1>
                                <p className="text-gray-500">
                                    {filteredOffers.length}{" "}
                                    {filteredOffers.length === 1 ? "offer" : "offers"} available
                                </p>
                            </div>

                            {/* Sort Dropdown */}
                            <select className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-[#FF6B6B] focus:border-[#FF6B6B] block p-2.5 outline-none cursor-pointer hover:border-gray-300 transition-colors">
                                <option>Recommended</option>
                                <option>Price: Low to High</option>
                                <option>Price: High to Low</option>
                                <option>Newest First</option>
                            </select>
                        </div>

                        <OfferGrid offers={filteredOffers} />
                    </div>
                </div>
            </main>
        </div>
    )
}
