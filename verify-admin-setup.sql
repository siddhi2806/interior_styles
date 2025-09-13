-- Quick Admin Verification Script
-- Run this to check current admin setup

-- 1. Check current admins
SELECT 
  'Current Admins:' as info,
  u.email,
  p.display_name,
  p.is_admin,
  p.created_at
FROM auth.users u
JOIN public.users p ON u.id = p.id
WHERE p.is_admin = TRUE;

-- 2. Check total user count
SELECT 
  'Total Users:' as info,
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_admin THEN 1 END) as admin_count,
  COUNT(CASE WHEN NOT is_admin THEN 1 END) as regular_users
FROM public.users;

-- 3. Check if admin_actions table exists
SELECT 
  'Admin Actions Table:' as info,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'admin_actions'
    ) 
    THEN 'EXISTS' 
    ELSE 'NOT FOUND' 
  END as status;

-- 4. Check admin views
SELECT 
  'Admin Views:' as info,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views 
      WHERE table_name = 'admin_user_stats'
    ) 
    THEN 'EXISTS' 
    ELSE 'NOT FOUND' 
  END as admin_user_stats_view;
