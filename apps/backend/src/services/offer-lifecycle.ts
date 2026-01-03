import type { Offer } from "../entities/Offer.js";

export const DAY_MS = 86_400_000;
export const THREE_DAYS_MS = 259_200_000;

export type CredentialsPayload = {
  username: string;
  password: string;
};

export function computeOfferDeadlines(nowMs: number): {
  fullAt: Date;
  credentialDeadline: Date;
  settleAfter: Date;
} {
  return {
    fullAt: new Date(nowMs),
    credentialDeadline: new Date(nowMs + DAY_MS),
    settleAfter: new Date(nowMs + THREE_DAYS_MS),
  };
}

export function ensureOfferDeadlines(offer: Offer, nowMs: number): void {
  const deadlines = computeOfferDeadlines(nowMs);
  if (!offer.fullAt) offer.fullAt = deadlines.fullAt;
  if (!offer.credentialDeadline) offer.credentialDeadline = deadlines.credentialDeadline;
  if (!offer.settleAfter) offer.settleAfter = deadlines.settleAfter;
}

export function buildCredentialRecord(
  offer: Offer,
  credentials: CredentialsPayload,
  nowMs: number,
): Offer["credentials"] {
  const submittedAt = new Date(nowMs);
  const unlockAt = offer.settleAfter ?? new Date(nowMs + THREE_DAYS_MS);

  return {
    username: credentials.username,
    password: credentials.password,
    submittedAt: submittedAt.toISOString(),
    unlockAt: unlockAt.toISOString(),
  };
}
