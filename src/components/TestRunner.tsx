import { useEffect, useState } from 'react';
import type { AnswerOption, TestSession } from '../types';

interface TestRunnerProps {
  session: TestSession;
  onAnswer: (questionId: number, answer: AnswerOption | null) => void;
  onFinish: () => void;
}

const OPTION_LABELS: AnswerOption[] = ['A', 'B', 'C', 'D'];

export default function TestRunner({ session, onAnswer, onFinish }: TestRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(session.currentIndex);
  const [elapsed, setElapsed] = useState(0);

  const question = session.questions[currentIndex];
  const total = session.questions.length;
  const isStudyMode = session.config.mode === 'study';
  const isLastQuestion = currentIndex === total - 1;

  const hasAnswer = question
    ? Object.prototype.hasOwnProperty.call(session.answers, question.id)
    : false;
  const selectedAnswer = question && hasAnswer
    ? (session.answers[question.id] ?? null)
    : null;
  const showFeedback = isStudyMode && hasAnswer;

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - session.startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [session.startedAt]);

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!question) return null;

  const handleSelect = (option: AnswerOption) => {
    if (showFeedback) return;
    onAnswer(question.id, option);
  };

  const handleBlank = () => {
    if (showFeedback) return;
    onAnswer(question.id, null);
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((index) => index + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((index) => index - 1);
    }
  };

  const getOptionStyle = (option: AnswerOption) => {
    if (!showFeedback) {
      return selectedAnswer === option
        ? 'border-blue-500 bg-blue-50 text-blue-800'
        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50';
    }
    if (option === question.correctAnswer) {
      return 'border-green-500 bg-green-50 text-green-800';
    }
    if (option === selectedAnswer) {
      return 'border-red-400 bg-red-50 text-red-700';
    }
    return 'border-gray-200 text-gray-500';
  };

  const answeredCount = Object.keys(session.answers).length;
  const progress = Math.round(((currentIndex + 1) / total) * 100);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          <span className="font-medium text-gray-700">{currentIndex + 1}</span>/{total}
          <span className="ml-3 text-xs text-gray-400">{answeredCount} respondidas</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 font-mono">{formatTime(elapsed)}</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {isStudyMode ? 'Estudio' : 'Examen'}
          </span>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

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

      <div className="space-y-2">
        {OPTION_LABELS.map((option) => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-colors duration-150 ${getOptionStyle(option)}`}
            disabled={showFeedback}
          >
            <span className="font-bold mr-3 text-sm">{option}.</span>
            {question.options[option]}
          </button>
        ))}
      </div>

      {showFeedback && (
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
          disabled={showFeedback}
        >
          Dejar en blanco
        </button>

        {isLastQuestion ? (
          <button onClick={onFinish} className="btn-primary">
            Finalizar test
          </button>
        ) : (
          <button onClick={handleNext} className="btn-primary">
            Siguiente →
          </button>
        )}
      </div>

      <div className="card">
        <p className="text-xs text-gray-500 mb-2 font-medium">Navegador</p>
        <div className="flex flex-wrap gap-1">
          {session.questions.map((item, index) => {
            const answered = Object.prototype.hasOwnProperty.call(
              session.answers,
              item.id,
            );
            let className =
              'w-7 h-7 text-xs rounded font-medium transition-colors cursor-pointer ';
            if (index === currentIndex) {
              className += 'bg-blue-600 text-white';
            } else if (answered) {
              className += 'bg-green-100 text-green-700 hover:bg-green-200';
            } else {
              className += 'bg-gray-100 text-gray-500 hover:bg-gray-200';
            }
            return (
              <button
                key={item.id}
                onClick={() => setCurrentIndex(index)}
                className={className}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
