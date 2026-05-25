import type { AppState } from '../types';
import { questions, TOPICS } from '../data/questions';
import { getProgress } from '../services/storage';

interface DashboardProps {
  state: AppState;
  onNewTest: () => void;
  onStats: () => void;
  onReset: () => void;
}

export default function Dashboard({ state, onNewTest, onStats, onReset }: DashboardProps) {
  const totalQ = questions.length;
  const seen = Object.values(state.questionProgress).filter(p => p.timesSeen > 0).length;
  const mastered = Object.values(state.questionProgress).filter(p => p.masteryLevel >= 4).length;
  const testsCount = state.testHistory.length;

  const avgScore = testsCount > 0
    ? (state.testHistory.reduce((s, t) => s + t.score, 0) / testsCount).toFixed(1)
    : '—';

  const coveragePct = Math.round((seen / totalQ) * 100);
  const masteredPct = Math.round((mastered / totalQ) * 100);

  const topicStats = TOPICS.map(topic => {
    const topicQs = questions.filter(q => q.topic === topic);
    const seenCount = topicQs.filter(q => getProgress(state, q.id).timesSeen > 0).length;
    const failedCount = topicQs.filter(q => {
      const p = getProgress(state, q.id);
      return p.timesSeen > 0 && p.timesWrong > p.timesCorrect;
    }).length;
    return { topic, total: topicQs.length, seen: seenCount, failed: failedCount };
  });

  const lastTests = state.testHistory.slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Oposiciones SAS</h1>
          <p className="text-gray-500 mt-1">Grupo Auxiliar Administrativo · 300 preguntas</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onStats} className="btn-secondary">
            Estadísticas
          </button>
          <button onClick={onNewTest} className="btn-primary">
            Nuevo test
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Tests realizados" value={testsCount.toString()} color="blue" />
        <StatCard label="Nota media" value={avgScore} color="green" />
        <StatCard label="Cobertura" value={`${coveragePct}%`} color="purple" />
        <StatCard label="Dominadas" value={`${masteredPct}%`} color="orange" />
      </div>

      {/* Progress bar */}
      <div className="card">
        <h2 className="font-semibold text-gray-700 mb-3">Progreso global</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Preguntas vistas: {seen} / {totalQ}</span>
            <span>{coveragePct}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${coveragePct}%` }}
            />
          </div>
        </div>
        <div className="space-y-2 mt-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Dominadas (nivel ≥4): {mastered} / {totalQ}</span>
            <span>{masteredPct}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${masteredPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Topic breakdown */}
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-4">Por tema</h2>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {topicStats.map(({ topic, total, seen, failed }) => {
              const pct = total > 0 ? Math.round((seen / total) * 100) : 0;
              return (
                <div key={topic}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span className="truncate max-w-[60%]">{topic}</span>
                    <span className="flex gap-2">
                      {failed > 0 && (
                        <span className="text-red-500 font-medium">{failed} falladas</span>
                      )}
                      <span>{seen}/{total}</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-400 h-2 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent tests */}
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-4">Últimos tests</h2>
          {lastTests.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">
              Aún no has realizado ningún test
            </p>
          ) : (
            <div className="space-y-3">
              {lastTests.map(test => (
                <div key={test.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {test.config.questionCount} preguntas
                      <span className="ml-2 text-xs text-gray-400">
                        {test.config.mode === 'exam' ? '· Examen' : '· Estudio'}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(test.date).toLocaleDateString('es-ES', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${test.score >= 5 ? 'text-green-600' : 'text-red-500'}`}>
                      {test.score.toFixed(1)}
                    </span>
                    <p className="text-xs text-gray-400">
                      {test.correct}✓ {test.wrong}✗ {test.blank}—
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reset button */}
      <div className="flex justify-end">
        <button onClick={onReset} className="text-sm text-red-400 hover:text-red-600 transition-colors">
          Reiniciar estadísticas
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    orange: 'text-orange-600 bg-orange-50',
  };
  return (
    <div className={`rounded-xl p-4 ${colors[color] ?? 'bg-gray-50 text-gray-700'}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-1 opacity-75">{label}</p>
    </div>
  );
}
