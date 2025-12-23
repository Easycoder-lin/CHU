"use client"

import React from "react"
import { Filter, Star, Clock, Zap, CheckCircle2, LucideIcon } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface SidebarProps {
    selectedServices: string[]
    onServiceChange: (service: string) => void
    selectedStatus: string
    onStatusChange: (status: string) => void
}

interface ServiceItem {
    id: string
    label: string
    count: number
}

interface StatusItem {
    id: string
    label: string
    icon: LucideIcon
}

export function Sidebar({
    selectedServices,
    onServiceChange,
    selectedStatus,
    onStatusChange,
}: SidebarProps) {
    const services: ServiceItem[] = [
        { id: "Netflix", label: "Netflix", count: 12 },
        { id: "YouTube", label: "YouTube Premium", count: 8 },
        { id: "Spotify", label: "Spotify Family", count: 15 },
        { id: "Disney+", label: "Disney+", count: 6 },
        { id: "HBO Max", label: "HBO Max", count: 4 },
        { id: "Apple One", label: "Apple One", count: 3 },
    ]

    const statuses: StatusItem[] = [
        { id: "all", label: "All Offers", icon: Filter },
        { id: "available", label: "Available Now", icon: CheckCircle2 },
        { id: "almost-full", label: "Almost Full", icon: Zap },
        { id: "new", label: "Newest", icon: Clock },
    ]

    return (
        <aside className="w-full lg:w-64 shrink-0 space-y-8">
            {/* Mobile/Tablet Header (only visible when stacked, but handled by parent layout usually) */}
            <div className="lg:hidden mb-4 flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Filters</h2>
                <button className="text-sm text-[#FF6B6B] font-medium">Reset</button>
            </div>

            {/* Status Filter */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Status
                </h3>
                <div className="space-y-1">
                    {statuses.map((status) => {
                        const Icon = status.icon
                        const isSelected = selectedStatus === status.id
                        return (
                            <button
                                key={status.id}
                                onClick={() => onStatusChange(status.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                    isSelected
                                        ? "bg-white text-[#FF6B6B] shadow-sm ring-1 ring-orange-100"
                                        : "text-gray-600 hover:bg-orange-50/50 hover:text-gray-900"
                                )}
                            >
                                <Icon
                                    className={cn(
                                        "w-4 h-4",
                                        isSelected ? "text-[#FF6B6B]" : "text-gray-400"
                                    )}
                                />
                                {status.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Service Filter */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Platform
                </h3>
                <div className="space-y-2">
                    {services.map((service) => (
                        <div
                            key={service.id}
                            className="flex items-center justify-between group cursor-pointer p-1 rounded-lg hover:bg-orange-50/30 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id={service.id}
                                        checked={selectedServices.includes(service.id)}
                                        onCheckedChange={() => onServiceChange(service.id)}
                                        className="border-gray-200 text-[#FF6B6B] data-[state=checked]:bg-[#FF6B6B] data-[state=checked]:border-[#FF6B6B]"
                                    />
                                    <Label
                                        htmlFor={service.id}
                                        className={cn(
                                            "text-sm font-medium transition-colors cursor-pointer",
                                            selectedServices.includes(service.id)
                                                ? "text-gray-900"
                                                : "text-gray-600 group-hover:text-gray-900"
                                        )}
                                    >
                                        {service.label}
                                    </Label>
                                </div>
                            </div>
                            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                {service.count}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Promo Card */}
            <div className="bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] rounded-2xl p-5 text-white shadow-lg shadow-orange-200">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-4 backdrop-blur-sm">
                    <Star className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-1">Go Premium</h3>
                <p className="text-orange-50 text-sm mb-4 leading-relaxed">
                    Save up to 20% on platform fees when you upgrade to Pro.
                </p>
                <button className="w-full py-2 bg-white text-[#FF6B6B] rounded-lg text-sm font-bold shadow-sm hover:bg-orange-50 transition-colors">
                    Upgrade Now
                </button>
            </div>
        </aside>
    )
}
