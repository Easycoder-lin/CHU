import type { Order, ProductId } from "../services/orderbook.js";

export function buildOrderbookSeeds(now: Date): Record<ProductId, Array<Omit<Order, "id">>> {
  const pad = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();

  return {
    NETFLIX_ANNUAL: [
      { product: "NETFLIX_ANNUAL", side: "SELL", price: 30, quantity: 2, remaining: 2, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorA", createdAt: pad(40), updatedAt: pad(40) },
      { product: "NETFLIX_ANNUAL", side: "SELL", price: 28, quantity: 1, remaining: 1, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorB", createdAt: pad(35), updatedAt: pad(35) },
      { product: "NETFLIX_ANNUAL", side: "SELL", price: 26, quantity: 3, remaining: 3, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorC", createdAt: pad(30), updatedAt: pad(30) },
      { product: "NETFLIX_ANNUAL", side: "SELL", price: 34, quantity: 2, remaining: 2, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorD", createdAt: pad(50), updatedAt: pad(50) },
      { product: "NETFLIX_ANNUAL", side: "SELL", price: 32, quantity: 1, remaining: 1, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorE", createdAt: pad(45), updatedAt: pad(45) },
      { product: "NETFLIX_ANNUAL", side: "SELL", price: 25, quantity: 2, remaining: 2, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorF", createdAt: pad(28), updatedAt: pad(28) },
      { product: "NETFLIX_ANNUAL", side: "BUY", price: 20, quantity: 2, remaining: 2, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberA", createdAt: pad(25), updatedAt: pad(25) },
      { product: "NETFLIX_ANNUAL", side: "BUY", price: 18, quantity: 2, remaining: 2, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberB", createdAt: pad(20), updatedAt: pad(20) },
      { product: "NETFLIX_ANNUAL", side: "BUY", price: 15, quantity: 4, remaining: 4, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberC", createdAt: pad(15), updatedAt: pad(15) },
      { product: "NETFLIX_ANNUAL", side: "BUY", price: 12, quantity: 3, remaining: 3, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberD", createdAt: pad(12), updatedAt: pad(12) },
      { product: "NETFLIX_ANNUAL", side: "BUY", price: 10, quantity: 2, remaining: 2, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberE", createdAt: pad(9), updatedAt: pad(9) },
    ],
    SPOTIFY_ANNUAL: [
      { product: "SPOTIFY_ANNUAL", side: "SELL", price: 15, quantity: 2, remaining: 2, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorD", createdAt: pad(30), updatedAt: pad(30) },
      { product: "SPOTIFY_ANNUAL", side: "SELL", price: 12, quantity: 1, remaining: 1, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorE", createdAt: pad(24), updatedAt: pad(24) },
      { product: "SPOTIFY_ANNUAL", side: "SELL", price: 18, quantity: 1, remaining: 1, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorF", createdAt: pad(32), updatedAt: pad(32) },
      { product: "SPOTIFY_ANNUAL", side: "BUY", price: 5, quantity: 3, remaining: 3, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberD", createdAt: pad(18), updatedAt: pad(18) },
      { product: "SPOTIFY_ANNUAL", side: "BUY", price: 2, quantity: 2, remaining: 2, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberE", createdAt: pad(12), updatedAt: pad(12) },
      { product: "SPOTIFY_ANNUAL", side: "BUY", price: 8, quantity: 2, remaining: 2, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberF", createdAt: pad(10), updatedAt: pad(10) },
    ],
    CHATGPT_ANNUAL: [
      { product: "CHATGPT_ANNUAL", side: "SELL", price: 80, quantity: 1, remaining: 1, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorF", createdAt: pad(22), updatedAt: pad(22) },
      { product: "CHATGPT_ANNUAL", side: "SELL", price: 76, quantity: 2, remaining: 2, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorG", createdAt: pad(18), updatedAt: pad(18) },
      { product: "CHATGPT_ANNUAL", side: "SELL", price: 84, quantity: 1, remaining: 1, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorH", createdAt: pad(26), updatedAt: pad(26) },
      { product: "CHATGPT_ANNUAL", side: "BUY", price: 68, quantity: 1, remaining: 1, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberF", createdAt: pad(14), updatedAt: pad(14) },
      { product: "CHATGPT_ANNUAL", side: "BUY", price: 65, quantity: 2, remaining: 2, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberG", createdAt: pad(10), updatedAt: pad(10) },
      { product: "CHATGPT_ANNUAL", side: "BUY", price: 60, quantity: 2, remaining: 2, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberH", createdAt: pad(8), updatedAt: pad(8) },
    ],
    GEMINI_ANNUAL: [
      { product: "GEMINI_ANNUAL", side: "SELL", price: 4, quantity: 1, remaining: 1, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorH", createdAt: pad(25), updatedAt: pad(25) },
      { product: "GEMINI_ANNUAL", side: "SELL", price: 5, quantity: 1, remaining: 1, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorI", createdAt: pad(30), updatedAt: pad(30) },
      { product: "GEMINI_ANNUAL", side: "BUY", price: 1, quantity: 1, remaining: 1, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberH", createdAt: pad(16), updatedAt: pad(16) },
      { product: "GEMINI_ANNUAL", side: "BUY", price: 2, quantity: 1, remaining: 1, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberI", createdAt: pad(12), updatedAt: pad(12) },
    ],
    YOUTUBE_PREMIUM_ANNUAL: [
      { product: "YOUTUBE_PREMIUM_ANNUAL", side: "SELL", price: 10, quantity: 3, remaining: 3, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorY1", createdAt: pad(34), updatedAt: pad(34) },
      { product: "YOUTUBE_PREMIUM_ANNUAL", side: "SELL", price: 13, quantity: 2, remaining: 2, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorY2", createdAt: pad(28), updatedAt: pad(28) },
      { product: "YOUTUBE_PREMIUM_ANNUAL", side: "BUY", price: 6, quantity: 2, remaining: 2, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberY1", createdAt: pad(20), updatedAt: pad(20) },
      { product: "YOUTUBE_PREMIUM_ANNUAL", side: "BUY", price: 7, quantity: 3, remaining: 3, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberY2", createdAt: pad(15), updatedAt: pad(15) },
    ],
    DISNEY_BUNDLE_ANNUAL: [
      { product: "DISNEY_BUNDLE_ANNUAL", side: "SELL", price: 50, quantity: 2, remaining: 2, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorD1", createdAt: pad(36), updatedAt: pad(36) },
      { product: "DISNEY_BUNDLE_ANNUAL", side: "SELL", price: 48, quantity: 2, remaining: 2, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorD2", createdAt: pad(30), updatedAt: pad(30) },
      { product: "DISNEY_BUNDLE_ANNUAL", side: "BUY", price: 38, quantity: 2, remaining: 2, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberD1", createdAt: pad(22), updatedAt: pad(22) },
      { product: "DISNEY_BUNDLE_ANNUAL", side: "BUY", price: 35, quantity: 3, remaining: 3, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberD2", createdAt: pad(18), updatedAt: pad(18) },
    ],
    APPLE_ONE_ANNUAL: [
      { product: "APPLE_ONE_ANNUAL", side: "SELL", price: 70, quantity: 2, remaining: 2, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorA1", createdAt: pad(38), updatedAt: pad(38) },
      { product: "APPLE_ONE_ANNUAL", side: "SELL", price: 65, quantity: 1, remaining: 1, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorA2", createdAt: pad(32), updatedAt: pad(32) },
      { product: "APPLE_ONE_ANNUAL", side: "BUY", price: 50, quantity: 2, remaining: 2, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberA1", createdAt: pad(24), updatedAt: pad(24) },
      { product: "APPLE_ONE_ANNUAL", side: "BUY", price: 46, quantity: 2, remaining: 2, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberA2", createdAt: pad(20), updatedAt: pad(20) },
    ],
    PRIME_VIDEO_ANNUAL: [
      { product: "PRIME_VIDEO_ANNUAL", side: "SELL", price: 8, quantity: 2, remaining: 2, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorP1", createdAt: pad(33), updatedAt: pad(33) },
      { product: "PRIME_VIDEO_ANNUAL", side: "SELL", price: 9, quantity: 1, remaining: 1, status: "OPEN", actor: "SPONSOR", walletAddress: "0xsponsorP2", createdAt: pad(27), updatedAt: pad(27) },
      { product: "PRIME_VIDEO_ANNUAL", side: "BUY", price: 6, quantity: 2, remaining: 2, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberP1", createdAt: pad(21), updatedAt: pad(21) },
      { product: "PRIME_VIDEO_ANNUAL", side: "BUY", price: 5, quantity: 3, remaining: 3, status: "OPEN", actor: "MEMBER", walletAddress: "0xmemberP2", createdAt: pad(17), updatedAt: pad(17) },
    ],
  };
}
