-- ================================================================
-- PHASE 10 MIGRATION: Fix modules & lessons RLS policies
-- Nguyên nhân gây lỗi chương không lưu được:
-- Bảng modules và lessons không có INSERT/UPDATE/DELETE policy cho admin/lecturer
-- RUN THIS IN YOUR SUPABASE SQL EDITOR
-- ================================================================

-- 1. Fix modules table: Add ALL policy for admins and lecturers
DROP POLICY IF EXISTS "Admins can manage modules" ON public.modules;
CREATE POLICY "Admins can manage modules" ON public.modules FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'lecturer')
));

-- 2. Fix lessons table: Add ALL policy for admins and lecturers
DROP POLICY IF EXISTS "Admins can manage lessons" ON public.lessons;
CREATE POLICY "Admins can manage lessons" ON public.lessons FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'lecturer')
));

-- 3. Fix lesson_quizzes table: Add admin/lecturer access (both admin and lecturer)
DROP POLICY IF EXISTS "Admins can manage quizzes" ON public.lesson_quizzes;
CREATE POLICY "Admins can manage quizzes" ON public.lesson_quizzes FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'lecturer')
));

-- Bonus: Also ensure students can view modules even with pending_approval status (for course preview page)
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
