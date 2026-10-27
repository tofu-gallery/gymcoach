-- Tofu: prisma/migrations/20260722162000_add_mcp_access_tokens/migration.sql, unchanged, which Tofu
-- applies before each build (see TOFU.md). The lines after it turn row-level security on,
-- with no policy, for the tables it makes.

CREATE TABLE "McpAccessToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tokenPrefix" TEXT NOT NULL,
    "canWrite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "McpAccessToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "McpAccessToken_tokenHash_key" ON "McpAccessToken"("tokenHash");
CREATE INDEX "McpAccessToken_userId_createdAt_idx" ON "McpAccessToken"("userId", "createdAt");

ALTER TABLE "McpAccessToken"
ADD CONSTRAINT "McpAccessToken_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tofu: row-level security on, with no policy, for the tables this file makes.
-- A Tofu database opens the tables these files make to Supabase's Data API
-- roles; with this, those roles read and change no row. The app is not
-- limited: its own connection owns the tables, and the policy is not forced.
ALTER TABLE "McpAccessToken" ENABLE ROW LEVEL SECURITY;
