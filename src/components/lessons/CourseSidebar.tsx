'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  PlayCircle, 
  FileText, 
  CheckCircle, 
  Circle, 
  Presentation, 
  HelpCircle, 
  FileEdit, 
  Video, 
  BookOpen 
} from 'lucide-react'

type Lesson = {
  id: string
  title: string
  type: 'video' | 'pdf' | 'slide' | 'quiz' | 'assignment' | 'live_class' | 'reading'
  duration_minutes: number
  is_completed: boolean
}

type Module = {
  id: string
  title: string
  lessons: Lesson[]
}

interface CourseSidebarProps {
  courseId: string
  modules: Module[]
}

export default function CourseSidebar({ courseId, modules }: CourseSidebarProps) {
  const pathname = usePathname()

  const getLessonIcon = (type: Lesson['type'], isActive: boolean) => {
    const size = 16
    const className = isActive ? 'text-[#103C11]' : 'text-gray-400'
    
    switch (type) {
      case 'video': return <PlayCircle size={size} className={className} />
      case 'pdf': return <FileText size={size} className={className} />
      case 'slide': return <Presentation size={size} className={className} />
      case 'quiz': return <HelpCircle size={size} className={className} />
      case 'assignment': return <FileEdit size={size} className={className} />
      case 'live_class': return <Video size={size} className={className} />
      case 'reading': return <BookOpen size={size} className={className} />
      default: return <Circle size={size} className={className} />
    }
  }

  const getLessonTypeText = (type: Lesson['type']) => {
    switch (type) {
      case 'video': return 'Video'
      case 'pdf': return 'Tài liệu PDF'
      case 'slide': return 'Slide bài giảng'
      case 'quiz': return 'Bài kiểm tra'
      case 'assignment': return 'Bài tập về nhà'
      case 'live_class': return 'Lớp học trực tuyến'
      case 'reading': return 'Bài đọc'
      default: return 'Bài học'
    }
  }

  return (
    <div className="w-80 h-full bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0 hidden lg:block shadow-sm">
      <div className="p-5 border-b border-gray-200 bg-[#103C11]/5 sticky top-0 z-10">
        <h3 className="font-bold text-[#103C11] uppercase text-xs tracking-widest">Nội dung khóa học</h3>
      </div>

      <div className="p-3 space-y-6">
        {modules.map((module, index) => (
          <div key={module.id} className="space-y-2">
            <h4 className="font-bold text-gray-900 px-3 py-2 text-sm leading-tight">
              Chương {index + 1}: {module.title}
            </h4>
            
            <div className="space-y-1">
              {module.lessons.map((lesson) => {
                const isActive = pathname.includes(lesson.id)
                return (
                  <Link
                    key={lesson.id}
                    href={`/dashboard/learning/${courseId}/lessons/${lesson.id}`}
                    className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-[#e6f0e7] shadow-sm ring-1 ring-[#103C11]/10' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {lesson.is_completed ? (
                        <div className="bg-green-100 p-0.5 rounded-full">
                          <CheckCircle size={14} className="text-green-600" />
                        </div>
                      ) : (
                        <div className="p-0.5">
                          <Circle size={14} className="text-gray-300" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold leading-snug truncate ${isActive ? 'text-[#103C11]' : 'text-gray-700'}`}>
                        {lesson.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center text-[10px] text-gray-400 font-medium uppercase tracking-tighter">
                          {getLessonIcon(lesson.type, isActive)}
                          <span className="ml-1">{getLessonTypeText(lesson.type)}</span>
                        </span>
                        {lesson.duration_minutes > 0 && (
                          <span className="text-[10px] text-gray-400 font-medium">• {lesson.duration_minutes} phút</span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


