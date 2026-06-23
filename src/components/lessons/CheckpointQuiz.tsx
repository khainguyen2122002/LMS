'use client'

import React, { useState } from 'react'
import { submitCheckpointQuiz } from '@/app/actions/lessons'
import { CheckCircle2, XCircle, ChevronRight, HelpCircle } from 'lucide-react'

interface Question {
  id: string
  question: string
  options: string[]
  correct_option_index: number
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
  const [result, setResult] = useState<{ success: boolean, message: string } | null>(null)

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
    if ('error' in res && res.error) {
      setResult({ success: false, message: res.error })
    } else {
      setResult(res as { success: boolean; message: string })
      if (res.success) {
        onSuccess()
      }
    }
    setIsSubmitting(false)
  }

  if (result) {
    return (
      <div className={`p-8 rounded-2xl border-2 text-center ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex justify-center mb-4">
          {result.success ? (
            <CheckCircle2 size={48} className="text-green-600" />
          ) : (
            <XCircle size={48} className="text-red-600" />
          )}
        </div>
        <h3 className={`text-xl font-bold mb-2 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
          {result.success ? 'Hoàn thành thử thách!' : 'Chưa vượt qua thử thách'}
        </h3>
        <p className="text-gray-600 mb-6">{result.message}</p>
        
        {!result.success && (
          <button 
            onClick={() => {
              setResult(null)
              setCurrentStep(0)
              setUserAnswers([])
            }}
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all"
          >
            Thử lại
          </button>
        )}
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

