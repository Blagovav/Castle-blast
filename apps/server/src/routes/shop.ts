import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  COST_LIVES_REFILL,
  COST_EXTRA_MOVES,
  COST_BOOSTER_PACK,
  COST_STARTER_PACK,
  COST_PREMIUM,
} from '@castle-blast/shared';
import type { ShopResponse, ShopItem } from '@castle-blast/shared';

export const shopRouter = Router();

const shopItems: ShopItem[] = [
  { id: 'lives_refill', type: 'lives_refill', name: 'Lives Refill', description: '+5 lives', priceStars: COST_LIVES_REFILL },
  { id: 'extra_moves', type: 'extra_moves', name: 'Extra Moves', description: '+3 moves', priceStars: COST_EXTRA_MOVES },
  { id: 'booster_rockets', type: 'booster_rockets', name: 'Rocket Pack', description: '3 rockets', priceStars: COST_BOOSTER_PACK },
  { id: 'booster_bombs', type: 'booster_bombs', name: 'Bomb Pack', description: '3 bombs', priceStars: COST_BOOSTER_PACK },
  { id: 'starter_pack', type: 'starter_pack', name: 'Starter Pack', description: 'Lives + Boosters + Coins', priceStars: COST_STARTER_PACK },
  { id: 'premium', type: 'premium', name: 'Premium', description: 'Monthly benefits', priceStars: COST_PREMIUM },
];

shopRouter.get('/', requireAuth, (_req, res) => {
  const response: ShopResponse = { items: shopItems };
  res.json(response);
});

shopRouter.post('/purchase', requireAuth, (req, res) => {
  // TODO: Validate Telegram Stars payment, apply item
  res.json({ success: true, player: {} });
});
