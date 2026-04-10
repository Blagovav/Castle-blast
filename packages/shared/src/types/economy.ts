export type ItemType =
  | 'lives_refill'
  | 'extra_moves'
  | 'booster_rockets'
  | 'booster_bombs'
  | 'starter_pack'
  | 'premium';

export interface ShopItem {
  id: string;
  type: ItemType;
  name: string;
  description: string;
  priceStars: number;
}

export interface Purchase {
  id: number;
  userId: number;
  itemType: ItemType;
  starsSpent: number;
  telegramChargeId: string | null;
  createdAt: string;
}
