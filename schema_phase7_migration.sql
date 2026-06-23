-- ================================================================
-- PHASE 7 MIGRATION: Admin Course Management Features
-- ================================================================
-- Chạy file này trong Supabase SQL Editor để thêm các cột mới
-- cho bảng modules (Chương học) và lessons (Bài học)

-- 1. Thêm cột mới cho bảng modules (Chương học)
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

-- 2. Thêm updated_at cho bảng courses nếu chưa có
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Cập nhật giá trị mặc định cho status của modules hiện tại
UPDATE public.modules 
SET status = 'published' 
WHERE status IS NULL;

-- 4. Trigger tự động cập nhật updated_at cho modules
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

-- 5. RLS: Cho phép admin/lecturer quản lý modules
DROP POLICY IF EXISTS "Admins can manage modules" ON public.modules;
CREATE POLICY "Admins can manage modules" ON public.modules FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'lecturer')
  )
);

-- 6. RLS: Cho phép admin/lecturer quản lý courses
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'lecturer')
  )
);

-- 7. RLS: Cho phép admin/lecturer quản lý lessons  
DROP POLICY IF EXISTS "Admins can manage lessons" ON public.lessons;
CREATE POLICY "Admins can manage lessons" ON public.lessons FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'lecturer')
  )
);

-- Xác nhận hoàn thành
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'modules' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
