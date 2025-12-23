"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { Offer, JoinedOffer, OfferStatus } from "@/types"
import { INITIAL_OFFERS } from "@/lib/mock-data"
import { useAuth } from "@/context/auth-context"

interface OffersContextType {
    offers: Offer[]
    joinedOffers: JoinedOffer[]
    createdOffers: string[]
    createOffer: (offer: Partial<Offer>) => Promise<string>
    joinOffer: (offerId: string) => Promise<void>
    submitCredentials: (offerId: string, username: string, password: string) => Promise<void>
    withdrawFunds: (offerId: string) => Promise<void>
    reportProblem: (offerId: string) => Promise<void>
    getOfferById: (offerId: string) => Offer | undefined
    getUserJoinedOffers: () => Offer[]
    getUserCreatedOffers: () => Offer[]
}

const OffersContext = createContext<OffersContextType | null>(null)

export function OffersProvider({ children }: { children: ReactNode }) {
    const { walletAddress } = useAuth()
    const [offers, setOffers] = useState<Offer[]>(INITIAL_OFFERS)
    const [joinedOffers, setJoinedOffers] = useState<JoinedOffer[]>([{
        offerId: '2',
        joinedAt: new Date(Date.now() - 86400000 * 8),
        hasReportedProblem: false
    }, {
        offerId: '5',
        joinedAt: new Date(Date.now() - 86400000 * 12),
        hasReportedProblem: false
    },
    // Add test Netflix offer to joined offers
    {
        offerId: 'test-netflix',
        joinedAt: new Date(Date.now() - 86400000 * 6),
        hasReportedProblem: false
    }])
    const [createdOffers, setCreatedOffers] = useState<string[]>(['test-full-pending', 'test-releasable'])

    const createOffer = useCallback(async (offerData: Partial<Offer>): Promise<string> => {
        console.log('Creating offer...', offerData)
        await new Promise(resolve => setTimeout(resolve, 1000))
        const newId = 'offer_' + Date.now()
        const now = new Date()
        const newOffer: Offer = {
            id: newId,
            service: offerData.service || 'Netflix',
            title: offerData.title || `${offerData.service} Subscription`,
            description: offerData.description || '',
            totalSeats: offerData.totalSeats || 4,
            takenSeats: 0,
            price: offerData.price || 5,
            currency: 'USD',
            period: offerData.period || 'mo',
            sponsorId: walletAddress || 'unknown',
            sponsorName: 'You',
            sponsorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
            status: 'LISTED',
            createdAt: now,
            credentialDeadline: new Date(now.getTime() + 86400000),
            members: [],
            tags: offerData.tags || []
        }
        setOffers(prev => [newOffer, ...prev])
        setCreatedOffers(prev => [...prev, newId])
        console.log('Offer created:', newId)
        return newId
    }, [walletAddress])

    const joinOffer = useCallback(async (offerId: string) => {
        console.log('Joining offer...', offerId)
        await new Promise(resolve => setTimeout(resolve, 1000))
        setOffers(prev => {
            return prev.map(offer => {
                if (offer.id === offerId) {
                    const newTakenSeats = offer.takenSeats + 1
                    const isFull = newTakenSeats >= offer.totalSeats
                    return {
                        ...offer,
                        takenSeats: newTakenSeats,
                        status: isFull ? 'FULL_PENDING_CREDENTIAL' as OfferStatus : offer.status,
                        members: [...offer.members, walletAddress || 'member']
                    }
                }
                return offer
            })
        })
        setJoinedOffers(prev => [...prev, {
            offerId,
            joinedAt: new Date(),
            hasReportedProblem: false
        }])
        console.log('Successfully joined offer!')
    }, [walletAddress])

    const submitCredentials = useCallback(async (offerId: string, username: string, password: string) => {
        console.log('Submitting credentials for offer:', offerId)
        await new Promise(resolve => setTimeout(resolve, 1000))
        const now = new Date()
        setOffers(prev => prev.map(offer => {
            if (offer.id === offerId) {
                return {
                    ...offer,
                    status: 'CREDENTIAL_SUBMITTED' as OfferStatus,
                    credentials: {
                        username,
                        password,
                        submittedAt: now,
                        unlockAt: new Date(now.getTime() + 86400000 * 3)
                    }
                }
            }
            return offer
        }))
        console.log('Credentials submitted!')
    }, [])

    const withdrawFunds = useCallback(async (offerId: string) => {
        console.log('Withdrawing funds for offer:', offerId)
        await new Promise(resolve => setTimeout(resolve, 1500))
        setOffers(prev => prev.map(offer => {
            if (offer.id === offerId) {
                return {
                    ...offer,
                    status: 'CLOSED' as OfferStatus
                }
            }
            return offer
        }))
        console.log('Funds withdrawn successfully!')
    }, [])

    const reportProblem = useCallback(async (offerId: string) => {
        console.log('Reporting problem for offer:', offerId)
        await new Promise(resolve => setTimeout(resolve, 500))
        setOffers(prev => prev.map(offer => {
            if (offer.id === offerId) {
                return {
                    ...offer,
                    status: 'DISPUTE_OPEN' as OfferStatus
                }
            }
            return offer
        }))
        setJoinedOffers(prev => prev.map(jo => {
            if (jo.offerId === offerId) {
                return {
                    ...jo,
                    hasReportedProblem: true
                }
            }
            return jo
        }))
        console.log('Problem reported!')
    }, [])

    const getOfferById = useCallback((offerId: string) => {
        return offers.find(o => o.id === offerId)
    }, [offers])

    const getUserJoinedOffers = useCallback(() => {
        return joinedOffers.map(jo => offers.find(o => o.id === jo.offerId)).filter((o): o is Offer => o !== undefined)
    }, [offers, joinedOffers])

    const getUserCreatedOffers = useCallback(() => {
        // Logic from original: filter offers where createOffers includes ID OR sponsorId matches
        return offers.filter(o => createdOffers.includes(o.id) || o.sponsorId === walletAddress || o.sponsorId === 'current-user')
    }, [offers, createdOffers, walletAddress])

    return (
        <OffersContext.Provider value={{
            offers,
            joinedOffers,
            createdOffers,
            createOffer,
            joinOffer,
            submitCredentials,
            withdrawFunds,
            reportProblem,
            getOfferById,
            getUserJoinedOffers,
            getUserCreatedOffers
        }}>
            {children}
        </OffersContext.Provider>
    )
}

export function useOffers() {
    const context = useContext(OffersContext)
    if (!context) {
        throw new Error("useOffers must be used within an OffersProvider")
    }
    return context
}
