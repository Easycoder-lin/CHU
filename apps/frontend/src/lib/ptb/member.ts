
import { Transaction } from "@mysten/sui/transactions";

import { CONTRACT_CONFIG } from "@/lib/contracts/config";

const { PACKAGE_ID, MODULES } = CONTRACT_CONFIG;
const MODULE_MEMBER = MODULES.MEMBER;
const MODULE_OFFER = MODULES.OFFER;

/**
 * 建構 "加入方案 (付費)" 的交易
 */
export const buildJoinOfferPTB = (tx: Transaction, offerId: string, paymentAmount: bigint) => {
    // 支付 Seat 費用
    const [coin] = tx.splitCoins(tx.gas, [paymentAmount]);

    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_MEMBER}::join_offer_entry`,
        arguments: [
            tx.object(offerId),
            coin,
            tx.object('0x6') // Clock
        ],
    });

    return tx;
};

/**
 * 建構 "提出爭議" 的交易
 */
export const buildSlashOfferPTB = (tx: Transaction, offerId: string) => {
    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_OFFER}::slash_offer_entry`,
        arguments: [
            tx.object(offerId),
            tx.object('0x6')
        ],
    });

    return tx;
};

export const buildClaimSlashPTB = (tx: Transaction, poolObjectId: string, claimObjectId: string) => {
    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_OFFER}::claim_slash_entry`,
        arguments: [
            tx.object(poolObjectId),
            tx.object(claimObjectId),
        ],
    });

    return tx;
};
