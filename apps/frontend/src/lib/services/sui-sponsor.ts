
import { Offer } from "@/types";
import { CreateOfferParams, ISponsorService, TransactionSigner } from "./types";
import { Transaction } from "@mysten/sui/transactions";
import { buildStakePTB, buildPublishOfferPTB, buildSubmitCredentialsPTB, buildWithdrawPTB } from "@/lib/ptb/sponsor";
import { SuiClient } from "@mysten/sui/client";
import { apiRequest } from "@/lib/api";
import { BackendOffer, mapBackendOffer } from "@/lib/services/backend-offers";
import { CONTRACT_CONFIG } from "@/lib/contracts/config";

type CreateOfferResponse = {
    offerId: string;
    chainConfig: {
        packageId: string;
        rpcUrl: string;
        network: string;
    };
    draft: BackendOffer;
};

export class SuiSponsorService implements ISponsorService {
    constructor(private client: SuiClient) { }

    async checkIsSponsor(address: string): Promise<boolean> {
        if (!address) return false;
        const sponsorType = `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULES.SPONSOR}::SponsorBadge`;
        try {
            const owned = await this.client.getOwnedObjects({
                owner: address,
                filter: { StructType: sponsorType },
                options: { showType: true },
            });
            return owned.data.length > 0;
        } catch (error) {
            console.warn("Failed to check sponsor status", error);
            return false;
        }
    }

    async stake(amount: number, signer?: TransactionSigner, ownerAddress?: string): Promise<string> {
        if (!signer) throw new Error("Signer required for real transaction");
        if (!ownerAddress) throw new Error("Wallet address required to stake");

        const tx = new Transaction();
        buildStakePTB(tx, amount, ownerAddress);

        const result = await signer.signAndExecuteTransaction({ transaction: tx });
        return result.digest;
    }

    async publishOffer(params: CreateOfferParams, signer?: TransactionSigner): Promise<string> {
        if (!signer) throw new Error("Signer required for real transaction");
        if (!params.sponsorAddress) throw new Error("Sponsor address required to publish offer");
        const pricePerSeat = Math.max(1, Math.round(params.pricePerSeat));
        const stakeToLock = Math.max(0, Math.round(params.stakeToLock ?? pricePerSeat));

        const backendOffer = await apiRequest<CreateOfferResponse>("/offers", {
            method: "POST",
            body: JSON.stringify({
                sponsorAddress: params.sponsorAddress,
                service: params.service,
                title: params.title || `${params.service} Subscription`,
                description: params.description || "",
                seatCap: params.totalSeats,
                pricePerSeat,
                period: params.period,
                currency: params.currency || "USD",
                tags: params.tags || [],
                sponsorName: params.sponsorName || null,
                sponsorAvatar: params.sponsorAvatar || null,
                orderHash: params.orderHash || null,
                platformFeeBps: params.platformFeeBps ?? 0,
                stakeLocked: stakeToLock,
            }),
        });

        const tx = new Transaction();

        try {
            const sponsorBadgeId = await this.getSponsorBadgeId(params.sponsorAddress);
            const orderHashBytes = this.buildOrderHashBytes(params);

            buildPublishOfferPTB(tx, {
                sponsorBadgeId,
                orderHash: orderHashBytes,
                seatCap: params.totalSeats,
                pricePerSeat,
                platformFeeBps: params.platformFeeBps ?? 0,
                stakeToLock,
                ownerAddress: params.sponsorAddress,
            });
            tx.setGasBudget(100_000_000);

            const result = await signer.signAndExecuteTransaction({
                transaction: tx,
                options: { showObjectChanges: true },
            });

            const chainOfferObjectId = this.extractOfferObjectId(result?.objectChanges);
            const poolObjectId = this.extractPoolObjectId(result?.objectChanges);

            await apiRequest(`/offers/${backendOffer.offerId}/tx`, {
                method: "PATCH",
                body: JSON.stringify({
                    txDigest: result.digest,
                    status: "SUBMITTED",
                    offerObjectId: chainOfferObjectId,
                    poolObjectId,
                }),
            });

            await this.confirmOfferWithRetry(backendOffer.offerId, 3);

            return result.digest;
        } catch (error) {
            try {
                await apiRequest(`/offers/${backendOffer.offerId}/tx`, {
                    method: "PATCH",
                    body: JSON.stringify({
                        status: "FAILED",
                    }),
                });
            } catch {
                // Offer might already be deleted on failure; ignore cleanup errors.
            }
            throw error;
        }
    }

