"use client"

import { ReactNode, useState } from "react"
import { createNetworkConfig, SuiClientProvider, WalletProvider } from "@mysten/dapp-kit"
import { getFullnodeUrl } from "@mysten/sui/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "@/context/auth-context"
import { OffersProvider } from "@/context/offers-context"
import "@mysten/dapp-kit/dist/index.css"

const { networkConfig } = createNetworkConfig({
    localnet: { url: getFullnodeUrl('localnet') },
    devnet: { url: getFullnodeUrl('devnet') },
    testnet: { url: getFullnodeUrl('testnet') },
    mainnet: { url: getFullnodeUrl('mainnet') },
})

export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient())

    return (
        <QueryClientProvider client={queryClient}>
            <SuiClientProvider networks={networkConfig} defaultNetwork="devnet">
                <WalletProvider>
                    <AuthProvider>
                        <OffersProvider>
                            {children}
                        </OffersProvider>
                    </AuthProvider>
                </WalletProvider>
            </SuiClientProvider>
        </QueryClientProvider>
    )
}
