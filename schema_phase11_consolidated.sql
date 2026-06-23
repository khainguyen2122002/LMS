-- ================================================================
-- CONSOLIDATED MIGRATION: Fix all schema columns, tables & RLS policies
-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO FIX ALL DATABASE ISSUES
-- ================================================================

-- 1. Create tables if not exists
-- Lesson Quizzes
CREATE TABLE IF NOT EXISTS public.lesson_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- ["A", "B", "C"]
    correct_option_index INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'assignment', 'grade', 'deadline', 'system'
    link TEXT, -- Link dẫn đến bài học hoặc bài tập
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add missing columns to public.modules table (from Phase 7)
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS duration_minutes INT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS prerequisite_module_id UUID 
    REFERENCES public.modules(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tags TEXT,
  ADD COLUMN IF NOT EXISTS internal_note TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Clean up/add check constraint for modules.status
ALTER TABLE public.modules DROP CONSTRAINT IF EXISTS modules_status_check;
ALTER TABLE public.modules ADD CONSTRAINT modules_status_check 
  CHECK (status IN ('published', 'draft', 'hidden'));

-- 3. Add missing columns to public.courses table (from Phase 8)
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Add missing columns to public.lessons table (from Phase 5 & 8)
ALTER TABLE public.lessons 
  ADD COLUMN IF NOT EXISTS live_start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS live_end_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS live_meeting_url TEXT,
  ADD COLUMN IF NOT EXISTS recording_url TEXT,
  ADD COLUMN IF NOT EXISTS completion_criteria TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS required_time_percent INT DEFAULT 80,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS slide_url TEXT,
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_completion_criteria_check;
ALTER TABLE public.lessons ADD CONSTRAINT lessons_completion_criteria_check 
  CHECK (completion_criteria IN ('manual', 'view', 'quiz', 'attendance'));

-- 5. Add missing columns to public.lesson_quizzes table (from Phase 8)
ALTER TABLE public.lesson_quizzes 
  ADD COLUMN IF NOT EXISTS explanation TEXT;

-- 6. Add missing columns to public.assignments table (from Phase 6 & 8)
ALTER TABLE public.assignments 
  ADD COLUMN IF NOT EXISTS min_passing_score INT DEFAULT 50,
  ADD COLUMN IF NOT EXISTS assignment_type TEXT DEFAULT 'file',
  ADD COLUMN IF NOT EXISTS allow_resubmission BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS essay_link TEXT;

ALTER TABLE public.assignments DROP CONSTRAINT IF EXISTS assignments_assignment_type_check;
ALTER TABLE public.assignments ADD CONSTRAINT assignments_assignment_type_check 
  CHECK (assignment_type IN ('file', 'link', 'text'));

-- 7. Add missing columns to public.submissions table (from Phase 6)
ALTER TABLE public.submissions 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS sharepoint_path TEXT,
  ADD COLUMN IF NOT EXISTS attachment_url TEXT,
  ADD COLUMN IF NOT EXISTS student_note TEXT,
  ADD COLUMN IF NOT EXISTS attempt_number INT DEFAULT 1;

ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_status_check;
ALTER TABLE public.submissions ADD CONSTRAINT submissions_status_check 
  CHECK (status IN ('pending', 'grading', 'passed', 'failed'));

-- 8. Update enrollments table constraints & columns (from Phase 9)
ALTER TABLE public.enrollments 
  DROP CONSTRAINT IF EXISTS enrollments_status_check;

ALTER TABLE public.enrollments 
  ADD CONSTRAINT enrollments_status_check 
  CHECK (status IN ('active', 'completed', 'dropped', 'pending_approval', 'rejected'));

ALTER TABLE public.enrollments 
  ADD COLUMN IF NOT EXISTS blocked_lessons JSONB DEFAULT '[]';

-- 9. Enable RLS on all tables
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- 10. Fix/Add policies (INSERT/UPDATE/DELETE/SELECT)
-- Modules
DROP POLICY IF EXISTS "Admins can manage modules" ON public.modules;
CREATE POLICY "Admins can manage modules" ON public.modules FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'lecturer')
));

DROP POLICY IF EXISTS "Enrolled students can view modules" ON public.modules;
CREATE POLICY "Enrolled students can view modules" ON public.modules FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'lecturer')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE user_id = auth.uid() AND course_id = public.modules.course_id
  )
);

-- Lessons
DROP POLICY IF EXISTS "Admins can manage lessons" ON public.lessons;
CREATE POLICY "Admins can manage lessons" ON public.lessons FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'lecturer')
));

DROP POLICY IF EXISTS "Enrolled students can view lessons" ON public.lessons;
CREATE POLICY "Enrolled students can view lessons" ON public.lessons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'lecturer')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.modules m 
    JOIN public.enrollments e ON m.course_id = e.course_id 
    WHERE m.id = public.lessons.module_id AND e.user_id = auth.uid()
  )
);

-- Quizzes
DROP POLICY IF EXISTS "Admins can manage quizzes" ON public.lesson_quizzes;
CREATE POLICY "Admins can manage quizzes" ON public.lesson_quizzes FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'lecturer')
));

DROP POLICY IF EXISTS "Quizzes are viewable by enrolled students" ON public.lesson_quizzes;
CREATE POLICY "Quizzes are viewable by enrolled students" ON public.lesson_quizzes FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'lecturer')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.lessons l 
    JOIN public.modules m ON l.module_id = m.id 
    JOIN public.enrollments e ON m.course_id = e.course_id 
    WHERE l.id = public.lesson_quizzes.lesson_id AND e.user_id = auth.uid()
  )
);

-- Assignments
DROP POLICY IF EXISTS "Everyone can view assignments" ON public.assignments;
CREATE POLICY "Everyone can view assignments" ON public.assignments FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins and lecturers can manage assignments" ON public.assignments;
CREATE POLICY "Admins and lecturers can manage assignments" ON public.assignments FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'lecturer')
));

-- Submissions
DROP POLICY IF EXISTS "Users can manage their own submissions" ON public.submissions;
CREATE POLICY "Users can manage their own submissions" ON public.submissions FOR ALL 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Lecturers can view all submissions" ON public.submissions;
CREATE POLICY "Lecturers can view all submissions" ON public.submissions FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'lecturer')
));

-- Notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
CREATE POLICY "Admins can create notifications" ON public.notifications FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'lecturer')
));

-- Enrollments
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.enrollments;
CREATE POLICY "Admins can manage enrollments" ON public.enrollments FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'lecturer')
));

-- 11. Add triggers for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_modules_updated_at ON public.modules;
CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Output confirmation info
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('modules', 'lessons', 'assignments', 'submissions', 'lesson_quizzes', 'notifications') 
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
