
import { Transaction } from "@mysten/sui/transactions";
import { CreateOfferParams } from "@/lib/services/types";

// Temporary Package ID; replace after contracts are deployed
import { CONTRACT_CONFIG } from "@/lib/contracts/config";

const { PACKAGE_ID, MODULES } = CONTRACT_CONFIG;
const MODULE_SPONSOR = MODULES.SPONSOR;
const MODULE_MARKET = MODULES.MARKET;

/**
 * Build PTB for sponsor staking
 */
export const buildStakePTB = (tx: Transaction, amount: number | bigint) => {
    // Assume contract requires a Coin object; split as needed
    const [coin] = tx.splitCoins(tx.gas, [amount]);

    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_SPONSOR}::stake`,
        arguments: [
            coin,
            tx.object('0x6') // Clock or other params if required
        ],
    });

    return tx;
};

/**
 * Build PTB for publishing an offer
 */
export const buildPublishOfferPTB = (tx: Transaction, params: CreateOfferParams) => {
    // Write pure data on chain
    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_MARKET}::publish_offer`,
        arguments: [
            tx.pure.string(params.service),
            tx.pure.u64(params.totalSeats),
            tx.pure.u64(params.pricePerSeat),
            tx.pure.string(params.period), // or use u8 enum
            tx.object('0x6') // Clock for creation time
        ],
    });

    return tx;
};

/**
 * Build PTB for submitting credentials (hash/encrypted)
 * In production, encrypt or store off-chain; here we demo on-chain submission
 */
export const buildSubmitCredentialsPTB = (tx: Transaction, offerId: string, encryptedData: string) => {
    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_MARKET}::submit_credentials`,
        arguments: [
            tx.object(offerId),
            tx.pure.string(encryptedData),
            tx.object('0x6') // Clock
        ],
    });

    return tx;
};

/**
 * Build PTB for withdrawing funds
 */
export const buildWithdrawPTB = (tx: Transaction, offerId: string) => {
    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_MARKET}::withdraw`,
        arguments: [
            tx.object(offerId),
            tx.object('0x6')
        ],
    });

    return tx;
};
