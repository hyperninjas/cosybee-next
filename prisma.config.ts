import path from "node:path";
import { defineConfig, env } from "prisma/config";

// Prisma 7 no longer auto-loads .env for the config file — do it
// ourselves so `env("DATABASE_URL")` resolves for CLI commands.
process.loadEnvFile();

// Prisma 7 configuration. The datasource URL moved out of
// schema.prisma and lives here; `migrations.seed` defines the seed
// command run by `prisma db seed`.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
