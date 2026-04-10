import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import type { LeaderboardEntry, LeaderboardResponse } from '@castle-blast/shared';

export const leaderboardRouter = Router();

// Generate mock leaderboard entries
function generateMockEntries(count: number): LeaderboardEntry[] {
  const names = [
    'DragonSlayer', 'CastleKing', 'BlastMaster', 'StoneCrusher', 'TowerBreaker',
    'WallSmasher', 'FortressLord', 'SiegeHero', 'BombExpert', 'RocketRider',
    'StarCollector', 'CoinHunter', 'LevelCrusher', 'GemSeeker', 'PowerPlayer',
    'MegaBlaster', 'UltraKnight', 'SuperBuilder', 'EpicWarrior', 'RoyalGuard',
  ];

  return Array.from({ length: count }, (_, i) => ({
    rank: i + 1,
    telegramId: 100000 + i,
    displayName: names[i] || `Player${i + 1}`,
    score: Math.floor(50000 - i * 2300 + Math.random() * 500),
    level: Math.max(1, 50 - i * 2),
  })).sort((a, b) => b.score - a.score)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}

const mockWeekly = generateMockEntries(20);
const mockAllTime = generateMockEntries(20).map((e) => ({
  ...e,
  score: e.score * 4,
}));

// GET /api/leaderboard — get weekly and all-time leaderboards
leaderboardRouter.get('/', requireAuth, (req, res) => {
  const telegramId = req.auth!.telegramId;

  // Find player rank (or default to a position outside top 20)
  const weeklyRank = mockWeekly.findIndex((e) => e.telegramId === telegramId);
  const allTimeRank = mockAllTime.findIndex((e) => e.telegramId === telegramId);

  const response: LeaderboardResponse = {
    weekly: mockWeekly,
    allTime: mockAllTime,
    playerRank: {
      weekly: weeklyRank >= 0 ? weeklyRank + 1 : 42,
      allTime: allTimeRank >= 0 ? allTimeRank + 1 : 128,
    },
  };

  res.json(response);
});

// POST /api/leaderboard/submit — submit a score
leaderboardRouter.post('/submit', requireAuth, (req, res) => {
  const { score } = req.body as { score: number };
  const telegramId = req.auth!.telegramId;

  if (typeof score !== 'number' || score < 0) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid score' });
    return;
  }

  // TODO: In production, use Redis ZADD to update the sorted set
  // ZADD leaderboard:weekly <score> <telegramId>
  // ZADD leaderboard:alltime <score> <telegramId>

  res.json({
    success: true,
    message: 'Score submitted',
    telegramId,
    score,
  });
});
