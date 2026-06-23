-- ========================================================
-- SETUP TRIGGER & CREATE ACCOUNTS (ADMIN & STUDENT)
-- RUN THIS IN YOUR SUPABASE SQL EDITOR
-- ========================================================

-- 1. Kích hoạt extension pgcrypto (để băm mật khẩu bằng bcrypt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Tạo/Cập nhật Function Trigger để tự động lưu các trường mới vào bảng profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
    CAST(NULLIF(NEW.raw_user_meta_data->>'experience_years', '') AS integer),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'pending')
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

-- 3. Tạo Trigger gắn function handle_new_user vào auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Tạo hoặc Cập nhật tài khoản ADMIN (inspiringhr.daotaonhansu@gmail.com / 123456)
DO $$
DECLARE
  admin_id UUID := gen_random_uuid();
  admin_email TEXT := 'inspiringhr.daotaonhansu@gmail.com';
  hashed_password TEXT := crypt('123456', gen_salt('bf'));
BEGIN
  -- Kiểm tra xem user admin đã tồn tại chưa
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) THEN
    -- Thêm vào auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_id,
      'authenticated',
      'authenticated',
      admin_email,
      hashed_password,
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Admin Inspiring HR", "role": "admin"}',
      NOW(),
      NOW()
    );
    
    -- Thêm vào public.profiles
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (admin_id, admin_email, 'Admin Inspiring HR', 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
  ELSE
    -- Nếu đã tồn tại, cập nhật mật khẩu, confirm email, và role
    UPDATE auth.users
    SET 
      encrypted_password = hashed_password,
      email_confirmed_at = NOW(),
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin", "full_name": "Admin Inspiring HR"}'::jsonb
    WHERE email = admin_email;
    
    -- Cập nhật profile
    UPDATE public.profiles
    SET role = 'admin', full_name = 'Admin Inspiring HR'
    WHERE email = admin_email;
  END IF;
END $$;

-- 5. Tạo hoặc Cập nhật tài khoản HỌC VIÊN TEST (khainguyen2122002@gmail.com / 123456)
DO $$
DECLARE
  student_id UUID := gen_random_uuid();
  student_email TEXT := 'khainguyen2122002@gmail.com';
  hashed_password TEXT := crypt('123456', gen_salt('bf'));
BEGIN
  -- Kiểm tra xem user student đã tồn tại chưa
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = student_email) THEN
    -- Thêm vào auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      student_id,
      'authenticated',
      'authenticated',
      student_email,
      hashed_password,
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Khai Nguyen Test Student", "role": "student"}',
      NOW(),
      NOW()
    );
    
    -- Thêm vào public.profiles
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (student_id, student_email, 'Khai Nguyen Test Student', 'student')
    ON CONFLICT (id) DO UPDATE SET role = 'student';
  ELSE
    -- Cập nhật mật khẩu, confirm email, và role
    UPDATE auth.users
    SET 
      encrypted_password = hashed_password,
      email_confirmed_at = NOW(),
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "student", "full_name": "Khai Nguyen Test Student"}'::jsonb
    WHERE email = student_email;
    
    -- Cập nhật profile
    UPDATE public.profiles
    SET role = 'student', full_name = 'Khai Nguyen Test Student'
    WHERE email = student_email;
  END IF;
END $$;
