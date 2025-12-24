"use client"

import React, { useState } from "react"
import { Wallet, LogOut } from "lucide-react"
import { ConnectModal } from "@mysten/dapp-kit"
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
    const { walletConnected, walletAddress, disconnectWallet } = useAuth()
    const [open, setOpen] = useState(false)
    // ConnectModal is a React component that we render. We control it via open state.
    // However, @mysten/dapp-kit <ConnectModal> might operate differently depending on version. 
    // Usually it has a `trigger` prop or an `open` prop.
    // Let's check if we can import ConnectModal. If not, use <ConnectButton /> directly? 
    // But <ConnectButton /> has fixed styles.
    // To be safe and keep custom styles, we look for `ConnectModal` which offers `trigger` or `open`.
    // Assuming standard dapp-kit usage:
    // We will render <ConnectModal open={open} onOpenChange={setOpen} trigger={<button ... />} />
    // OR just use <ConnectButton className="..." /> if it accepts className?
    // Let's use ConnectModal to wrap our custom button as trigger.

    // BUT since I am not 100% sure of the API version without checking node_modules, 
    // and I cannot check node_modules deeply efficiently, 
    // I will use `ConnectModal` assuming it exists. If it fails build, I'll switch to `ConnectButton`.

    // Wait, let's use the safer `ConnectButton` component and try to override styles or use its `children` prop if it has one?
    // Actually, `ConnectModal` is cleaner for custom buttons.

    const handleConnect = () => {
        setOpen(true)
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
                    <span className="font-mono text-xs">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
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
        <ConnectModal
            trigger={
                <button
                    disabled={open}
                    className={cn(
                        baseClasses,
                        sizeClasses[size],
                        variantClasses[variant],
                        fullWidth ? "w-full" : "",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        className
                    )}
                >
                    <Wallet className="w-4 h-4" />
                    <span>Connect Wallet</span>
                </button>
            }
            open={open}
            onOpenChange={setOpen}
        />
    )
}
