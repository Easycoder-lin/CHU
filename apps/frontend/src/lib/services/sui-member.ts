
import { Offer } from "@/types";
import { IMemberService, TransactionSigner } from "./types";
import { Transaction } from "@mysten/sui/transactions";
import { buildClaimSlashPTB, buildJoinOfferPTB, buildSlashOfferPTB } from "@/lib/ptb/member";
import { SuiClient } from "@mysten/sui/client";
import { apiRequest } from "@/lib/api";
import { BackendOffer, mapBackendOffer } from "@/lib/services/backend-offers";
import { CONTRACT_CONFIG } from "@/lib/contracts/config";

export class SuiMemberService implements IMemberService {
    constructor(private client: SuiClient) { }

    async joinOffer(
        offerId: string,
        paymentAmount: number,
        signer?: TransactionSigner,
        backendOfferId?: string
    ): Promise<string> {
        if (!signer) throw new Error("Signer required for real transaction");

        const tx = new Transaction();
        // BigInt conversion handled in PTB or here
        buildJoinOfferPTB(tx, offerId, BigInt(paymentAmount));

        const result = await signer.signAndExecuteTransaction({ transaction: tx });

        if (backendOfferId) {
            const current = await apiRequest<BackendOffer>(`/offers/${backendOfferId}`);
            const nextSeatsSold = Math.min(current.seatsSold + 1, current.seatCap);
            const nextStatus = nextSeatsSold >= current.seatCap ? "FULL" : "OPEN";

            await apiRequest(`/offers/${backendOfferId}/tx`, {
                method: "PATCH",
                body: JSON.stringify({
                    seatsSold: nextSeatsSold,
                    status: nextStatus,
                    txDigest: result.digest,
                }),
            });
        }
        return result.digest;
    }

    async getMySubscriptions(address: string): Promise<Offer[]> {
        // Query owned Seat objects
        return [];
    }

    async getMarketOffers(): Promise<Offer[]> {
        const response = await apiRequest<{ data: BackendOffer[] }>("/offers?status=OPEN");
        return response.data.map(mapBackendOffer);
    }

    async raiseDispute(
        offerId: string,
        reason: string,
        signer?: TransactionSigner,
        backendOfferId?: string
    ): Promise<string> {
        if (backendOfferId) {
            await apiRequest(`/offers/${backendOfferId}/tx`, {
                method: "PATCH",
                body: JSON.stringify({
                    status: "DISPUTE_OPEN",
                    lastError: reason,
                }),
            });
        }
        return "backend-dispute";
    }

    async slashOffer(
        offerId: string,
        signer?: TransactionSigner,
        backendOfferId?: string
    ): Promise<string> {
        if (!signer) throw new Error("Signer required for real transaction");

        const tx = new Transaction();
        buildSlashOfferPTB(tx, offerId);

        const result = await signer.signAndExecuteTransaction({ transaction: tx });

        if (backendOfferId) {
            await apiRequest(`/offers/${backendOfferId}/tx`, {
                method: "PATCH",
                body: JSON.stringify({
                    status: "SLASHED",
                    txDigest: result.digest,
                }),
            });
        }
        return result.digest;
    }

    async claimSlash(
        params: {
            ownerAddress?: string;
            poolObjectId?: string;
            claimObjectId?: string;
            backendOfferId?: string;
        },
        signer?: TransactionSigner
    ): Promise<string> {
        if (!signer) throw new Error("Signer required for real transaction");
        if (!params.ownerAddress) throw new Error("Wallet address required to claim slash");

        const poolObjectId = params.poolObjectId || await this.findOwnedObjectId(
            params.ownerAddress,
            `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULES.OFFER}::SlashedPool`
        );
        const claimObjectId = params.claimObjectId || await this.findOwnedObjectId(
            params.ownerAddress,
            `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULES.OFFER}::SlashClaim`
        );

        if (!poolObjectId || !claimObjectId) {
            throw new Error("Missing slashed pool or claim object in wallet");
        }

        const tx = new Transaction();
        buildClaimSlashPTB(tx, poolObjectId, claimObjectId);

        const result = await signer.signAndExecuteTransaction({ transaction: tx });

        if (params.backendOfferId) {
            await apiRequest(`/offers/${params.backendOfferId}/tx`, {
                method: "PATCH",
                body: JSON.stringify({
                    txDigest: result.digest,
                    status: "SLASHED",
                }),
            });
        }

        return result.digest;
    }

    private async findOwnedObjectId(owner: string, structType: string): Promise<string | undefined> {
        const owned = await this.client.getOwnedObjects({
            owner,
            filter: { StructType: structType },
        });
        const object = owned.data[0];
        return object?.data?.objectId;
    }
}
