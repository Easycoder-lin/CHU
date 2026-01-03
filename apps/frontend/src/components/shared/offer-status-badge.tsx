import React from "react"
import { Clock, CheckCircle2, AlertTriangle, Lock, Unlock, XCircle, LucideIcon } from "lucide-react"
import { OfferStatus } from "@/types"
import { cn } from "@/lib/utils"

interface OfferStatusBadgeProps {
    status: OfferStatus
    size?: "sm" | "md"
    className?: string
}

const STATUS_CONFIG: Record<
    OfferStatus,
    {
        label: string
        icon: LucideIcon
        bg: string
        text: string
        border: string
    }
> = {
    LISTED: {
        label: "Available",
        icon: CheckCircle2,
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
    },
    WAITING_FOR_CREDENTIAL: {
        label: "Waiting for Credentials",
        icon: Clock,
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
    },
    CREDENTIAL_SUBMITTED: {
        label: "Credentials Submitted",
        icon: Lock,
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
    },
    DISPUTE_OPEN: {
        label: "Dispute Open",
        icon: AlertTriangle,
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
    },
    RELEASABLE: {
        label: "Ready to Release",
        icon: Unlock,
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-200",
    },
    PENDING: {
        label: "Pending",
        icon: Clock,
        bg: "bg-slate-50",
        text: "text-slate-700",
        border: "border-slate-200",
    },
    FAILED: {
        label: "Failed",
        icon: XCircle,
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
    },
    CLOSED: {
        label: "Completed",
        icon: XCircle,
        bg: "bg-gray-50",
        text: "text-gray-600",
        border: "border-gray-200",
    },
}

export function OfferStatusBadge({
    status,
    size = "md",
    className,
}: OfferStatusBadgeProps) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.LISTED
    const Icon = config.icon

    const sizeClasses =
        size === "sm" ? "px-2 py-0.5 text-xs gap-1" : "px-3 py-1.5 text-sm gap-1.5"
    const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4"

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full font-medium border",
                config.bg,
                config.text,
                config.border,
                sizeClasses,
                className
            )}
        >
            <Icon className={iconSize} />
            {config.label}
        </span>
    )
}
