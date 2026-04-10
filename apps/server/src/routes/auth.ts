import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import type { AuthRequest, AuthResponse } from '@castle-blast/shared';

export const authRouter = Router();

authRouter.post('/telegram', (req, res) => {
  const { initData } = req.body as AuthRequest;

  // TODO: Validate Telegram HMAC signature
  // For now, create a mock user for development
  const mockPlayer = {
    id: 1,
    telegramId: 123456,
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
  };

  const token = jwt.sign(
    { userId: mockPlayer.id, telegramId: mockPlayer.telegramId },
    config.JWT_SECRET,
    { expiresIn: '24h' },
  );

  const response: AuthResponse = { token, player: mockPlayer };
  res.json(response);
});
