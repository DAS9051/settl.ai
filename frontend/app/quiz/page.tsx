'use client'

import { useState, useEffect } from 'react'
import { getQuizQuestion, evaluateQuizAnswer } from '@/lib/api'
import type { QuizQuestion, QuizEvaluationResponse } from '@/lib/types'
import { useLanguage } from '@/contexts/LanguageContext'

const CATEGORIES = [
  'Email etiquette',
  'Meeting norms',
  'Workplace dress code',
  'Jargon and slang',
  'Hierarchy and authority',
  'Time and punctuality',
]

const CATEGORY_COLORS: Record<string, string> = {
  'Email etiquette': 'bg-blue-100 text-blue-700',
  'Meeting norms': 'bg-purple-100 text-purple-700',
  'Workplace dress code': 'bg-pink-100 text-pink-700',
  'Jargon and slang': 'bg-indigo-100 text-indigo-700',
  'Hierarchy and authority': 'bg-amber-100 text-amber-700',
  'Time and punctuality': 'bg-teal-100 text-teal-700',
}

function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

export default function QuizPage() {
  const { t } = useLanguage()
  const [question, setQuestion] = useState<QuizQuestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [evaluation, setEvaluation] = useState<QuizEvaluationResponse | null>(null)
  const [evaluating, setEvaluating] = useState(false)
  const [streak, setStreak] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('quizStreak')
    if (saved) {
      const parsed = parseInt(saved, 10)
      if (!isNaN(parsed)) setStreak(parsed)
    }
  }, [])

  async function loadQuestion(category?: string) {
    setLoading(true)
    setError(null)
    setQuestion(null)
    setSelectedAnswer(null)
    setEvaluation(null)
    try {
      const q = await getQuizQuestion(category || selectedCategory || undefined)
      setQuestion(q)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load question')
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectAnswer(answer: string) {
    if (!question || evaluating || evaluation) return
    setSelectedAnswer(answer)
    setEvaluating(true)
    try {
      const result = await evaluateQuizAnswer(question.question, question.options, answer)
      setEvaluation(result)
      if (result.correct) {
        const newStreak = streak + 1
        setStreak(newStreak)
        localStorage.setItem('quizStreak', String(newStreak))
      } else {
        setStreak(0)
        localStorage.setItem('quizStreak', '0')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate answer')
    } finally {
      setEvaluating(false)
    }
  }

  function getOptionStyle(option: string) {
    if (!evaluation || !selectedAnswer) {
      return selectedAnswer === option
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
    }
    if (option === evaluation.correct_answer) return 'border-green-500 bg-green-50'
    if (option === selectedAnswer && !evaluation.correct) return 'border-red-500 bg-red-50'
    return 'border-gray-200 opacity-50'
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">{t.quizTitle}</h1>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            <span className="text-xl">🔥</span>
            <span className="text-lg font-bold text-amber-700">{streak}</span>
            <span className="text-xs text-amber-600 font-medium">{t.quizStreak}</span>
          </div>
        </div>
        <p className="text-sm text-gray-500">{t.quizSubtitle}</p>
      </div>

      {/* Category filters */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.quizTopic}</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setSelectedCategory(null); }}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
              selectedCategory === null
                ? 'bg-gray-800 text-white border-gray-800'
                : 'border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            {t.quizRandom}
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                selectedCategory === cat
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Question card */}
      {!question && !loading && !error && (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-sm">
          <div className="text-5xl mb-4">🍁</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to learn?</h2>
          <p className="text-sm text-gray-500 mb-6">
            Each question covers a real aspect of Canadian work culture with encouraging feedback.
          </p>
          <button
            onClick={() => loadQuestion()}
            className="px-8 py-3 bg-blue-800 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            {t.quizStart}
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-sm">
          <div className="flex items-center justify-center gap-3 text-gray-400">
            <Spinner />
            <span className="text-sm">{t.quizGenerating}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 text-sm mb-3">{error}</p>
          <button onClick={() => loadQuestion()} className="text-sm text-red-700 underline">Try again</button>
        </div>
      )}

      {question && !loading && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          {/* Category badge */}
          <div className="mb-4">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[question.category] || 'bg-gray-100 text-gray-600'}`}>
              {question.category}
            </span>
          </div>

          {/* Question */}
          <h2 className="text-lg font-semibold text-gray-900 mb-5 leading-relaxed">{question.question}</h2>

          {/* Options */}
          <div className="space-y-3 mb-5">
            {question.options.map((option, i) => (
              <button
                key={i}
                onClick={() => handleSelectAnswer(option)}
                disabled={!!evaluation || evaluating}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${getOptionStyle(option)}`}
              >
                <span className="font-medium text-gray-700 mr-2">{String.fromCharCode(65 + i)}.</span>
                {option}
                {evaluation && option === evaluation.correct_answer && (
                  <span className="ml-2 text-green-600">✓</span>
                )}
                {evaluation && option === selectedAnswer && !evaluation.correct && option !== evaluation.correct_answer && (
                  <span className="ml-2 text-red-600">✗</span>
                )}
              </button>
            ))}
          </div>

          {evaluating && (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
              <Spinner /> {t.quizChecking}
            </div>
          )}

          {/* Feedback */}
          {evaluation && (
            <div className={`rounded-xl p-4 mb-5 ${evaluation.correct ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{evaluation.correct ? '🎉' : '💡'}</span>
                <span className={`text-sm font-bold ${evaluation.correct ? 'text-green-700' : 'text-amber-700'}`}>
                  {evaluation.correct ? t.quizCorrect : t.quizIncorrect}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{evaluation.feedback}</p>
            </div>
          )}

          {/* Next question button */}
          {evaluation && (
            <button
              onClick={() => loadQuestion()}
              className="w-full py-3 bg-blue-800 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              {t.quizNext}
            </button>
          )}
        </div>
      )}

      {/* Tips footer */}
      <div className="mt-6 text-center text-xs text-gray-400">
        {t.quizStreakNote}
      </div>
    </div>
  )
}
