
import { Transaction } from "@mysten/sui/transactions";

import { CONTRACT_CONFIG } from "@/lib/contracts/config";

const { PACKAGE_ID, MODULES } = CONTRACT_CONFIG;
const MODULE_MARKET = MODULES.MARKET;

/**
 * 建構 "加入方案 (付費)" 的交易
 */
export const buildJoinOfferPTB = (tx: Transaction, offerId: string, paymentAmount: bigint) => {
    // 支付 Seat 費用
    const [coin] = tx.splitCoins(tx.gas, [paymentAmount]);

    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_MARKET}::join_offer`,
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
export const buildRaiseDisputePTB = (tx: Transaction, offerId: string, reason: string) => {
    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_MARKET}::raise_dispute`,
        arguments: [
            tx.object(offerId),
            tx.pure.string(reason),
            tx.object('0x6')
        ],
    });

    return tx;
};
