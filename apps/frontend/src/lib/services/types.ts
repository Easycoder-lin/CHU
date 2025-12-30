
import { Offer, ServiceType } from "@/types";

export interface CreateOfferParams {
    service: ServiceType;
    totalSeats: number;
    pricePerSeat: number;
    period: 'mo' | 'yr';
    title?: string;
    description?: string;
    tags?: string[];
}

// Generic signer interface compatible with dApp Kit signAndExecuteTransaction
export type TransactionSigner = {
    signAndExecuteTransaction: (input: { transaction: any }) => Promise<{ digest: string }>;
};

export interface ISponsorService {
    checkIsSponsor(address: string): Promise<boolean>;

    // signer is optional because Mock service doesn't need it
    stake(amount: number, signer?: TransactionSigner): Promise<string>;

    publishOffer(params: CreateOfferParams, signer?: TransactionSigner): Promise<string>;

    submitCredentials(offerId: string, credentials: { username: string, password: string }, signer?: TransactionSigner): Promise<string>;

    withdraw(offerId: string, signer?: TransactionSigner): Promise<string>;

    getMyOffers(address: string): Promise<Offer[]>;
}

export interface IMemberService {
    joinOffer(offerId: string, paymentAmount: number, signer?: TransactionSigner): Promise<string>;

    getMySubscriptions(address: string): Promise<Offer[]>;

    getMarketOffers(): Promise<Offer[]>;

    raiseDispute(offerId: string, reason: string, signer?: TransactionSigner): Promise<string>;
}
