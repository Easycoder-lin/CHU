
import { Offer } from "@/types";
import { IMemberService, TransactionSigner } from "./types";
import { Transaction } from "@mysten/sui/transactions";
import { buildJoinOfferPTB, buildRaiseDisputePTB } from "@/lib/ptb/member";
import { SuiClient } from "@mysten/sui/client";

export class SuiMemberService implements IMemberService {
    constructor(private client: SuiClient) { }

    async joinOffer(offerId: string, paymentAmount: number, signer?: TransactionSigner): Promise<string> {
        if (!signer) throw new Error("Signer required for real transaction");

        const tx = new Transaction();
        // BigInt conversion handled in PTB or here
        buildJoinOfferPTB(tx, offerId, BigInt(paymentAmount));

        const result = await signer.signAndExecuteTransaction({ transaction: tx });
        return result.digest;
    }

    async getMySubscriptions(address: string): Promise<Offer[]> {
        // Query owned Seat objects
        return [];
    }

    async getMarketOffers(): Promise<Offer[]> {
        // Query shared Offer objects
        return [];
    }

    async raiseDispute(offerId: string, reason: string, signer?: TransactionSigner): Promise<string> {
        if (!signer) throw new Error("Signer required for real transaction");

        const tx = new Transaction();
        buildRaiseDisputePTB(tx, offerId, reason);

        const result = await signer.signAndExecuteTransaction({ transaction: tx });
        return result.digest;
    }
}
