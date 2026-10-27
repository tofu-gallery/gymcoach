-- Tofu: prisma/migrations/20261027120000_tofu_progress_photo_in_database/migration.sql, unchanged, which Tofu
-- applies before each build (see TOFU.md).

-- Tofu: progress photos are kept in the database (see TOFU.md). Tofu's
-- hosting keeps no files between requests, so a new photo's bytes go in
-- "imageData" and its "storagePath" stays NULL; a photo uploaded before keeps
-- its file path and is still read from UPLOADS_DIR.

-- AlterTable
ALTER TABLE "ProgressPhoto" ADD COLUMN "imageData" BYTEA;
ALTER TABLE "ProgressPhoto" ALTER COLUMN "storagePath" DROP NOT NULL;
