#[test_only]
module chu::pool_tests {
    use chu::offer;
    use chu::pool;
    use chu::sponsor;
    use chu::vault;
    use sui::coin;
    use sui::sui::SUI;
    use sui::test_scenario;

    const THREE_DAYS_MS: u64 = 259_200_000;

    fun sample_order_hash(): vector<u8> {
        let mut hash = vector::empty<u8>();
        vector::push_back(&mut hash, 1);
        vector::push_back(&mut hash, 2);
        hash
    }

    #[test]
    fun test_pool_join_and_registry() {
        let mut scenario = test_scenario::begin(@0xA);
        let ctx = test_scenario::ctx(&mut scenario);
        let mut gas = coin::mint_for_testing<SUI>(50_000, ctx);
        let stake = coin::split(&mut gas, 10_000, ctx);
        let mut badge = sponsor::stake_sponsor_for_testing(stake, 1, ctx);

        let (mut offer, mut pool_obj) = pool::create_pool_for_offer_for_testing(
            &mut badge,
            sample_order_hash(),
            2,
            1_000,
            500,
            5_000,
            1,
            ctx,
        );

        let mut registry = pool::init_registry_for_testing(ctx);
        pool::register_pool_for_testing(&mut registry, &pool_obj);
        let lookup = pool::get_pool_id(&registry, &sample_order_hash());
        assert!(option::is_some(&lookup), 0);
        let pool_id = *option::borrow(&lookup);
        assert!(pool_id == object::id(&pool_obj), 1);

        test_scenario::next_tx(&mut scenario, @0xB);
        let ctx = test_scenario::ctx(&mut scenario);
        let payment_one = coin::split(&mut gas, 1_000, ctx);
        let seat_one =
            pool::join_pool_for_testing(&mut pool_obj, &mut offer, payment_one, 2, ctx);

        test_scenario::next_tx(&mut scenario, @0xC);
        let ctx = test_scenario::ctx(&mut scenario);
        let payment_two = coin::split(&mut gas, 1_000, ctx);
        let seat_two =
            pool::join_pool_for_testing(&mut pool_obj, &mut offer, payment_two, 2, ctx);

        assert!(pool::seats_sold(&pool_obj) == pool::seat_cap(&pool_obj), 2);
        assert!(pool::is_full(&pool_obj), 3);

        test_scenario::next_tx(&mut scenario, @0xA);
        let ctx = test_scenario::ctx(&mut scenario);
        offer::submit_tee_receipt_for_testing(&mut offer, &badge, sample_order_hash(), 2);
        let (mut vault_obj, cap) = vault::init_vault_for_testing(ctx);
        let settle_time = 2 + THREE_DAYS_MS;
        let (payout, stake_return) = offer::settle_offer_for_testing(
            &mut offer,
            &badge,
            &mut vault_obj,
            settle_time,
            ctx,
        );

        let sender = test_scenario::sender(&scenario);
        transfer::public_transfer(gas, sender);
        transfer::public_transfer(offer, sender);
        transfer::public_transfer(pool_obj, sender);
        transfer::public_transfer(registry, sender);
        transfer::public_transfer(badge, sender);
        transfer::public_transfer(vault_obj, sender);
        transfer::public_transfer(cap, sender);
        transfer::public_transfer(payout, sender);
        transfer::public_transfer(stake_return, sender);
        transfer::public_transfer(seat_one, sender);
        transfer::public_transfer(seat_two, sender);
        test_scenario::end(scenario);
    }

