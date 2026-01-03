
import { Transaction } from "@mysten/sui/transactions";
import { CONTRACT_CONFIG } from "@/lib/contracts/config";

const { PACKAGE_ID, MODULES } = CONTRACT_CONFIG;
const MODULE_SPONSOR = MODULES.SPONSOR;
const MODULE_OFFER = MODULES.OFFER;

type PublishOfferOnChainParams = {
    sponsorBadgeId: string;
    orderHash: Uint8Array;
    seatCap: number;
    pricePerSeat: number;
    platformFeeBps: number;
    stakeToLock: number;
    ownerAddress: string;
};

/**
 * 建構 "Sponsor 質押" 的交易
 */
export const buildStakePTB = (tx: Transaction, amount: number | bigint, ownerAddress: string) => {
    // 假設合約需要傳入一個 Coin 物件
    // 這裡需要拆分 Coin，未來根據實際合約調整
    const [coin] = tx.splitCoins(tx.gas, [amount]);

    const badge = tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_SPONSOR}::stake_sponsor_entry`,
        arguments: [
            coin,
            tx.object('0x6') // 假設需要 Clock 或其他參數
        ],
    });

    tx.transferObjects([badge], tx.pure.address(ownerAddress));

    return tx;
};

/**
 * 建構 "發布方案" 的交易
 */
export const buildPublishOfferPTB = (tx: Transaction, params: PublishOfferOnChainParams) => {
    const offer = tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_OFFER}::create_offer_entry`,
        arguments: [
            tx.object(params.sponsorBadgeId),
            tx.pure.vector("u8", Array.from(params.orderHash)),
            tx.pure.u64(params.seatCap),
            tx.pure.u64(params.pricePerSeat),
            tx.pure.u64(params.platformFeeBps),
            tx.pure.u64(params.stakeToLock),
            tx.object('0x6') // Clock for creation time
        ],
    });

    tx.transferObjects([offer], tx.pure.address(params.ownerAddress));

    return tx;
};

/**
 * 建構 "提交帳密" 的交易
 * 注意：實際生產環境這部分可能需要加密，或是 Off-chain 儲存
 * 這裡演示 On-chain 提交 Hash 或加密後的數據
 */
export const buildSubmitCredentialsPTB = (
    tx: Transaction,
    offerId: string,
    sponsorBadgeId: string,
    receipt: Uint8Array
) => {
    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_OFFER}::submit_tee_receipt_entry`,
        arguments: [
            tx.object(offerId),
            tx.object(sponsorBadgeId),
            tx.pure.vector("u8", Array.from(receipt)),
            tx.object('0x6') // Clock
        ],
    });

    return tx;
};

/**
 * 建構 "領回資金" 的交易
 */
export const buildWithdrawPTB = (
    tx: Transaction,
    offerId: string,
    sponsorBadgeId: string,
    vaultObjectId: string
) => {
    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_OFFER}::settle_offer_entry`,
        arguments: [
            tx.object(offerId),
            tx.object(sponsorBadgeId),
            tx.object(vaultObjectId),
            tx.object('0x6')
        ],
    });

    return tx;
};
