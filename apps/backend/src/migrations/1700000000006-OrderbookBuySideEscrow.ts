import { MigrationInterface, QueryRunner } from "typeorm";

export class OrderbookBuySideEscrow1700000000006 implements MigrationInterface {
  name = "OrderbookBuySideEscrow1700000000006";
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "orderbook_trades_status_enum" ADD VALUE IF NOT EXISTS 'AWAITING_SETTLEMENT'`,
    );
    await queryRunner.query(
      `UPDATE "orderbook_trades" SET "status" = 'AWAITING_SETTLEMENT' WHERE "status" = 'AWAITING_PAYMENT'`,
    );

    await queryRunner.query(
      `CREATE TYPE "orderbook_order_lock_status_enum" AS ENUM ('LOCKED', 'PARTIALLY_USED', 'REFUNDED', 'SETTLED')`,
    );

    await queryRunner.query(
      `ALTER TABLE "orderbook_orders"
        ADD COLUMN IF NOT EXISTS "lockAmount" int,
        ADD COLUMN IF NOT EXISTS "lockUsedAmount" int NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "lockAsset" varchar(16),
        ADD COLUMN IF NOT EXISTS "lockTxDigest" varchar(255),
        ADD COLUMN IF NOT EXISTS "lockObjectId" varchar(255),
        ADD COLUMN IF NOT EXISTS "lockStatus" "orderbook_order_lock_status_enum"`,
    );

    await queryRunner.query(
      `ALTER TABLE "orderbook_trades"
        ADD COLUMN IF NOT EXISTS "lockObjectId" varchar(255),
        ADD COLUMN IF NOT EXISTS "lockTxDigest" varchar(255)`,
    );

    await queryRunner.query(
      `CREATE TYPE "member_locks_status_enum" AS ENUM ('LOCKED', 'PARTIALLY_USED', 'REFUNDED', 'SETTLED')`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "member_locks" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "offerId" uuid NOT NULL,
        "memberAddress" varchar(255) NOT NULL,
        "lockedAmount" int NOT NULL,
        "asset" varchar(16) NOT NULL DEFAULT 'SUI',
        "lockTxDigest" varchar(255) NOT NULL,
        "lockObjectId" varchar(255),
        "status" "member_locks_status_enum" NOT NULL DEFAULT 'LOCKED',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_member_locks_id" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "member_locks_offer_idx" ON "member_locks" ("offerId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "member_locks_member_idx" ON "member_locks" ("memberAddress")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "member_locks_member_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "member_locks_offer_idx"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "member_locks"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "member_locks_status_enum"`);

    await queryRunner.query(
      `ALTER TABLE "orderbook_trades"
        DROP COLUMN IF EXISTS "lockTxDigest",
        DROP COLUMN IF EXISTS "lockObjectId"`,
    );

    await queryRunner.query(
      `ALTER TABLE "orderbook_orders"
        DROP COLUMN IF EXISTS "lockStatus",
        DROP COLUMN IF EXISTS "lockObjectId",
        DROP COLUMN IF EXISTS "lockTxDigest",
        DROP COLUMN IF EXISTS "lockAsset",
        DROP COLUMN IF EXISTS "lockUsedAmount",
        DROP COLUMN IF EXISTS "lockAmount"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "orderbook_order_lock_status_enum"`);
  }
}
