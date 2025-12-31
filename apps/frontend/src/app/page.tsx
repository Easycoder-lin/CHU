"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/orderbook")
  }, [router])

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <p className="text-gray-600 font-medium">Loading Marketplace...</p>
      </div>
    </div>
  )
}

