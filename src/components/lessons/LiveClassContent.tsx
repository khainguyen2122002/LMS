'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, Video, ExternalLink, PlayCircle } from 'lucide-react'
import VideoPlayer from './VideoPlayer'

interface LiveClassContentProps {
  lesson: {
    id: string
    title: string
    live_start_at: string
    live_end_at: string
    live_meeting_url: string
    recording_url: string
  }
}

export default function LiveClassContent({ lesson }: LiveClassContentProps) {
  const [status, setStatus] = useState<'upcoming' | 'live' | 'ended'>('upcoming')
  const [timeLeft, setLeft] = useState<string>('')

  useEffect(() => {
    const checkStatus = () => {
      const now = new Date()
      const start = new Date(lesson.live_start_at)
      const end = new Date(lesson.live_end_at)

      if (now < start) {
        setStatus('upcoming')
        // Calculate time left
        const diff = start.getTime() - now.getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        setLeft(`${hours} giờ ${minutes} phút`)
      } else if (now >= start && now <= end) {
        setStatus('live')
      } else {
        setStatus('ended')
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 60000)
    return () => clearInterval(interval)
  }, [lesson])

  if (status === 'upcoming') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-dashed border-gray-300">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <Calendar size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Lớp học sắp bắt đầu</h2>
        <p className="text-gray-500 mb-6 text-center max-w-md">
          Buổi học trực tiếp "{lesson.title}" sẽ diễn ra vào lúc:
          <br />
          <span className="font-bold text-[#103C11]">
            {new Date(lesson.live_start_at).toLocaleString('vi-VN')}
          </span>
        </p>
        <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full text-sm font-bold text-gray-600">
          <Clock size={16} />
          Bắt đầu sau: {timeLeft}
        </div>
      </div>
    )
  }

  if (status === 'live') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-[#103C11] text-white rounded-2xl shadow-xl overflow-hidden relative">
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-red-500 rounded-full animate-pulse">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Trực tiếp</span>
        </div>
        
        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6">
          <Video size={40} className="text-[#C7A959]" />
        </div>
        
        <h2 className="text-3xl font-bold mb-4 text-center">Lớp học đang diễn ra!</h2>
        <p className="text-white/80 mb-8 text-center max-w-md">
          Nhấn vào nút bên dưới để tham gia buổi học trên Microsoft Teams cùng giảng viên và các học viên khác.
        </p>
        
        <a 
          href={lesson.live_meeting_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-[#C7A959] text-[#103C11] px-8 py-4 rounded-xl font-black text-lg hover:bg-white transition-all transform hover:scale-105 shadow-2xl"
        >
          Tham gia lớp học ngay
          <ExternalLink size={24} />
        </a>
      </div>
    )
  }

  // Ended state
  return (
    <div className="space-y-6">
      <div className="bg-gray-100 p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center">
            <PlayCircle size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-700">Buổi học đã kết thúc</p>
            <p className="text-xs text-gray-500">Bạn có thể xem lại bản ghi hình bên dưới</p>
          </div>
        </div>
        {lesson.recording_url && (
          <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">
            Có bản ghi replay
          </span>
        )}
      </div>

      {lesson.recording_url ? (
        <VideoPlayer url={lesson.recording_url} title={lesson.title} />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-2xl border border-gray-200 text-center">
          <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
            <Video size={24} />
          </div>
          <h3 className="font-bold text-gray-800">Bản ghi đang được xử lý</h3>
          <p className="text-sm text-gray-500 max-w-xs mt-2">
            Vui lòng quay lại sau ít phút để xem lại nội dung buổi học đã diễn ra.
          </p>
        </div>
      )}
    </div>
  )
}

