"use client"

import React, { useMemo } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Navbar } from "@/components/shared/navbar"
import { OfferStatusBadge } from "@/components/shared/offer-status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useMarket } from "@/features/marketplace/hooks/use-market"
import type { Offer, OfferStatus } from "@/types"

const ACTIVE_STATUSES: OfferStatus[] = [
  "LISTED",
  "WAITING_FOR_CREDENTIAL",
  "CREDENTIAL_SUBMITTED",
  "DISPUTE_OPEN",
  "RELEASABLE",
  "PENDING",
]

const HOW_IT_WORKS = [
  {
    title: "Sponsors stake and list",
    description:
      "Sponsors deposit a safety stake, then create subscription offers with seats and pricing.",
  },
  {
    title: "Members browse the marketplace",
    description:
      "Members compare offers by price, seats, and status before joining a plan.",
  },
  {
    title: "Seats are reserved on-chain",
    description:
      "Joining locks a seat and triggers settlement flows tied to the offer’s lifecycle.",
  },
  {
    title: "Credentials are delivered",
    description:
      "Sponsors provide credentials once seats fill or when the schedule hits the deadline.",
  },
]

function formatSponsor(offer: Offer) {
  if (offer.sponsorName) return offer.sponsorName
  if (!offer.sponsorId) return "Unknown sponsor"
  return `${offer.sponsorId.slice(0, 6)}...${offer.sponsorId.slice(-4)}`
}

