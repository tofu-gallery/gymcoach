-- Tofu: prisma/migrations/20261017090000_add_set_block/migration.sql, unchanged, which Tofu
-- applies before each build (see TOFU.md).

-- Block of a deliberately repeated exercise (issue #429): additive only. A
-- nullable column without a default is a metadata-only change, so existing
-- rows read NULL (treated as the first occurrence) without a table rewrite.
-- Rollback: ALTER TABLE "Set" DROP COLUMN "block";

-- AlterTable
ALTER TABLE "Set" ADD COLUMN "block" INTEGER;
