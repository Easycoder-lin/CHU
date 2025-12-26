# CHU Move Contracts

Smart contracts for the CHU protocol on Sui, covering sponsor staking, offer
creation, member seat purchases, settlement/slashing, and pool registry logic.

## Package layout

- `sources/sponsor.move`: Core offer lifecycle (stake sponsor, create offer,
  join, submit TEE receipt, settle, slash, and claim slashed stake).
- `sources/member.move`: Member-facing helpers for joining offers with duplicate
  member protection.
- `sources/pool.move`: Pool + registry flow for grouping offers by order hash
  and coordinating group joins.
- `sources/seat_nft.move`: Seat NFT minting for successful joins.
- `sources/vault.move`: Platform fee vault with admin-controlled withdrawals.
- `sources/chu.move`: Placeholder root module.
- `sources/tee_registry.move`: Placeholder registry module.

## Core flow (happy path)

1. Sponsor stakes SUI to mint a `SponsorBadge` (`sponsor::stake_sponsor`).
2. Sponsor creates an `Offer` with seat cap and price
   (`sponsor::create_offer` or via `pool::create_pool_for_offer`).
3. Members join the offer by paying the seat price, receiving a `SeatNFT`
   (`member::join_offer` or `pool::join_pool`).
4. Sponsor submits a TEE receipt before the credential deadline
   (`sponsor::submit_tee_receipt`).
5. After the settlement delay, sponsor settles to receive payouts and stake
   (`sponsor::settle_offer`), with platform fees deposited to the vault.

## Slash flow (missed credentials)

If the sponsor misses the credential deadline:

- Anyone can call `sponsor::slash_offer`, which creates a `SlashedPool` and
  per-member `SlashClaim` tickets.
- Members claim their share via `sponsor::claim_slash`.

## Pool registry

The pool module maintains a `PoolRegistry` for mapping `order_hash` values to a
`Pool` ID:

- `pool::init_registry` creates the registry.
- `pool::register_pool` adds a pool to the registry.
- `pool::get_pool_id` looks up the pool by `order_hash`.

## Addresses

Named addresses are configured in `Move.toml`:

- `chu = "0x0"` (update for deployments)

## Tests

Run Move tests from the package directory:

```sh
cd packages/move/CHU
sui move test
```

## Build

```sh
cd packages/move/CHU
sui move build
```

## Deploy to testnet

1. Keep the named address at `0x0` (required for publish):

```toml
[addresses]
chu = "0x0"
```

2. Configure the testnet environment and fund the active address:

```sh
sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443
sui client switch --env testnet
sui client faucet
```

3. Build and publish the package:

```sh
cd packages/move/CHU
sui move build
sui client publish --gas-budget 100000000
```

4. Save the `PackageId` from the publish output. Optionally record it in
`Move.toml` for convenience (do not replace `chu = "0x0"`):

```toml
[package]
published-at = "0xYOUR_PACKAGE_ID"
```

5. Call public entry helpers via `sui client call`, for example:

```sh
sui client call \
  --package 0xYOUR_PACKAGE_ID \
  --module sponsor \
  --function stake_sponsor_entry \
  --args <STAKE_COIN_ID> 0x6 \
  --gas-budget 100000000
```

### End-to-end testnet call sequence

This sequence creates a sponsor badge, an offer, joins the offer, initializes
the vault, and submits a receipt. Settlement or slashing requires waiting for
on-chain time to pass, so those are listed separately.

1. Get a gas coin ID:

```sh
sui client gas
```

2. Split coins for staking and payment:

```sh
sui client split-coin --coin-id <GAS_COIN_ID> --amounts 1000000000 --gas-budget 100000000
sui client split-coin --coin-id <GAS_COIN_ID> --amounts 100000000 --gas-budget 100000000
```

3. Stake sponsor (record `BADGE_ID` from the output):

```sh
sui client call \
  --package 0xYOUR_PACKAGE_ID \
  --module sponsor \
  --function stake_sponsor_entry \
  --args <STAKE_COIN_ID> 0x6 \
  --gas-budget 100000000
```

4. Create an offer (record `OFFER_ID`):

```sh
sui client call \
  --package 0xYOUR_PACKAGE_ID \
  --module sponsor \
  --function create_offer_entry \
  --args <BADGE_ID> 0x0102 1 100000000 500 500000000 0x6 \
  --gas-budget 100000000
```

5. Join the offer as a member (record `SEAT_NFT_ID`):

```sh
sui client call \
  --package 0xYOUR_PACKAGE_ID \
  --module member \
  --function join_offer_entry \
  --args <OFFER_ID> <PAYMENT_COIN_ID> 0x6 \
  --gas-budget 100000000
```

6. Initialize the vault (record `VAULT_ID` and `ADMIN_CAP_ID`):

```sh
sui client call \
  --package 0xYOUR_PACKAGE_ID \
  --module vault \
  --function init_vault_entry \
  --gas-budget 100000000
```

7. Submit the TEE receipt:

```sh
sui client call \
  --package 0xYOUR_PACKAGE_ID \
  --module sponsor \
  --function submit_tee_receipt_entry \
  --args <OFFER_ID> <BADGE_ID> 0xdeadbeef 0x6 \
  --gas-budget 100000000
```

8. Settle (after the settlement delay):

```sh
sui client call \
  --package 0xYOUR_PACKAGE_ID \
  --module sponsor \
  --function settle_offer_entry \
  --args <OFFER_ID> <BADGE_ID> <VAULT_ID> 0x6 \
  --gas-budget 100000000
```

9. Slash (if the sponsor missed the deadline):

```sh
sui client call \
  --package 0xYOUR_PACKAGE_ID \
  --module sponsor \
  --function slash_offer_entry \
  --args <OFFER_ID> 0x6 \
  --gas-budget 100000000
```

10. Claim slashed stake:

```sh
sui client call \
  --package 0xYOUR_PACKAGE_ID \
  --module sponsor \
  --function claim_slash_entry \
  --args <SLASH_POOL_ID> <SLASH_CLAIM_ID> \
  --gas-budget 100000000
```
