## Quick start (one-click script)

```sh
./scripts/dev.sh
```

What it does:
- starts Postgres via `docker compose` (if available)
- installs backend/frontend deps if missing
- runs backend migrations
- starts backend + frontend dev servers

## Docker Compose (Postgres only)

```sh
docker compose up -d
```

Default credentials (match `apps/backend/.env`):
- DB: `chu`
- User: `postgres`
- Password: `postgres`

## Manual start

Backend:

```sh
cd apps/backend
cp .env.sample .env
pnpm install
pnpm run db:migrate
pnpm run dev
```

Chain config (backend `.env`):
- `SUI_RPC_URL` (Sui fullnode JSON-RPC URL)
- `SUI_NETWORK` (e.g. `testnet`)
- `SUI_PACKAGE_ID` (deployed packageId, fixed to `0x7300a3b8d7e3b285a773fd6f8f4715a811ec02d2dabe31efdc8262a80937d7dc`)

Frontend:

```sh
cd apps/frontend
cp .env.sample .env.local
pnpm install
pnpm run dev
```

Move contracts:

```sh
cd packages/move/CHU
sui move build
sui move test
```

## Contracts

See `packages/move/CHU/README.md` for publish steps and testnet call sequence.

## Orderbook auto-matching

The backend now automatically matches orderbook bids/asks on order creation or offer sync. When a match occurs it:
- creates an `orderbook_trades` row with execution status,
- marks the trade `AWAITING_SETTLEMENT` until the buyer releases escrow on-chain,
- updates offer seats/members once settlement is confirmed.

Notes:
- Trades require a `walletAddress` on the buy order; missing wallets will cause the trade to be marked `FAILED`.
- No new environment variables are required for the escrow settlement flow.

## Buy-Side Escrow Semantics

- Sponsor offer creation is listing-only; no member funds are locked at create time.
- Member joins lock funds immediately on-chain via the vault lock flow, then escrow is deposited to the offer.
- Orderbook BUY orders require a pre-funded escrow lock (`lockObjectId`, `lockTxDigest`) at placement time.
- Matched trades are settled by releasing already-locked escrow into `join_offer_with_lock_entry`, never by pulling new wallet funds post-match.
- Escrow refunds are handled on-chain via vault lock refund calls for unused balances.
