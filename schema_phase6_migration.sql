-- 1. Cập nhật bảng assignments
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS min_passing_score INT DEFAULT 50,
ADD COLUMN IF NOT EXISTS assignment_type TEXT DEFAULT 'file' CHECK (assignment_type IN ('file', 'link', 'text')),
ADD COLUMN IF NOT EXISTS allow_resubmission BOOLEAN DEFAULT TRUE;

-- 2. Cập nhật bảng submissions
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'grading', 'passed', 'failed')),
ADD COLUMN IF NOT EXISTS sharepoint_path TEXT,
ADD COLUMN IF NOT EXISTS attachment_url TEXT, -- Link file bài làm (SharePoint/OneDrive)
ADD COLUMN IF NOT EXISTS student_note TEXT,
ADD COLUMN IF NOT EXISTS attempt_number INT DEFAULT 1;

-- 3. Tạo bảng Notifications (Thông báo In-app)
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

-- 4. Bảo mật (RLS) cho Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
CREATE POLICY "Admins can create notifications" ON public.notifications FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'lecturer')));

-- 5. Cập nhật RLS cho submissions (Cho phép học viên nộp bài)
DROP POLICY IF EXISTS "Users can manage their own submissions" ON public.submissions;
CREATE POLICY "Users can manage their own submissions" ON public.submissions FOR ALL 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Lecturers can view all submissions" ON public.submissions;
CREATE POLICY "Lecturers can view all submissions" ON public.submissions FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'lecturer')));
