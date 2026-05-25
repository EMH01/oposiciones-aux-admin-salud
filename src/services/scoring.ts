import type { Question, AnswerOption } from '../types';

export interface ScoreResult {
  correct: number;
  wrong: number;
  blank: number;
  score: number; // 0-10
  rawPoints: number;
}

export function calculateScore(
  questions: Question[],
  answers: Record<number, AnswerOption | null>,
  penalty: boolean
): ScoreResult {
  const total = questions.length;
  let correct = 0;
  let wrong = 0;
  let blank = 0;

  for (const q of questions) {
    const answer = answers[q.id];
    if (answer === null || answer === undefined) {
      blank++;
    } else if (answer === q.correctAnswer) {
      correct++;
    } else {
      wrong++;
    }
  }

  let rawPoints: number;
  let score: number;

  if (penalty) {
    rawPoints = correct - wrong / 3;
    score = Math.max(0, (rawPoints / total) * 10);
  } else {
    rawPoints = correct;
    score = (correct / total) * 10;
  }

  return {
    correct,
    wrong,
    blank,
    score: Math.round(score * 100) / 100,
    rawPoints: Math.round(rawPoints * 100) / 100,
  };
}

export function getTopicBreakdown(
  questions: Question[],
  answers: Record<number, AnswerOption | null>
): Record<string, { correct: number; wrong: number; blank: number }> {
  const breakdown: Record<string, { correct: number; wrong: number; blank: number }> = {};

  for (const q of questions) {
    if (!breakdown[q.topic]) {
      breakdown[q.topic] = { correct: 0, wrong: 0, blank: 0 };
    }
    const answer = answers[q.id];
    if (answer === null || answer === undefined) {
      breakdown[q.topic].blank++;
    } else if (answer === q.correctAnswer) {
      breakdown[q.topic].correct++;
    } else {
      breakdown[q.topic].wrong++;
    }
  }

  return breakdown;
}
