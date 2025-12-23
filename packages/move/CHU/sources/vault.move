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
        init_vault_with_admin(admin, ctx)
    }

    // Test helper to initialize a vault and cap for the sender.
    #[test_only]
    public fun init_vault_for_testing(
        ctx: &mut tx_context::TxContext,
    ): (PlatformVault, AdminCap) {
        let admin = tx_context::sender(ctx);
        init_vault_with_admin(admin, ctx)
    }

    // Internal helper to initialize a vault for a specific admin.
    fun init_vault_with_admin(
        admin: address,
        ctx: &mut tx_context::TxContext,
    ): (PlatformVault, AdminCap) {
        let vault = PlatformVault {
            id: object::new(ctx),
            fees: balance::zero<SUI>(),
        };
        let cap = AdminCap { id: object::new(ctx) };
        event::emit(VaultInitialized {
            vault_id: object::id(&vault),
            admin,
        });
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
        withdraw_fees_with_sender(vault, _cap, amount, ctx)
    }

    // Test helper to withdraw fees and return the coin.
    #[test_only]
    public fun withdraw_fees_for_testing(
        vault: &mut PlatformVault,
        cap: &AdminCap,
        amount: u64,
        ctx: &mut tx_context::TxContext,
    ): coin::Coin<SUI> {
        withdraw_fees_with_sender(vault, cap, amount, ctx)
    }

    // Internal helper to withdraw fees for the current sender.
    fun withdraw_fees_with_sender(
        vault: &mut PlatformVault,
        _cap: &AdminCap,
        amount: u64,
        ctx: &mut tx_context::TxContext,
    ): coin::Coin<SUI> {
        let available = balance::value(&vault.fees);
        assert!(amount <= available, EInsufficientFees);
        let payout = balance::split(&mut vault.fees, amount);
        let admin = tx_context::sender(ctx);
        event::emit(FeesWithdrawn {
            vault_id: object::id(vault),
            admin,
            amount,
        });
        coin::from_balance(payout, ctx)
    }
}
