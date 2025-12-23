"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Users, Shield, LogIn, Sparkles, Lock, Zap } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { ModeCard } from "@/components/features/landing/mode-card"
import { UserMode } from "@/types"

export default function LandingPage() {
  const router = useRouter()
  const { setMode } = useAuth()

  const handleModeSelect = (mode: UserMode) => {
    setMode(mode)
    switch (mode) {
      case "sponsor":
        // router.push("/sponsor/stake") 
        // For now, redirect to dashboard or login, since pages aren't migrated yet
        router.push("/login")
        break
      case "member":
        router.push("/marketplace")
        break
      case "login":
        router.push("/login")
        break
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-200">
              S
            </div>
            <span className="text-2xl font-bold text-gray-900 tracking-tight">
              ShareMarket
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-full text-[#FF6B6B] font-medium text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            Powered by Sui Blockchain
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Share Subscriptions,
            <br />
            <span className="bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] bg-clip-text text-transparent">
              Save Together
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            A decentralized marketplace for sharing subscription services. Secure,
            transparent, and trustless — powered by smart contracts.
          </p>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          {/* Sponsor Mode */}
          <ModeCard
            title="Sponsor Mode"
            description="Share your subscription with others. Stake tokens, create offers, and earn from your unused seats."
            icon={Shield}
            onClick={() => handleModeSelect("sponsor")}
            gradient="bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53]"
            iconColor="text-[#FF6B6B]"
            shadowColor="shadow-lg shadow-orange-100/50 hover:shadow-orange-200/50"
            buttonText="Become a Sponsor"
          />

          {/* Member Mode */}
          <ModeCard
            title="Member Mode"
            description="Browse available subscriptions and join shared plans at a fraction of the cost."
            icon={Users}
            onClick={() => handleModeSelect("member")}
            gradient="bg-gradient-to-br from-[#4ECDC4] to-[#44A08D]"
            iconColor="text-[#4ECDC4]"
            shadowColor="shadow-lg shadow-orange-100/50 hover:shadow-teal-200/50"
            buttonText="Browse Offers"
          />

          {/* Direct Login */}
          <ModeCard
            title="Direct Login"
            description="Already have a subscription? Access your services directly with wallet verification."
            icon={LogIn}
            onClick={() => handleModeSelect("login")}
            gradient="bg-gradient-to-br from-[#667eea] to-[#764ba2]"
            iconColor="text-[#667eea]"
            shadowColor="shadow-lg shadow-orange-100/50 hover:shadow-purple-200/50"
            buttonText="Access Services"
          />
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl w-full">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-[#FF6B6B]" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Secure & Trustless
            </h4>
            <p className="text-sm text-gray-600">
              Smart contracts ensure fair transactions without intermediaries
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-[#FF6B6B]" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Dispute Protection
            </h4>
            <p className="text-sm text-gray-600">
              3-day verification period protects both sponsors and members
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-[#FF6B6B]" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Instant Access
            </h4>
            <p className="text-sm text-gray-600">
              Get credentials immediately after subscription is confirmed
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-500 text-sm">
        <p>Built on Sui Network • Secure • Decentralized</p>
      </footer>
    </div>
  )
}
