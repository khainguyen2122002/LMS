'use client'

import React, { useState } from 'react'
import { submitCheckpointQuiz } from '@/app/actions/lessons'
import { CheckCircle2, XCircle, ChevronRight, HelpCircle, Check, X, Info } from 'lucide-react'

interface Question {
  id: string
  question: string
  options: string[]
  correct_option_index: number
}

interface GradedQuiz extends Question {
  explanation: string
  userAnswerIndex: number | null
}

interface CheckpointQuizProps {
  lessonId: string
  courseId: string
  quizzes: Question[]
  onSuccess: () => void
}

export default function CheckpointQuiz({ lessonId, courseId, quizzes, onSuccess }: CheckpointQuizProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [userAnswers, setUserAnswers] = useState<{ questionId: string, answerIndex: number }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    correctCount: number
    totalCount: number
    message: string
    gradedQuizzes: GradedQuiz[]
  } | null>(null)

  const handleSelect = (answerIndex: number) => {
    const newAnswers = [...userAnswers]
    const existingIndex = newAnswers.findIndex(a => a.questionId === quizzes[currentStep].id)

    if (existingIndex > -1) {
      newAnswers[existingIndex].answerIndex = answerIndex
    } else {
      newAnswers.push({ questionId: quizzes[currentStep].id, answerIndex })
    }

    setUserAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentStep < quizzes.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const res = await submitCheckpointQuiz(lessonId, courseId, userAnswers)
    
    if (res && 'gradedQuizzes' in res) {
      setResult(res as any)
      if (res.success) {
        onSuccess()
      }
    } else {
      alert((res as any)?.error || 'Có lỗi xảy ra khi nộp bài')
    }
    setIsSubmitting(false)
  }

  const handleRetry = () => {
    setResult(null)
    setCurrentStep(0)
    setUserAnswers([])
  }

  if (result) {
    return (
      <div className="space-y-6 p-6 md:p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
        {/* Result Header */}
        <div className={`p-6 rounded-2xl border text-center ${result.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <div className="flex justify-center mb-3">
            {result.success ? (
              <CheckCircle2 size={48} className="text-green-600 animate-bounce" />
            ) : (
              <XCircle size={48} className="text-red-600" />
            )}
          </div>
          <h3 className="text-xl font-bold mb-1">
            {result.success ? 'Hoàn thành thử thách!' : 'Chưa đạt yêu cầu hoàn thành'}
          </h3>
          <p className="text-sm font-semibold mb-3">
            Kết quả: {result.correctCount} / {result.totalCount} câu trả lời đúng
          </p>
          <p className="text-xs opacity-90 leading-relaxed max-w-md mx-auto">{result.message}</p>
          
          {!result.success && (
            <button
              onClick={handleRetry}
              className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-red-600/10 active:scale-95"
            >
              Thử lại bài kiểm tra
            </button>
          )}
        </div>

        {/* Detailed Question Review */}
        <div className="space-y-6 pt-4">
          <h4 className="font-bold text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
            <Info size={18} className="text-[#C7A959]" />
            Xem lại đáp án & Giải thích chi tiết
          </h4>

          <div className="space-y-6 divide-y divide-gray-100">
            {result.gradedQuizzes.map((quiz, idx) => {
              const isCorrect = quiz.userAnswerIndex === quiz.correct_option_index
              
              return (
                <div key={quiz.id || idx} className={`space-y-3 pt-6 ${idx === 0 ? 'pt-0' : ''}`}>
                  <p className="font-bold text-gray-800 text-sm flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 bg-[#103C11]/10 text-[#103C11] w-5 h-5 rounded-full flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    {quiz.question}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-7">
                    {quiz.options.map((opt, optIdx) => {
                      const wasSelected = quiz.userAnswerIndex === optIdx
                      const isOptionCorrect = quiz.correct_option_index === optIdx
                      
                      let btnStyle = 'border-gray-100 text-gray-700 bg-white'
                      let icon = null

                      if (isOptionCorrect) {
                        btnStyle = 'border-green-300 bg-green-50 text-green-800 font-semibold'
                        icon = <Check size={14} className="text-green-600 shrink-0" />
                      } else if (wasSelected) {
                        btnStyle = 'border-red-300 bg-red-50 text-red-800 font-semibold'
                        icon = <X size={14} className="text-red-600 shrink-0" />
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs ${btnStyle}`}
                        >
                          <span className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
                              isOptionCorrect ? 'bg-green-600 border-green-600 text-white' : 
                              wasSelected ? 'bg-red-600 border-red-600 text-white' : 'border-gray-300'
                            }`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            {opt}
                          </span>
                          {icon}
                        </div>
                      )
                    })}
                  </div>

                  {/* Explanation panel */}
                  <div className="pl-7 pt-1">
                    <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-start gap-2 text-xs text-gray-600">
                      <HelpCircle size={16} className="text-[#C7A959] mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold text-gray-700 mr-1">Giải thích:</span>
                        {quiz.explanation}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = quizzes[currentStep]
  const selectedAnswer = userAnswers.find(a => a.questionId === currentQuestion.id)?.answerIndex

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#103C11]">
          <HelpCircle size={18} />
          <span className="font-bold">Kiểm tra kiến thức</span>
        </div>
        <div className="text-xs font-bold text-gray-400">
          Câu {currentStep + 1} / {quizzes.length}
        </div>
      </div>

      <div className="p-8">
        <h3 className="text-lg font-bold text-gray-800 mb-6">{currentQuestion.question}</h3>

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium ${
                selectedAnswer === index
                  ? 'border-[#103C11] bg-[#103C11]/5 text-[#103C11]'
                  : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${
                  selectedAnswer === index ? 'border-[#103C11] bg-[#103C11] text-white' : 'border-gray-300'
                }`}>
                  {String.fromCharCode(65 + index)}
                </div>
                {option}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
        <button
          disabled={selectedAnswer === undefined || isSubmitting}
          onClick={handleNext}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${
            selectedAnswer !== undefined
              ? 'bg-[#C7A959] text-white hover:bg-[#d99700]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? 'Đang gửi...' : (
            <>
              {currentStep === quizzes.length - 1 ? 'Nộp bài' : 'Tiếp theo'}
              <ChevronRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
