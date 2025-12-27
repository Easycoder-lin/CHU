module chu::member {
    use chu::offer;
    use chu::seat_nft;
    use sui::clock;
    use sui::coin;
    use sui::event;
    use sui::sui::SUI;

    const EAlreadyMember: u64 = 0;

    public struct MemberJoined has copy, drop, store {
        offer_id: object::ID,
        member: address,
        seats_sold: u64,
        seat_cap: u64,
    }

    public fun join_offer(
        offer: &mut offer::Offer,
        payment: coin::Coin<SUI>,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext,
    ): seat_nft::SeatNFT {
        let member = tx_context::sender(ctx);
        assert!(!offer::is_member(offer, member), EAlreadyMember);

        let seat = offer::join_offer(offer, payment, clock, ctx);
        emit_member_joined(offer, member, true);
        seat
    }

    // Entry wrapper to join an offer from on-chain transactions.
    public fun join_offer_entry(
        offer: &mut offer::Offer,
        payment: coin::Coin<SUI>,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext,
    ): seat_nft::SeatNFT {
        join_offer(offer, payment, clock, ctx)
    }

    #[test_only]
    public fun join_offer_for_testing(
        offer: &mut offer::Offer,
        payment: coin::Coin<SUI>,
        now_ms: u64,
        ctx: &mut tx_context::TxContext,
    ): seat_nft::SeatNFT {
        let member = tx_context::sender(ctx);
        assert!(!offer::is_member(offer, member), EAlreadyMember);

        let seat = offer::join_offer_for_testing(offer, payment, now_ms, ctx);
        emit_member_joined(offer, member, false);
        seat
    }

    fun emit_member_joined(offer: &offer::Offer, member: address, emit_events: bool) {
        if (emit_events) {
            event::emit(MemberJoined {
                offer_id: object::id(offer),
                member,
                seats_sold: offer::seats_sold(offer),
                seat_cap: offer::seat_cap(offer),
            });
        };
    }
}
