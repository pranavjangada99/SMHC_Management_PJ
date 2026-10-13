-- =====================================================================
-- Cloudflare D1 Relational Migration: 0003_staff_user_hierarchy.sql
-- Role-based user creation: Admin -> Doctors -> Receptionists
-- =====================================================================

-- Add extra columns to staff_users table
ALTER TABLE staff_users ADD COLUMN pin TEXT DEFAULT '1111';
ALTER TABLE staff_users ADD COLUMN phone TEXT;
ALTER TABLE staff_users ADD COLUMN status TEXT DEFAULT 'active';
ALTER TABLE staff_users ADD COLUMN created_by_role TEXT DEFAULT 'admin';

-- Update initial staff profiles with specific default PINs
UPDATE staff_users SET pin = '1111' WHERE role = 'admin';
UPDATE staff_users SET pin = '2222' WHERE role = 'doctor';
UPDATE staff_users SET pin = '3333' WHERE role = 'receptionist';
