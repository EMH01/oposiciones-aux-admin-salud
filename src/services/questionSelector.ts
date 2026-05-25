import type { Question, AppState, TestConfig } from '../types';
import { questions } from '../data/questions';
import { getProgress } from './storage';

type Priority = 'never_seen' | 'failed' | 'seen_low' | 'seen_high';

function getPriority(state: AppState, q: Question): Priority {
  const p = getProgress(state, q.id);
  if (p.timesSeen === 0) return 'never_seen';
  if (p.lastResult === 'wrong' || p.timesWrong > p.timesCorrect) return 'failed';
  if (p.masteryLevel < 3) return 'seen_low';
  return 'seen_high';
}

const PRIORITY_WEIGHT: Record<Priority, number> = {
  never_seen: 8,
  failed: 5,
  seen_low: 3,
  seen_high: 1,
};

function weightedShuffle<T>(items: T[], weightFn: (item: T) => number): T[] {
  const weighted = items.map(item => ({ item, weight: weightFn(item), rand: Math.random() }));
  weighted.sort((a, b) => {
    const scoreA = a.weight * a.rand;
    const scoreB = b.weight * b.rand;
    return scoreB - scoreA;
  });
  return weighted.map(x => x.item);
}

export function selectQuestions(state: AppState, config: TestConfig): Question[] {
  const pool = config.topics.length > 0
    ? questions.filter(q => config.topics.includes(q.topic))
    : questions;

  const sorted = weightedShuffle(pool, q => {
    const priority = getPriority(state, q);
    return PRIORITY_WEIGHT[priority];
  });

  return sorted.slice(0, Math.min(config.questionCount, sorted.length));
}
