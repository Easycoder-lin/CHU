import { Offer, ServiceType, OfferStatus } from "@/types";
import { CreateOfferParams, IMemberService, ISponsorService, TransactionSigner } from "@/lib/services/types";

// --- Fake DB ---
class MockDB {
    private offers: Offer[] = [];
    private sponsors: Set<string> = new Set(); // set of wallet addresses

    constructor() {
        // Seed some data
        this.sponsors.add("0x123");
        this.offers.push({
            id: "offer-1",
            service: "Netflix",
            title: "Netflix Premium 4K",
            description: "Family plan shared slot, long term stable.",
            totalSeats: 4,
            takenSeats: 2,
            price: 5,
            currency: "SUI",
            period: "mo",
            sponsorId: "0x123",
            sponsorName: "Alice",
            sponsorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
            status: "LISTED",
            createdAt: new Date(Date.now() - 86400000 * 2),
            credentialDeadline: new Date(Date.now() + 86400000 * 5),
            members: ["0xUserA", "0xUserB"],
            tags: ["4K", "Stable"]
        });

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
        return db.isSponsor(address);
    }

    async stake(amount: number, signer?: TransactionSigner): Promise<string> {
        await delay(2000);
        // For mock, we pretend the caller became a sponsor.
        // We can't access caller address easily here without context,
        // effectively we assume success.
        return "0xMockTxDigest_Stake_" + randomId();
    }

    async publishOffer(params: CreateOfferParams, signer?: TransactionSigner): Promise<string> {
        await delay(2000);
        const newOffer: Offer = {
            id: "offer-" + randomId(),
            service: params.service,
            title: `${params.service} ${params.period} Plan`,
            description: "Freshly created offer.",
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
            tags: ["New"]
        };
        db.addOffer(newOffer);
        return "0xMockTxDigest_Publish_" + randomId();
    }

    async submitCredentials(offerId: string, credentials: { username: ""; password: ""; }, signer?: TransactionSigner): Promise<string> {
        await delay(1500);
        db.updateOfferStatus(offerId, "CREDENTIAL_SUBMITTED");
        return "0xMockTxDigest_SubmitCreds";
    }

    async withdraw(offerId: string, signer?: TransactionSigner): Promise<string> {
        await delay(1500);
        db.updateOfferStatus(offerId, "CLOSED");
        return "0xMockTxDigest_Withdraw";
    }

    async getMyOffers(address: string): Promise<Offer[]> {
        await delay(800);
        // creating some fake "my offers" if address matches '0xMe' or just return all for demo
        return db.getOffers(); // Return all for demo visibility
    }
}

export class MockMemberService implements IMemberService {
    async joinOffer(offerId: string, paymentAmount: number, signer?: TransactionSigner): Promise<string> {
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
        return [db.getOffers()[0]];
    }

    async getMarketOffers(): Promise<Offer[]> {
        await delay(800);
        return db.getOffers();
    }

    async raiseDispute(offerId: string, reason: string, signer?: TransactionSigner): Promise<string> {
        await delay(1500);
        db.updateOfferStatus(offerId, "DISPUTE_OPEN");
        return "0xMockTxDigest_Dispute";
    }
}
