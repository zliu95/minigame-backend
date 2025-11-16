-- CreateIndex
CREATE INDEX "players_gameId_score_updatedAt_idx" ON "players"("gameId", "score" DESC, "updatedAt");

-- CreateIndex
CREATE INDEX "players_gameId_updatedAt_idx" ON "players"("gameId", "updatedAt");

-- CreateIndex
CREATE INDEX "players_score_updatedAt_idx" ON "players"("score" DESC, "updatedAt");

-- CreateIndex
CREATE INDEX "players_platform_createdAt_idx" ON "players"("platform", "createdAt");