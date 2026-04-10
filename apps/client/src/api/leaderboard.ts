import { get, post } from './client.js';
import type { LeaderboardResponse } from '@castle-blast/shared';

export function fetchLeaderboard(): Promise<LeaderboardResponse> {
  return get<LeaderboardResponse>('/leaderboard');
}

export function submitScore(score: number): Promise<{ success: boolean }> {
  return post<{ success: boolean }>('/leaderboard/submit', { score });
}
