"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { User, UserMode } from "@/types"

interface AuthContextType {
    walletConnected: boolean
    walletAddress: string | null
    user: User | null
    currentMode: UserMode
    connectWallet: () => Promise<void>
    disconnectWallet: () => void
    stakeToBecomeSponsors: () => Promise<void>
    setMode: (mode: UserMode) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [walletConnected, setWalletConnected] = useState(false)
    const [walletAddress, setWalletAddress] = useState<string | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [currentMode, setCurrentMode] = useState<UserMode>(null)

    const connectWallet = useCallback(async () => {
        // Mock wallet connection
        console.log("Connecting wallet...")
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const mockAddress = "current-user"
        setWalletConnected(true)
        setWalletAddress(mockAddress)
        setUser({
            walletAddress: mockAddress,
            isSponsor: true, // Mocking as sponsor for now
            stakedAmount: 100,
            stakedAt: new Date(Date.now() - 86400000 * 5),
        })
        console.log("Wallet connected:", mockAddress)
    }, [])

    const disconnectWallet = useCallback(() => {
        setWalletConnected(false)
        setWalletAddress(null)
        setUser(null)
    }, [])

    const stakeToBecomeSponsors = useCallback(async () => {
        console.log("Staking tokens to become sponsor...")
        await new Promise((resolve) => setTimeout(resolve, 1500))
        setUser((prev) =>
            prev
                ? {
                    ...prev,
                    isSponsor: true,
                    stakedAmount: 100,
                    stakedAt: new Date(),
                }
                : null
        )
        console.log("Successfully staked! You are now a sponsor.")
    }, [])

    const setMode = useCallback((mode: UserMode) => {
        setCurrentMode(mode)
    }, [])

    return (
        <AuthContext.Provider
            value={{
                walletConnected,
                walletAddress,
                user,
                currentMode,
                connectWallet,
                disconnectWallet,
                stakeToBecomeSponsors,
                setMode,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
