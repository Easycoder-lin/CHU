"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowLeft,
    Plus,
    Calendar,
    Clock,
    DollarSign,
    Users,
    Info,
    Loader2,
} from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useOffers } from "@/context/offers-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ServiceType } from "@/types"
import { cn } from "@/lib/utils"

const SERVICES: {
    id: ServiceType
    label: string
    icon: string
}[] = [
        { id: "Netflix", label: "Netflix", icon: "🎬" },
        { id: "YouTube", label: "YouTube Premium", icon: "▶️" },
        { id: "Spotify", label: "Spotify", icon: "🎵" },
        { id: "Disney+", label: "Disney+", icon: "🏰" },
        { id: "HBO Max", label: "HBO Max", icon: "📺" },
        { id: "Apple One", label: "Apple One", icon: "🍎" },
    ]

export default function SponsorCreateOfferPage() {
    const router = useRouter()
    const { user, walletConnected } = useAuth()
    const { createOffer } = useOffers()

    const [formData, setFormData] = useState({
        service: "Netflix" as ServiceType,
        title: "",
        description: "",
        totalSeats: 4,
        price: 5,
        period: "mo" as "mo" | "yr",
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const now = new Date()
    const credentialDeadline = new Date(now.getTime() + 86400000) // +24 hours

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!walletConnected || !user?.isSponsor) return
        setIsSubmitting(true)
        try {
            await createOffer({
                ...formData,
                title: formData.title || `${formData.service} Subscription`,
                tags: [formData.period === "mo" ? "Monthly" : "Annual"],
            })
            router.push("/sponsor/manage")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!walletConnected || !user?.isSponsor) {
        return (
            <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">
                        You need to be a sponsor to create offers.
                    </p>
                    <Button
                        onClick={() => router.push("/sponsor/stake")}
                        className="px-6 py-3 h-auto bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white rounded-xl font-semibold"
                    >
                        Become a Sponsor
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#FFF8F0]">
            {/* Header */}
            <header className="w-full px-6 py-4 border-b border-orange-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => router.push("/sponsor/manage")}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Back to Manage</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] flex items-center justify-center text-white font-bold">
                            S
                        </div>
                        <span className="text-xl font-bold text-gray-900">ShareMarket</span>
                    </div>
                    <div className="w-32" />
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Publish New Offer
                    </h1>
                    <p className="text-gray-600">
                        Share your subscription with the community and earn.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Service Selection */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm">
                        <Label className="block text-sm font-semibold text-gray-900 mb-4">
                            Select Service
                        </Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {SERVICES.map((service) => (
                                <button
                                    key={service.id}
                                    type="button"
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            service: service.id,
                                        }))
                                    }
                                    className={cn(
                                        "p-4 rounded-xl border-2 text-left transition-all",
                                        formData.service === service.id
                                            ? "border-[#FF6B6B] bg-orange-50"
                                            : "border-gray-100 hover:border-gray-200"
                                    )}
                                >
                                    <span className="text-2xl mb-2 block">{service.icon}</span>
                                    <span
                                        className={cn(
                                            "font-medium",
                                            formData.service === service.id
                                                ? "text-[#FF6B6B]"
                                                : "text-gray-700"
                                        )}
                                    >
                                        {service.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Offer Details */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
                        <h3 className="font-semibold text-gray-900">Offer Details</h3>

                        {/* Title */}
                        <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                Title (Optional)
                            </Label>
                            <Input
                                type="text"
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        title: e.target.value,
                                    }))
                                }
                                placeholder={`${formData.service} Premium Plan`}
                                className="w-full px-4 py-3 h-auto rounded-xl border border-gray-200 focus:border-[#FF6B6B] focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                Description (Optional)
                            </Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        description: e.target.value,
                                    }))
                                }
                                placeholder="Tell members about your subscription plan..."
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#FF6B6B] focus:ring-2 focus:ring-orange-100 outline-none transition-all resize-none"
                            />
                        </div>

                        {/* Seats and Price */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Users className="w-4 h-4 inline mr-1" />
                                    Number of Seats
                                </Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={formData.totalSeats}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            totalSeats: parseInt(e.target.value) || 1,
                                        }))
                                    }
                                    className="w-full px-4 py-3 h-auto rounded-xl border border-gray-200 focus:border-[#FF6B6B] focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <Label className="block text-sm font-medium text-gray-700 mb-2">
                                    <DollarSign className="w-4 h-4 inline mr-1" />
                                    Price per Seat (USD)
                                </Label>
                                <Input
                                    type="number"
                                    min={0.01}
                                    step={0.01}
                                    value={formData.price}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            price: parseFloat(e.target.value) || 0,
                                        }))
                                    }
                                    className="w-full px-4 py-3 h-auto rounded-xl border border-gray-200 focus:border-[#FF6B6B] focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Duration */}
                        <div>
                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Subscription Period
                            </Label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            period: "mo",
                                        }))
                                    }
                                    className={cn(
                                        "flex-1 py-3 rounded-xl border-2 font-medium transition-all",
                                        formData.period === "mo"
                                            ? "border-[#FF6B6B] bg-orange-50 text-[#FF6B6B]"
                                            : "border-gray-100 text-gray-600 hover:border-gray-200"
                                    )}
                                >
                                    Monthly
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            period: "yr",
                                        }))
                                    }
                                    className={cn(
                                        "flex-1 py-3 rounded-xl border-2 font-medium transition-all",
                                        formData.period === "yr"
                                            ? "border-[#FF6B6B] bg-orange-50 text-[#FF6B6B]"
                                            : "border-gray-100 text-gray-600 hover:border-gray-200"
                                    )}
                                >
                                    Annual
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Auto-generated Info */}
                    <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                        <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    <span className="text-blue-800">
                                        <strong>Created:</strong> {now.toLocaleDateString()}{" "}
                                        {now.toLocaleTimeString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-blue-600" />
                                    <span className="text-blue-800">
                                        <strong>Credential Deadline:</strong>{" "}
                                        {credentialDeadline.toLocaleDateString()}{" "}
                                        {credentialDeadline.toLocaleTimeString()}
                                    </span>
                                </div>
                                <p className="text-blue-600">
                                    You must submit valid credentials within 24 hours after the
                                    offer is fully booked.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 h-auto bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white rounded-xl font-semibold text-lg shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Publishing...
                            </>
                        ) : (
                            <>
                                <Plus className="w-5 h-5" />
                                Publish Offer
                            </>
                        )}
                    </Button>
                </form>
            </main>
        </div>
    )
}
