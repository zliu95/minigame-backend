/*
  Warnings:

  - You are about to drop the `records` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[gameId,openid,platform]` on the table `players` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `gameId` to the `players` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."records" DROP CONSTRAINT "records_gameId_fkey";

-- DropForeignKey
ALTER TABLE "public"."records" DROP CONSTRAINT "records_playerId_fkey";

-- DropIndex
DROP INDEX "public"."players_createdAt_idx";

-- DropIndex
DROP INDEX "public"."players_platform_idx";

-- DropIndex
DROP INDEX "public"."players_platform_openid_key";

-- AlterTable
ALTER TABLE "players" ADD COLUMN     "detailsJson" JSONB,
ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "gameId" TEXT NOT NULL,
ADD COLUMN     "score" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "public"."records";

-- CreateIndex
CREATE INDEX "players_gameId_score_idx" ON "players"("gameId", "score" DESC);

-- CreateIndex
CREATE INDEX "players_gameId_platform_score_idx" ON "players"("gameId", "platform", "score" DESC);

-- CreateIndex
CREATE INDEX "players_gameId_duration_idx" ON "players"("gameId", "duration" ASC);

-- CreateIndex
CREATE INDEX "players_gameId_createdAt_idx" ON "players"("gameId", "createdAt");

-- CreateIndex
CREATE INDEX "players_gameId_updatedAt_idx" ON "players"("gameId", "updatedAt");

-- CreateIndex
CREATE INDEX "players_gameId_score_updatedAt_idx" ON "players"("gameId", "score" DESC, "updatedAt");

-- CreateIndex
CREATE INDEX "players_platform_createdAt_idx" ON "players"("platform", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "players_gameId_openid_platform_key" ON "players"("gameId", "openid", "platform");

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
