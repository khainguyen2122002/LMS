-- ================================================================
-- PHASE 8 MIGRATION: LMS Inspiring HR Enhancements
-- RUN THIS IN YOUR SUPABASE SQL EDITOR
-- ================================================================

-- 1. Fix created_by column in courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);

-- 2. Update Categories RLS: Allow Admins and Lecturers to manage categories
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'lecturer')));

-- 3. Add explanation column to lesson_quizzes table (for MCQ explanations)
ALTER TABLE public.lesson_quizzes ADD COLUMN IF NOT EXISTS explanation TEXT;

-- 4. Add essay_link column to assignments table (for essay submission external link)
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS essay_link TEXT;

-- 5. Add columns to lessons table (for video/slide URLs and local attachments)
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS slide_url TEXT;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

-- 6. Add RLS policies for assignments table so students can view them
DROP POLICY IF EXISTS "Everyone can view assignments" ON public.assignments;
CREATE POLICY "Everyone can view assignments" ON public.assignments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins and lecturers can manage assignments" ON public.assignments;
CREATE POLICY "Admins and lecturers can manage assignments" ON public.assignments FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'lecturer')));
