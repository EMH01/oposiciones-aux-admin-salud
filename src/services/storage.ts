import type { AppState, QuestionProgress, TestRecord } from '../types';

const STORAGE_KEY = 'oposiciones_sas_v1';

const DEFAULT_STATE: AppState = {
  questionProgress: {},
  testHistory: [],
  lastUpdated: new Date().toISOString(),
};

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return JSON.parse(raw) as AppState;
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      lastUpdated: new Date().toISOString(),
    }));
  } catch {
    console.error('Error al guardar estado en localStorage');
  }
}

export function getProgress(state: AppState, questionId: number): QuestionProgress {
  return state.questionProgress[questionId] ?? {
    questionId,
    timesSeen: 0,
    timesCorrect: 0,
    timesWrong: 0,
    lastAnsweredAt: null,
    lastResult: null,
    masteryLevel: 0,
  };
}

export function updateProgress(
  state: AppState,
  questionId: number,
  result: 'correct' | 'wrong' | 'blank'
): AppState {
  const prev = getProgress(state, questionId);
  const timesCorrect = result === 'correct' ? prev.timesCorrect + 1 : prev.timesCorrect;
  const timesWrong = result === 'wrong' ? prev.timesWrong + 1 : prev.timesWrong;
  const timesSeen = prev.timesSeen + 1;

  let masteryLevel = prev.masteryLevel;
  if (result === 'correct') {
    masteryLevel = Math.min(5, masteryLevel + 1);
  } else if (result === 'wrong') {
    masteryLevel = Math.max(0, masteryLevel - 1);
  }

  return {
    ...state,
    questionProgress: {
      ...state.questionProgress,
      [questionId]: {
        questionId,
        timesSeen,
        timesCorrect,
        timesWrong,
        lastAnsweredAt: new Date().toISOString(),
        lastResult: result,
        masteryLevel,
      },
    },
  };
}

export function addTestRecord(state: AppState, record: TestRecord): AppState {
  return {
    ...state,
    testHistory: [record, ...state.testHistory].slice(0, 200),
  };
}

export function resetAllProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportData(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `oposiciones_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(json: string): AppState | null {
  try {
    const data = JSON.parse(json) as AppState;
    if (!data.questionProgress || !data.testHistory) return null;
    return data;
  } catch {
    return null;
  }
}
