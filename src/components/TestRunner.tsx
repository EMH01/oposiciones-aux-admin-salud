import { useState, useEffect } from 'react';
import type { TestSession, AnswerOption } from '../types';

interface TestRunnerProps {
  session: TestSession;
  onAnswer: (questionId: number, answer: AnswerOption | null) => void;
  onFinish: () => void;
}

const OPTION_LABELS: AnswerOption[] = ['A', 'B', 'C', 'D'];

export default function TestRunner({ session, onAnswer, onFinish }: TestRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(session.currentIndex);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const question = session.questions[currentIndex];
  const total = session.questions.length;
  const isStudyMode = session.config.mode === 'study';
  const isLastQuestion = currentIndex === total - 1;
  const existingAnswer = session.answers[question?.id] ?? null;

  useEffect(() => {
    setSelectedAnswer(existingAnswer);
    setShowFeedback(isStudyMode && existingAnswer !== null);
  }, [currentIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - session.startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [session.startedAt]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelect = (option: AnswerOption) => {
    if (isStudyMode && showFeedback) return; // locked after feedback
    setSelectedAnswer(option);
    onAnswer(question.id, option);
    if (isStudyMode) {
      setShowFeedback(true);
    }
  };

  const handleBlank = () => {
    if (isStudyMode && showFeedback) return;
    setSelectedAnswer(null);
    onAnswer(question.id, null);
    if (isStudyMode) {
      setShowFeedback(true);
    }
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex(i => i + 1);
      setShowFeedback(false);
      setSelectedAnswer(null);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      setShowFeedback(false);
      setSelectedAnswer(null);
    }
  };

  const getOptionStyle = (option: AnswerOption) => {
    if (!showFeedback || !isStudyMode) {
      return selectedAnswer === option
        ? 'border-blue-500 bg-blue-50 text-blue-800'
        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50';
    }
    // Study mode with feedback
    if (option === question.correctAnswer) return 'border-green-500 bg-green-50 text-green-800';
    if (option === selectedAnswer && option !== question.correctAnswer)
      return 'border-red-400 bg-red-50 text-red-700';
    return 'border-gray-200 text-gray-500';
  };

  const answeredCount = Object.keys(session.answers).length;
  const progress = Math.round(((currentIndex + 1) / total) * 100);

  if (!question) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          <span className="font-medium text-gray-700">{currentIndex + 1}</span>/{total}
          <span className="ml-3 text-xs text-gray-400">{answeredCount} respondidas</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 font-mono">{formatTime(elapsed)}</span>
          {session.config.mode === 'study' && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Estudio</span>
          )}
          {session.config.mode === 'exam' && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Examen</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div className="card">
        <div className="flex justify-between items-start mb-1">
          <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">
            {question.topic}
          </span>
          <span className="text-xs text-gray-400">P.{question.id}</span>
        </div>
        <p className="text-gray-800 font-medium text-base leading-relaxed mt-3">
          {question.question}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {OPTION_LABELS.map(option => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-colors duration-150 ${getOptionStyle(option)}`}
            disabled={isStudyMode && showFeedback}
          >
            <span className="font-bold mr-3 text-sm">{option}.</span>
            {question.options[option]}
          </button>
        ))}
      </div>

      {/* Study mode feedback */}
      {isStudyMode && showFeedback && (
        <div className={`rounded-xl p-4 ${
          selectedAnswer === question.correctAnswer
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          {selectedAnswer === question.correctAnswer ? (
            <p className="text-green-700 font-semibold">✓ ¡Correcto!</p>
          ) : selectedAnswer === null ? (
            <p className="text-gray-600 font-semibold">
              En blanco — La respuesta correcta era <strong>{question.correctAnswer}</strong>
            </p>
          ) : (
            <p className="text-red-700 font-semibold">
              ✗ Incorrecto — La respuesta correcta es <strong>{question.correctAnswer}</strong>
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="btn-secondary disabled:opacity-40"
        >
          ← Anterior
        </button>

        <button
          onClick={handleBlank}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          disabled={isStudyMode && showFeedback}
        >
          Dejar en blanco
        </button>

        {isLastQuestion ? (
          <button
            onClick={onFinish}
            className="btn-primary"
          >
            Finalizar test
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="btn-primary"
          >
            Siguiente →
          </button>
        )}
      </div>

      {/* Question navigator */}
      <div className="card">
        <p className="text-xs text-gray-500 mb-2 font-medium">Navegador</p>
        <div className="flex flex-wrap gap-1">
          {session.questions.map((q, idx) => {
            const ans = session.answers[q.id];
            let cls = 'w-7 h-7 text-xs rounded font-medium transition-colors cursor-pointer ';
            if (idx === currentIndex) {
              cls += 'bg-blue-600 text-white';
            } else if (ans !== undefined) {
              cls += 'bg-green-100 text-green-700 hover:bg-green-200';
            } else {
              cls += 'bg-gray-100 text-gray-500 hover:bg-gray-200';
            }
            return (
              <button
                key={q.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setShowFeedback(false);
                }}
                className={cls}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
