export type ServiceType = 'Netflix' | 'YouTube' | 'Spotify' | 'Disney+' | 'HBO Max' | 'Apple One';
export type OfferStatus =
    | 'LISTED'
    | 'FULL_PENDING_CREDENTIAL'
    | 'CREDENTIAL_SUBMITTED'
    | 'DISPUTE_OPEN'
    | 'RELEASABLE'
    | 'CLOSED'
    | 'PENDING'
    | 'FAILED';
export type UserMode = 'sponsor' | 'member' | 'login' | null;
export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'OPEN' | 'PARTIAL' | 'FILLED' | 'CANCELLED';
export type OrderActor = 'SPONSOR' | 'MEMBER';
export type ProductId =
    | 'NETFLIX_ANNUAL'
    | 'SPOTIFY_ANNUAL'
    | 'CHATGPT_ANNUAL'
    | 'GEMINI_ANNUAL'
    | 'YOUTUBE_PREMIUM_ANNUAL'
    | 'DISNEY_BUNDLE_ANNUAL'
    | 'APPLE_ONE_ANNUAL'
    | 'PRIME_VIDEO_ANNUAL';
export type AllocationState = 'ACTIVE' | 'EXITED' | 'TERMINATED';

export interface Offer {
    id: string;
    backendId?: string;
    chainOfferObjectId?: string;
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

export interface OrderBookLevel {
    price: number;
    size: number;
    orderCount: number;
}

export interface Trade {
    id: string;
    product: string;
    buyOrderId: string;
    sellOrderId: string;
    price: number;
    quantity: number;
    createdAt: string;
}

export interface Order {
    id: string;
    product: ProductId;
    side: OrderSide;
    price: number;
    quantity: number;
    remaining: number;
    status: OrderStatus;
    actor: OrderActor;
    walletAddress?: string;
    createdAt: string;
    updatedAt: string;
}

export interface OrderBookSnapshot {
    product: ProductId;
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
    bestBid?: number;
    bestAsk?: number;
    spread?: number;
    lastTrade?: Trade;
    timestamp: string;
}

export interface Allocation {
    id: string;
    marketId: ProductId;
    offerId: string;
    bidId: string;
    buyerWallet?: string;
    sellerWallet?: string;
    price: number;
    qty: number;
    state: AllocationState;
    createdAt: string;
}

export interface MarketSummary {
    id: ProductId;
    name: string;
    bestBid?: number;
    bestAsk?: number;
    spread?: number;
    canCross: boolean;
}
