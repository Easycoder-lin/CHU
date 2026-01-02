import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddDisputeOpenStatus1700000000001 implements MigrationInterface {
  name = "AddDisputeOpenStatus1700000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "offers_status_enum" ADD VALUE IF NOT EXISTS 'DISPUTE_OPEN'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "offers_status_enum" RENAME TO "offers_status_enum_old"`);
    await queryRunner.query(`
      CREATE TYPE "offers_status_enum" AS ENUM (
        'DRAFT',
        'PENDING',
        'OPEN',
        'FULL',
        'CREDENTIALS_SUBMITTED',
        'SETTLED',
        'SLASHED',
        'FAILED'
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "offers"
      ALTER COLUMN "status" TYPE "offers_status_enum"
      USING "status"::text::"offers_status_enum"
    `);
    await queryRunner.query(`DROP TYPE "offers_status_enum_old"`);
  }
}
