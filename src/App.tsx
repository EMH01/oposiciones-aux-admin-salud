import { useState, useCallback, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import TestSetup from "./components/TestSetup";
import TestRunner from "./components/TestRunner";
import TestResults from "./components/TestResults";
import Stats from "./components/Stats";
import type { AppState, TestConfig, TestSession, TestRecord, AnswerOption, AppScreen } from "./types";
import { loadState, saveState, addTestRecord, updateProgress, resetAllProgress, exportData, importData } from "./services/storage";
import { selectQuestions } from "./services/questionSelector";
import { calculateScore, getTopicBreakdown } from "./services/scoring";
import { loadFromPdf } from "./services/pdfLoader";
import { questions } from "./data/questions";

function isPlaceholder() {
  return questions[0]?.question.includes('[Proporciona el PDF');
}

function App() {
  const [screen, setScreen] = useState<AppScreen>("dashboard");
  const [state, setState] = useState<AppState>(loadState);
  // questionsKey fuerza re-render de toda la UI cuando se cargan las preguntas del PDF
  const [questionsKey, setQuestionsKey] = useState(0);
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'loading' | 'done' | 'error'>(
    isPlaceholder() ? 'loading' : 'done',
  );
  const [pdfMsg, setPdfMsg] = useState('Cargando preguntas desde PDF…');
  const [session, setSession] = useState<TestSession | null>(null);
  const [lastRecord, setLastRecord] = useState<TestRecord | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);

  // Carga el PDF al primer arranque si las preguntas son placeholder
  useEffect(() => {
    if (pdfStatus !== 'loading') return;
    loadFromPdf((msg) => setPdfMsg(msg))
      .then((count) => {
        console.log(`PDF: ${count} preguntas parseadas`);
        setPdfStatus('done');
        setQuestionsKey(k => k + 1);
      })
      .catch((err: unknown) => {
        console.warn('PDF no disponible:', err);
        setPdfStatus('error');
        setPdfMsg(err instanceof Error ? err.message : String(err));
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      {/* Pantalla de carga del PDF (solo primer arranque) */}
      {pdfStatus === 'loading' && (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center gap-4 z-50">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 text-sm">{pdfMsg}</p>
        </div>
      )}

      {/* Aviso si el PDF no está disponible */}
      {pdfStatus === 'error' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 flex items-center gap-2">
          <span>⚠️</span>
          <span>
            Preguntas en modo plantilla —{' '}
            <span className="font-mono text-xs">{pdfMsg}</span>
          </span>
        </div>
      )}

      <div key={questionsKey}>
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
      </div>{/* end questionsKey */}
    </div>
  );
}

export default App;
