-- CreateIndex
CREATE INDEX "comments_author_id_idx" ON "comments"("author_id");

-- CreateIndex
CREATE INDEX "posts_author_id_created_at_id_idx" ON "posts"("author_id", "created_at" DESC, "id" DESC);
