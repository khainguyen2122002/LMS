-- ==========================================
-- MASTER SQL SCHEMA FOR INSPIRING HR LMS
-- ==========================================

-- 1. Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_url TEXT,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles (Users)
-- Lưu ý: Bảng này thường được tạo tự động bởi trigger từ auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'pending' CHECK (role IN ('admin', 'lecturer', 'student', 'pending', 'rejected')),
  avatar_url TEXT,
  company TEXT,
  position TEXT,
  experience_years INT,
  industry TEXT,
  bio TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- 3. Courses
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  category_id UUID REFERENCES public.categories(id),
  level TEXT CHECK (level IN ('Cơ bản', 'Trung cấp', 'Chuyên sâu')),
  lecturer_id UUID REFERENCES public.profiles(id),
  thumbnail_url TEXT,
  intro_video_url TEXT,
  price DECIMAL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  total_duration INT DEFAULT 0, -- Tổng thời gian (phút)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Modules
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INT DEFAULT 0
);

-- 5. Lessons
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('video', 'pdf', 'slide', 'quiz', 'assignment', 'live_class', 'reading')),
  content_url TEXT, -- Link Microsoft SharePoint/Stream, v.v.
  zoom_link TEXT,
  duration_minutes INT DEFAULT 0,
  order_index INT DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enrollments
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  progress_percentage DECIMAL DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- 7. Lesson_Progress
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  watch_time_seconds INT DEFAULT 0,
  UNIQUE(enrollment_id, lesson_id)
);

-- 8. Assignments
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  attachment_url TEXT,
  due_date TIMESTAMPTZ,
  max_score INT DEFAULT 100
);

-- 9. Submissions
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  submission_url TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  score DECIMAL,
  feedback TEXT,
  graded_by UUID REFERENCES public.profiles(id),
  graded_at TIMESTAMPTZ
);

-- 10. Attendance (Cho Live Classes)
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  attended_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('present', 'absent', 'late')),
  note TEXT
);

-- 11. Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- RLS POLICIES (Bảo mật tầng cơ sở dữ liệu)
-- ==========================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Categories: Mọi người đều có thể xem
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);

-- Profiles: Người dùng xem profile của mình, Admin xem tất cả
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Courses: Mọi người xem khóa học đã xuất bản, Admin/Lecturer quản lý tất cả
DROP POLICY IF EXISTS "Everyone can view published courses" ON public.courses;
CREATE POLICY "Everyone can view published courses" ON public.courses FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Admins and lecturers can manage courses" ON public.courses;
CREATE POLICY "Admins and lecturers can manage courses" ON public.courses FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'lecturer')));

-- Modules & Lessons: Học viên đã enroll hoặc Admin/Lecturer mới được xem
DROP POLICY IF EXISTS "Enrolled students can view modules" ON public.modules;
CREATE POLICY "Enrolled students can view modules" ON public.modules FOR SELECT USING (EXISTS (SELECT 1 FROM public.enrollments WHERE user_id = auth.uid() AND course_id = public.modules.course_id) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'lecturer')));

DROP POLICY IF EXISTS "Enrolled students can view lessons" ON public.lessons;
CREATE POLICY "Enrolled students can view lessons" ON public.lessons FOR SELECT USING (EXISTS (SELECT 1 FROM public.modules m JOIN public.enrollments e ON m.course_id = e.course_id WHERE m.id = module_id AND e.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'lecturer')));

-- Enrollments & Progress: Người dùng quản lý của chính mình
DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.enrollments;
CREATE POLICY "Users can view their own enrollments" ON public.enrollments FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own progress" ON public.lesson_progress;
CREATE POLICY "Users can manage their own progress" ON public.lesson_progress FOR ALL USING (EXISTS (SELECT 1 FROM public.enrollments WHERE id = enrollment_id AND user_id = auth.uid()));

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================

-- Function cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
