-- ================================================================
-- PHASE 9 MIGRATION: Course Enrollments & Student Access Management
-- RUN THIS IN YOUR SUPABASE SQL EDITOR
-- ================================================================

-- 1. Drop old enrollment check constraint
ALTER TABLE public.enrollments DROP CONSTRAINT IF EXISTS enrollments_status_check;

-- 2. Add new enrollment check constraint supporting pending_approval and rejected
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_status_check 
  CHECK (status IN ('active', 'completed', 'dropped', 'pending_approval', 'rejected'));

-- 3. Add blocked_lessons JSONB column to enrollments
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS blocked_lessons JSONB DEFAULT '[]';

-- 4. Enable admin/lecturer RLS policies for enrollments table so they can manage enrollments
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.enrollments;
CREATE POLICY "Admins can manage enrollments" ON public.enrollments FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND role IN ('admin', 'lecturer')
));
