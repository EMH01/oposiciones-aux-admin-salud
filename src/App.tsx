import { useState, useCallback } from "react";
import Dashboard from "./components/Dashboard";
import TestSetup from "./components/TestSetup";
import TestRunner from "./components/TestRunner";
import TestResults from "./components/TestResults";
import Stats from "./components/Stats";
import type { AppState, TestConfig, TestSession, TestRecord, AnswerOption, AppScreen } from "./types";
import { loadState, saveState, addTestRecord, updateProgress, resetAllProgress, exportData, importData } from "./services/storage";
import { selectQuestions } from "./services/questionSelector";
import { calculateScore, getTopicBreakdown } from "./services/scoring";

function App() {
  const [screen, setScreen] = useState<AppScreen>("dashboard");
  const [state, setState] = useState<AppState>(loadState);
  const [session, setSession] = useState<TestSession | null>(null);
  const [lastRecord, setLastRecord] = useState<TestRecord | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);

  const persistState = useCallback((newState: AppState) => {
    setState(newState);
    saveState(newState);
  }, []);

  const handleNewTest = () => setScreen("setup");

  const handleStartTest = (config: TestConfig) => {
    const qs = selectQuestions(state, config);
    if (qs.length === 0) {
      alert("No hay preguntas disponibles con esa configuracion.");
      return;
    }
    setSession({
      config,
      questions: qs,
      answers: {},
      startedAt: Date.now(),
      currentIndex: 0,
      finished: false,
    });
    setScreen("test");
  };

  const handleAnswer = (questionId: number, answer: AnswerOption | null) => {
    if (!session) return;
    setSession(prev => prev ? {
      ...prev,
      answers: { ...prev.answers, [questionId]: answer },
    } : prev);
  };

  const handleFinishTest = () => {
    if (!session) return;
    const { questions, answers, config, startedAt } = session;
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    const scoreResult = calculateScore(questions, answers, config.penalty);
    const topicBreakdown = getTopicBreakdown(questions, answers);

    const record: TestRecord = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      config,
      answers,
      score: scoreResult.score,
      correct: scoreResult.correct,
      wrong: scoreResult.wrong,
      blank: scoreResult.blank,
      totalQuestions: questions.length,
      timeElapsed: elapsed,
      topicBreakdown,
    };

    let newState = state;
    for (const q of questions) {
      const ans = answers[q.id];
      const result = ans === null || ans === undefined
        ? "blank"
        : ans === q.correctAnswer ? "correct" : "wrong";
      newState = updateProgress(newState, q.id, result);
    }
    newState = addTestRecord(newState, record);
    persistState(newState);
    setLastRecord(record);
    setSession(null);
    setScreen("results");
  };

  const handleReset = () => {
    if (!resetConfirm) { setResetConfirm(true); return; }
    resetAllProgress();
    setState(loadState());
    setResetConfirm(false);
  };

  const handleExport = () => exportData(state);

  const handleImport = (json: string) => {
    const imported = importData(json);
    if (!imported) {
      alert("Archivo invalido o corrupto.");
      return;
    }
    persistState(imported);
    alert("Datos importados correctamente.");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {screen === "dashboard" && (
        <Dashboard
          state={state}
          onNewTest={handleNewTest}
          onStats={() => setScreen("stats")}
          onReset={handleReset}
        />
      )}
      {screen === "setup" && (
        <TestSetup
          onStart={handleStartTest}
          onBack={() => setScreen("dashboard")}
        />
      )}
      {screen === "test" && session && (
        <TestRunner
          session={session}
          onAnswer={handleAnswer}
          onFinish={handleFinishTest}
        />
      )}
      {screen === "results" && lastRecord && (
        <TestResults
          record={lastRecord}
          onDashboard={() => setScreen("dashboard")}
          onNewTest={() => setScreen("setup")}
        />
      )}
      {screen === "stats" && (
        <Stats
          state={state}
          onBack={() => setScreen("dashboard")}
          onExport={handleExport}
          onImport={handleImport}
        />
      )}

      {resetConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">¿Reiniciar estadisticas?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Se borraran todos tus progresos, historial de tests y estadisticas. Esta accion no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setResetConfirm(false)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                className="btn-danger flex-1"
              >
                Borrar todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
