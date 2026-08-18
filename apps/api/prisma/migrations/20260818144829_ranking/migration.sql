-- DropIndex
DROP INDEX "posts_subreddit_id_hot_rank_id_created_at_idx";

-- CreateIndex
CREATE INDEX "posts_subreddit_id_hot_rank_id_idx" ON "posts"("subreddit_id", "hot_rank" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "posts_subreddit_id_created_at_id_idx" ON "posts"("subreddit_id", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "posts_subreddit_id_score_id_idx" ON "posts"("subreddit_id", "score" DESC, "id" DESC);
