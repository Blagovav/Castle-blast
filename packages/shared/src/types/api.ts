import type { PlayerProfile } from './player.js';
import type { LevelResult } from './level.js';
import type { ShopItem } from './economy.js';
import type { Building } from './kingdom.js';

// Auth
export interface AuthRequest {
  initData: string;
}

export interface AuthResponse {
  token: string;
  player: PlayerProfile;
}

// Player
export interface PlayerResponse {
  player: PlayerProfile;
}

// Level
export interface LevelStartRequest {
  levelNum: number;
}

export interface LevelStartResponse {
  sessionId: string;
  maxMoves: number;
}

export interface LevelFinishRequest {
  sessionId: string;
  result: LevelResult;
}

export interface LevelFinishResponse {
  rewards: {
    coins: number;
    buildStars: number;
  };
  newLevel: number;
  player: PlayerProfile;
}

// Shop
export interface ShopResponse {
  items: ShopItem[];
}

export interface PurchaseRequest {
  itemId: string;
}

export interface PurchaseResponse {
  success: boolean;
  player: PlayerProfile;
}

// Kingdom
export interface KingdomResponse {
  buildings: Building[];
  pendingIncome: number;
}

export interface CollectIdleResponse {
  coinsCollected: number;
  player: PlayerProfile;
}

// Referral
export interface ReferralStatsResponse {
  referralCode: string;
  referralLink: string;
  totalReferred: number;
  rewards: ReferralReward[];
}

export interface ReferralReward {
  threshold: number; // friends needed
  reward: string;
  claimed: boolean;
}

export interface ClaimReferralRewardRequest {
  threshold: number;
}

export interface ClaimReferralRewardResponse {
  success: boolean;
  reward: string;
  player: PlayerProfile;
}

// Leaderboard
export interface LeaderboardEntry {
  rank: number;
  telegramId: number;
  displayName: string;
  score: number;
  level: number;
}

export interface LeaderboardResponse {
  weekly: LeaderboardEntry[];
  allTime: LeaderboardEntry[];
  playerRank: {
    weekly: number;
    allTime: number;
  };
}

// Generic
export interface ApiError {
  error: string;
  message: string;
}
