import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum OrderbookOrderSide {
  BUY = "BUY",
  SELL = "SELL",
}

export enum OrderbookOrderStatus {
  OPEN = "OPEN",
  PARTIAL = "PARTIAL",
  FILLED = "FILLED",
  CANCELLED = "CANCELLED",
}

export enum OrderbookOrderActor {
  SPONSOR = "SPONSOR",
  MEMBER = "MEMBER",
}

export enum OrderbookOrderLockStatus {
  LOCKED = "LOCKED",
  PARTIALLY_USED = "PARTIALLY_USED",
  REFUNDED = "REFUNDED",
  SETTLED = "SETTLED",
}

@Entity({ name: "orderbook_orders" })
export class OrderbookOrder {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 64 })
  product!: string;

  @Column({ type: "enum", enum: OrderbookOrderSide })
  side!: OrderbookOrderSide;

  @Column({ type: "int" })
  price!: number;

  @Column({ type: "int" })
  quantity!: number;

  @Column({ type: "int" })
  remaining!: number;

  @Column({ type: "enum", enum: OrderbookOrderStatus, default: OrderbookOrderStatus.OPEN })
  status!: OrderbookOrderStatus;

  @Column({ type: "enum", enum: OrderbookOrderActor })
  actor!: OrderbookOrderActor;

  @Column({ type: "varchar", length: 255, nullable: true })
  walletAddress?: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  orderHash?: string | null;

  @Column({ type: "int", nullable: true })
  lockAmount?: number | null;

  @Column({ type: "int", default: 0 })
  lockUsedAmount!: number;

  @Column({ type: "varchar", length: 16, nullable: true })
  lockAsset?: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  lockTxDigest?: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  lockObjectId?: string | null;

  @Column({ type: "enum", enum: OrderbookOrderLockStatus, nullable: true })
  lockStatus?: OrderbookOrderLockStatus | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
