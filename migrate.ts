import { getDb } from "./src/lib/server/db";

async function run() {
  console.log("Starting migration...");
  // getDb will load the local JSON (or seed data) and persist it to the connected MongoDB
  await getDb();
  console.log("Migration complete!");
  process.exit(0);
}

run().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
