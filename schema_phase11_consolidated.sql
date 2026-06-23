-- ================================================================
-- CONSOLIDATED MIGRATION: Fix all schema columns & RLS policies
-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO FIX ALL DATABASE ISSUES
-- ================================================================

-- 1. Add missing columns to public.modules table (from Phase 7)
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS duration_minutes INT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' 
    CHECK (status IN ('published', 'draft', 'hidden')),
  ADD COLUMN IF NOT EXISTS prerequisite_module_id UUID 
    REFERENCES public.modules(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tags TEXT,
  ADD COLUMN IF NOT EXISTS internal_note TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Add missing columns to public.courses table (from Phase 8)
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Add missing columns to public.lessons table (from Phase 8)
ALTER TABLE public.lessons 
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS slide_url TEXT,
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

-- 4. Add missing column to public.lesson_quizzes table (from Phase 8)
ALTER TABLE public.lesson_quizzes 
  ADD COLUMN IF NOT EXISTS explanation TEXT;

-- 5. Add missing column to public.assignments table (from Phase 8)
ALTER TABLE public.assignments 
  ADD COLUMN IF NOT EXISTS essay_link TEXT;

-- 6. Update enrollments table constraints & columns (from Phase 9)
ALTER TABLE public.enrollments 
  DROP CONSTRAINT IF EXISTS enrollments_status_check;

ALTER TABLE public.enrollments 
  ADD CONSTRAINT enrollments_status_check 
  CHECK (status IN ('active', 'completed', 'dropped', 'pending_approval', 'rejected'));

ALTER TABLE public.enrollments 
  ADD COLUMN IF NOT EXISTS blocked_lessons JSONB DEFAULT '[]';

-- 7. Fix/Add ALL policies (INSERT/UPDATE/DELETE/SELECT) for admins & lecturers on modules, lessons, quizzes, assignments, enrollments
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

-- Quizzes
DROP POLICY IF EXISTS "Admins can manage quizzes" ON public.lesson_quizzes;
CREATE POLICY "Admins can manage quizzes" ON public.lesson_quizzes FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'lecturer')
));

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

-- Enrollments
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.enrollments;
CREATE POLICY "Admins can manage enrollments" ON public.enrollments FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'lecturer')
));

-- 8. Add triggers for auto-updating updated_at if not exists
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

-- Force Schema Cache Reload (Supabase automatically does this on SQL Editor executes, but this returns confirmation info)
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('modules', 'lessons', 'enrollments') 
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