function formatOfferDate(date: Offer["createdAt"]) {
  const parsed = typeof date === "string" ? new Date(date) : date
  if (!parsed) return ""
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function OfferSnapshotCard({ offer }: { offer: Offer }) {
  const seatsLeft = Math.max(offer.totalSeats - offer.takenSeats, 0)

  return (
    <Card className="border-orange-100/60 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-100/60">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-orange-500 font-semibold">
              {offer.service}
            </p>
            <CardTitle className="text-lg text-gray-900">{offer.title}</CardTitle>
          </div>
          <OfferStatusBadge status={offer.status} size="sm" />
        </div>
        <p className="text-sm text-gray-500">
          Sponsored by <span className="font-medium text-gray-700">{formatSponsor(offer)}</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{seatsLeft} seats left</span>
          <span>{offer.takenSeats}/{offer.totalSeats} filled</span>
        </div>
        <div className="flex items-end justify-between border-t border-orange-100/60 pt-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">Price</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-gray-900">${offer.price}</span>
              <span className="text-sm text-gray-400">/{offer.period}</span>
            </div>
          </div>
          <div className="text-right text-xs text-gray-400">
            <p>Listed</p>
            <p className="font-medium text-gray-500">{formatOfferDate(offer.createdAt)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LandingPage() {
  const { offers, isLoading, isError, error } = useMarket()

  const summary = useMemo(() => {
    const totalOffers = offers.length
    const seatsLeft = offers.reduce(
      (sum, offer) => sum + Math.max(offer.totalSeats - offer.takenSeats, 0),
      0
    )
    const avgPrice = totalOffers
      ? offers.reduce((sum, offer) => sum + offer.price, 0) / totalOffers
      : 0

    return {
      totalOffers,
      seatsLeft,
      avgPrice,
    }
  }, [offers])

  const snapshotOffers = useMemo(() => {
    const filtered = offers.filter((offer) => ACTIVE_STATUSES.includes(offer.status))
    return filtered
      .slice()
      .sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime()
        const bTime = new Date(b.createdAt).getTime()
        return bTime - aTime
      })
      .slice(0, 6)
  }, [offers])

  return (
    <div className="min-h-screen bg-[#FFF8F0] text-gray-900">
      <Navbar />

      <main className="relative overflow-hidden">
        <section className="relative">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(255,214,180,0.8),_rgba(255,248,240,0.95)_55%)]" />
          <div className="max-w-6xl mx-auto px-4 py-16 md:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-start">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">
                  Community subscriptions, reimagined
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                  ShareMarket
                </h1>
                <p className="text-lg text-gray-600 max-w-xl">
                  Sponsors publish shared offers, members join instantly, and credentials arrive
                  as soon as seats are confirmed.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    className="h-11 rounded-xl bg-[#FF6B6B] px-6 text-white shadow-md shadow-orange-200/70 hover:bg-[#FF5252]"
                  >
                    <Link href="/orderbook?product=NETFLIX_ANNUAL">Browse Marketplace</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 rounded-xl border-2 border-[#FFB48A] bg-white px-6 text-[#FF6B6B] shadow-sm shadow-orange-100/60 hover:border-[#FF6B6B] hover:bg-orange-50"
                  >
                    <Link href="/sponsor/stake">Become Sponsor</Link>
                  </Button>
                  <Button
                    asChild
                    variant="secondary"
                    className="h-11 rounded-xl border-2 border-[#FFB48A] bg-[#FFF3E8] px-6 text-[#C3532E] shadow-sm shadow-orange-100/60 hover:border-[#FF6B6B] hover:bg-[#FFE5D0]"
                  >
                    <Link href="/member/orders">My Memberships</Link>
                  </Button>
                </div>
              </div>
              <div className="rounded-3xl border border-orange-100 bg-white/85 p-6 shadow-xl shadow-orange-100/60">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-500">
                    Live Highlights
                  </h2>
                  <Link
                    href="/orderbook?product=NETFLIX_ANNUAL"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF6B6B] hover:text-[#FF5252]"
                  >
                    View all <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-orange-100 bg-[#FFF8F0] px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Live offers</p>
                    <p className="text-2xl font-semibold text-gray-900">{summary.totalOffers}</p>
                  </div>
                  <div className="rounded-2xl border border-orange-100 bg-[#FFF8F0] px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Seats left</p>
                    <p className="text-2xl font-semibold text-gray-900">{summary.seatsLeft}</p>
                  </div>
                  <div className="rounded-2xl border border-orange-100 bg-[#FFF8F0] px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Avg price</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      ${summary.avgPrice.toFixed(0)}
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">
                    Latest listings
                  </p>
                  <div className="mt-3 space-y-3">
                    {snapshotOffers.slice(0, 3).map((offer) => (
                      <div
                        key={`hero-${offer.id}`}
                        className="flex items-center justify-between rounded-2xl border border-orange-100 bg-white/80 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{offer.title}</p>
                          <p className="text-xs text-gray-500">{offer.service}</p>
                        </div>
                        <OfferStatusBadge status={offer.status} size="sm" />
                      </div>
                    ))}
                    {snapshotOffers.length === 0 && (
                      <div className="rounded-2xl border border-orange-100 bg-white/80 px-4 py-4 text-sm text-gray-500">
                        New offers will appear here once sponsors go live.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 pb-16 md:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Market Snapshot</h2>
              <p className="text-gray-500">
                Recent offers ready for members right now.
              </p>
            </div>
            <Button asChild variant="ghost" className="text-[#FF6B6B] hover:text-[#FF5252]">
              <Link href="/orderbook?product=NETFLIX_ANNUAL">View all offers</Link>
            </Button>
          </div>

          <div className="mt-8">
            {isLoading && (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`loading-${index}`}
                    className="h-48 rounded-2xl border border-orange-100 bg-white/70 animate-pulse"
                  />
                ))}
              </div>
            )}

            {!isLoading && isError && (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">
                {error instanceof Error ? error.message : "Failed to load offers."}
              </div>
            )}

            {!isLoading && !isError && snapshotOffers.length === 0 && (
              <div className="rounded-2xl border border-orange-100 bg-white/80 p-8 text-center">
                <p className="text-lg font-semibold text-gray-800">No offers yet</p>
                <p className="mt-2 text-sm text-gray-500">
                  Sponsors are preparing the first listings. Check back soon.
                </p>
              </div>
            )}

            {!isLoading && !isError && snapshotOffers.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {snapshotOffers.map((offer) => (
                  <OfferSnapshotCard key={offer.id} offer={offer} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="border-t border-orange-100 bg-white/60">
          <div className="max-w-6xl mx-auto px-4 py-16 md:px-6 lg:px-8">
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-gray-900">How it works</h2>
              <p className="text-gray-500">
                A simple flow for sponsors and members to share subscriptions safely.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {HOW_IT_WORKS.map((step, index) => (
                <Card
                  key={step.title}
                  className="border-orange-100/80 bg-white/90 shadow-sm"
                >
                  <CardHeader className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">
                      Step {index + 1}
                    </span>
                    <CardTitle className="text-xl text-gray-900">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600">
                    {step.description}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-orange-100 bg-[#FFF8F0]">
        <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-gray-500 md:px-6 lg:px-8">
          ShareMarket connects sponsors and members to safely share premium subscriptions.
        </div>
      </footer>
    </div>
  )
}
