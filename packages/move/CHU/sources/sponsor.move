module chu::sponsor {
    use chu::seat_nft;
    use chu::vault;
    use sui::balance;
    use sui::coin;
    use sui::clock;
    use sui::event;
    use sui::sui::SUI;

    const DAY_MS: u64 = 86_400_000;
    const THREE_DAYS_MS: u64 = 259_200_000;

    const STATUS_OPEN: u8 = 0;
    const STATUS_FULL: u8 = 1;
    const STATUS_CREDENTIALS_SUBMITTED: u8 = 2;
    const STATUS_SETTLED: u8 = 3;
    const STATUS_SLASHED: u8 = 4;

    const EInvalidSeatCap: u64 = 0;
    const EInvalidPrice: u64 = 1;
    const EInvalidFeeBps: u64 = 2;
    const EInvalidStake: u64 = 3;
    const EInsufficientStake: u64 = 4;
    const ENotSponsor: u64 = 5;
    const EOfferNotOpen: u64 = 6;
    const ESeatCapReached: u64 = 7;
    const EInvalidPayment: u64 = 8;
    const EOfferNotFull: u64 = 9;
    const ECredentialsExpired: u64 = 10;
    const ECredentialsAlreadySubmitted: u64 = 11;
    const ECredentialsMissing: u64 = 12;
    const ENoMembers: u64 = 13;
    const EPerMemberZero: u64 = 14;
    const EOfferNotReadyToSettle: u64 = 15;
    const EClaimNotOwner: u64 = 16;
    const EAlreadyClaimed: u64 = 17;
    const EPoolMismatch: u64 = 18;
    const EInsufficientPool: u64 = 19;

    public struct SponsorBadge has key, store {
        id: object::UID,
        sponsor: address,
        staked: balance::Balance<SUI>,
        created_at_ms: u64,
    }

    public struct Offer has key, store {
        id: object::UID,
        sponsor: address,
        order_hash: vector<u8>,
        seat_cap: u64,
        price_per_seat: u64,
        platform_fee_bps: u64,
        seats_sold: u64,
        status: u8,
        escrow_payments: balance::Balance<SUI>,
        stake_locked: balance::Balance<SUI>,
        created_at_ms: u64,
        full_at_ms: option::Option<u64>,
        cred_deadline_ms: option::Option<u64>,
        settle_after_ms: option::Option<u64>,
        members: vector<address>,
        tee_receipt: option::Option<vector<u8>>,
    }

    public struct SlashedPool has key, store {
        id: object::UID,
        offer_id: object::ID,
        remaining: balance::Balance<SUI>,
        per_member: u64,
        total_members: u64,
    }

    public struct SlashClaim has key, store {
        id: object::UID,
        pool_id: object::ID,
        claimer: address,
        claimed: bool,
    }

    public struct SponsorStaked has copy, drop, store {
        sponsor: address,
        amount: u64,
        created_at_ms: u64,
    }

    public struct OfferCreated has copy, drop, store {
        offer_id: object::ID,
        sponsor: address,
        seat_cap: u64,
        price_per_seat: u64,
        platform_fee_bps: u64,
        stake_locked: u64,
        created_at_ms: u64,
        order_hash_len: u64,
    }

    public struct MemberJoined has copy, drop, store {
        offer_id: object::ID,
        member: address,
        seats_sold: u64,
    }

    public struct OfferFilled has copy, drop, store {
        offer_id: object::ID,
        full_at_ms: u64,
        order_hash_len: u64,
    }

    public struct CredentialsSubmitted has copy, drop, store {
        offer_id: object::ID,
        sponsor: address,
        receipt_len: u64,
    }

    public struct OfferSlashed has copy, drop, store {
        offer_id: object::ID,
        pool_id: object::ID,
        per_member: u64,
        total_members: u64,
    }

    public struct SlashClaimed has copy, drop, store {
        pool_id: object::ID,
        claimer: address,
        amount: u64,
    }

    public struct OfferSettled has copy, drop, store {
        offer_id: object::ID,
        payout: u64,
        fee: u64,
        stake_returned: u64,
    }

    // Stake SUI and mint a sponsor badge.
    public fun stake_sponsor(
        stake: coin::Coin<SUI>,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext,
    ): SponsorBadge {
        stake_sponsor_with_time(stake, clock::timestamp_ms(clock), ctx, true)
    }

    // Test helper to mint a sponsor badge at a given timestamp.
    #[test_only]
    public fun stake_sponsor_for_testing(
        stake: coin::Coin<SUI>,
        now_ms: u64,
        ctx: &mut tx_context::TxContext,
    ): SponsorBadge {
        stake_sponsor_with_time(stake, now_ms, ctx, false)
    }

    // Internal helper to stake with explicit time.
    fun stake_sponsor_with_time(
        stake: coin::Coin<SUI>,
        now_ms: u64,
        ctx: &mut tx_context::TxContext,
        emit_events: bool,
    ): SponsorBadge {
        let sponsor = tx_context::sender(ctx);
        let staked = coin::into_balance(stake);
        let badge = SponsorBadge {
            id: object::new(ctx),
            sponsor,
            staked,
            created_at_ms: now_ms,
        };
        if (emit_events) {
            event::emit(SponsorStaked {
                sponsor,
                amount: balance::value(&badge.staked),
                created_at_ms: now_ms,
            });
        };
        badge
    }

    // Create a new offer and lock sponsor stake.
    public fun create_offer(
        badge: &mut SponsorBadge,
        order_hash: vector<u8>,
        seat_cap: u64,
        price_per_seat: u64,
        platform_fee_bps: u64,
        stake_to_lock: u64,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext,
    ): Offer {
        create_offer_with_time(
            badge,
            order_hash,
            seat_cap,
            price_per_seat,
            platform_fee_bps,
            stake_to_lock,
            clock::timestamp_ms(clock),
            ctx,
            true,
        )
    }

    // Test helper to create an offer at a given timestamp.
    #[test_only]
    public fun create_offer_for_testing(
        badge: &mut SponsorBadge,
        order_hash: vector<u8>,
        seat_cap: u64,
        price_per_seat: u64,
        platform_fee_bps: u64,
        stake_to_lock: u64,
        now_ms: u64,
        ctx: &mut tx_context::TxContext,
    ): Offer {
        create_offer_with_time(
            badge,
            order_hash,
            seat_cap,
            price_per_seat,
            platform_fee_bps,
            stake_to_lock,
            now_ms,
            ctx,
            false,
        )
    }

    // Internal helper to create an offer with explicit time.
    fun create_offer_with_time(
        badge: &mut SponsorBadge,
        order_hash: vector<u8>,
        seat_cap: u64,
        price_per_seat: u64,
        platform_fee_bps: u64,
        stake_to_lock: u64,
        now_ms: u64,
        ctx: &mut tx_context::TxContext,
        emit_events: bool,
    ): Offer {
        assert!(badge.sponsor == tx_context::sender(ctx), ENotSponsor);
        assert!(seat_cap > 0, EInvalidSeatCap);
        assert!(price_per_seat > 0, EInvalidPrice);
        assert!(platform_fee_bps <= 10_000, EInvalidFeeBps);
        assert!(stake_to_lock > 0, EInvalidStake);

        let available = balance::value(&badge.staked);
        assert!(available >= stake_to_lock, EInsufficientStake);
        let stake_locked = balance::split(&mut badge.staked, stake_to_lock);
        let order_hash_len = vector::length(&order_hash);
        let offer = Offer {
            id: object::new(ctx),
            sponsor: badge.sponsor,
            order_hash,
            seat_cap,
            price_per_seat,
            platform_fee_bps,
            seats_sold: 0,
            status: STATUS_OPEN,
            escrow_payments: balance::zero<SUI>(),
            stake_locked,
            created_at_ms: now_ms,
            full_at_ms: option::none<u64>(),
            cred_deadline_ms: option::none<u64>(),
            settle_after_ms: option::none<u64>(),
            members: vector::empty<address>(),
            tee_receipt: option::none<vector<u8>>(),
        };
        if (emit_events) {
            event::emit(OfferCreated {
                offer_id: object::id(&offer),
                sponsor: offer.sponsor,
                seat_cap,
                price_per_seat,
                platform_fee_bps,
                stake_locked: stake_to_lock,
                created_at_ms: now_ms,
                order_hash_len,
            });
        };
        offer
    }

    // Join an open offer by paying exactly one seat price and mint a Seat NFT.
    public(package) fun join_offer(
        offer: &mut Offer,
        payment: coin::Coin<SUI>,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext,
    ): seat_nft::SeatNFT {
        join_offer_with_time(offer, payment, clock::timestamp_ms(clock), ctx)
    }

    // Test helper to join an offer at a given timestamp.
    #[test_only]
    public(package) fun join_offer_for_testing(
        offer: &mut Offer,
        payment: coin::Coin<SUI>,
        now_ms: u64,
        ctx: &mut tx_context::TxContext,
    ): seat_nft::SeatNFT {
        join_offer_with_time_for_testing(offer, payment, now_ms, ctx)
    }

    // Internal helper to join an offer with explicit time.
    fun join_offer_with_time(
        offer: &mut Offer,
        payment: coin::Coin<SUI>,
        now_ms: u64,
        ctx: &mut tx_context::TxContext,
    ): seat_nft::SeatNFT {
        assert!(offer.status == STATUS_OPEN, EOfferNotOpen);
        assert!(offer.seats_sold < offer.seat_cap, ESeatCapReached);

        let member = tx_context::sender(ctx);
        let amount = coin::value(&payment);
        assert!(amount == offer.price_per_seat, EInvalidPayment);
        let payment_balance = coin::into_balance(payment);
        balance::join(&mut offer.escrow_payments, payment_balance);

        offer.seats_sold = offer.seats_sold + 1;
        vector::push_back(&mut offer.members, member);

        event::emit(MemberJoined {
            offer_id: object::id(offer),
            member,
            seats_sold: offer.seats_sold,
        });

        if (offer.seats_sold == offer.seat_cap) {
            offer.status = STATUS_FULL;
            offer.full_at_ms = option::some(now_ms);
            offer.cred_deadline_ms = option::some(now_ms + DAY_MS);
            offer.settle_after_ms = option::some(now_ms + THREE_DAYS_MS);
            event::emit(OfferFilled {
                offer_id: object::id(offer),
                full_at_ms: now_ms,
                order_hash_len: vector::length(&offer.order_hash),
            });
        };

        let order_hash = copy_u8_vector(&offer.order_hash);
        seat_nft::mint(object::id(offer), order_hash, ctx)
    }

    #[test_only]
    fun join_offer_with_time_for_testing(
        offer: &mut Offer,
        payment: coin::Coin<SUI>,
        now_ms: u64,
        ctx: &mut tx_context::TxContext,
    ): seat_nft::SeatNFT {
        assert!(offer.status == STATUS_OPEN, EOfferNotOpen);
        assert!(offer.seats_sold < offer.seat_cap, ESeatCapReached);

        let member = tx_context::sender(ctx);
        let amount = coin::value(&payment);
        assert!(amount == offer.price_per_seat, EInvalidPayment);
        let payment_balance = coin::into_balance(payment);
        balance::join(&mut offer.escrow_payments, payment_balance);

        offer.seats_sold = offer.seats_sold + 1;
        vector::push_back(&mut offer.members, member);

        if (offer.seats_sold == offer.seat_cap) {
            offer.status = STATUS_FULL;
            offer.full_at_ms = option::some(now_ms);
            offer.cred_deadline_ms = option::some(now_ms + DAY_MS);
            offer.settle_after_ms = option::some(now_ms + THREE_DAYS_MS);
        };

        let order_hash = copy_u8_vector(&offer.order_hash);
        seat_nft::mint_for_testing(object::id(offer), order_hash, ctx)
    }

    public(package) fun is_member(offer: &Offer, member: address): bool {
        let len = vector::length(&offer.members);
        let mut i = 0;
        let mut found = false;
        while (i < len) {
            if (*vector::borrow(&offer.members, i) == member) {
                found = true;
                i = len;
            } else {
                i = i + 1;
            };
        };
        found
    }

    public(package) fun seat_cap(offer: &Offer): u64 {
        offer.seat_cap
    }

    public(package) fun seats_sold(offer: &Offer): u64 {
        offer.seats_sold
    }

    // Clone a vector<u8> without relying on std::vector copy APIs.
    fun copy_u8_vector(input: &vector<u8>): vector<u8> {
        let mut out = vector::empty<u8>();
        let len = vector::length(input);
        let mut i = 0;
        while (i < len) {
            let b = *vector::borrow(input, i);
            vector::push_back(&mut out, b);
            i = i + 1;
        };
        out
    }

    // Submit the TEE receipt within the credential deadline.
    public fun submit_tee_receipt(
        offer: &mut Offer,
        badge: &SponsorBadge,
        receipt: vector<u8>,
        clock: &clock::Clock,
    ) {
        submit_tee_receipt_with_time(
            offer,
            badge,
            receipt,
            clock::timestamp_ms(clock),
            true,
        )
    }

    // Test helper to submit a receipt at a given timestamp.
    #[test_only]
    public fun submit_tee_receipt_for_testing(
        offer: &mut Offer,
        badge: &SponsorBadge,
        receipt: vector<u8>,
        now_ms: u64,
    ) {
        submit_tee_receipt_with_time(offer, badge, receipt, now_ms, false)
    }

    // Internal helper to submit receipt with explicit time.
    fun submit_tee_receipt_with_time(
        offer: &mut Offer,
        badge: &SponsorBadge,
        receipt: vector<u8>,
        now_ms: u64,
        emit_events: bool,
    ) {
        assert!(badge.sponsor == offer.sponsor, ENotSponsor);
        assert!(offer.status == STATUS_FULL, EOfferNotFull);
        assert!(
            option::is_none(&offer.tee_receipt),
            ECredentialsAlreadySubmitted
        );
        assert!(
            option::is_some(&offer.cred_deadline_ms),
            EOfferNotFull
        );
        let deadline = *option::borrow(&offer.cred_deadline_ms);
        assert!(now_ms <= deadline, ECredentialsExpired);

        let receipt_len = vector::length(&receipt);
        offer.tee_receipt = option::some(receipt);
        offer.status = STATUS_CREDENTIALS_SUBMITTED;
        if (emit_events) {
            event::emit(CredentialsSubmitted {
                offer_id: object::id(offer),
                sponsor: offer.sponsor,
                receipt_len,
            });
        };
    }

    // Slash sponsor stake after missed deadline and mint claim tickets.
    public fun slash_offer(
        offer: &mut Offer,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext,
    ): (SlashedPool, vector<SlashClaim>) {
        slash_offer_with_time(offer, clock::timestamp_ms(clock), ctx, true)
    }

    // Test helper to slash an offer at a given timestamp.
    #[test_only]
    public fun slash_offer_for_testing(
        offer: &mut Offer,
        now_ms: u64,
        ctx: &mut tx_context::TxContext,
    ): (SlashedPool, vector<SlashClaim>) {
        slash_offer_with_time(offer, now_ms, ctx, false)
    }

    // Internal helper to slash with explicit time.
    fun slash_offer_with_time(
        offer: &mut Offer,
        now_ms: u64,
        ctx: &mut tx_context::TxContext,
        emit_events: bool,
    ): (SlashedPool, vector<SlashClaim>) {
        assert!(offer.status == STATUS_FULL, EOfferNotFull);
        assert!(option::is_some(&offer.cred_deadline_ms), EOfferNotFull);
        assert!(option::is_none(&offer.tee_receipt), ECredentialsMissing);

        let deadline = *option::borrow(&offer.cred_deadline_ms);
        assert!(now_ms > deadline, ECredentialsExpired);

        let total_members = vector::length(&offer.members);
        assert!(total_members > 0, ENoMembers);

        let stake_balance = balance::withdraw_all(&mut offer.stake_locked);
        let total_stake = balance::value(&stake_balance);
        let per_member = total_stake / total_members;
        assert!(per_member > 0, EPerMemberZero);

        offer.status = STATUS_SLASHED;
        let pool = SlashedPool {
            id: object::new(ctx),
            offer_id: object::id(offer),
            remaining: stake_balance,
            per_member,
            total_members,
        };
        let pool_id = object::id(&pool);

        let mut claims = vector::empty<SlashClaim>();
        let mut i = 0;
        while (i < total_members) {
            let claimer = *vector::borrow(&offer.members, i);
            vector::push_back(
                &mut claims,
                SlashClaim {
                    id: object::new(ctx),
                    pool_id,
                    claimer,
                    claimed: false,
                },
            );
            i = i + 1;
        };

        if (emit_events) {
            event::emit(OfferSlashed {
                offer_id: object::id(offer),
                pool_id,
                per_member,
                total_members,
            });
        };

        (pool, claims)
    }

    // Claim a slashed stake payout using a claim ticket.
    public fun claim_slash(
        pool: &mut SlashedPool,
        claim: &mut SlashClaim,
        ctx: &mut tx_context::TxContext,
    ): coin::Coin<SUI> {
        claim_slash_with_sender(pool, claim, ctx, true)
    }

    // Test helper to claim a slashed payout and return the coin.
    #[test_only]
    public fun claim_slash_for_testing(
        pool: &mut SlashedPool,
        claim: &mut SlashClaim,
        ctx: &mut tx_context::TxContext,
    ): coin::Coin<SUI> {
        claim_slash_with_sender(pool, claim, ctx, false)
    }

    // Internal helper to claim a slashed payout for the current sender.
    fun claim_slash_with_sender(
        pool: &mut SlashedPool,
        claim: &mut SlashClaim,
        ctx: &mut tx_context::TxContext,
        emit_events: bool,
    ): coin::Coin<SUI> {
        let sender = tx_context::sender(ctx);
        assert!(claim.claimer == sender, EClaimNotOwner);
        assert!(!claim.claimed, EAlreadyClaimed);
        assert!(claim.pool_id == object::id(pool), EPoolMismatch);

        let available = balance::value(&pool.remaining);
        assert!(available >= pool.per_member, EInsufficientPool);

        let payout_balance = balance::split(&mut pool.remaining, pool.per_member);
        claim.claimed = true;

        if (emit_events) {
            event::emit(SlashClaimed {
                pool_id: object::id(pool),
                claimer: sender,
                amount: pool.per_member,
            });
        };
        coin::from_balance(payout_balance, ctx)
    }

    // Settle an offer after the settlement delay and return payout + stake.
    public fun settle_offer(
        offer: &mut Offer,
        badge: &SponsorBadge,
        vault_obj: &mut vault::PlatformVault,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext,
    ): (coin::Coin<SUI>, coin::Coin<SUI>) {
        settle_offer_with_time(
            offer,
            badge,
            vault_obj,
            clock::timestamp_ms(clock),
            ctx,
            true,
        )
    }

    // Test helper to settle an offer at a given timestamp.
    #[test_only]
    public fun settle_offer_for_testing(
        offer: &mut Offer,
        badge: &SponsorBadge,
        vault_obj: &mut vault::PlatformVault,
        now_ms: u64,
        ctx: &mut tx_context::TxContext,
    ): (coin::Coin<SUI>, coin::Coin<SUI>) {
        settle_offer_with_time(offer, badge, vault_obj, now_ms, ctx, false)
    }

    // Internal helper to settle with explicit time.
    fun settle_offer_with_time(
        offer: &mut Offer,
        badge: &SponsorBadge,
        vault_obj: &mut vault::PlatformVault,
        now_ms: u64,
        ctx: &mut tx_context::TxContext,
        emit_events: bool,
    ): (coin::Coin<SUI>, coin::Coin<SUI>) {
        assert!(offer.sponsor == badge.sponsor, ENotSponsor);
        assert!(
            offer.status == STATUS_CREDENTIALS_SUBMITTED,
            EOfferNotReadyToSettle
        );
        assert!(
            option::is_some(&offer.settle_after_ms),
            EOfferNotReadyToSettle
        );
        let settle_after = *option::borrow(&offer.settle_after_ms);
        assert!(now_ms >= settle_after, EOfferNotReadyToSettle);

        let total = balance::value(&offer.escrow_payments);
        let fee = total * offer.platform_fee_bps / 10_000;
        let fee_balance = balance::split(&mut offer.escrow_payments, fee);
        vault::deposit_fees(vault_obj, fee_balance);

        let payout_balance = balance::withdraw_all(&mut offer.escrow_payments);
        let payout_coin = coin::from_balance(payout_balance, ctx);

        let stake_balance = balance::withdraw_all(&mut offer.stake_locked);
        let stake_value = balance::value(&stake_balance);
        let stake_coin = coin::from_balance(stake_balance, ctx);

        offer.status = STATUS_SETTLED;
        if (emit_events) {
            event::emit(OfferSettled {
                offer_id: object::id(offer),
                payout: total - fee,
                fee,
                stake_returned: stake_value,
            });
        };

        (payout_coin, stake_coin)
    }
}
