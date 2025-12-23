module chu::member {
    use chu::seat_nft;
    use chu::sponsor;
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
        offer: &mut sponsor::Offer,
        payment: coin::Coin<SUI>,
        clock: &clock::Clock,
        ctx: &mut tx_context::TxContext,
    ): seat_nft::SeatNFT {
        let member = tx_context::sender(ctx);
        assert!(!sponsor::is_member(offer, member), EAlreadyMember);

        let seat = sponsor::join_offer(offer, payment, clock, ctx);
        emit_member_joined(offer, member);
        seat
    }

    #[test_only]
    public fun join_offer_for_testing(
        offer: &mut sponsor::Offer,
        payment: coin::Coin<SUI>,
        now_ms: u64,
        ctx: &mut tx_context::TxContext,
    ): seat_nft::SeatNFT {
        let member = tx_context::sender(ctx);
        assert!(!sponsor::is_member(offer, member), EAlreadyMember);

        let seat = sponsor::join_offer_for_testing(offer, payment, now_ms, ctx);
        emit_member_joined(offer, member);
        seat
    }

    fun emit_member_joined(offer: &sponsor::Offer, member: address) {
        event::emit(MemberJoined {
            offer_id: object::id(offer),
            member,
            seats_sold: sponsor::seats_sold(offer),
            seat_cap: sponsor::seat_cap(offer),
        });
    }
}
