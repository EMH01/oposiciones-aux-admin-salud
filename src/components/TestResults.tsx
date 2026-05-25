import type { TestRecord } from '../types';
import { questions } from '../data/questions';

interface TestResultsProps {
  record: TestRecord;
  onDashboard: () => void;
  onNewTest: () => void;
}

export default function TestResults({ record, onDashboard, onNewTest }: TestResultsProps) {
  const { correct, wrong, blank, score, totalQuestions, timeElapsed, topicBreakdown, config } = record;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m} min ${s} s` : `${s} s`;
  };

  const scoreColor = score >= 7 ? 'text-green-600' : score >= 5 ? 'text-yellow-500' : 'text-red-500';
  const passFail = score >= 5 ? 'APROBADO' : 'SUSPENSO';
  const passFailColor = score >= 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600';

  const topicRows = Object.entries(topicBreakdown).map(([topic, stats]) => {
    const total = stats.correct + stats.wrong + stats.blank;
    const pct = total > 0 ? Math.round((stats.correct / total) * 100) : 0;
    return { topic, ...stats, total, pct };
  }).sort((a, b) => a.pct - b.pct);

  // Questions answered wrongly (for review only - not for repeat button)
  const wrongQuestions = questions.filter(q => {
    const ans = record.answers[q.id];
    return ans !== undefined && ans !== null && ans !== q.correctAnswer;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 text-center">Resultados del test</h1>

      {/* Score card */}
      <div className="card text-center">
        <div className={`text-6xl font-bold ${scoreColor}`}>
          {score.toFixed(1)}
        </div>
        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${passFailColor}`}>
          {passFail}
        </span>
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div>
            <p className="text-2xl font-bold text-green-600">{correct}</p>
            <p className="text-xs text-gray-500">Correctas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-500">{wrong}</p>
            <p className="text-xs text-gray-500">Incorrectas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-400">{blank}</p>
            <p className="text-xs text-gray-500">En blanco</p>
          </div>
        </div>
        <div className="mt-4 flex justify-center gap-6 text-sm text-gray-500">
          <span>⏱ {formatTime(timeElapsed)}</span>
          <span>📝 {totalQuestions} preguntas</span>
          {config.penalty && <span>⚠ Con penalización</span>}
        </div>
      </div>

      {/* Topic breakdown */}
      <div className="card">
        <h2 className="font-semibold text-gray-700 mb-4">Resultados por tema</h2>
        <div className="space-y-3">
          {topicRows.map(({ topic, correct, wrong, blank, pct }) => (
            <div key={topic}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-700 truncate max-w-[55%]">{topic}</span>
                <div className="flex gap-3 text-xs">
                  <span className="text-green-600">{correct}✓</span>
                  <span className="text-red-500">{wrong}✗</span>
                  <span className="text-gray-400">{blank}—</span>
                  <span className="font-medium text-gray-600">{pct}%</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${pct >= 70 ? 'bg-green-400' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wrong answers review */}
      {wrongQuestions.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-1">Preguntas incorrectas ({wrongQuestions.length})</h2>
          <p className="text-xs text-gray-400 mb-4">
            Estas preguntas aparecerán con más frecuencia en tus próximos tests.
          </p>
          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {wrongQuestions.map(q => (
              <div key={q.id} className="border border-red-100 rounded-lg p-3 bg-red-50">
                <p className="text-xs text-blue-600 font-medium mb-1">{q.topic}</p>
                <p className="text-sm text-gray-800 mb-2">{q.question}</p>
                <div className="space-y-1">
                  {(['A','B','C','D'] as const).map(opt => (
                    <div
                      key={opt}
                      className={`text-xs px-2 py-1 rounded ${
                        opt === q.correctAnswer
                          ? 'bg-green-100 text-green-700 font-semibold'
                          : opt === record.answers[q.id]
                          ? 'bg-red-100 text-red-600 line-through'
                          : 'text-gray-500'
                      }`}
                    >
                      <span className="font-bold mr-1">{opt}.</span> {q.options[opt]}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions - NO "repetir falladas" button */}
      <div className="flex gap-3">
        <button onClick={onDashboard} className="btn-secondary flex-1">
          Ir al inicio
        </button>
        <button onClick={onNewTest} className="btn-primary flex-1">
          Nuevo test
        </button>
      </div>
    </div>
  );
}
