import { Offer, OfferStatus, ServiceType } from "@/types";

export type BackendOffer = {
    id: string;
    sponsorAddress: string;
    service: string;
    title: string;
    description?: string | null;
    seatCap: number;
    pricePerSeat: number;
    seatsSold: number;
    period: string;
    currency?: string | null;
    sponsorName?: string | null;
    sponsorAvatar?: string | null;
    status: string;
    chainOfferObjectId?: string | null;
    createdAt: string;
    credentialDeadline?: string | null;
    credentials?: {
        username: string;
        password: string;
        submittedAt: string;
        unlockAt: string;
    } | null;
    members?: string[];
    tags?: string[];
};

const mapStatus = (status: string): OfferStatus => {
    switch (status) {
        case "PENDING":
            return "PENDING";
        case "DISPUTE_OPEN":
            return "DISPUTE_OPEN";
        case "FAILED":
            return "FAILED";
        case "OPEN":
            return "LISTED";
        case "FULL":
            return "FULL_PENDING_CREDENTIAL";
        case "CREDENTIALS_SUBMITTED":
            return "CREDENTIAL_SUBMITTED";
        case "SETTLED":
            return "CLOSED";
        case "SLASHED":
            return "DISPUTE_OPEN";
        default:
            return "LISTED";
    }
};

export const mapBackendOffer = (offer: BackendOffer): Offer => {
    const createdAt = new Date(offer.createdAt);
    const credentialDeadline = offer.credentialDeadline ? new Date(offer.credentialDeadline) : createdAt;

    return {
        id: offer.chainOfferObjectId || offer.id,
        backendId: offer.id,
        chainOfferObjectId: offer.chainOfferObjectId || undefined,
        service: offer.service as ServiceType,
        title: offer.title,
        description: offer.description || "",
        totalSeats: offer.seatCap,
        takenSeats: offer.seatsSold,
        price: offer.pricePerSeat,
        currency: offer.currency || "USD",
        period: offer.period === "yr" ? "yr" : "mo",
        sponsorId: offer.sponsorAddress,
        sponsorName: offer.sponsorName || "",
        sponsorAvatar: offer.sponsorAvatar || "",
        status: mapStatus(offer.status),
        createdAt,
        credentialDeadline,
        credentials: offer.credentials
            ? {
                username: offer.credentials.username,
                password: offer.credentials.password,
                submittedAt: new Date(offer.credentials.submittedAt),
                unlockAt: new Date(offer.credentials.unlockAt),
            }
            : undefined,
        members: offer.members || [],
        tags: offer.tags || [],
    };
};
