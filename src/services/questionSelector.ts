import type { AppState, Question, TestConfig } from '../types';
import { questions } from '../data/questions';
import { getProgress } from './storage';

type Priority = 'never_seen' | 'failed' | 'seen_low' | 'seen_high';

function getPriority(state: AppState, q: Question): Priority {
  const progress = getProgress(state, q.id);
  if (progress.timesSeen === 0) return 'never_seen';
  if (
    progress.lastResult === 'wrong'
    || progress.timesWrong > progress.timesCorrect
  ) {
    return 'failed';
  }
  if (progress.masteryLevel < 3) return 'seen_low';
  return 'seen_high';
}

const PRIORITY_WEIGHT: Record<Priority, number> = {
  never_seen: 8,
  failed: 5,
  seen_low: 3,
  seen_high: 1,
};

/**
 * Weighted random permutation using exponential keys.
 *
 * Higher-weight items are more likely to appear earlier while every item
 * remains eligible. This avoids the distortion produced by sorting on
 * `weight * Math.random()`.
 */
function weightedShuffle<T>(
  items: T[],
  weightFn: (item: T) => number,
): T[] {
  return items
    .map((item) => {
      const weight = Math.max(weightFn(item), Number.EPSILON);
      const random = Math.max(Math.random(), Number.MIN_VALUE);
      return {
        item,
        key: random ** (1 / weight),
      };
    })
    .sort((a, b) => b.key - a.key)
    .map(({ item }) => item);
}

export function selectQuestions(
  state: AppState,
  config: TestConfig,
): Question[] {
  const pool = config.topics.length > 0
    ? questions.filter((question) => config.topics.includes(question.topic))
    : questions;

  const ordered = weightedShuffle(pool, (question) => {
    const priority = getPriority(state, question);
    return PRIORITY_WEIGHT[priority];
  });

  return ordered.slice(0, Math.min(config.questionCount, ordered.length));
}