    async submitCredentials(
        offerId: string,
        credentials: { username: string; password: string; },
        signer?: TransactionSigner,
        sponsorAddress?: string,
        backendOfferId?: string
    ): Promise<string> {
        if (!signer) throw new Error("Signer required for real transaction");
        if (!sponsorAddress) throw new Error("Sponsor address required to submit credentials");

        const tx = new Transaction();
        const sponsorBadgeId = await this.getSponsorBadgeId(sponsorAddress);
        const receipt = new TextEncoder().encode(JSON.stringify(credentials));
        buildSubmitCredentialsPTB(tx, offerId, sponsorBadgeId, receipt);

        const result = await signer.signAndExecuteTransaction({ transaction: tx });

        if (backendOfferId) {
            await apiRequest(`/offers/${backendOfferId}/tx`, {
                method: "PATCH",
                body: JSON.stringify({
                    status: "CREDENTIALS_SUBMITTED",
                    credentials,
                    txDigest: result.digest,
                }),
            });
        }
        return result.digest;
    }

    async withdraw(
        offerId: string,
        signer?: TransactionSigner,
        sponsorAddress?: string,
        backendOfferId?: string
    ): Promise<string> {
        if (!signer) throw new Error("Signer required for real transaction");
        if (!sponsorAddress) throw new Error("Sponsor address required to withdraw");

        const tx = new Transaction();
        const sponsorBadgeId = await this.getSponsorBadgeId(sponsorAddress);
        const vaultObjectId = CONTRACT_CONFIG.VAULT_OBJECT_ID;
        if (!vaultObjectId) {
            throw new Error("Missing NEXT_PUBLIC_VAULT_OBJECT_ID");
        }
        buildWithdrawPTB(tx, offerId, sponsorBadgeId, vaultObjectId);

        const result = await signer.signAndExecuteTransaction({ transaction: tx });

        if (backendOfferId) {
            await apiRequest(`/offers/${backendOfferId}/tx`, {
                method: "PATCH",
                body: JSON.stringify({
                    status: "SETTLED",
                    txDigest: result.digest,
                }),
            });
        }
        return result.digest;
    }

    async getMyOffers(address: string): Promise<Offer[]> {
        const response = await apiRequest<{ data: BackendOffer[] }>(`/offers?sponsorAddress=${encodeURIComponent(address)}`);
        return response.data.map(mapBackendOffer);
    }

    private async getSponsorBadgeId(address: string): Promise<string> {
        const sponsorType = `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULES.SPONSOR}::SponsorBadge`;
        const owned = await this.client.getOwnedObjects({
            owner: address,
            filter: { StructType: sponsorType },
        });
        const badge = owned.data[0];
        if (!badge || !badge.data?.objectId) {
            throw new Error("Sponsor badge not found. Stake to become a sponsor first.");
        }
        return badge.data.objectId;
    }

    private buildOrderHashBytes(params: CreateOfferParams): Uint8Array {
        if (params.orderHash) {
            return new TextEncoder().encode(params.orderHash);
        }
        const payload = JSON.stringify({
            service: params.service,
            title: params.title || `${params.service} Subscription`,
            description: params.description || "",
            period: params.period,
            tags: params.tags || [],
        });
        return new TextEncoder().encode(payload);
    }

    private extractOfferObjectId(objectChanges: any): string | undefined {
        if (!Array.isArray(objectChanges)) return undefined;
        const offerType = `${CONTRACT_CONFIG.PACKAGE_ID}::${CONTRACT_CONFIG.MODULES.OFFER}::Offer`;
        const created = objectChanges.find(
            (change) => change?.type === "created" && change?.objectType === offerType
        );
        return created?.objectId;
    }

    private extractPoolObjectId(objectChanges: any): string | undefined {
        if (!Array.isArray(objectChanges)) return undefined;
        const poolType = `${CONTRACT_CONFIG.PACKAGE_ID}::pool::Pool`;
        const created = objectChanges.find(
            (change) => change?.type === "created" && change?.objectType === poolType
        );
        return created?.objectId;
    }

    private async confirmOfferWithRetry(offerId: string, attempts: number): Promise<void> {
        let lastError: Error | null = null;
        for (let i = 0; i < attempts; i += 1) {
            try {
                await apiRequest(`/offers/${offerId}/confirm`, { method: "POST" });
                return;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }
        if (lastError) {
            throw lastError;
        }
    }
}
