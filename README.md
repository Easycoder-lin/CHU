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
- `SUI_PACKAGE_ID` (deployed packageId, fixed to `0xedc20852fba479e27d10cb05ca415cbb608dcb4fddc1f0749fbfa3e4c93c71b7`)

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
