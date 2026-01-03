import { Offer, ServiceType, OfferStatus } from "@/types";
import { CreateOfferParams, IMemberService, ISponsorService, TransactionSigner } from "@/lib/services/types";

// --- Fake DB ---
class MockDB {
    private offers: Offer[] = [];
    private sponsors: Set<string> = new Set(); // set of wallet addresses

    constructor() {
        // Seed some data
        this.sponsors.add("0x123");

        // Offer 1: Active Netflix with Credentials (READY TO ACCESS)
        this.offers.push({
            id: "offer-1",
            service: "Netflix",
            title: "Netflix Premium 4K",
            description: "Family plan shared slot, long term stable.",
            totalSeats: 4,
            takenSeats: 4,
            price: 5,
            currency: "SUI",
            period: "mo",
            sponsorId: "0x123",
            sponsorName: "Alice",
            sponsorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
            status: "CREDENTIAL_SUBMITTED",
            createdAt: new Date(Date.now() - 86400000 * 5),
            credentialDeadline: new Date(Date.now() + 86400000 * 5),
            members: ["0xUserA", "0xUserB"],
            tags: ["4K", "Stable"],
            credentials: {
                username: "alice_family@netflix.com",
                password: "SecurePassword123!",
                submittedAt: new Date(Date.now() - 86400000),
                unlockAt: new Date(Date.now() - 86400000)
            }
        });

        // Offer 2: YouTube Pending Credentials
        this.offers.push({
            id: "offer-2",
            service: "YouTube",
            title: "YouTube Premium Family",
            description: "No ads, background play.",
            totalSeats: 5,
            takenSeats: 5,
            price: 2,
            currency: "SUI",
            period: "mo",
            sponsorId: "0x456",
            sponsorName: "Bob",
            sponsorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
            status: "FULL_PENDING_CREDENTIAL",
            createdAt: new Date(),
            credentialDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
            members: [],
            tags: ["Music", "NoAds"]
        });

        // Offer 3: Expired Spotify (CLOSED)
        this.offers.push({
            id: "offer-3",
            service: "Spotify",
            title: "Spotify Duo",
            description: "Music for two.",
            totalSeats: 2,
            takenSeats: 2,
            price: 3,
            currency: "SUI",
            period: "mo",
            sponsorId: "0x789",
            sponsorName: "Charlie",
            sponsorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
            status: "CLOSED",
            createdAt: new Date(Date.now() - 86400000 * 60),
            credentialDeadline: new Date(Date.now() - 86400000 * 55),
            members: ["0xUserC"],
            tags: ["Music"],
            credentials: {
                username: "old_spotify@gmail.com",
                password: "ExpiredPassword",
                submittedAt: new Date(Date.now() - 86400000 * 59),
                unlockAt: new Date(Date.now() - 86400000 * 59)
            }
        });
    }

    getOffers() { return this.offers; }

    addOffer(offer: Offer) { this.offers.push(offer); }

    findOffer(id: string) { return this.offers.find(o => o.id === id); }

    updateOfferStatus(id: string, status: OfferStatus) {
        const offer = this.findOffer(id);
        if (offer) offer.status = status;
    }

    addSponsor(address: string) { this.sponsors.add(address); }

    isSponsor(address: string) { return this.sponsors.has(address); }
}

const db = new MockDB();

// --- Helpers ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomId = () => Math.random().toString(36).substring(2, 10);

// --- Service Implementations ---

export class MockSponsorService implements ISponsorService {
    async checkIsSponsor(address: string): Promise<boolean> {
        await delay(500);
        return true; // db.isSponsor(address);
    }

    async stake(amount: number, signer?: TransactionSigner, ownerAddress?: string): Promise<string> {
        await delay(2000);
        return "0xMockTxDigest_Stake_" + randomId();
    }

    async publishOffer(params: CreateOfferParams, signer?: TransactionSigner): Promise<string> {
        await delay(2000);
        const newOffer: Offer = {
            id: "offer-" + randomId(),
            service: params.service,
            title: params.title || `${params.service} ${params.period} Plan`,
            description: params.description || "Freshly created offer.",
            totalSeats: params.totalSeats,
            takenSeats: 0,
            price: params.pricePerSeat,
            currency: "SUI",
            period: params.period,
            sponsorId: "0xMe",
            sponsorName: "Me",
            sponsorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Me",
            status: "LISTED",
            createdAt: new Date(),
            credentialDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
            members: [],
            tags: params.tags || ["New"]
        };
        db.addOffer(newOffer);
        return "0xMockTxDigest_Publish_" + randomId();
    }

    async submitCredentials(
        offerId: string,
        credentials: { username: ""; password: ""; },
        signer?: TransactionSigner,
        sponsorAddress?: string,
        backendOfferId?: string
    ): Promise<string> {
        await delay(1500);
        db.updateOfferStatus(offerId, "CREDENTIAL_SUBMITTED");
        return "0xMockTxDigest_SubmitCreds";
    }

    async withdraw(
        offerId: string,
        signer?: TransactionSigner,
        sponsorAddress?: string,
        backendOfferId?: string
    ): Promise<string> {
        await delay(1500);
        db.updateOfferStatus(offerId, "CLOSED");
        return "0xMockTxDigest_Withdraw";
    }

    async getMyOffers(address: string): Promise<Offer[]> {
        await delay(800);
        return db.getOffers();
    }
}

export class MockMemberService implements IMemberService {
    async joinOffer(
        offerId: string,
        paymentAmount: number,
        signer?: TransactionSigner,
        backendOfferId?: string
    ): Promise<string> {
        await delay(2000);
        const offer = db.findOffer(offerId);
        if (offer) {
            offer.takenSeats += 1;
            if (offer.takenSeats >= offer.totalSeats) {
                offer.status = "FULL_PENDING_CREDENTIAL";
            }
        }
        return "0xMockTxDigest_Join";
    }

    async getMySubscriptions(address: string): Promise<Offer[]> {
        await delay(800);
        // Return a mix of offers to demonstrate different card states
        return db.getOffers();
    }

    async getMarketOffers(): Promise<Offer[]> {
        await delay(800);
        return db.getOffers();
    }

    async raiseDispute(
        offerId: string,
        reason: string,
        signer?: TransactionSigner,
        backendOfferId?: string
    ): Promise<string> {
        await delay(1500);
        db.updateOfferStatus(offerId, "DISPUTE_OPEN");
        return "0xMockTxDigest_Dispute";
    }

    async slashOffer(
        offerId: string,
        signer?: TransactionSigner,
        backendOfferId?: string
    ): Promise<string> {
        await delay(1500);
        db.updateOfferStatus(offerId, "DISPUTE_OPEN");
        return "0xMockTxDigest_Slash";
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
        await delay(1500);
        return "0xMockTxDigest_ClaimSlash";
    }
}
