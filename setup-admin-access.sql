-- Admin Access Setup Script
-- Run this in your Supabase SQL Editor to set up admin access

-- Step 1: Create a function to safely grant admin access
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Grant admin access to your 3 chosen admins
-- Replace these emails with the actual admin emails
SELECT grant_admin_access('admin1@example.com');
SELECT grant_admin_access('admin2@example.com'); 
SELECT grant_admin_access('admin3@example.com');

-- Step 3: Create a trigger to automatically sync admin status
CREATE OR REPLACE FUNCTION sync_admin_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user signs up, check if they should be admin
  IF NEW.email IN (
    'admin1@example.com',
    'admin2@example.com', 
    'admin3@example.com'
  ) THEN
    -- Update auth metadata
    UPDATE auth.users 
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb
    WHERE id = NEW.id;
    
    -- Set admin flag in public table
    NEW.is_admin = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created_admin_sync ON public.users;
CREATE TRIGGER on_auth_user_created_admin_sync
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION sync_admin_status();

-- Step 4: Create admin actions logging table (if not exists)
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

-- Only admins can view admin actions
CREATE POLICY "Admins can view admin actions" ON admin_actions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

-- Only admins can insert admin actions
CREATE POLICY "Admins can log actions" ON admin_actions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

-- Step 5: Create function to revoke admin access (for security)
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: View current admins
SELECT 
  u.email,
  p.display_name,
  p.is_admin,
  p.created_at
FROM auth.users u
JOIN public.users p ON u.id = p.id
WHERE p.is_admin = TRUE;
