import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrderbookOrders1700000000003 implements MigrationInterface {
  name = "CreateOrderbookOrders1700000000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "orderbook_orders_side_enum" AS ENUM ('BUY', 'SELL')
    `);
    await queryRunner.query(`
      CREATE TYPE "orderbook_orders_status_enum" AS ENUM ('OPEN', 'PARTIAL', 'FILLED', 'CANCELLED')
    `);
    await queryRunner.query(`
      CREATE TYPE "orderbook_orders_actor_enum" AS ENUM ('SPONSOR', 'MEMBER')
    `);

    await queryRunner.query(`
      CREATE TABLE "orderbook_orders" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "product" varchar(64) NOT NULL,
        "side" "orderbook_orders_side_enum" NOT NULL,
        "price" int NOT NULL,
        "quantity" int NOT NULL,
        "remaining" int NOT NULL,
        "status" "orderbook_orders_status_enum" NOT NULL DEFAULT 'OPEN',
        "actor" "orderbook_orders_actor_enum" NOT NULL,
        "walletAddress" varchar(255),
        "orderHash" varchar(255),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "orderbook_orders_product_idx" ON "orderbook_orders" ("product")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "orderbook_orders_orderhash_key" ON "orderbook_orders" ("orderHash")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "orderbook_orders"`);
    await queryRunner.query(`DROP TYPE "orderbook_orders_actor_enum"`);
    await queryRunner.query(`DROP TYPE "orderbook_orders_status_enum"`);
    await queryRunner.query(`DROP TYPE "orderbook_orders_side_enum"`);
  }
}
