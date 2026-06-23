-- 1. Bổ sung các cột cho bảng lessons
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS live_start_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS live_end_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS live_meeting_url TEXT,
ADD COLUMN IF NOT EXISTS recording_url TEXT,
ADD COLUMN IF NOT EXISTS completion_criteria TEXT DEFAULT 'manual' CHECK (completion_criteria IN ('manual', 'view', 'quiz', 'attendance')),
ADD COLUMN IF NOT EXISTS required_time_percent INT DEFAULT 80;

-- 2. Tạo bảng cho Checkpoint Quizzes (Kiểm soát tiến độ Level 2)
CREATE TABLE IF NOT EXISTS public.lesson_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Lưu mảng các lựa chọn: ["A", "B", "C"]
    correct_option_index INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bảo mật (RLS) cho bảng quiz mới
ALTER TABLE public.lesson_quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Quizzes are viewable by enrolled students" ON public.lesson_quizzes;
CREATE POLICY "Quizzes are viewable by enrolled students" ON public.lesson_quizzes FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.lessons l 
    JOIN public.modules m ON l.module_id = m.id 
    JOIN public.enrollments e ON m.course_id = e.course_id 
    WHERE l.id = public.lesson_quizzes.lesson_id AND e.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Admins can manage quizzes" ON public.lesson_quizzes;
CREATE POLICY "Admins can manage quizzes" ON public.lesson_quizzes FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
