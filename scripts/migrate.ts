import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import bcrypt from "bcryptjs";
import { admins } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const conn = postgres(connectionString, { max: 1 });
  const db = drizzle(conn);

  try {
    console.log("Running migrations...");
    await migrate(db, { migrationsFolder: "./lib/db/migrations" });
    console.log("Migrations complete.");

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminUsername) {
      if (!adminPassword) {
        console.warn("ADMIN_USERNAME is set but ADMIN_PASSWORD is not — skipping admin seed.");
      } else {
        console.log(`Checking for existing admin "${adminUsername}"...`);
        const existing = await db
          .select()
          .from(admins)
          .where(eq(admins.username, adminUsername))
          .limit(1);

        if (existing.length > 0) {
          console.log("Admin already exists, skipping seed.");
        } else {
          const passwordHash = await bcrypt.hash(adminPassword, 12);
          await db.insert(admins).values({ username: adminUsername, passwordHash });
          console.log(`Admin "${adminUsername}" created successfully.`);
        }
      }
    } else {
      console.log("ADMIN_USERNAME not set, skipping admin seed.");
    }
  } catch (err) {
    console.error("Migration failed:", err);
    await conn.end();
    process.exit(1);
  }

  await conn.end();
  process.exit(0);
}

main();
