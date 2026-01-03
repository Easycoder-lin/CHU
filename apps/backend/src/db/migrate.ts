import { initializeDataSource } from "./data-source.js";

async function run() {
  const dataSource = await initializeDataSource();
  const migrations = await dataSource.runMigrations({ transaction: "none" });
  // eslint-disable-next-line no-console
  console.log(`Migrations applied: ${migrations.length}`);
  await dataSource.destroy();
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Migration failed:", error);
  process.exit(1);
});
