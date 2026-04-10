import type {
  LevelStartRequest,
  LevelStartResponse,
  LevelFinishRequest,
  LevelFinishResponse,
} from '@castle-blast/shared';
import { post } from './client';

export function startLevel(levelNum: number): Promise<LevelStartResponse> {
  return post<LevelStartResponse>('/levels/start', { levelNum } satisfies LevelStartRequest);
}

export function finishLevel(
  sessionId: string,
  result: LevelFinishRequest['result'],
): Promise<LevelFinishResponse> {
  return post<LevelFinishResponse>('/levels/finish', { sessionId, result } satisfies LevelFinishRequest);
}
