import "reflect-metadata";

import path from "node:path";
import { DataSource } from "typeorm";

import { env } from "../env.js";
import { Offer } from "../entities/Offer.js";
import { MemberLock } from "../entities/MemberLock.js";
import { OrderbookOrder } from "../entities/OrderbookOrder.js";
import { OrderbookTrade } from "../entities/OrderbookTrade.js";

const migrationsPath = path.join(__dirname, "..", "migrations", "*.{ts,js}");

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  synchronize: false,
  logging: env.DB_LOGGING,
  entities: [Offer, MemberLock, OrderbookOrder, OrderbookTrade],
  migrations: [migrationsPath],
});

export async function initializeDataSource() {
  if (AppDataSource.isInitialized) return AppDataSource;
  await AppDataSource.initialize();
  return AppDataSource;
}
