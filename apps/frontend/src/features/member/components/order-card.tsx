"use client"

import React, { useState } from "react"
import {
  Eye,
  EyeOff,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { useMember } from "@/features/member/hooks/use-member"
import { Offer } from "@/types"
import { OfferStatusBadge } from "@/components/shared/offer-status-badge"
import { Button } from "@/components/ui/button"

function getServiceIcon(service: string): string {
  const icons: Record<string, string> = {
    Netflix: "🎬",
    YouTube: "▶️",
    Spotify: "🎵",
    "Disney+": "🏰",
    "HBO Max": "📺",
    "Apple One": "🍎",
  }
  return icons[service] || "📱"
}

export function OrderCard({
  offer,
  hasReportedProblem,
}: {
  offer: Offer
  hasReportedProblem: boolean
}) {
  const { raiseDispute, isRaisingDispute: isReporting, claimSlash, isClaimingSlash } = useMember()
  const [showCredentials, setShowCredentials] = useState(false)

  const canViewCredentials =
    offer.status === "CREDENTIAL_SUBMITTED" ||
    offer.status === "RELEASABLE" ||
    offer.status === "CLOSED"
  const canReportProblem =
    offer.status === "CREDENTIAL_SUBMITTED" && !hasReportedProblem

  // Check if within 3-day window
  // Ensure dates are parsed as Dates, though context provides mock Date objects
  const isWithinDisputeWindow =
    offer.credentials?.unlockAt && new Date() < offer.credentials.unlockAt

  const handleReport = async () => {
    try {
      await raiseDispute({ offerId: offer.id, backendOfferId: offer.backendId, reason: "Issue reported by user" })
    } catch (error) {
      console.error(error)
    }
  }

  const handleClaimSlash = async () => {
    try {
      await claimSlash({ backendOfferId: offer.backendId })
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden text-left">
      {/* Card Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{getServiceIcon(offer.service)}</span>
              <h3 className="text-xl font-bold text-gray-900">{offer.title}</h3>
            </div>
            <OfferStatusBadge status={offer.status} />
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Your cost</p>
            <p className="text-2xl font-bold text-gray-900">
              ${offer.price}
              <span className="text-sm text-gray-500">/{offer.period}</span>
            </p>
          </div>
        </div>

        {/* Host Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <img
            src={offer.sponsorAvatar}
            alt={offer.sponsorName}
            className="w-6 h-6 rounded-full"
          />
          <span>
            Hosted by{" "}
            <span className="font-medium text-gray-900">
              {offer.sponsorName}
            </span>
          </span>
        </div>
      </div>

      {/* Status-specific content */}
      <div className="p-6 bg-gray-50">
        {/* Waiting statuses */}
        {(offer.status === "LISTED" ||
          offer.status === "FULL_PENDING_CREDENTIAL") && (
            <div className="flex items-center gap-3 text-amber-600">
              <Clock className="w-5 h-5" />
              <div>
                <p className="font-medium">
                  {offer.status === "LISTED"
                    ? "Waiting for more members"
                    : "Waiting for credentials"}
                </p>
                <p className="text-sm text-amber-500">
                  {offer.status === "LISTED"
                    ? `${offer.totalSeats - offer.takenSeats} more seats needed`
                    : "Sponsor will submit credentials soon"}
                </p>
              </div>
            </div>
          )}

        {/* Credentials available */}
        {canViewCredentials && offer.credentials && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Access Credentials</span>
              </div>
              <button
                onClick={() => setShowCredentials(!showCredentials)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {showCredentials ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                {showCredentials ? "Hide" : "Show"}
              </button>
            </div>

            {showCredentials && (
              <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Username / Email</p>
                  <p className="font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {offer.credentials.username}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Password</p>
                  <p className="font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {offer.credentials.password}
                  </p>
                </div>
              </div>
            )}

            {/* Report Problem Button */}
            {canReportProblem && isWithinDisputeWindow && (
              <Button
                onClick={handleReport}
                disabled={isReporting}
                variant="outline"
                className="w-full py-3 h-auto border-2 border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 hover:text-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isReporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Reporting...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    There's a Problem
                  </>
                )}
              </Button>
            )}

            {/* Dispute period info */}
            {offer.status === "CREDENTIAL_SUBMITTED" && isWithinDisputeWindow && (
              <p className="text-xs text-gray-500 text-center">
                Dispute window ends:{" "}
                {offer.credentials.unlockAt.toLocaleDateString()}{" "}
                {offer.credentials.unlockAt.toLocaleTimeString()}
              </p>
            )}

            {offer.status === "RELEASABLE" && (
              <p className="text-xs text-gray-500 text-center">
                Dispute period has ended
              </p>
            )}
          </div>
        )}

        {/* Dispute open */}
        {offer.status === "DISPUTE_OPEN" && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Dispute in Progress</p>
                <p className="text-sm text-red-600">
                  Slash claim is ready to be collected.
                </p>
              </div>
            </div>
            <Button
              onClick={handleClaimSlash}
              disabled={isClaimingSlash}
              className="w-full py-3 h-auto rounded-xl font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isClaimingSlash ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Claim Slash
                </>
              )}
            </Button>
          </div>
        )}

        {/* Closed */}
        {offer.status === "CLOSED" && (
          <div className="flex items-center gap-3 text-gray-500">
            <CheckCircle2 className="w-5 h-5" />
            <span>This subscription has been completed</span>
          </div>
        )}
      </div>
    </div>
  )
}
