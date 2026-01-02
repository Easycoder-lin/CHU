import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOffers1700000000000 implements MigrationInterface {
  name = "CreateOffers1700000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`
      CREATE TYPE "offers_status_enum" AS ENUM (
        'DRAFT',
        'PENDING',
        'OPEN',
        'FULL',
        'CREDENTIALS_SUBMITTED',
        'DISPUTE_OPEN',
        'SETTLED',
        'SLASHED',
        'FAILED'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "offers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "sponsorAddress" varchar(255) NOT NULL,
        "service" varchar(64) NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text,
        "seatCap" int NOT NULL,
        "pricePerSeat" int NOT NULL,
        "seatsSold" int NOT NULL DEFAULT 0,
        "period" varchar(8) NOT NULL,
        "currency" varchar(16) NOT NULL DEFAULT 'USD',
        "sponsorName" varchar(255),
        "sponsorAvatar" varchar(512),
        "orderHash" varchar(255),
        "platformFeeBps" int NOT NULL DEFAULT 0,
        "stakeLocked" int NOT NULL DEFAULT 0,
        "status" "offers_status_enum" NOT NULL DEFAULT 'PENDING',
        "chainOfferObjectId" varchar(255),
        "txDigest" varchar(255),
        "lastError" text,
        "fullAt" timestamptz,
        "credentialDeadline" timestamptz,
        "settleAfter" timestamptz,
        "members" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "tags" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "credentials" jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "offers"`);
    await queryRunner.query(`DROP TYPE "offers_status_enum"`);
  }
}
