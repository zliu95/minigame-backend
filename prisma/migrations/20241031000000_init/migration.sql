-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('WECHAT', 'DOUYIN', 'IOS_APP', 'ANDROID_APP');

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "details" JSONB,
    "platform" "Platform" NOT NULL,
    "openid" TEXT,
    "location" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username");

-- CreateIndex
CREATE UNIQUE INDEX "games_shortName_key" ON "games"("shortName");

-- CreateIndex
CREATE INDEX "players_gameId_score_idx" ON "players"("gameId", "score" DESC);

-- CreateIndex
CREATE INDEX "players_gameId_platform_score_idx" ON "players"("gameId", "platform", "score" DESC);

-- CreateIndex
CREATE INDEX "players_gameId_createdAt_idx" ON "players"("gameId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "players_gameId_platform_playerId_key" ON "players"("gameId", "platform", "playerId");

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;