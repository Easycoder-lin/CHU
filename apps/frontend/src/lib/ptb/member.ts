
import { Transaction } from "@mysten/sui/transactions";

import { CONTRACT_CONFIG } from "@/lib/contracts/config";

const { PACKAGE_ID, MODULES } = CONTRACT_CONFIG;
const MODULE_MARKET = MODULES.MARKET;

/**
 * Build PTB for joining an offer (paying seats)
 */
export const buildJoinOfferPTB = (tx: Transaction, offerId: string, paymentAmount: bigint) => {
    // Pay seat fee
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
 * Build PTB for raising a dispute
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
