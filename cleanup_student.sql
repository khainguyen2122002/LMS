-- ===================================================
-- CHẠY ĐOẠN SQL NÀY TRƯỚC KHI ĐĂNG KÝ LẠI HỌC VIÊN
-- Tạo mới trong tab "New query" trên Supabase SQL Editor
-- ===================================================

-- Xóa sạch profile cũ bị lỗi của học viên (nếu có)
-- Việc này giúp tránh lỗi unique constraint khi đăng ký lại
DELETE FROM public.profiles WHERE email = 'khainguyen2122002@gmail.com';
