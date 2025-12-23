"use client"

import React, { useState } from "react"
import { Wallet, LogOut, Loader2 } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"

interface WalletButtonProps {
    variant?: "primary" | "secondary" | "outline"
    size?: "sm" | "md" | "lg"
    fullWidth?: boolean
    showDisconnect?: boolean
    className?: string
}

export function WalletButton({
    variant = "primary",
    size = "md",
    fullWidth = false,
    showDisconnect = true,
    className,
}: WalletButtonProps) {
    const { walletConnected, walletAddress, connectWallet, disconnectWallet } =
        useAuth()
    const [isLoading, setIsLoading] = useState(false)

    const handleConnect = async () => {
        setIsLoading(true)
        try {
            await connectWallet()
        } finally {
            setIsLoading(false)
        }
    }

    const baseClasses =
        "inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-200"

    const sizeClasses = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
    }

    const variantClasses = {
        primary:
            "bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] text-white shadow-md shadow-orange-200 hover:shadow-lg hover:shadow-orange-300 hover:-translate-y-0.5",
        secondary:
            "bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50",
        outline:
            "bg-transparent text-[#FF6B6B] border-2 border-[#FF6B6B] hover:bg-[#FF6B6B] hover:text-white",
    }

    if (walletConnected && walletAddress) {
        return (
            <div
                className={cn(
                    "flex items-center gap-2",
                    fullWidth ? "w-full" : "",
                    className
                )}
            >
                <div
                    className={cn(
                        baseClasses,
                        sizeClasses[size],
                        "bg-emerald-50 text-emerald-700 border border-emerald-200",
                        fullWidth ? "flex-1" : ""
                    )}
                >
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono text-xs">{walletAddress}</span>
                </div>
                {showDisconnect && (
                    <button
                        onClick={disconnectWallet}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Disconnect wallet"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                )}
            </div>
        )
    }

    return (
        <button
            onClick={handleConnect}
            disabled={isLoading}
            className={cn(
                baseClasses,
                sizeClasses[size],
                variantClasses[variant],
                fullWidth ? "w-full" : "",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                className
            )}
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Wallet className="w-4 h-4" />
            )}
            <span>{isLoading ? "Connecting..." : "Connect Wallet"}</span>
        </button>
    )
}
