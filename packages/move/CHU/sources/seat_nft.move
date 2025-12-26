module chu::seat_nft {
    use sui::event;

    public struct SeatNFT has key, store {
        id: object::UID,
        offer_id: object::ID,
        owner: address,
        order_hash: vector<u8>,
    }

    public struct SeatMinted has copy, drop, store {
        offer_id: object::ID,
        owner: address,
        order_hash_len: u64,
    }

    // Mint a Seat NFT for the caller and emit a mint event.
    public fun mint(
        offer_id: object::ID,
        order_hash: vector<u8>,
        ctx: &mut tx_context::TxContext,
    ): SeatNFT {
        mint_with_event(offer_id, order_hash, ctx, true)
    }

    #[test_only]
    public fun mint_for_testing(
        offer_id: object::ID,
        order_hash: vector<u8>,
        ctx: &mut tx_context::TxContext,
    ): SeatNFT {
        mint_with_event(offer_id, order_hash, ctx, false)
    }

    fun mint_with_event(
        offer_id: object::ID,
        order_hash: vector<u8>,
        ctx: &mut tx_context::TxContext,
        emit_events: bool,
    ): SeatNFT {
        let owner = tx_context::sender(ctx);
        let order_hash_len = vector::length(&order_hash);
        let nft = SeatNFT {
            id: object::new(ctx),
            offer_id,
            owner,
            order_hash,
        };
        if (emit_events) {
            event::emit(SeatMinted {
                offer_id,
                owner,
                order_hash_len,
            });
        };
        nft
    }
}
