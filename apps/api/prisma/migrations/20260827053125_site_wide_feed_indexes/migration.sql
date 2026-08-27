-- CreateIndex
CREATE INDEX "posts_hot_rank_id_idx" ON "posts"("hot_rank" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "posts_created_at_id_idx" ON "posts"("created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "posts_score_id_idx" ON "posts"("score" DESC, "id" DESC);
