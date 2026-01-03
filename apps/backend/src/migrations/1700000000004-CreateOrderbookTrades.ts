import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrderbookTrades1700000000004 implements MigrationInterface {
  name = "CreateOrderbookTrades1700000000004";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "orderbook_trades_status_enum" AS ENUM ('PENDING_EXECUTION', 'EXECUTING', 'SETTLED', 'FAILED')
    `);

    await queryRunner.query(`
      CREATE TABLE "orderbook_trades" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "product" varchar(64) NOT NULL,
        "buyOrderId" uuid NOT NULL,
        "sellOrderId" uuid NOT NULL,
        "price" int NOT NULL,
        "quantity" int NOT NULL,
        "status" "orderbook_trades_status_enum" NOT NULL DEFAULT 'PENDING_EXECUTION',
        "buyWalletAddress" varchar(255),
        "sellWalletAddress" varchar(255),
        "offerId" uuid,
        "txDigest" varchar(255),
        "errorReason" text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "orderbook_trades_product_idx" ON "orderbook_trades" ("product")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "orderbook_trades_status_idx" ON "orderbook_trades" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "orderbook_trades_buy_wallet_idx" ON "orderbook_trades" ("buyWalletAddress")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "orderbook_trades_sell_wallet_idx" ON "orderbook_trades" ("sellWalletAddress")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "orderbook_trades"`);
    await queryRunner.query(`DROP TYPE "orderbook_trades_status_enum"`);
  }
}
