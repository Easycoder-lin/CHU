import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum OfferStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  SUBMITTED = "SUBMITTED",
  CONFIRMED = "CONFIRMED",
  OPEN = "OPEN",
  FULL = "FULL",
  CREDENTIALS_SUBMITTED = "CREDENTIALS_SUBMITTED",
  DISPUTE_OPEN = "DISPUTE_OPEN",
  SETTLED = "SETTLED",
  SLASHED = "SLASHED",
  FAILED = "FAILED",
}

@Entity({ name: "offers" })
export class Offer {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  sponsorAddress!: string;

  @Column({ type: "varchar", length: 64 })
  service!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description?: string | null;

  @Column({ type: "int" })
  seatCap!: number;

  @Column({ type: "int" })
  pricePerSeat!: number;

  @Column({ type: "int", default: 0 })
  seatsSold!: number;

  @Column({ type: "varchar", length: 8 })
  period!: string;

  @Column({ type: "varchar", length: 16, default: "USD" })
  currency!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  sponsorName?: string | null;

  @Column({ type: "varchar", length: 512, nullable: true })
  sponsorAvatar?: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  orderHash?: string | null;

  @Column({ type: "int", default: 0 })
  platformFeeBps!: number;

  @Column({ type: "int", default: 0 })
  stakeLocked!: number;

  @Column({ type: "enum", enum: OfferStatus, default: OfferStatus.DRAFT })
  status!: OfferStatus;

  @Column({ type: "varchar", length: 255, nullable: true })
  offerObjectId?: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  poolObjectId?: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  packageId!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  chainNetwork!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  rpcUrl!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  txDigest?: string | null;

  @Column({ type: "text", nullable: true })
  errorReason?: string | null;

  @Column({ type: "timestamptz", nullable: true })
  fullAt?: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  credentialDeadline?: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  settleAfter?: Date | null;

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  members!: string[];

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  tags!: string[];

  @Column({ type: "jsonb", nullable: true })
  credentials?: {
    username: string;
    password: string;
    submittedAt: string;
    unlockAt: string;
  } | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
