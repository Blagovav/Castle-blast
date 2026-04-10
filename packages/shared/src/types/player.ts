export interface PlayerProfile {
  id: number;
  telegramId: number;
  username: string | null;
  displayName: string;
  coins: number;
  stars: number;
  currentLevel: number;
  lives: number;
  livesUpdatedAt: string;
  isPremium: boolean;
  premiumExpiresAt: string | null;
  createdAt: string;
  lastLoginAt: string;
}
