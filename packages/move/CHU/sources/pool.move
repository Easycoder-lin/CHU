module chu::pool {
    use chu::member;
    use chu::offer;
    use chu::seat_nft;
    use chu::sponsor;
    use sui::address;
    use sui::clock;
    use sui::coin;
    use sui::event;
    use sui::hash;
    use sui::sui::SUI;
    use sui::table;

    const STATUS_OPEN: u8 = 0;
    const STATUS_FULL: u8 = 1;

    const EPoolNotOpen: u64 = 0;
    const ESeatCapReached: u64 = 1;
    const EOfferMismatch: u64 = 2;
    const ESeatCapMismatch: u64 = 3;
    const EAlreadyRegistered: u64 = 4;
    const EMemberNotFound: u64 = 5;

    public struct Pool has key, store {
        id: object::UID,
        offer_id: object::ID,
        order_hash: vector<u8>,
        seat_cap: u64,
        seats_sold: u64,
        status: u8,
        created_at_ms: u64,
        members: vector<address>,
    }

    public struct PoolRegistry has key, store {
        id: object::UID,
        pools: table::Table<address, object::ID>,
    }

    public struct PoolCreated has copy, drop, store {
        pool_id: object::ID,
        offer_id: object::ID,
        sponsor: address,
        order_hash: vector<u8>,
        seat_cap: u64,
        created_at_ms: u64,
    }

    public struct PoolJoined has copy, drop, store {
        pool_id: object::ID,
        offer_id: object::ID,
        member: address,
        seats_sold: u64,
        seat_cap: u64,
    }

    public struct PoolFilled has copy, drop, store {
        pool_id: object::ID,
        offer_id: object::ID,
        order_hash: vector<u8>,
        full_at_ms: u64,
    }

    public struct PoolRegistered has copy, drop, store {
        registry_id: object::ID,
        pool_id: object::ID,
        order_hash: vector<u8>,
    }

    public struct RegistryInitialized has copy, drop, store {
        registry_id: object::ID,
        admin: address,
    }

    public fun create_pool_for_offer(
        badge: &mut sponsor::SponsorBadge,
        order_hash: vector<u8>,
        seat_cap: u64,
        price_per_seat: u64,
        platform_fee_bps: u64,
        stake_to_lock: u64,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext,
    ): (offer::Offer, Pool) {
        let now_ms = clock::timestamp_ms(clock);
        let order_hash_for_offer = copy_u8_vector(&order_hash);
        let offer = offer::create_offer(
            badge,
            order_hash_for_offer,
            seat_cap,
            price_per_seat,
            platform_fee_bps,
            stake_to_lock,
            clock,
            ctx,
        );
        let sponsor_addr = tx_context::sender(ctx);
        let pool = create_pool_object(
            &offer,
            sponsor_addr,
            order_hash,
            seat_cap,
            now_ms,
            ctx,
            true,
        );
        (offer, pool)
    }

    // Entry wrapper to create a pool + offer on-chain.
    public fun create_pool_for_offer_entry(
        badge: &mut sponsor::SponsorBadge,
        order_hash: vector<u8>,
        seat_cap: u64,
        price_per_seat: u64,
        platform_fee_bps: u64,
        stake_to_lock: u64,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext,
    ): (offer::Offer, Pool) {
        create_pool_for_offer(
            badge,
            order_hash,
            seat_cap,
            price_per_seat,
            platform_fee_bps,
            stake_to_lock,
            clock,
            ctx,
        )
    }

    #[test_only]
    public fun create_pool_for_offer_for_testing(
        badge: &mut sponsor::SponsorBadge,
        order_hash: vector<u8>,
        seat_cap: u64,
        price_per_seat: u64,
        platform_fee_bps: u64,
        stake_to_lock: u64,
        now_ms: u64,
        ctx: &mut tx_context::TxContext,
    ): (offer::Offer, Pool) {
        let order_hash_for_offer = copy_u8_vector(&order_hash);
        let offer = offer::create_offer_for_testing(
            badge,
            order_hash_for_offer,
            seat_cap,
            price_per_seat,
            platform_fee_bps,
            stake_to_lock,
            now_ms,
            ctx,
        );
        let sponsor_addr = tx_context::sender(ctx);
        let pool = create_pool_object(
            &offer,
            sponsor_addr,
            order_hash,
            seat_cap,
            now_ms,
            ctx,
            false,
        );
        (offer, pool)
    }

    public fun join_pool(
        pool: &mut Pool,
        offer: &mut offer::Offer,
        payment: coin::Coin<SUI>,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext,
    ): seat_nft::SeatNFT {
        let now_ms = clock::timestamp_ms(clock);
        assert!(pool.offer_id == object::id(offer), EOfferMismatch);
        assert!(pool.status == STATUS_OPEN, EPoolNotOpen);
        assert!(pool.seats_sold < pool.seat_cap, ESeatCapReached);
        assert!(offer::seat_cap(offer) == pool.seat_cap, ESeatCapMismatch);

        let member = tx_context::sender(ctx);
        let seat = member::join_offer(offer, payment, clock, ctx);

        vector::push_back(&mut pool.members, member);
        pool.seats_sold = offer::seats_sold(offer);

        event::emit(PoolJoined {
            pool_id: object::id(pool),
            offer_id: pool.offer_id,
            member,
            seats_sold: pool.seats_sold,
            seat_cap: pool.seat_cap,
        });

        if (pool.seats_sold == pool.seat_cap) {
            pool.status = STATUS_FULL;
            let order_hash_for_event = copy_u8_vector(&pool.order_hash);
            event::emit(PoolFilled {
                pool_id: object::id(pool),
                offer_id: pool.offer_id,
                order_hash: order_hash_for_event,
                full_at_ms: now_ms,
            });
        };

        seat
    }

    public fun refund_seat(
        pool: &mut Pool,
        offer: &mut offer::Offer,
        seat: seat_nft::SeatNFT,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext,
    ): coin::Coin<SUI> {
        assert!(pool.offer_id == object::id(offer), EOfferMismatch);
        assert!(pool.status == STATUS_OPEN, EPoolNotOpen);
        let refund = offer::refund_seat(offer, seat, clock, ctx);
        let member = tx_context::sender(ctx);
        assert!(remove_member(pool, member), EMemberNotFound);
        pool.seats_sold = offer::seats_sold(offer);
        pool.status = STATUS_OPEN;
        refund
    }

    // Entry wrapper to refund a seat in a pool on-chain.
    public fun refund_seat_entry(
        pool: &mut Pool,
        offer: &mut offer::Offer,
        seat: seat_nft::SeatNFT,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext,
    ): coin::Coin<SUI> {
        refund_seat(pool, offer, seat, clock, ctx)
    }

    #[test_only]
    public fun refund_seat_for_testing(
        pool: &mut Pool,
        offer: &mut offer::Offer,
        seat: seat_nft::SeatNFT,
        now_ms: u64,
        ctx: &mut tx_context::TxContext,
    ): coin::Coin<SUI> {
        assert!(pool.offer_id == object::id(offer), EOfferMismatch);
        assert!(pool.status == STATUS_OPEN, EPoolNotOpen);
        let refund = offer::refund_seat_for_testing(offer, seat, now_ms, ctx);
        let member = tx_context::sender(ctx);
        assert!(remove_member(pool, member), EMemberNotFound);
        pool.seats_sold = offer::seats_sold(offer);
        pool.status = STATUS_OPEN;
        refund
    }

    // Entry wrapper to join a pool on-chain.
    public fun join_pool_entry(
        pool: &mut Pool,
        offer: &mut offer::Offer,
        payment: coin::Coin<SUI>,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext,
    ): seat_nft::SeatNFT {
        join_pool(pool, offer, payment, clock, ctx)
    }

    #[test_only]
    public fun join_pool_for_testing(
        pool: &mut Pool,
        offer: &mut offer::Offer,
        payment: coin::Coin<SUI>,
        now_ms: u64,
        ctx: &mut tx_context::TxContext,
    ): seat_nft::SeatNFT {
        assert!(pool.offer_id == object::id(offer), EOfferMismatch);
        assert!(pool.status == STATUS_OPEN, EPoolNotOpen);
        assert!(pool.seats_sold < pool.seat_cap, ESeatCapReached);
        assert!(offer::seat_cap(offer) == pool.seat_cap, ESeatCapMismatch);

        let member = tx_context::sender(ctx);
        let seat = member::join_offer_for_testing(offer, payment, now_ms, ctx);

        vector::push_back(&mut pool.members, member);
        pool.seats_sold = offer::seats_sold(offer);

        if (pool.seats_sold == pool.seat_cap) {
            pool.status = STATUS_FULL;
        };

        seat
    }

    fun create_pool_object(
        offer: &offer::Offer,
        sponsor_addr: address,
        order_hash: vector<u8>,
        seat_cap: u64,
        now_ms: u64,
        ctx: &mut tx_context::TxContext,
        emit_events: bool,
    ): Pool {
        let pool = Pool {
            id: object::new(ctx),
            offer_id: object::id(offer),
            order_hash,
            seat_cap,
            seats_sold: 0,
            status: STATUS_OPEN,
            created_at_ms: now_ms,
            members: vector::empty<address>(),
        };
        if (emit_events) {
            let order_hash_for_event = copy_u8_vector(&pool.order_hash);
            event::emit(PoolCreated {
                pool_id: object::id(&pool),
                offer_id: pool.offer_id,
                sponsor: sponsor_addr,
                order_hash: order_hash_for_event,
                seat_cap,
                created_at_ms: now_ms,
            });
        };
        pool
    }

    public fun init_registry(ctx: &mut tx_context::TxContext): PoolRegistry {
        init_registry_with_event(ctx, true)
    }

    // Entry wrapper to initialize a pool registry on-chain.
    public fun init_registry_entry(
        ctx: &mut tx_context::TxContext,
    ): PoolRegistry {
        init_registry(ctx)
    }

    #[test_only]
    public fun init_registry_for_testing(ctx: &mut tx_context::TxContext): PoolRegistry {
        init_registry_with_event(ctx, false)
    }

    public fun register_pool(registry: &mut PoolRegistry, pool: &Pool) {
        register_pool_with_event(registry, pool, true)
    }

    // Entry wrapper to register a pool on-chain.
    public fun register_pool_entry(
        registry: &mut PoolRegistry,
        pool: &Pool,
    ) {
        register_pool(registry, pool)
    }

    #[test_only]
    public fun register_pool_for_testing(registry: &mut PoolRegistry, pool: &Pool) {
        register_pool_with_event(registry, pool, false)
    }

    fun init_registry_with_event(
        ctx: &mut tx_context::TxContext,
        emit_events: bool,
    ): PoolRegistry {
        let registry = PoolRegistry {
            id: object::new(ctx),
            pools: table::new<address, object::ID>(ctx),
        };
        if (emit_events) {
            let admin = tx_context::sender(ctx);
            event::emit(RegistryInitialized {
                registry_id: object::id(&registry),
                admin,
            });
        };
        registry
    }

    fun register_pool_with_event(
        registry: &mut PoolRegistry,
        pool: &Pool,
        emit_events: bool,
    ) {
        let key = order_hash_key(&pool.order_hash);
        assert!(!table::contains(&registry.pools, key), EAlreadyRegistered);
        table::add(&mut registry.pools, key, object::id(pool));
        if (emit_events) {
            let order_hash_event = copy_u8_vector(&pool.order_hash);
            event::emit(PoolRegistered {
                registry_id: object::id(registry),
                pool_id: object::id(pool),
                order_hash: order_hash_event,
            });
        };
    }

    public fun get_pool_id(
        registry: &PoolRegistry,
        order_hash: &vector<u8>,
    ): option::Option<object::ID> {
        let key = order_hash_key(order_hash);
        if (table::contains(&registry.pools, key)) {
            option::some(*table::borrow(&registry.pools, key))
        } else {
            option::none<object::ID>()
        }
    }

    public fun seat_cap(pool: &Pool): u64 {
        pool.seat_cap
    }

    public fun seats_sold(pool: &Pool): u64 {
        pool.seats_sold
    }

    public fun is_full(pool: &Pool): bool {
        pool.status == STATUS_FULL
    }

    fun remove_member(pool: &mut Pool, member: address): bool {
        let len = vector::length(&pool.members);
        let mut i = 0;
        while (i < len) {
            if (*vector::borrow(&pool.members, i) == member) {
                if (len == 1) {
                    vector::pop_back(&mut pool.members);
                } else {
                    let last = vector::pop_back(&mut pool.members);
                    if (i < len - 1) {
                        *vector::borrow_mut(&mut pool.members, i) = last;
                    };
                };
                return true
            };
            i = i + 1;
        };
        false
    }

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

    fun order_hash_key(order_hash: &vector<u8>): address {
        address::from_bytes(hash::blake2b256(order_hash))
    }
}
