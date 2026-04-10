import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

export const playerRouter = Router();

playerRouter.get('/', requireAuth, (req, res) => {
  // TODO: Fetch from database
  res.json({
    player: {
      id: req.auth!.userId,
      telegramId: req.auth!.telegramId,
      username: 'dev_user',
      displayName: 'Developer',
      coins: 1000,
      stars: 10,
      currentLevel: 1,
      lives: 5,
      livesUpdatedAt: new Date().toISOString(),
      isPremium: false,
      premiumExpiresAt: null,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    },
  });
});
