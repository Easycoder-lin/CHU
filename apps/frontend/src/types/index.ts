export type ServiceType = 'Netflix' | 'YouTube' | 'Spotify' | 'Disney+' | 'HBO Max' | 'Apple One';
export type OfferStatus = 'LISTED' | 'FULL_PENDING_CREDENTIAL' | 'CREDENTIAL_SUBMITTED' | 'DISPUTE_OPEN' | 'RELEASABLE' | 'CLOSED';
export type UserMode = 'sponsor' | 'member' | 'login' | null;

export interface Offer {
    id: string;
    service: ServiceType;
    title: string;
    description: string;
    totalSeats: number;
    takenSeats: number;
    price: number;
    currency: string;
    period: 'mo' | 'yr';
    sponsorId: string;
    sponsorName: string;
    sponsorAvatar: string;
    status: OfferStatus;
    createdAt: Date;
    credentialDeadline: Date;
    credentials?: {
        username: string;
        password: string;
        submittedAt: Date;
        unlockAt: Date;
    };
    members: string[];
    tags: string[];
}

export interface User {
    walletAddress: string;
    isSponsor: boolean;
    stakedAmount: number;
    stakedAt?: Date;
}

export interface JoinedOffer {
    offerId: string;
    joinedAt: Date;
    hasReportedProblem: boolean;
}

export interface AppState {
    currentMode: UserMode;
    walletConnected: boolean;
    walletAddress: string | null;
    user: User | null;
    offers: Offer[];
    joinedOffers: JoinedOffer[];
    createdOffers: string[];
}
