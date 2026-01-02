import { initializeDataSource } from "./data-source.js";

async function run() {
  const dataSource = await initializeDataSource();
  await dataSource.undoLastMigration();
  // eslint-disable-next-line no-console
  console.log("Last migration reverted.");
  await dataSource.destroy();
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Migration revert failed:", error);
  process.exit(1);
});
