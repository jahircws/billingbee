import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import fs from "fs";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  // Prefer DATABASE_URL (PgBouncer / connection pooler) for app queries.
  // DIRECT_DATABASE_URL bypasses the pooler and is only needed for migrations.
  const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_DATABASE_URL;

  const sslCertPath = process.env.PG_SSL_CERT;
  // On EC2 (same VPC as RDS) ssl=undefined works fine — internal network.
  // Locally, the connection goes over the internet and RDS requires SSL.
  // NODE_ENV=development → always enable SSL with self-signed cert allowed.
  const ssl = sslCertPath
    ? { ca: fs.readFileSync(sslCertPath).toString() }
    : process.env.NODE_ENV !== "production"
      ? { rejectUnauthorized: false }
      : undefined;

  const pool = new Pool({
    connectionString,
    ssl,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
  });

  // Log pool errors so they don't crash the process silently
  pool.on("error", (err) => {
    console.error("[pg pool] idle client error:", err.message);
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

export const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;
