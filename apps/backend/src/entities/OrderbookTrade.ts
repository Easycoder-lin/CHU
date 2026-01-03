import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum OrderbookTradeStatus {
  PENDING_EXECUTION = "PENDING_EXECUTION",
  EXECUTING = "EXECUTING",
  AWAITING_SETTLEMENT = "AWAITING_SETTLEMENT",
  SETTLED = "SETTLED",
  FAILED = "FAILED",
}

@Entity({ name: "orderbook_trades" })
export class OrderbookTrade {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 64 })
  product!: string;

  @Column({ type: "uuid" })
  buyOrderId!: string;

  @Column({ type: "uuid" })
  sellOrderId!: string;

  @Column({ type: "int" })
  price!: number;

  @Column({ type: "int" })
  quantity!: number;

  @Column({ type: "int", default: 0 })
  baseAmount!: number;

  @Column({ type: "int", default: 0 })
  feeBps!: number;

  @Column({ type: "int", default: 0 })
  feeAmount!: number;

  @Column({ type: "int", default: 0 })
  totalAmount!: number;

  @Column({ type: "enum", enum: OrderbookTradeStatus, default: OrderbookTradeStatus.PENDING_EXECUTION })
  status!: OrderbookTradeStatus;

  @Column({ type: "varchar", length: 255, nullable: true })
  buyWalletAddress?: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  sellWalletAddress?: string | null;

  @Column({ type: "uuid", nullable: true })
  offerId?: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  lockObjectId?: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  lockTxDigest?: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  txDigest?: string | null;

  @Column({ type: "text", nullable: true })
  errorReason?: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
