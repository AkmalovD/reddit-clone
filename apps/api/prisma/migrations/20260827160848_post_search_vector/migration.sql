ALTER TABLE "posts"
ADD COLUMN "search_vector" tsvector
GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'B')
) STORED;

CREATE INDEX "posts_search_idx" ON "posts" USING GIN ("search_vector");
