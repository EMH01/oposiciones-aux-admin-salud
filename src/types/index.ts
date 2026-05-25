export type AnswerOption = 'A' | 'B' | 'C' | 'D';

export interface Question {
  id: number;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: AnswerOption;
  topic: string;
}

export interface QuestionProgress {
  questionId: number;
  timesSeen: number;
  timesCorrect: number;
  timesWrong: number;
  lastAnsweredAt: string | null;
  lastResult: 'correct' | 'wrong' | 'blank' | null;
  masteryLevel: number; // 0-5
}

export type TestMode = 'exam' | 'study';

export interface TestConfig {
  questionCount: number;
  mode: TestMode;
  topics: string[]; // empty = all topics
  penalty: boolean;
}

export interface TestRecord {
  id: string;
  date: string;
  config: TestConfig;
  answers: Record<number, AnswerOption | null>;
  score: number;
  correct: number;
  wrong: number;
  blank: number;
  totalQuestions: number;
  timeElapsed: number; // seconds
  topicBreakdown: Record<string, { correct: number; wrong: number; blank: number }>;
}

export interface AppState {
  questionProgress: Record<number, QuestionProgress>;
  testHistory: TestRecord[];
  lastUpdated: string;
}

export type AppScreen = 'dashboard' | 'setup' | 'test' | 'results' | 'stats';

export interface TestSession {
  config: TestConfig;
  questions: Question[];
  answers: Record<number, AnswerOption | null>;
  startedAt: number; // timestamp
  currentIndex: number;
  finished: boolean;
}