    #[test, expected_failure(abort_code = ::chu::pool::EPoolNotOpen)]
    fun test_pool_full_rejects_join() {
        let mut scenario = test_scenario::begin(@0xA);
        let ctx = test_scenario::ctx(&mut scenario);
        let mut gas = coin::mint_for_testing<SUI>(10_000, ctx);
        let stake = coin::split(&mut gas, 2_000, ctx);
        let mut badge = sponsor::stake_sponsor_for_testing(stake, 1, ctx);

        let (mut offer, mut pool_obj) = pool::create_pool_for_offer_for_testing(
            &mut badge,
            sample_order_hash(),
            1,
            1_000,
            0,
            1_000,
            1,
            ctx,
        );

        let payment_one = coin::split(&mut gas, 1_000, ctx);
        let seat_one =
            pool::join_pool_for_testing(&mut pool_obj, &mut offer, payment_one, 2, ctx);

        test_scenario::next_tx(&mut scenario, @0xB);
        let ctx = test_scenario::ctx(&mut scenario);
        let payment_two = coin::split(&mut gas, 1_000, ctx);
        let seat_two =
            pool::join_pool_for_testing(&mut pool_obj, &mut offer, payment_two, 3, ctx);

        let sender = test_scenario::sender(&scenario);
        transfer::public_transfer(gas, sender);
        transfer::public_transfer(offer, sender);
        transfer::public_transfer(pool_obj, sender);
        transfer::public_transfer(badge, sender);
        transfer::public_transfer(seat_one, sender);
        transfer::public_transfer(seat_two, sender);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_pool_refund_before_full() {
        let mut scenario = test_scenario::begin(@0xA);
        let ctx = test_scenario::ctx(&mut scenario);
        let mut gas = coin::mint_for_testing<SUI>(10_000, ctx);
        let stake = coin::split(&mut gas, 2_000, ctx);
        let mut badge = sponsor::stake_sponsor_for_testing(stake, 1, ctx);

        let (mut offer, mut pool_obj) = pool::create_pool_for_offer_for_testing(
            &mut badge,
            sample_order_hash(),
            2,
            1_000,
            0,
            1_000,
            1,
            ctx,
        );

        test_scenario::next_tx(&mut scenario, @0xB);
        let ctx = test_scenario::ctx(&mut scenario);
        let payment_one = coin::split(&mut gas, 1_000, ctx);
        let seat_one =
            pool::join_pool_for_testing(&mut pool_obj, &mut offer, payment_one, 2, ctx);
        let refund = pool::refund_seat_for_testing(&mut pool_obj, &mut offer, seat_one, 3, ctx);

        assert!(coin::value(&refund) == 1_000, 0);
        assert!(pool::seats_sold(&pool_obj) == 0, 1);
        assert!(offer::seats_sold(&offer) == 0, 2);

        let sender = test_scenario::sender(&scenario);
        transfer::public_transfer(gas, sender);
        transfer::public_transfer(offer, sender);
        transfer::public_transfer(pool_obj, sender);
        transfer::public_transfer(badge, sender);
        transfer::public_transfer(refund, sender);
        test_scenario::end(scenario);
    }

    #[test, expected_failure(abort_code = ::chu::pool::EPoolNotOpen)]
    fun test_pool_refund_after_full_rejected() {
        let mut scenario = test_scenario::begin(@0xA);
        let ctx = test_scenario::ctx(&mut scenario);
        let mut gas = coin::mint_for_testing<SUI>(10_000, ctx);
        let stake = coin::split(&mut gas, 2_000, ctx);
        let mut badge = sponsor::stake_sponsor_for_testing(stake, 1, ctx);

        let (mut offer, mut pool_obj) = pool::create_pool_for_offer_for_testing(
            &mut badge,
            sample_order_hash(),
            1,
            1_000,
            0,
            1_000,
            1,
            ctx,
        );

        test_scenario::next_tx(&mut scenario, @0xB);
        let ctx = test_scenario::ctx(&mut scenario);
        let payment_one = coin::split(&mut gas, 1_000, ctx);
        let seat_one =
            pool::join_pool_for_testing(&mut pool_obj, &mut offer, payment_one, 2, ctx);
        let refund = pool::refund_seat_for_testing(&mut pool_obj, &mut offer, seat_one, 3, ctx);

        let sender = test_scenario::sender(&scenario);
        transfer::public_transfer(gas, sender);
        transfer::public_transfer(offer, sender);
        transfer::public_transfer(pool_obj, sender);
        transfer::public_transfer(badge, sender);
        transfer::public_transfer(refund, sender);
        test_scenario::end(scenario);
    }
}
