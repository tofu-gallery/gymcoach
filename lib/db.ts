// Tofu: the adapter takes its pool settings from lib/tofu-database.ts, which
// verifies a Tofu database's certificate (SUPABASE_CA_CERT); see TOFU.md.
import { PrismaClient } from '@/prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { databasePoolConfig } from '@/lib/tofu-database';

// Singleton pattern recommended by Prisma in dev (avoids
// multiple connections on Next.js hot-reload).
// https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices
//
// Prisma 7 removed the bundled Rust query engine: the client now talks to
// PostgreSQL through a JavaScript driver adapter, so we hand it a pg-backed
// PrismaPg adapter built from DATABASE_URL.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const adapter = new PrismaPg(databasePoolConfig());
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
