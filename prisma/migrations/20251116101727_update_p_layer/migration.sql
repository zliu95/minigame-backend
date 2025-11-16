/*
  Warnings:

  - You are about to drop the column `details` on the `players` table. All the data in the column will be lost.
  - You are about to drop the column `gameId` on the `players` table. All the data in the column will be lost.
  - You are about to drop the column `openId` on the `players` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `players` table. All the data in the column will be lost.
  - You are about to drop the column `playerId` on the `players` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `players` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[platform,openid]` on the table `players` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `openid` to the `players` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."players" DROP CONSTRAINT "players_gameId_fkey";

-- DropIndex
DROP INDEX "public"."players_gameId_createdAt_idx";

-- DropIndex
DROP INDEX "public"."players_gameId_platform_playerId_key";

-- DropIndex
DROP INDEX "public"."players_gameId_platform_score_idx";

-- DropIndex
DROP INDEX "public"."players_gameId_score_idx";

-- DropIndex
DROP INDEX "public"."players_gameId_score_updatedAt_idx";

-- DropIndex
DROP INDEX "public"."players_gameId_updatedAt_idx";

-- DropIndex
DROP INDEX "public"."players_platform_createdAt_idx";

-- DropIndex
DROP INDEX "public"."players_score_updatedAt_idx";

-- AlterTable
ALTER TABLE "players" DROP COLUMN "details",
DROP COLUMN "gameId",
DROP COLUMN "openId",
DROP COLUMN "duration",
DROP COLUMN "playerId",
DROP COLUMN "score",
ADD COLUMN     "openid" TEXT NOT NULL,
ALTER COLUMN "location" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "records" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "detailsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "records_gameId_score_idx" ON "records"("gameId", "score" DESC);

-- CreateIndex
CREATE INDEX "records_gameId_score_updatedAt_idx" ON "records"("gameId", "score" DESC, "updatedAt");

-- CreateIndex
CREATE INDEX "records_gameId_duration_idx" ON "records"("gameId", "duration" ASC);

-- CreateIndex
CREATE INDEX "records_gameId_createdAt_idx" ON "records"("gameId", "createdAt");

-- CreateIndex
CREATE INDEX "records_gameId_updatedAt_idx" ON "records"("gameId", "updatedAt");

-- CreateIndex
CREATE INDEX "records_playerId_idx" ON "records"("playerId");

-- CreateIndex
CREATE INDEX "records_score_idx" ON "records"("score" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "records_gameId_playerId_key" ON "records"("gameId", "playerId");

-- CreateIndex
CREATE INDEX "players_platform_idx" ON "players"("platform");

-- CreateIndex
CREATE INDEX "players_createdAt_idx" ON "players"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "players_platform_openid_key" ON "players"("platform", "openid");

-- AddForeignKey
ALTER TABLE "records" ADD CONSTRAINT "records_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "records" ADD CONSTRAINT "records_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
