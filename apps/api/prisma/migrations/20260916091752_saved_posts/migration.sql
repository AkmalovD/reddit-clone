-- CreateTable
CREATE TABLE "saved_posts" (
    "user_id" UUID NOT NULL,
    "psot_id" UUID NOT NULL,
    "saved_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_posts_pkey" PRIMARY KEY ("user_id","psot_id")
);

-- CreateIndex
CREATE INDEX "saved_posts_user_id_psot_id_idx" ON "saved_posts"("user_id", "psot_id");

-- AddForeignKey
ALTER TABLE "saved_posts" ADD CONSTRAINT "saved_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_posts" ADD CONSTRAINT "saved_posts_psot_id_fkey" FOREIGN KEY ("psot_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
