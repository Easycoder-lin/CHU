import type { MigrationInterface, QueryRunner } from "typeorm";

export class OfferLifecycle1700000000002 implements MigrationInterface {
  name = "OfferLifecycle1700000000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "offers_status_enum" ADD VALUE IF NOT EXISTS 'SUBMITTED'`);
    await queryRunner.query(`ALTER TYPE "offers_status_enum" ADD VALUE IF NOT EXISTS 'CONFIRMED'`);

    await queryRunner.query(`ALTER TABLE "offers" RENAME COLUMN "chainOfferObjectId" TO "offerObjectId"`);
    await queryRunner.query(`ALTER TABLE "offers" RENAME COLUMN "lastError" TO "errorReason"`);

    await queryRunner.query(`ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "poolObjectId" varchar(255)`);
    await queryRunner.query(`ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "packageId" varchar(255)`);
    await queryRunner.query(`ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "chainNetwork" varchar(255)`);
    await queryRunner.query(`ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "rpcUrl" varchar(255)`);

    await queryRunner.query(`ALTER TABLE "offers" ALTER COLUMN "status" SET DEFAULT 'DRAFT'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "offers" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);

    await queryRunner.query(`ALTER TABLE "offers" DROP COLUMN IF EXISTS "rpcUrl"`);
    await queryRunner.query(`ALTER TABLE "offers" DROP COLUMN IF EXISTS "chainNetwork"`);
    await queryRunner.query(`ALTER TABLE "offers" DROP COLUMN IF EXISTS "packageId"`);
    await queryRunner.query(`ALTER TABLE "offers" DROP COLUMN IF EXISTS "poolObjectId"`);

    await queryRunner.query(`ALTER TABLE "offers" RENAME COLUMN "offerObjectId" TO "chainOfferObjectId"`);
    await queryRunner.query(`ALTER TABLE "offers" RENAME COLUMN "errorReason" TO "lastError"`);
  }
}
