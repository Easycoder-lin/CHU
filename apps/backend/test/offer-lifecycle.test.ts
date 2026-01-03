import { describe, expect, it } from "vitest";

import { buildCredentialRecord, computeOfferDeadlines, DAY_MS, ensureOfferDeadlines, THREE_DAYS_MS } from "../src/services/offer-lifecycle.js";
import type { Offer } from "../src/entities/Offer.js";

function makeOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    fullAt: null,
    credentialDeadline: null,
    settleAfter: null,
    credentials: null,
    ...overrides,
  } as Offer;
}

describe("offer lifecycle helpers", () => {
  it("computes deadlines in milliseconds", () => {
    const nowMs = 1_000_000;
    const deadlines = computeOfferDeadlines(nowMs);
    expect(deadlines.fullAt.getTime()).toBe(nowMs);
    expect(deadlines.credentialDeadline.getTime()).toBe(nowMs + DAY_MS);
    expect(deadlines.settleAfter.getTime()).toBe(nowMs + THREE_DAYS_MS);
  });

  it("fills missing deadlines without overwriting existing values", () => {
    const nowMs = 2_000_000;
    const existing = new Date(nowMs - 5_000);
    const offer = makeOffer({ fullAt: existing });

    ensureOfferDeadlines(offer, nowMs);

    expect(offer.fullAt?.getTime()).toBe(existing.getTime());
    expect(offer.credentialDeadline?.getTime()).toBe(nowMs + DAY_MS);
    expect(offer.settleAfter?.getTime()).toBe(nowMs + THREE_DAYS_MS);
  });

  it("builds credential records using settleAfter when available", () => {
    const nowMs = 3_000_000;
    const settleAfter = new Date(nowMs + THREE_DAYS_MS + 1234);
    const offer = makeOffer({ settleAfter });

    const record = buildCredentialRecord(offer, { username: "user", password: "pass" }, nowMs);

    expect(record.submittedAt).toBe(new Date(nowMs).toISOString());
    expect(record.unlockAt).toBe(settleAfter.toISOString());
  });
});
