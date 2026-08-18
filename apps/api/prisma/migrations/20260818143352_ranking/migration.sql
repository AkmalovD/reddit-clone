-- DropIndex
DROP INDEX "posts_subreddit_id_created_at_idx";

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "downvotes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "upvotes" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "downvotes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hot_rank" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "upvotes" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "posts_subreddit_id_hot_rank_id_created_at_idx" ON "posts"("subreddit_id", "hot_rank" DESC, "id" DESC, "created_at" DESC);

-- пересчёт плюсов и минусов из таблицы голосов
UPDATE "posts" p SET
  "upvotes"   = (SELECT count(*) FROM "post_votes" v WHERE v.post_id = p.id AND v.value = 1),
  "downvotes" = (SELECT count(*) FROM "post_votes" v WHERE v.post_id = p.id AND v.value = -1);

UPDATE "comments" c SET
  "upvotes"   = (SELECT count(*) FROM "comment_votes" v WHERE v.comment_id = c.id AND v.value = 1),
  "downvotes" = (SELECT count(*) FROM "comment_votes" v WHERE v.comment_id = c.id AND v.value = -1);

-- та же формула hot, но на SQL: log() в Postgres — десятичный логарифм
UPDATE "posts" SET "hot_rank" =
  sign("score") * log(greatest(abs("score"), 1))
  + (extract(epoch from "created_at") - 1134028003) / 45000;
