type SuiTransactionBlock = {
  effects?: {
    status?: {
      status?: string;
      error?: string;
    };
  };
  objectChanges?: Array<{
    type?: string;
    objectId?: string;
    objectType?: string;
  }>;
  transaction?: {
    data?: {
      sender?: string;
    };
  };
};

type RpcResponse<T> = {
  result?: T;
  error?: {
    message?: string;
  };
};

export async function getTransactionBlock(rpcUrl: string, digest: string): Promise<SuiTransactionBlock> {
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "sui_getTransactionBlock",
    params: [
      digest,
      {
        showEffects: true,
        showObjectChanges: true,
        showInput: true,
      },
    ],
  };

  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Sui RPC error: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as RpcResponse<SuiTransactionBlock>;
  if (json.error) {
    throw new Error(json.error.message || "Sui RPC error");
  }

  if (!json.result) {
    throw new Error("Missing transaction result from Sui RPC");
  }

  return json.result;
}

export function verifyOfferCreation(input: {
  tx: SuiTransactionBlock;
  packageId: string;
  sponsorAddress: string;
  offerObjectId?: string | null;
}): { ok: boolean; errorReason?: string; offerObjectId?: string; poolObjectId?: string } {
  const { tx, packageId, sponsorAddress, offerObjectId } = input;
  const status = tx.effects?.status?.status;

  if (status !== "success") {
    return {
      ok: false,
      errorReason: tx.effects?.status?.error || "Transaction failed",
    };
  }

  const sender = tx.transaction?.data?.sender;
  if (sender && sender.toLowerCase() !== sponsorAddress.toLowerCase()) {
    return { ok: false, errorReason: "Sponsor address does not match transaction sender" };
  }

  const created = Array.isArray(tx.objectChanges)
    ? tx.objectChanges.filter((change) => change.type === "created")
    : [];
  const offerType = `${packageId}::offer::Offer`;
  const poolType = `${packageId}::pool::Pool`;

  const createdOffer = created.find((change) => change.objectType === offerType);
  if (!createdOffer?.objectId) {
    return { ok: false, errorReason: "Offer object not created in transaction" };
  }

  if (offerObjectId && createdOffer.objectId !== offerObjectId) {
    return { ok: false, errorReason: "Offer object id does not match transaction output" };
  }

  const createdPool = created.find((change) => change.objectType === poolType);

  return {
    ok: true,
    offerObjectId: createdOffer.objectId,
    poolObjectId: createdPool?.objectId,
  };
}
