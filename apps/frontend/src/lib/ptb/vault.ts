import { Transaction } from "@mysten/sui/transactions";

import { CONTRACT_CONFIG } from "@/lib/contracts/config";

const { PACKAGE_ID, MODULES } = CONTRACT_CONFIG;
const MODULE_VAULT = MODULES.VAULT;

export const buildLockFundsPTB = (
    tx: Transaction,
    amount: bigint,
    ownerAddress: string
) => {
    const [coin] = tx.splitCoins(tx.gas, [amount]);

    const lock = tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_VAULT}::lock_funds_entry`,
        arguments: [coin],
    });

    tx.transferObjects([lock], tx.pure.address(ownerAddress));

    return tx;
};

export const buildRefundLockPTB = (
    tx: Transaction,
    lockObjectId: string,
    ownerAddress: string
) => {
    const refund = tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_VAULT}::refund_all_from_lock`,
        arguments: [tx.object(lockObjectId)],
    });

    tx.transferObjects([refund], tx.pure.address(ownerAddress));

    return tx;
};
