-- ========================================================
-- SCRIPT THIẾT LẬP TOÀN DIỆN (CHẠY TRÊN SUPABASE SQL EDITOR)
-- ========================================================

-- 1. Kích hoạt extension pgcrypto (để mã hóa mật khẩu)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Tắt RLS (Bảo mật hàng) trên bảng profiles để tránh việc Next.js Server/Middleware bị chặn không đọc được Role
-- Điều này giải quyết triệt để lỗi "Chờ phê duyệt" dù database đã lưu role là 'admin'.
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. Tạo/Cập nhật Function Trigger đồng bộ từ auth.users sang public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Xóa profile cũ nếu trùng email nhưng khác ID để tránh xung đột
  DELETE FROM public.profiles WHERE email = NEW.email AND id != NEW.id;

  -- Chèn profile mới với kiểm tra kiểu dữ liệu và role an toàn
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    phone,
    company,
    position,
    industry,
    experience_years,
    avatar_url, 
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'company',
    NEW.raw_user_meta_data->>'position',
    NEW.raw_user_meta_data->>'industry',
    CASE 
      WHEN NEW.raw_user_meta_data->>'experience_years' ~ '^[0-9]+$' THEN 
        (NEW.raw_user_meta_data->>'experience_years')::integer
      ELSE 
        NULL 
    END,
    NEW.raw_user_meta_data->>'avatar_url',
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'pending') IN ('admin', 'lecturer', 'student', 'pending', 'rejected') THEN 
        COALESCE(NEW.raw_user_meta_data->>'role', 'pending')
      ELSE 
        'pending'
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    company = EXCLUDED.company,
    position = EXCLUDED.position,
    industry = EXCLUDED.industry,
    experience_years = EXCLUDED.experience_years,
    avatar_url = EXCLUDED.avatar_url,
    role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Tạo Trigger liên kết với auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Đồng bộ các tài khoản hiện tại từ auth.users sang public.profiles (nếu bị thiếu)
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', email), 
  COALESCE(raw_user_meta_data->>'role', 'student')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 6. Xác nhận email và gán quyền ADMIN cho inspiringhr.daotaonhansu@gmail.com
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'inspiringhr.daotaonhansu@gmail.com';

UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'inspiringhr.daotaonhansu@gmail.com';

-- 7. Xác nhận email và gán quyền STUDENT cho khainguyen2122002@gmail.com
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'khainguyen2122002@gmail.com';

UPDATE public.profiles 
SET role = 'student' 
WHERE email = 'khainguyen2122002@gmail.com';
