import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { randomUUID } from 'crypto';
import type { LevelStartRequest, LevelStartResponse, LevelFinishRequest, LevelFinishResponse } from '@castle-blast/shared';

export const levelRouter = Router();

levelRouter.post('/start', requireAuth, (req, res) => {
  const { levelNum } = req.body as LevelStartRequest;

  // TODO: Store session in Redis, validate level access
  const response: LevelStartResponse = {
    sessionId: randomUUID(),
    maxMoves: 25,
  };
  res.json(response);
});

levelRouter.post('/finish', requireAuth, (req, res) => {
  const { sessionId, result } = req.body as LevelFinishRequest;

  // TODO: Validate session from Redis, check rewards plausibility
  const response: LevelFinishResponse = {
    rewards: { coins: result.score * 0.1, buildStars: result.starsEarned },
    newLevel: result.starsEarned > 0 ? result.levelNum + 1 : result.levelNum,
    player: {
      id: req.auth!.userId,
      telegramId: req.auth!.telegramId,
      username: 'dev_user',
      displayName: 'Developer',
      coins: 1000 + result.score * 0.1,
      stars: 10,
      currentLevel: result.starsEarned > 0 ? result.levelNum + 1 : result.levelNum,
      lives: 4,
      livesUpdatedAt: new Date().toISOString(),
      isPremium: false,
      premiumExpiresAt: null,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    },
  };
  res.json(response);
});
