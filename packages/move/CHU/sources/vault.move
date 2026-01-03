module chu::vault {
    use sui::balance;
    use sui::coin;
    use sui::event;
    use sui::sui::SUI;

    const EInsufficientFees: u64 = 0;
    const ELockNotOwner: u64 = 1;
    const ELockInsufficient: u64 = 2;
    const ELockNotEmpty: u64 = 3;

    public struct AdminCap has key, store {
        id: object::UID,
    }

    public struct PlatformVault has key, store {
        id: object::UID,
        fees: balance::Balance<SUI>,
    }

    public struct Escrow has store {
        funds: balance::Balance<SUI>,
    }

    public struct MemberLock has key, store {
        id: object::UID,
        owner: address,
        funds: balance::Balance<SUI>,
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

    public struct FundsLocked has copy, drop, store {
        lock_id: object::ID,
        owner: address,
        amount: u64,
    }

    public struct FundsUsed has copy, drop, store {
        lock_id: object::ID,
        owner: address,
        amount: u64,
        remaining: u64,
    }

    public struct FundsRefunded has copy, drop, store {
        lock_id: object::ID,
        owner: address,
        amount: u64,
        remaining: u64,
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

    public fun init_escrow(): Escrow {
        Escrow { funds: balance::zero<SUI>() }
    }

    public fun escrow_value(escrow: &Escrow): u64 {
        balance::value(&escrow.funds)
    }

    public fun escrow_deposit(escrow: &mut Escrow, payment: balance::Balance<SUI>) {
        balance::join(&mut escrow.funds, payment);
    }

    public fun escrow_withdraw(escrow: &mut Escrow, amount: u64): balance::Balance<SUI> {
        balance::split(&mut escrow.funds, amount)
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

    public fun lock_funds(payment: coin::Coin<SUI>, ctx: &mut tx_context::TxContext): MemberLock {
        let owner = tx_context::sender(ctx);
        let amount = coin::value(&payment);
        let lock = MemberLock {
            id: object::new(ctx),
            owner,
            funds: coin::into_balance(payment),
        };
        event::emit(FundsLocked {
            lock_id: object::id(&lock),
            owner,
            amount,
        });
        lock
    }

    public fun lock_funds_entry(
        payment: coin::Coin<SUI>,
        ctx: &mut tx_context::TxContext,
    ): MemberLock {
        lock_funds(payment, ctx)
    }

    public fun lock_owner(lock: &MemberLock): address {
        lock.owner
    }

    public fun lock_value(lock: &MemberLock): u64 {
        balance::value(&lock.funds)
    }

    public fun settle_from_lock(
        lock: &mut MemberLock,
        amount: u64,
        ctx: &mut tx_context::TxContext,
    ): coin::Coin<SUI> {
        let sender = tx_context::sender(ctx);
        assert!(lock.owner == sender, ELockNotOwner);
        let available = balance::value(&lock.funds);
        assert!(amount <= available, ELockInsufficient);
        let payout = balance::split(&mut lock.funds, amount);
        if (amount > 0) {
            event::emit(FundsUsed {
                lock_id: object::id(lock),
                owner: sender,
                amount,
                remaining: balance::value(&lock.funds),
            });
        };
        coin::from_balance(payout, ctx)
    }

    public fun refund_from_lock(
        lock: &mut MemberLock,
        amount: u64,
        ctx: &mut tx_context::TxContext,
    ): coin::Coin<SUI> {
        let sender = tx_context::sender(ctx);
        assert!(lock.owner == sender, ELockNotOwner);
        let available = balance::value(&lock.funds);
        assert!(amount <= available, ELockInsufficient);
        let refund = balance::split(&mut lock.funds, amount);
        event::emit(FundsRefunded {
            lock_id: object::id(lock),
            owner: sender,
            amount,
            remaining: balance::value(&lock.funds),
        });
        coin::from_balance(refund, ctx)
    }

    public fun refund_all_from_lock(
        lock: MemberLock,
        ctx: &mut tx_context::TxContext,
    ): coin::Coin<SUI> {
        let lock_id = object::id(&lock);
        let lock_owner = lock.owner;
        let MemberLock { id, owner, funds } = lock;
        let sender = tx_context::sender(ctx);
        assert!(owner == sender, ELockNotOwner);
        let amount = balance::value(&funds);
        event::emit(FundsRefunded {
            lock_id,
            owner: lock_owner,
            amount,
            remaining: 0,
        });
        object::delete(id);
        coin::from_balance(funds, ctx)
    }

    public fun close_empty_lock(lock: MemberLock) {
        let MemberLock { id, owner: _, funds } = lock;
        assert!(balance::value(&funds) == 0, ELockNotEmpty);
        balance::destroy_zero(funds);
        object::delete(id);
    }
}
