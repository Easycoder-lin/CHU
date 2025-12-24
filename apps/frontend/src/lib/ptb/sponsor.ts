
import { Transaction } from "@mysten/sui/transactions";
import { CreateOfferParams } from "@/lib/services/types";

// 暫時的 Package ID，未來合約部署後替換
import { CONTRACT_CONFIG } from "@/lib/contracts/config";

const { PACKAGE_ID, MODULES } = CONTRACT_CONFIG;
const MODULE_SPONSOR = MODULES.SPONSOR;
const MODULE_MARKET = MODULES.MARKET;

/**
 * 建構 "Sponsor 質押" 的交易
 */
export const buildStakePTB = (tx: Transaction, amount: number | bigint) => {
    // 假設合約需要傳入一個 Coin 物件
    // 這裡需要拆分 Coin，未來根據實際合約調整
    const [coin] = tx.splitCoins(tx.gas, [amount]);

    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_SPONSOR}::stake`,
        arguments: [
            coin,
            tx.object('0x6') // 假設需要 Clock 或其他參數
        ],
    });

    return tx;
};

/**
 * 建構 "發布方案" 的交易
 */
export const buildPublishOfferPTB = (tx: Transaction, params: CreateOfferParams) => {
    // 純數據上鏈
    tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_MARKET}::publish_offer`,
        arguments: [
            tx.pure.string(params.service),
            tx.pure.u64(params.totalSeats),
            tx.pure.u64(params.pricePerSeat),
            tx.pure.string(params.period), // 或用 u8 enum
            tx.object('0x6') // Clock for creation time
        ],
    });

    return tx;
};

/**
 * 建構 "提交帳密" 的交易
 * 注意：實際生產環境這部分可能需要加密，或是 Off-chain 儲存
 * 這裡演示 On-chain 提交 Hash 或加密後的數據
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
 * 建構 "領回資金" 的交易
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
