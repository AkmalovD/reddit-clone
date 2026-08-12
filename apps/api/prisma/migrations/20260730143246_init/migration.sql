-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('MEMBER', 'MODERATOR', 'OWNER');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('TEXT', 'LINK');

-- CreateTable
CREATE TABLE
    "users" (
        "id" UUID NOT NULL,
        "username" VARCHAR(20) NOT NULL,
        "email" VARCHAR(255) NOT NULL,
        "password_hash" TEXT NOT NULL,
        "created_at" TIMESTAMPTZ (3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ (3) NOT NULL,
        CONSTRAINT "users_pkey" PRIMARY KEY ("id")
    );

-- CreateTable
CREATE TABLE
    "subreddits" (
        "id" UUID NOT NULL,
        "name" VARCHAR(21) NOT NULL,
        "description" VARCHAR(500),
        "created_at" TIMESTAMPTZ (3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ (3) NOT NULL,
        CONSTRAINT "subreddits_pkey" PRIMARY KEY ("id")
    );

-- CreateTable
CREATE TABLE
    "memberships" (
        "user_id" UUID NOT NULL,
        "subreddit_id" UUID NOT NULL,
        "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',
        "joined_at" TIMESTAMPTZ (3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "memberships_pkey" PRIMARY KEY ("user_id", "subreddit_id")
    );

-- CreateTable
CREATE TABLE
    "posts" (
        "id" UUID NOT NULL,
        "type" "PostType" NOT NULL DEFAULT 'TEXT',
        "title" VARCHAR(300) NOT NULL,
        "body" TEXT,
        "url" TEXT,
        "score" INTEGER NOT NULL DEFAULT 0,
        "comment_count" INTEGER NOT NULL DEFAULT 0,
        "author_id" UUID,
        "subreddit_id" UUID NOT NULL,
        "created_at" TIMESTAMPTZ (3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ (3) NOT NULL,
        "deleted_at" TIMESTAMPTZ (3),
        CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
    );

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users" ("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users" ("email");

-- CreateIndex
CREATE UNIQUE INDEX "subreddits_name_key" ON "subreddits" ("name");

-- CreateIndex
CREATE INDEX "memberships_subreddit_id_idx" ON "memberships" ("subreddit_id");

-- CreateIndex
CREATE INDEX "posts_subreddit_id_created_at_idx" ON "posts" ("subreddit_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_subreddit_id_fkey" FOREIGN KEY ("subreddit_id") REFERENCES "subreddits" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_subreddit_id_fkey" FOREIGN KEY ("subreddit_id") REFERENCES "subreddits" ("id") ON DELETE CASCADE ON UPDATE CASCADE;