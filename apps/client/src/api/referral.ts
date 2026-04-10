import { get, post } from './client.js';
import type { ReferralStatsResponse, ClaimReferralRewardResponse } from '@castle-blast/shared';

export function fetchReferralStats(): Promise<ReferralStatsResponse> {
  return get<ReferralStatsResponse>('/referral/stats');
}

export function applyReferralCode(referralCode: string): Promise<{ success: boolean }> {
  return post<{ success: boolean }>('/referral/apply', { referralCode });
}

export function claimReferralReward(threshold: number): Promise<ClaimReferralRewardResponse> {
  return post<ClaimReferralRewardResponse>('/referral/claim', { threshold });
}
