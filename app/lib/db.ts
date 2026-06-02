import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/app/generated/prisma/client";

// libSQL driver adapter. The SAME code runs against a local SQLite
// file in development (DATABASE_URL=file:./prisma/dev.db) and a hosted,
// writable Turso database in production (DATABASE_URL=libsql://… plus
// DATABASE_AUTH_TOKEN) — so the admin can create posts on Vercel.
function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const adapter = new PrismaLibSql({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  return new PrismaClient({ adapter });
}

// Reuse one client across dev hot-reloads / warm serverless invocations.
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createClient>;
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
