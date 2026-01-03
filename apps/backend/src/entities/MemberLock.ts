import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum MemberLockStatus {
  LOCKED = "LOCKED",
  PARTIALLY_USED = "PARTIALLY_USED",
  REFUNDED = "REFUNDED",
  SETTLED = "SETTLED",
}

@Entity({ name: "member_locks" })
export class MemberLock {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  offerId!: string;

  @Column({ type: "varchar", length: 255 })
  memberAddress!: string;

  @Column({ type: "int" })
  lockedAmount!: number;

  @Column({ type: "varchar", length: 16, default: "SUI" })
  asset!: string;

  @Column({ type: "varchar", length: 255 })
  lockTxDigest!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  lockObjectId?: string | null;

  @Column({ type: "enum", enum: MemberLockStatus, default: MemberLockStatus.LOCKED })
  status!: MemberLockStatus;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
