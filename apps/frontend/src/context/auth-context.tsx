"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { User, UserMode } from "@/types"
import { useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit"

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
    const currentAccount = useCurrentAccount();
    const { mutate: disconnect } = useDisconnectWallet();
    const [user, setUser] = useState<User | null>(null);
    const [currentMode, setCurrentMode] = useState<UserMode>(null);

    // Sync wallet state with user state
    React.useEffect(() => {
        if (currentAccount) {
            setUser(prev => prev?.walletAddress === currentAccount.address ? prev : {
                walletAddress: currentAccount.address,
                isSponsor: false, // Default to false, checkSponsorStatus() in a real app
                stakedAmount: 0,
                stakedAt: undefined
            });
        } else {
            setUser(null);
        }
    }, [currentAccount]);

    const connectWallet = useCallback(async () => {
        // This is now handled by the UI triggering the ConnectModal
        // We can leave this as a no-op or a placeholder if components still call it, 
        // but ideally they should use the ConnectModal directly.
        console.warn("connectWallet called but connection is handled by ConnectModal");
    }, []);

    const disconnectWallet = useCallback(() => {
        disconnect();
        // State cleanup handled by useEffect
    }, [disconnect]);

    const stakeToBecomeSponsors = useCallback(async () => {
        console.log("Staking tokens to become sponsor...");
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setUser((prev) =>
            prev
                ? {
                    ...prev,
                    isSponsor: true,
                    stakedAmount: 100,
                    stakedAt: new Date(),
                }
                : null
        );
        console.log("Successfully staked! You are now a sponsor.");
    }, []);

    const setMode = useCallback((mode: UserMode) => {
        setCurrentMode(mode);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                walletConnected: !!currentAccount,
                walletAddress: currentAccount?.address || null,
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
    );
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
