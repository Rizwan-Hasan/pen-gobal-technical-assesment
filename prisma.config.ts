import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * Prisma 7 moved the Migrate connection URL and the seed command out of
 * schema.prisma and package.json into this file. The runtime connection is
 * separate — the app passes a driver adapter to PrismaClient in lib/prisma.ts.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
