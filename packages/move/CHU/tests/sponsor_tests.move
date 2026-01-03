#[test_only]
module chu::sponsor_tests {
    use chu::member;
    use chu::offer;
    use chu::seat_nft;
    use chu::sponsor;
    use chu::vault;
    use sui::coin;
    use sui::sui::SUI;
    use sui::test_scenario;

    const DAY_MS: u64 = 86_400_000;
    const THREE_DAYS_MS: u64 = 259_200_000;

    // Build a short sample order hash for tests.
    fun sample_order_hash(): vector<u8> {
        let mut hash = vector::empty<u8>();
        vector::push_back(&mut hash, 1);
        vector::push_back(&mut hash, 2);
        hash
    }

    // End-to-end settlement flow test.
    #[test]
    fun test_offer_settlement_flow() {
        let mut scenario = test_scenario::begin(@0xA);
        let ctx = test_scenario::ctx(&mut scenario);
        let mut gas = coin::mint_for_testing<SUI>(50_000, ctx);
        let stake = coin::split(&mut gas, 10_000, ctx);
        let mut badge = sponsor::stake_sponsor_for_testing(stake, 1, ctx);

        let mut offer = offer::create_offer_for_testing(
            &mut badge,
            sample_order_hash(),
            2,
            1_000,
            500,
            5_000,
            1,
            ctx,
        );

        test_scenario::next_tx(&mut scenario, @0xB);
        let ctx = test_scenario::ctx(&mut scenario);
        let payment_one = coin::split(&mut gas, 1_000, ctx);
        let seat_one = member::join_offer_for_testing(&mut offer, payment_one, 2, ctx);

        test_scenario::next_tx(&mut scenario, @0xC);
        let ctx = test_scenario::ctx(&mut scenario);
        let payment_two = coin::split(&mut gas, 1_000, ctx);
        let seat_two = member::join_offer_for_testing(&mut offer, payment_two, 2, ctx);

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

        assert!(coin::value(&payout) == 1_900, 0);
        assert!(coin::value(&stake_return) == 5_000, 1);

        let sender = test_scenario::sender(&scenario);
        transfer::public_transfer(gas, sender);
        transfer::public_transfer(offer, sender);
        transfer::public_transfer(badge, sender);
        transfer::public_transfer(vault_obj, sender);
        transfer::public_transfer(cap, sender);
        transfer::public_transfer(payout, sender);
        transfer::public_transfer(stake_return, sender);
        transfer::public_transfer(seat_one, sender);
        transfer::public_transfer(seat_two, sender);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_offer_create_has_no_escrow() {
        let mut scenario = test_scenario::begin(@0xA);
        let ctx = test_scenario::ctx(&mut scenario);
        let mut gas = coin::mint_for_testing<SUI>(10_000, ctx);
        let stake = coin::split(&mut gas, 2_000, ctx);
        let mut badge = sponsor::stake_sponsor_for_testing(stake, 1, ctx);

        let offer = offer::create_offer_for_testing(
            &mut badge,
            sample_order_hash(),
            1,
            1_000,
            0,
            1_000,
            1,
            ctx,
        );

        assert!(offer::escrow_value(&offer) == 0, 0);

        let sender = test_scenario::sender(&scenario);
        transfer::public_transfer(gas, sender);
        transfer::public_transfer(offer, sender);
        transfer::public_transfer(badge, sender);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_join_locks_into_escrow() {
        let mut scenario = test_scenario::begin(@0xA);
        let ctx = test_scenario::ctx(&mut scenario);
        let mut gas = coin::mint_for_testing<SUI>(10_000, ctx);
        let stake = coin::split(&mut gas, 2_000, ctx);
        let mut badge = sponsor::stake_sponsor_for_testing(stake, 1, ctx);

        let mut offer = offer::create_offer_for_testing(
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
        let seat_one = member::join_offer_for_testing(&mut offer, payment_one, 2, ctx);

        assert!(offer::escrow_value(&offer) == 1_000, 0);

        let sender = test_scenario::sender(&scenario);
        transfer::public_transfer(gas, sender);
        transfer::public_transfer(offer, sender);
        transfer::public_transfer(badge, sender);
        transfer::public_transfer(seat_one, sender);
        test_scenario::end(scenario);
    }

    // Slash and claim flow test.
    #[test]
    fun test_slash_and_claim_flow() {
        let mut scenario = test_scenario::begin(@0xA);
        let ctx = test_scenario::ctx(&mut scenario);
        let mut gas = coin::mint_for_testing<SUI>(50_000, ctx);
        let stake = coin::split(&mut gas, 8_000, ctx);
        let mut badge = sponsor::stake_sponsor_for_testing(stake, 1, ctx);

        let mut offer = offer::create_offer_for_testing(
            &mut badge,
            sample_order_hash(),
            2,
            1_000,
            0,
            4_000,
            1,
            ctx,
        );

        test_scenario::next_tx(&mut scenario, @0xB);
        let ctx = test_scenario::ctx(&mut scenario);
        let payment_one = coin::split(&mut gas, 1_000, ctx);
        let seat_one = member::join_offer_for_testing(&mut offer, payment_one, 2, ctx);

        test_scenario::next_tx(&mut scenario, @0xC);
        let ctx = test_scenario::ctx(&mut scenario);
        let payment_two = coin::split(&mut gas, 1_000, ctx);
        let seat_two = member::join_offer_for_testing(&mut offer, payment_two, 2, ctx);

        test_scenario::next_tx(&mut scenario, @0xA);
        let ctx = test_scenario::ctx(&mut scenario);

        let slash_time = 2 + DAY_MS + 1;
        let (mut pool, mut claims) = offer::slash_offer_for_testing(&mut offer, slash_time, ctx);

        test_scenario::next_tx(&mut scenario, @0xC);
        let ctx = test_scenario::ctx(&mut scenario);
        let mut claim = vector::pop_back(&mut claims);
        let payout = offer::claim_slash_for_testing(&mut pool, &mut claim, ctx);

        assert!(coin::value(&payout) == 2_000, 2);

        let sender = test_scenario::sender(&scenario);
        transfer::public_transfer(gas, sender);
        transfer::public_transfer(offer, sender);
        transfer::public_transfer(badge, sender);
        transfer::public_transfer(pool, sender);
        transfer::public_transfer(claim, sender);
        transfer::public_transfer(payout, sender);
        transfer::public_transfer(seat_one, sender);
        transfer::public_transfer(seat_two, sender);
        while (!vector::is_empty(&claims)) {
            let leftover = vector::pop_back(&mut claims);
            transfer::public_transfer(leftover, sender);
        };
        vector::destroy_empty(claims);
        test_scenario::end(scenario);
    }

    #[test, expected_failure(abort_code = ::chu::member::EAlreadyMember)]
    fun test_duplicate_member_rejected() {
        let mut scenario = test_scenario::begin(@0xA);
        let ctx = test_scenario::ctx(&mut scenario);
        let mut gas = coin::mint_for_testing<SUI>(10_000, ctx);
        let stake = coin::split(&mut gas, 2_000, ctx);
        let mut badge = sponsor::stake_sponsor_for_testing(stake, 1, ctx);

        let mut offer = offer::create_offer_for_testing(
            &mut badge,
            sample_order_hash(),
            2,
            1_000,
            0,
            1_000,
            1,
            ctx,
        );

        let payment_one = coin::split(&mut gas, 1_000, ctx);
        let seat_one = member::join_offer_for_testing(&mut offer, payment_one, 2, ctx);
        let payment_two = coin::split(&mut gas, 1_000, ctx);
        let seat_two = member::join_offer_for_testing(&mut offer, payment_two, 3, ctx);

        let sender = test_scenario::sender(&scenario);
        transfer::public_transfer(gas, sender);
        transfer::public_transfer(offer, sender);
        transfer::public_transfer(badge, sender);
        transfer::public_transfer(seat_one, sender);
        transfer::public_transfer(seat_two, sender);
        test_scenario::end(scenario);
    }

    #[test, expected_failure(abort_code = 8, location = ::chu::offer)]
    fun test_wrong_price_rejected() {
        let mut scenario = test_scenario::begin(@0xA);
        let ctx = test_scenario::ctx(&mut scenario);
        let mut gas = coin::mint_for_testing<SUI>(10_000, ctx);
        let stake = coin::split(&mut gas, 2_000, ctx);
        let mut badge = sponsor::stake_sponsor_for_testing(stake, 1, ctx);

        let mut offer = offer::create_offer_for_testing(
            &mut badge,
            sample_order_hash(),
            1,
            1_000,
            0,
            1_000,
            1,
            ctx,
        );

        let wrong_payment = coin::split(&mut gas, 900, ctx);
        let seat = member::join_offer_for_testing(&mut offer, wrong_payment, 2, ctx);

        let sender = test_scenario::sender(&scenario);
        transfer::public_transfer(gas, sender);
        transfer::public_transfer(offer, sender);
        transfer::public_transfer(badge, sender);
        transfer::public_transfer(seat, sender);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_refund_before_full() {
        let mut scenario = test_scenario::begin(@0xA);
        let ctx = test_scenario::ctx(&mut scenario);
        let mut gas = coin::mint_for_testing<SUI>(10_000, ctx);
        let stake = coin::split(&mut gas, 2_000, ctx);
        let mut badge = sponsor::stake_sponsor_for_testing(stake, 1, ctx);

        let mut offer = offer::create_offer_for_testing(
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
        let seat_one = member::join_offer_for_testing(&mut offer, payment_one, 2, ctx);
        let refund = member::refund_seat_for_testing(&mut offer, seat_one, 3, ctx);

        assert!(coin::value(&refund) == 1_000, 0);
        assert!(offer::seats_sold(&offer) == 0, 1);
        assert!(!offer::is_member(&offer, @0xB), 2);
        assert!(offer::escrow_value(&offer) == 0, 3);

        let sender = test_scenario::sender(&scenario);
        transfer::public_transfer(gas, sender);
        transfer::public_transfer(offer, sender);
        transfer::public_transfer(badge, sender);
        transfer::public_transfer(refund, sender);
        test_scenario::end(scenario);
    }

    #[test, expected_failure(abort_code = ::chu::offer::EOfferNotOpenForRefund)]
    fun test_refund_after_full_rejected() {
        let mut scenario = test_scenario::begin(@0xA);
        let ctx = test_scenario::ctx(&mut scenario);
        let mut gas = coin::mint_for_testing<SUI>(10_000, ctx);
        let stake = coin::split(&mut gas, 2_000, ctx);
        let mut badge = sponsor::stake_sponsor_for_testing(stake, 1, ctx);

        let mut offer = offer::create_offer_for_testing(
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
        let seat_one = member::join_offer_for_testing(&mut offer, payment_one, 2, ctx);
        let refund = member::refund_seat_for_testing(&mut offer, seat_one, 3, ctx);

        let sender = test_scenario::sender(&scenario);
        transfer::public_transfer(gas, sender);
        transfer::public_transfer(offer, sender);
        transfer::public_transfer(badge, sender);
        transfer::public_transfer(refund, sender);
        test_scenario::end(scenario);
    }

    #[test, expected_failure(abort_code = ::chu::offer::ESeatOwnerMismatch)]
    fun test_refund_wrong_owner_rejected() {
        let mut scenario = test_scenario::begin(@0xA);
        let ctx = test_scenario::ctx(&mut scenario);
        let mut gas = coin::mint_for_testing<SUI>(10_000, ctx);
        let stake = coin::split(&mut gas, 2_000, ctx);
        let mut badge = sponsor::stake_sponsor_for_testing(stake, 1, ctx);

        let mut offer = offer::create_offer_for_testing(
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
        let mut seat_one = member::join_offer_for_testing(&mut offer, payment_one, 2, ctx);
        seat_nft::set_owner_for_testing(&mut seat_one, @0xC);
        let refund = member::refund_seat_for_testing(&mut offer, seat_one, 3, ctx);

        let sender = test_scenario::sender(&scenario);
        transfer::public_transfer(gas, sender);
        transfer::public_transfer(offer, sender);
        transfer::public_transfer(badge, sender);
        transfer::public_transfer(refund, sender);
        test_scenario::end(scenario);
    }

    #[test, expected_failure(abort_code = ::chu::offer::EOfferNotSettled)]
    fun test_access_proof_rejects_before_settled() {
        let mut scenario = test_scenario::begin(@0xA);
        let ctx = test_scenario::ctx(&mut scenario);
        let mut gas = coin::mint_for_testing<SUI>(10_000, ctx);
        let stake = coin::split(&mut gas, 2_000, ctx);
        let mut badge = sponsor::stake_sponsor_for_testing(stake, 1, ctx);

        let mut offer = offer::create_offer_for_testing(
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
        let seat_one = member::join_offer_for_testing(&mut offer, payment_one, 2, ctx);
        offer::prove_access_for_testing(&offer, &seat_one, 3, ctx);

        let sender = test_scenario::sender(&scenario);
        transfer::public_transfer(gas, sender);
        transfer::public_transfer(offer, sender);
        transfer::public_transfer(badge, sender);
        transfer::public_transfer(seat_one, sender);
        test_scenario::end(scenario);
    }

    #[test]
    fun test_access_proof_after_settled() {
        let mut scenario = test_scenario::begin(@0xA);
        let ctx = test_scenario::ctx(&mut scenario);
        let mut gas = coin::mint_for_testing<SUI>(50_000, ctx);
        let stake = coin::split(&mut gas, 10_000, ctx);
        let mut badge = sponsor::stake_sponsor_for_testing(stake, 1, ctx);

        let mut offer = offer::create_offer_for_testing(
            &mut badge,
            sample_order_hash(),
            1,
            1_000,
            500,
            5_000,
            1,
            ctx,
        );

        test_scenario::next_tx(&mut scenario, @0xB);
        let ctx = test_scenario::ctx(&mut scenario);
        let payment_one = coin::split(&mut gas, 1_000, ctx);
        let seat_one = member::join_offer_for_testing(&mut offer, payment_one, 2, ctx);

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

        test_scenario::next_tx(&mut scenario, @0xB);
        let ctx = test_scenario::ctx(&mut scenario);
        offer::prove_access_for_testing(&offer, &seat_one, settle_time + 1, ctx);

        let sender = test_scenario::sender(&scenario);
        transfer::public_transfer(gas, sender);
        transfer::public_transfer(offer, sender);
        transfer::public_transfer(badge, sender);
        transfer::public_transfer(vault_obj, sender);
        transfer::public_transfer(cap, sender);
        transfer::public_transfer(payout, sender);
        transfer::public_transfer(stake_return, sender);
        transfer::public_transfer(seat_one, sender);
        test_scenario::end(scenario);
    }

    #[test, expected_failure(abort_code = ::chu::offer::EOfferNotOpenForRefund)]
    fun test_refund_after_settled_rejected() {
        let mut scenario = test_scenario::begin(@0xA);
        let ctx = test_scenario::ctx(&mut scenario);
        let mut gas = coin::mint_for_testing<SUI>(50_000, ctx);
        let stake = coin::split(&mut gas, 10_000, ctx);
        let mut badge = sponsor::stake_sponsor_for_testing(stake, 1, ctx);

        let mut offer = offer::create_offer_for_testing(
            &mut badge,
            sample_order_hash(),
            1,
            1_000,
            500,
            5_000,
            1,
            ctx,
        );

        test_scenario::next_tx(&mut scenario, @0xB);
        let ctx = test_scenario::ctx(&mut scenario);
        let payment_one = coin::split(&mut gas, 1_000, ctx);
        let seat_one = member::join_offer_for_testing(&mut offer, payment_one, 2, ctx);

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

        test_scenario::next_tx(&mut scenario, @0xB);
        let sender = test_scenario::sender(&scenario);
        let ctx = test_scenario::ctx(&mut scenario);
        transfer::public_transfer(payout, sender);
        transfer::public_transfer(stake_return, sender);
        let refund = member::refund_seat_for_testing(&mut offer, seat_one, settle_time + 1, ctx);

        transfer::public_transfer(gas, sender);
        transfer::public_transfer(offer, sender);
        transfer::public_transfer(badge, sender);
        transfer::public_transfer(vault_obj, sender);
        transfer::public_transfer(cap, sender);
        transfer::public_transfer(refund, sender);
        test_scenario::end(scenario);
    }
}
