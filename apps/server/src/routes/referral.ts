import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import type {
  ReferralStatsResponse,
  ReferralReward,
  ClaimReferralRewardRequest,
  ClaimReferralRewardResponse,
} from '@castle-blast/shared';

export const referralRouter = Router();

const BOT_NAME = 'CastleBlastBot';

const REWARD_MILESTONES: ReferralReward[] = [
  { threshold: 1, reward: '1 Star', claimed: false },
  { threshold: 3, reward: 'Chest (500 coins)', claimed: false },
  { threshold: 5, reward: '3 rockets + 3 bombs', claimed: false },
  { threshold: 10, reward: '3-day premium trial', claimed: false },
];

// Mock referral data store (keyed by telegramId)
const mockReferralData: Record<number, { referredCount: number; claimedThresholds: number[] }> = {};

function getReferralData(telegramId: number) {
  if (!mockReferralData[telegramId]) {
    mockReferralData[telegramId] = { referredCount: 2, claimedThresholds: [1] };
  }
  return mockReferralData[telegramId];
}

// GET /api/referral/stats — get referral stats for the authenticated user
referralRouter.get('/stats', requireAuth, (req, res) => {
  const telegramId = req.auth!.telegramId;
  const data = getReferralData(telegramId);

  const referralCode = `ref_${telegramId}`;
  const referralLink = `https://t.me/${BOT_NAME}?start=${referralCode}`;

  const rewards: ReferralReward[] = REWARD_MILESTONES.map((m) => ({
    ...m,
    claimed: data.claimedThresholds.includes(m.threshold),
  }));

  const response: ReferralStatsResponse = {
    referralCode,
    referralLink,
    totalReferred: data.referredCount,
    rewards,
  };

  res.json(response);
});

// POST /api/referral/apply — apply a referral code (called when a new user joins)
referralRouter.post('/apply', requireAuth, (req, res) => {
  const { referralCode } = req.body as { referralCode: string };
  const refereeTelegramId = req.auth!.telegramId;

  if (!referralCode || !referralCode.startsWith('ref_')) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid referral code format' });
    return;
  }

  const referrerTelegramId = parseInt(referralCode.replace('ref_', ''), 10);
  if (isNaN(referrerTelegramId)) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid referral code' });
    return;
  }

  if (referrerTelegramId === refereeTelegramId) {
    res.status(400).json({ error: 'Bad Request', message: 'Cannot refer yourself' });
    return;
  }

  // Anti-abuse: referee must have completed level 5
  // TODO: Check actual player level from database
  const mockRefereeLevel = 6; // Mock: assume referee has completed level 5
  if (mockRefereeLevel < 5) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'You must complete level 5 before applying a referral code',
    });
    return;
  }

  // Credit the referrer
  const referrerData = getReferralData(referrerTelegramId);
  referrerData.referredCount += 1;

  res.json({ success: true, message: 'Referral applied successfully' });
});

// POST /api/referral/claim — claim a reward milestone
referralRouter.post('/claim', requireAuth, (req, res) => {
  const telegramId = req.auth!.telegramId;
  const { threshold } = req.body as ClaimReferralRewardRequest;

  const milestone = REWARD_MILESTONES.find((m) => m.threshold === threshold);
  if (!milestone) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid reward threshold' });
    return;
  }

  const data = getReferralData(telegramId);

  if (data.claimedThresholds.includes(threshold)) {
    res.status(400).json({ error: 'Bad Request', message: 'Reward already claimed' });
    return;
  }

  if (data.referredCount < threshold) {
    res.status(400).json({
      error: 'Bad Request',
      message: `Need ${threshold} referrals to claim this reward (currently ${data.referredCount})`,
    });
    return;
  }

  data.claimedThresholds.push(threshold);

  // TODO: Actually grant the reward to the player
  const response: ClaimReferralRewardResponse = {
    success: true,
    reward: milestone.reward,
    player: {
      id: 1,
      telegramId,
      username: 'dev_user',
      displayName: 'Developer',
      coins: 1000,
      stars: 11,
      currentLevel: 1,
      lives: 5,
      livesUpdatedAt: new Date().toISOString(),
      isPremium: false,
      premiumExpiresAt: null,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    },
  };

  res.json(response);
});
