-- CreateEnum
CREATE TYPE "TokenRevokeReason" AS ENUM ('ROTATED', 'LOGOUT', 'REUSE');

-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "revoked_reason" "TokenRevokeReason";
