"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { User, UserMode } from "@/types"
import { useCurrentAccount, useDisconnectWallet, useSignAndExecuteTransaction } from "@mysten/dapp-kit"
import { getSponsorService } from "@/lib/services/factory"

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
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const [user, setUser] = useState<User | null>(null);
    const [currentMode, setCurrentMode] = useState<UserMode>(null);

    // Sync wallet state with user state
    React.useEffect(() => {
        let active = true;
        if (currentAccount) {
            const address = currentAccount.address;
            setUser(prev => prev?.walletAddress === address ? prev : {
                walletAddress: address,
                isSponsor: false,
                stakedAmount: 0,
                stakedAt: undefined
            });

            const sponsorService = getSponsorService();
            sponsorService.checkIsSponsor(address)
                .then((isSponsor) => {
                    if (!active) return;
                    setUser(prev => {
                        if (!prev || prev.walletAddress !== address) return prev;
                        return { ...prev, isSponsor };
                    });
                })
                .catch(() => {
                    // Already handled in service; keep default false.
                });
        } else {
            setUser(null);
        }
        return () => {
            active = false;
        };
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
        if (!currentAccount?.address) {
            throw new Error("Wallet address required to stake");
        }
        const sponsorService = getSponsorService();
        const signer = {
            signAndExecuteTransaction: (input: { transaction: any }) => signAndExecuteTransaction(input),
        };
        const stakeAmount = 1;
        await sponsorService.stake(stakeAmount, signer, currentAccount.address);
        const isSponsor = await sponsorService.checkIsSponsor(currentAccount.address);
        setUser((prev) =>
            prev
                ? {
                    ...prev,
                    isSponsor,
                    stakedAmount: stakeAmount,
                    stakedAt: new Date(),
                }
                : null
        );
    }, [currentAccount?.address, signAndExecuteTransaction]);

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
