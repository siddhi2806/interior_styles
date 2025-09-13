-- COMPLETE Admin Setup Script for Room Styler
-- Run this ENTIRE script in Supabase SQL Editor in ONE GO

-- Step 1: Create the grant_admin_access function
CREATE OR REPLACE FUNCTION grant_admin_access(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  -- Update user to admin status based on email
  UPDATE auth.users 
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb
  WHERE email = user_email;
  
  -- Also update the public users table
  UPDATE public.users 
  SET is_admin = TRUE 
  WHERE id = (
    SELECT id FROM auth.users WHERE email = user_email
  );
  
  -- Log the action
  RAISE NOTICE 'Admin access granted to: %', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create the revoke_admin_access function
CREATE OR REPLACE FUNCTION revoke_admin_access(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  -- Remove admin from auth metadata
  UPDATE auth.users 
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) - 'is_admin'
  WHERE email = user_email;
  
  -- Remove admin flag from public table
  UPDATE public.users 
  SET is_admin = FALSE 
  WHERE id = (
    SELECT id FROM auth.users WHERE email = user_email
  );
  
  -- Log the action
  RAISE NOTICE 'Admin access revoked from: %', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create admin sync function for new signups
CREATE OR REPLACE FUNCTION sync_admin_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user signs up, check if they should be admin
  IF NEW.id IN (
    SELECT id FROM auth.users WHERE email IN (
      'siddhi.xia.samdhss@gmail.com',
      'stud22.mpc1@gec.ac.in', 
      'Kordevaishnavi02@gmail.com'
    )
  ) THEN
    -- Set admin flag in public table
    NEW.is_admin = TRUE;
    
    -- Update auth metadata
    UPDATE auth.users 
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb
    WHERE id = NEW.id;
    
    RAISE NOTICE 'Auto-assigned admin status to: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created_admin_sync ON public.users;
CREATE TRIGGER on_auth_user_created_admin_sync
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION sync_admin_status();

-- Step 5: Create admin_actions table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.users(id),
  action_type TEXT NOT NULL,
  target_user_id UUID REFERENCES public.users(id),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_actions
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view admin actions" ON admin_actions;
DROP POLICY IF EXISTS "Admins can log actions" ON admin_actions;

-- Create policies for admin_actions
CREATE POLICY "Admins can view admin actions" ON admin_actions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

CREATE POLICY "Admins can log actions" ON admin_actions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

-- Step 6: Grant admin access to your specific users
-- REPLACE THESE WITH YOUR ACTUAL ADMIN EMAILS
SELECT grant_admin_access('siddhi.xia.samdhss@gmail.com');
SELECT grant_admin_access('stud22.mpc1@gec.ac.in'); 
SELECT grant_admin_access('Kordevaishnavi02@gmail.com');

-- Step 7: Verify the setup
SELECT 
  'ADMIN SETUP COMPLETE - Current Admins:' as status,
  u.email,
  p.display_name,
  p.is_admin,
  p.created_at
FROM auth.users u
LEFT JOIN public.users p ON u.id = p.id
WHERE u.email IN (
  'siddhi.xia.samdhss@gmail.com',
  'stud22.mpc1@gec.ac.in', 
  'Kordevaishnavi02@gmail.com'
);

-- Step 8: Show summary
SELECT 
  'SETUP SUMMARY:' as info,
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_admin THEN 1 END) as admin_count,
  COUNT(CASE WHEN NOT is_admin THEN 1 END) as regular_users
FROM public.users;
