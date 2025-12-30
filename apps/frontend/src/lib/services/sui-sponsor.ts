
import { Offer } from "@/types";
import { CreateOfferParams, ISponsorService, TransactionSigner } from "./types";
import { Transaction } from "@mysten/sui/transactions";
import { buildStakePTB, buildPublishOfferPTB, buildSubmitCredentialsPTB, buildWithdrawPTB } from "@/lib/ptb/sponsor";
import { SuiClient } from "@mysten/sui/client";

export class SuiSponsorService implements ISponsorService {
    constructor(private client: SuiClient) { }

    async checkIsSponsor(address: string): Promise<boolean> {
        // Real logic: query whether the address owns a Sponsor Object or is in the sponsor registry
        // Temporary false until contract queries are defined
        // Example: this.client.getObject(...)
        return false;
    }

    async stake(amount: number, signer?: TransactionSigner): Promise<string> {
        if (!signer) throw new Error("Signer required for real transaction");

        const tx = new Transaction();
        buildStakePTB(tx, amount);

        const result = await signer.signAndExecuteTransaction({ transaction: tx });
        return result.digest;
    }

    async publishOffer(params: CreateOfferParams, signer?: TransactionSigner): Promise<string> {
        if (!signer) throw new Error("Signer required for real transaction");

        const tx = new Transaction();
        buildPublishOfferPTB(tx, params);

        const result = await signer.signAndExecuteTransaction({ transaction: tx });
        return result.digest;
    }

    async submitCredentials(offerId: string, credentials: { username: string; password: string; }, signer?: TransactionSigner): Promise<string> {
        if (!signer) throw new Error("Signer required for real transaction");

        const tx = new Transaction();
        // TODO: add encryption before sending credentials
        const encrypted = JSON.stringify(credentials);
        buildSubmitCredentialsPTB(tx, offerId, encrypted);

        const result = await signer.signAndExecuteTransaction({ transaction: tx });
        return result.digest;
    }

    async withdraw(offerId: string, signer?: TransactionSigner): Promise<string> {
        if (!signer) throw new Error("Signer required for real transaction");

        const tx = new Transaction();
        buildWithdrawPTB(tx, offerId);

        const result = await signer.signAndExecuteTransaction({ transaction: tx });
        return result.digest;
    }

    async getMyOffers(address: string): Promise<Offer[]> {
        // Real logic: query owned Offer objects via SuiClient
        // this.client.getOwnedObjects(...)
        return [];
    }
}
