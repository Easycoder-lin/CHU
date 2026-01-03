
import { Offer, ServiceType } from "@/types";

export interface CreateOfferParams {
    service: ServiceType;
    totalSeats: number;
    pricePerSeat: number;
    period: 'mo' | 'yr';
    title?: string;
    description?: string;
    tags?: string[];
    sponsorAddress?: string;
    sponsorName?: string;
    sponsorAvatar?: string;
    currency?: string;
    platformFeeBps?: number;
    stakeToLock?: number;
    orderHash?: string;
}

// 定義一個通用的 Signer 介面，兼容 dApp Kit 的 signAndExecuteTransaction
export type TransactionSigner = {
    signAndExecuteTransaction: (input: { transaction: any; options?: any }) => Promise<any>;
};

export interface ISponsorService {
    checkIsSponsor(address: string): Promise<boolean>;

    // signer is optional because Mock service doesn't need it
    stake(amount: number, signer?: TransactionSigner, ownerAddress?: string): Promise<string>;

    publishOffer(params: CreateOfferParams, signer?: TransactionSigner): Promise<string>;

    submitCredentials(
        offerId: string,
        credentials: { username: string, password: string },
        signer?: TransactionSigner,
        sponsorAddress?: string,
        backendOfferId?: string
    ): Promise<string>;

    withdraw(
        offerId: string,
        signer?: TransactionSigner,
        sponsorAddress?: string,
        backendOfferId?: string
    ): Promise<string>;

    getMyOffers(address: string): Promise<Offer[]>;
}

export interface IMemberService {
    joinOffer(
        offerId: string,
        paymentAmount: number,
        signer?: TransactionSigner,
        walletAddress?: string,
        backendOfferId?: string
    ): Promise<string>;

    getPendingSettlements(address: string): Promise<import("@/types").PendingSettlement[]>;

    settleMatchedTrade(
        settlement: import("@/types").PendingSettlement,
        signer?: TransactionSigner,
        walletAddress?: string
    ): Promise<string>;

    getMySubscriptions(address: string): Promise<Offer[]>;

    getMarketOffers(): Promise<Offer[]>;

    raiseDispute(
        offerId: string,
        reason: string,
        signer?: TransactionSigner,
        backendOfferId?: string
    ): Promise<string>;

    slashOffer(
        offerId: string,
        signer?: TransactionSigner,
        backendOfferId?: string
    ): Promise<string>;

    claimSlash(
        params: {
            ownerAddress?: string;
            poolObjectId?: string;
            claimObjectId?: string;
            backendOfferId?: string;
        },
        signer?: TransactionSigner
    ): Promise<string>;
}
