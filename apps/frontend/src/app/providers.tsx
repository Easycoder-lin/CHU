"use client"

import { ReactNode } from "react"
import { AuthProvider } from "@/context/auth-context"
import { OffersProvider } from "@/context/offers-context"

export function Providers({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <OffersProvider>
                {children}
            </OffersProvider>
        </AuthProvider>
    )
}
