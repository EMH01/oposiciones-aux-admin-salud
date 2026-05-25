import type { AppState } from '../types';
import { questions, TOPICS } from '../data/questions';
import { getProgress } from '../services/storage';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

interface StatsProps {
  state: AppState;
  onBack: () => void;
  onExport: () => void;
  onImport: (json: string) => void;
}

export default function Stats({ state, onBack, onExport, onImport }: StatsProps) {
  const tests = [...state.testHistory].reverse();
  const scoreHistory = tests.slice(-20).map((t, i) => ({
    n: i + 1,
    nota: t.score,
    date: new Date(t.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
  }));

  const topicStats = TOPICS.map(topic => {
    const topicQs = questions.filter(q => q.topic === topic);
    const seen = topicQs.filter(q => getProgress(state, q.id).timesSeen > 0).length;
    const correct = topicQs.reduce((s, q) => s + getProgress(state, q.id).timesCorrect, 0);
    const wrong = topicQs.reduce((s, q) => s + getProgress(state, q.id).timesWrong, 0);
    const total = correct + wrong;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { topic: topic.length > 20 ? topic.slice(0, 20) + '…' : topic, accuracy, seen, total: topicQs.length };
  });

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const json = ev.target?.result as string;
        onImport(json);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const totalTests = state.testHistory.length;
  const avgScore = totalTests > 0
    ? (state.testHistory.reduce((s, t) => s + t.score, 0) / totalTests).toFixed(2)
    : '—';
  const bestScore = totalTests > 0
    ? Math.max(...state.testHistory.map(t => t.score)).toFixed(1)
    : '—';
  const totalCorrect = Object.values(state.questionProgress).reduce((s, p) => s + p.timesCorrect, 0);
  const totalWrong = Object.values(state.questionProgress).reduce((s, p) => s + p.timesWrong, 0);
  const globalAccuracy = (totalCorrect + totalWrong) > 0
    ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100)
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600">
            ← Volver
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={handleImportClick} className="btn-secondary text-sm py-1.5">
            Importar
          </button>
          <button onClick={onExport} className="btn-secondary text-sm py-1.5">
            Exportar
          </button>
        </div>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="Tests totales" value={totalTests.toString()} />
        <MiniStat label="Nota media" value={avgScore} />
        <MiniStat label="Mejor nota" value={bestScore} />
        <MiniStat label="Precisión global" value={`${globalAccuracy}%`} />
      </div>

      {/* Score evolution chart */}
      {scoreHistory.length > 1 && (
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-4">Evolución de notas (últimos 20)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={scoreHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(v: any) => [typeof v === 'number' ? v.toFixed(1) : String(v), 'Nota']}
                labelFormatter={(l) => `Test: ${l}`}
              />
              <Line
                type="monotone"
                dataKey="nota"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Accuracy by topic */}
      <div className="card">
        <h2 className="font-semibold text-gray-700 mb-4">Precisión por tema</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={topicStats} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
            <YAxis type="category" dataKey="topic" width={140} tick={{ fontSize: 10 }} />
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <Tooltip formatter={(v: any) => [`${v}%`, 'Precisión']} />
            <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
              {topicStats.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.accuracy >= 70 ? '#22c55e' : entry.accuracy >= 50 ? '#f59e0b' : '#ef4444'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Test history */}
      {totalTests > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-4">Historial de tests</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b">
                  <th className="text-left pb-2 pr-4">Fecha</th>
                  <th className="text-right pb-2 pr-4">Nota</th>
                  <th className="text-right pb-2 pr-4">✓</th>
                  <th className="text-right pb-2 pr-4">✗</th>
                  <th className="text-right pb-2 pr-4">—</th>
                  <th className="text-left pb-2">Modo</th>
                </tr>
              </thead>
              <tbody>
                {state.testHistory.slice(0, 50).map(test => (
                  <tr key={test.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 pr-4 text-gray-500">
                      {new Date(test.date).toLocaleDateString('es-ES', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className={`py-2 pr-4 text-right font-semibold ${
                      test.score >= 5 ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {test.score.toFixed(1)}
                    </td>
                    <td className="py-2 pr-4 text-right text-green-600">{test.correct}</td>
                    <td className="py-2 pr-4 text-right text-red-500">{test.wrong}</td>
                    <td className="py-2 pr-4 text-right text-gray-400">{test.blank}</td>
                    <td className="py-2 text-gray-500 text-xs">
                      {test.config.mode === 'exam' ? 'Examen' : 'Estudio'}
                      {test.config.penalty && ' · Penaliz.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card py-4">
      <p className="text-xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
