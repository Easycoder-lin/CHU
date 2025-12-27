module chu::vault {
    use sui::balance;
    use sui::coin;
    use sui::event;
    use sui::sui::SUI;

    const EInsufficientFees: u64 = 0;

    public struct AdminCap has key, store {
        id: object::UID,
    }

    public struct PlatformVault has key, store {
        id: object::UID,
        fees: balance::Balance<SUI>,
    }

    public struct VaultInitialized has copy, drop, store {
        vault_id: object::ID,
        admin: address,
    }

    public struct FeesWithdrawn has copy, drop, store {
        vault_id: object::ID,
        admin: address,
        amount: u64,
    }

    // Initialize a vault and admin cap for the transaction sender.
    public fun init_vault(ctx: &mut tx_context::TxContext): (PlatformVault, AdminCap) {
        let admin = tx_context::sender(ctx);
        init_vault_with_admin(admin, ctx, true)
    }

    // Entry wrapper to initialize the platform vault on-chain.
    public fun init_vault_entry(
        ctx: &mut tx_context::TxContext,
    ): (PlatformVault, AdminCap) {
        init_vault(ctx)
    }

    // Test helper to initialize a vault and cap for the sender.
    #[test_only]
    public fun init_vault_for_testing(
        ctx: &mut tx_context::TxContext,
    ): (PlatformVault, AdminCap) {
        let admin = tx_context::sender(ctx);
        init_vault_with_admin(admin, ctx, false)
    }

    // Internal helper to initialize a vault for a specific admin.
    fun init_vault_with_admin(
        admin: address,
        ctx: &mut tx_context::TxContext,
        emit_events: bool,
    ): (PlatformVault, AdminCap) {
        let vault = PlatformVault {
            id: object::new(ctx),
            fees: balance::zero<SUI>(),
        };
        let cap = AdminCap { id: object::new(ctx) };
        if (emit_events) {
            event::emit(VaultInitialized {
                vault_id: object::id(&vault),
                admin,
            });
        };
        (vault, cap)
    }

    // Deposit fees into the platform vault.
    public fun deposit_fees(vault: &mut PlatformVault, fees: balance::Balance<SUI>) {
        balance::join(&mut vault.fees, fees);
    }

    // Withdraw fees to the caller using the admin cap.
    public fun withdraw_fees(
        vault: &mut PlatformVault,
        _cap: &AdminCap,
        amount: u64,
        ctx: &mut tx_context::TxContext,
    ): coin::Coin<SUI> {
        withdraw_fees_with_sender(vault, _cap, amount, ctx, true)
    }

    // Entry wrapper to withdraw fees from the vault.
    public fun withdraw_fees_entry(
        vault: &mut PlatformVault,
        cap: &AdminCap,
        amount: u64,
        ctx: &mut tx_context::TxContext,
    ): coin::Coin<SUI> {
        withdraw_fees(vault, cap, amount, ctx)
    }

    // Test helper to withdraw fees and return the coin.
    #[test_only]
    public fun withdraw_fees_for_testing(
        vault: &mut PlatformVault,
        cap: &AdminCap,
        amount: u64,
        ctx: &mut tx_context::TxContext,
    ): coin::Coin<SUI> {
        withdraw_fees_with_sender(vault, cap, amount, ctx, false)
    }

    // Internal helper to withdraw fees for the current sender.
    fun withdraw_fees_with_sender(
        vault: &mut PlatformVault,
        _cap: &AdminCap,
        amount: u64,
        ctx: &mut tx_context::TxContext,
        emit_events: bool,
    ): coin::Coin<SUI> {
        let available = balance::value(&vault.fees);
        assert!(amount <= available, EInsufficientFees);
        let payout = balance::split(&mut vault.fees, amount);
        let admin = tx_context::sender(ctx);
        if (emit_events) {
            event::emit(FeesWithdrawn {
                vault_id: object::id(vault),
                admin,
                amount,
            });
        };
        coin::from_balance(payout, ctx)
    }
}
