import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWaitingForCredentialStatus1700000000007 implements MigrationInterface {
  name = "AddWaitingForCredentialStatus1700000000007";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "offers_status_enum" ADD VALUE IF NOT EXISTS 'WAITING_FOR_CREDENTIAL'`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Enum value removal is not supported safely; no-op for rollback.
  }
}
