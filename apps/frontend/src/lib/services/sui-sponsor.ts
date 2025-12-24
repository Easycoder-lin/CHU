
import { Offer } from "@/types";
import { CreateOfferParams, ISponsorService, TransactionSigner } from "./types";
import { Transaction } from "@mysten/sui/transactions";
import { buildStakePTB, buildPublishOfferPTB, buildSubmitCredentialsPTB, buildWithdrawPTB } from "@/lib/ptb/sponsor";
import { SuiClient } from "@mysten/sui/client";

export class SuiSponsorService implements ISponsorService {
    constructor(private client: SuiClient) { }

    async checkIsSponsor(address: string): Promise<boolean> {
        // 真實邏輯：查詢該 Address 是否擁有 Sponsor Object 或在 Sponsor Resource List 中
        // 暫時回傳 false，等合約定義好查詢方式
        // 範例: this.client.getObject(...)
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
        // 這裡應該要做加密
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
        // 真實邏輯：使用 SuiClient 查詢該地址擁有的 Offer Objects
        // this.client.getOwnedObjects(...)
        return [];
    }
}
