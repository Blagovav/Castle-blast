import type {
  ShopResponse,
  PurchaseRequest,
  PurchaseResponse,
} from '@castle-blast/shared';
import { get, post } from './client';

export function fetchShopItems(): Promise<ShopResponse> {
  return get<ShopResponse>('/shop');
}

export function purchaseItem(itemId: string): Promise<PurchaseResponse> {
  return post<PurchaseResponse>('/shop/purchase', { itemId } satisfies PurchaseRequest);
}
