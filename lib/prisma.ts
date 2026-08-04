import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// const pool = new Pool({
//   connectionString: process.env["DATABASE_URL"],
//   ssl: { rejectUnauthorized: false },
// });
const pool = new Pool({
  connectionString: process.env["DATABASE_URL"],
  ssl: process.env["DATABASE_SSL"] === "true"
    ? { rejectUnauthorized: false }
    : undefined,
});
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });