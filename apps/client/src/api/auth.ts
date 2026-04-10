import type { AuthRequest, AuthResponse } from '@castle-blast/shared';
import { post } from './client';

export function authenticateTelegram(initData: string): Promise<AuthResponse> {
  return post<AuthResponse>('/auth/telegram', { initData } satisfies AuthRequest);
}
