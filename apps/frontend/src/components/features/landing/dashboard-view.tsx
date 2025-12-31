"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export function DashboardView() {
    const router = useRouter()

    useEffect(() => {
        router.push("/orderbook")
    }, [router])

    return (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                <p className="text-gray-600 font-medium">Redirecting to Orderbook...</p>
            </div>
        </div>
    )
}
