/*
  Warnings:

  - Added the required column `playerId` to the `players` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- 步骤1: 添加字段（允许为空）
ALTER TABLE "players" ADD COLUMN "playerId" TEXT;

-- 步骤2: 为现有数据设置默认值（使用 openid 作为 playerId）
UPDATE "players" SET "playerId" = "openid" WHERE "playerId" IS NULL;

-- 步骤3: 设置字段为必填
ALTER TABLE "players" ALTER COLUMN "playerId" SET NOT NULL;
