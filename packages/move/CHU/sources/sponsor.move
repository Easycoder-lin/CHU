module chu::sponsor {
    use sui::balance;
    use sui::coin;
    use sui::clock;
    use sui::event;
    use sui::sui::SUI;

    public struct SponsorBadge has key, store {
        id: object::UID,
        sponsor: address,
        staked: balance::Balance<SUI>,
        created_at_ms: u64,
    }

    public struct SponsorStaked has copy, drop, store {
        sponsor: address,
        amount: u64,
        created_at_ms: u64,
    }

    public fun sponsor_address(badge: &SponsorBadge): address {
        badge.sponsor
    }

    public fun available_stake(badge: &SponsorBadge): u64 {
        balance::value(&badge.staked)
    }

    public fun lock_stake(badge: &mut SponsorBadge, amount: u64): balance::Balance<SUI> {
        balance::split(&mut badge.staked, amount)
    }

    // Stake SUI and mint a sponsor badge.
    public fun stake_sponsor(
        stake: coin::Coin<SUI>,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext,
    ): SponsorBadge {
        stake_sponsor_with_time(stake, clock::timestamp_ms(clock), ctx, true)
    }

    // Entry wrapper to stake and mint a sponsor badge on-chain.
    public fun stake_sponsor_entry(
        stake: coin::Coin<SUI>,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext,
    ): SponsorBadge {
        stake_sponsor(stake, clock, ctx)
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

}
