import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderbookTradePaymentFields1700000000005 implements MigrationInterface {
  name = "AddOrderbookTradePaymentFields1700000000005";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "orderbook_trades_status_enum" ADD VALUE IF NOT EXISTS 'AWAITING_PAYMENT'
    `);
    await queryRunner.query(`
      ALTER TABLE "orderbook_trades" ADD COLUMN IF NOT EXISTS "baseAmount" int NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "orderbook_trades" ADD COLUMN IF NOT EXISTS "feeBps" int NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "orderbook_trades" ADD COLUMN IF NOT EXISTS "feeAmount" int NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "orderbook_trades" ADD COLUMN IF NOT EXISTS "totalAmount" int NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orderbook_trades" DROP COLUMN IF EXISTS "totalAmount"
    `);
    await queryRunner.query(`
      ALTER TABLE "orderbook_trades" DROP COLUMN IF EXISTS "feeAmount"
    `);
    await queryRunner.query(`
      ALTER TABLE "orderbook_trades" DROP COLUMN IF EXISTS "feeBps"
    `);
    await queryRunner.query(`
      ALTER TABLE "orderbook_trades" DROP COLUMN IF EXISTS "baseAmount"
    `);
  }
}
