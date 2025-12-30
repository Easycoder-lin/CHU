
import { SuiClient } from "@mysten/sui/client";
import { IMemberService, ISponsorService } from "./types";
import { MockMemberService, MockSponsorService } from "../mock/services";
import { SuiMemberService } from "./sui-member";
import { SuiSponsorService } from "./sui-sponsor";

// Simple singleton cache for services
let sponsorServiceInstance: ISponsorService | null = null;
let memberServiceInstance: IMemberService | null = null;
let suiClientInstance: SuiClient | null = null;

// Environment toggle (set NEXT_PUBLIC_USE_MOCK=true in .env.local to use mocks)
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

function getSuiClient() {
    if (!suiClientInstance) {
        suiClientInstance = new SuiClient({ url: process.env.NEXT_PUBLIC_SUI_NODE_URL || 'https://fullnode.devnet.sui.io:443' });
    }
    return suiClientInstance;
}

export function getSponsorService(): ISponsorService {
    if (sponsorServiceInstance) return sponsorServiceInstance;

    if (USE_MOCK) {
        console.log("🛠️ Using MockSponsorService");
        sponsorServiceInstance = new MockSponsorService();
    } else {
        console.log("🔗 Using SuiSponsorService");
        sponsorServiceInstance = new SuiSponsorService(getSuiClient());
    }
    return sponsorServiceInstance;
}

export function getMemberService(): IMemberService {
    if (memberServiceInstance) return memberServiceInstance;

    if (USE_MOCK) {
        console.log("🛠️ Using MockMemberService");
        memberServiceInstance = new MockMemberService();
    } else {
        console.log("🔗 Using SuiMemberService");
        memberServiceInstance = new SuiMemberService(getSuiClient());
    }
    return memberServiceInstance;
}
