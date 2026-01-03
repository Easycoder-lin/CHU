
import { SuiClient } from "@mysten/sui/client";
import { IMemberService, ISponsorService } from "./types";
import { SuiMemberService } from "./sui-member";
import { SuiSponsorService } from "./sui-sponsor";

// 簡單的 Singleton 緩存
let sponsorServiceInstance: ISponsorService | null = null;
let memberServiceInstance: IMemberService | null = null;
let suiClientInstance: SuiClient | null = null;

function getSuiClient() {
    if (!suiClientInstance) {
        suiClientInstance = new SuiClient({ url: process.env.NEXT_PUBLIC_SUI_NODE_URL || 'https://fullnode.testnet.sui.io:443' });
    }
    return suiClientInstance;
}

export function getSponsorService(): ISponsorService {
    if (sponsorServiceInstance) return sponsorServiceInstance;

    console.log("🔗 Using SuiSponsorService");
    sponsorServiceInstance = new SuiSponsorService(getSuiClient());
    return sponsorServiceInstance;
}

export function getMemberService(): IMemberService {
    if (memberServiceInstance) return memberServiceInstance;

    console.log("🔗 Using SuiMemberService");
    memberServiceInstance = new SuiMemberService(getSuiClient());
    return memberServiceInstance;
}
