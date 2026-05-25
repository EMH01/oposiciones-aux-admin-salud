import { useState } from 'react';
import type { TestConfig, TestMode } from '../types';
import { TOPICS } from '../data/questions';

interface TestSetupProps {
  onStart: (config: TestConfig) => void;
  onBack: () => void;
}

export default function TestSetup({ onStart, onBack }: TestSetupProps) {
  const [questionCount, setQuestionCount] = useState(25);
  const [mode, setMode] = useState<TestMode>('exam');
  const [penalty, setPenalty] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handleStart = () => {
    onStart({ questionCount, mode, penalty, topics: selectedTopics });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600">
          ← Volver
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Configurar test</h1>
      </div>

      {/* Número de preguntas */}
      <div className="card">
        <h2 className="font-semibold text-gray-700 mb-4">Número de preguntas</h2>
        <div className="flex flex-wrap gap-3">
          {[10, 25, 50, 100].map(n => (
            <button
              key={n}
              onClick={() => setQuestionCount(n)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                questionCount === n
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <label className="text-sm text-gray-500 block mb-1">Personalizado</label>
          <input
            type="number"
            min={1}
            max={100}
            value={questionCount}
            onChange={e => setQuestionCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
            className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Modo */}
      <div className="card">
        <h2 className="font-semibold text-gray-700 mb-4">Modo</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode('exam')}
            className={`p-4 rounded-xl border-2 text-left transition-colors ${
              mode === 'exam' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="font-semibold text-gray-800">Examen</p>
            <p className="text-xs text-gray-500 mt-1">Sin feedback hasta el final</p>
          </button>
          <button
            onClick={() => setMode('study')}
            className={`p-4 rounded-xl border-2 text-left transition-colors ${
              mode === 'study' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="font-semibold text-gray-800">Estudio</p>
            <p className="text-xs text-gray-500 mt-1">Feedback inmediato tras cada respuesta</p>
          </button>
        </div>
      </div>

      {/* Penalización */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-700">Penalización por error</h2>
            <p className="text-xs text-gray-500 mt-1">Cada 3 fallos restan 1 acierto</p>
          </div>
          <button
            onClick={() => setPenalty(p => !p)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              penalty ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                penalty ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Filtro por tema */}
      <div className="card">
        <h2 className="font-semibold text-gray-700 mb-1">Filtrar por tema</h2>
        <p className="text-xs text-gray-500 mb-4">
          {selectedTopics.length === 0 ? 'Todos los temas seleccionados' : `${selectedTopics.length} temas seleccionados`}
        </p>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map(topic => (
            <button
              key={topic}
              onClick={() => toggleTopic(topic)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedTopics.includes(topic)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
        {selectedTopics.length > 0 && (
          <button
            onClick={() => setSelectedTopics([])}
            className="mt-3 text-xs text-gray-400 hover:text-gray-600"
          >
            Limpiar selección
          </button>
        )}
      </div>

      <button onClick={handleStart} className="btn-primary w-full py-3 text-base">
        Comenzar test ({questionCount} preguntas)
      </button>
    </div>
  );
}
