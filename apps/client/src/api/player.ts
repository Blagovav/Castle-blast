import type { PlayerResponse } from '@castle-blast/shared';
import { get } from './client';

export function fetchPlayerProfile(): Promise<PlayerResponse> {
  return get<PlayerResponse>('/player/me');
}
