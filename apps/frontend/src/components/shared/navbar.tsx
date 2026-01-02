"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Bell, Menu, LogOut } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { WalletButton } from "@/components/shared/wallet-button"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface NavbarProps {
    activeTab?: string
    onTabChange?: (tab: string) => void
}

export function Navbar({ activeTab, onTabChange }: NavbarProps) {
    const router = useRouter()
    const { walletConnected, walletAddress, disconnectWallet, user } = useAuth()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const isSponsor = mounted && user?.isSponsor
    const tabs = ["Browse", "My Subscriptions", "Sponsor"]

    const handleTabClick = (tab: string) => {
        if (onTabChange) {
            onTabChange(tab)
        } else {
            // Fallback or navigation logic if no onTabChange provided
            // In real app, tabs might route to different pages
            if (tab === 'Sponsor') router.push(isSponsor ? '/sponsor/manage' : '/sponsor/stake')
            if (tab === 'My Subscriptions') router.push('/member/orders')
            if (tab === 'Browse') router.push('/orderbook')
        }
        setIsMobileMenuOpen(false)
    }

    return (
        <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-orange-100 dark:border-slate-800 px-4 py-3 md:px-6 lg:px-8 transition-colors">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <button
                    onClick={() => router.push("/")}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] flex items-center justify-center text-white font-bold text-lg">
                        S
                    </div>
                    <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                        ShareMarket
                    </span>
                </button>

                {/* Desktop Tabs */}
                <div className="hidden md:flex items-center space-x-1 bg-orange-50/50 p-1 rounded-full border border-orange-100">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => handleTabClick(tab)}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                                activeTab === tab
                                    ? "bg-white dark:bg-slate-800 text-[#FF6B6B] dark:text-orange-400 shadow-sm ring-1 ring-orange-100 dark:ring-slate-700"
                                    : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800"
                            )}
                        >
                            {tab === "Sponsor" ? (isSponsor ? "My Offers" : "Become Sponsor") : tab}
                        </button>
                    ))}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3 md:gap-4">
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative hidden sm:block">
                        <Search className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors relative hidden sm:block">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF6B6B] rounded-full border-2 border-white dark:border-slate-900"></span>
                    </button>

                    <ThemeToggle />

                    <WalletButton size="sm" className="hidden sm:flex" />

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-gray-600"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden pt-4 pb-2 border-t border-orange-100 mt-3 space-y-3 animate-in slide-in-from-top-2">
                    <div className="flex flex-col space-y-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabClick(tab)}
                                className={cn(
                                    "px-4 py-2 text-left text-sm font-medium rounded-lg mx-2",
                                    activeTab === tab
                                        ? "bg-orange-50 text-[#FF6B6B]"
                                        : "text-gray-600"
                                )}
                            >
                                {tab === "Sponsor" ? (isSponsor ? "My Offers" : "Become Sponsor") : tab}
                            </button>
                        ))}
                    </div>
                    <div className="px-4 pt-2">
                        <WalletButton fullWidth />
                    </div>
                </div>
            )}
        </nav>
    )
}
