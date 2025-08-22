-- AI Room Styler Database Schema
-- Run these commands in your Supabase SQL Editor

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  credits INTEGER DEFAULT 50,
  blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view and update all profiles
CREATE POLICY "Admins can view all profiles" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update all profiles" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Users can view, create, update, and delete their own projects
CREATE POLICY "Users can manage own projects" ON public.projects
  FOR ALL USING (auth.uid() = user_id);

-- Admins can view all projects
CREATE POLICY "Admins can view all projects" ON public.projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Styles table (admin managed)
CREATE TABLE IF NOT EXISTS public.styles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.styles ENABLE ROW LEVEL SECURITY;

-- Everyone can view styles
CREATE POLICY "Anyone can view styles" ON public.styles
  FOR SELECT USING (TRUE);

-- Only admins can manage styles
CREATE POLICY "Admins can manage styles" ON public.styles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Project images table
CREATE TABLE IF NOT EXISTS public.project_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  before_path TEXT,
  after_path TEXT,
  style_id INTEGER REFERENCES public.styles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;

-- Users can view, create, update, and delete their own project images
CREATE POLICY "Users can manage own project images" ON public.project_images
  FOR ALL USING (auth.uid() = user_id);

-- Admins can view all project images
CREATE POLICY "Admins can view all project images" ON public.project_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Usage logs table (for tracking credits and admin actions)
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  project_id UUID REFERENCES public.projects(id),
  type TEXT NOT NULL, -- 'render', 'admin_credit', 'signup_bonus', etc.
  amount INTEGER NOT NULL, -- negative for deductions, positive for additions
  detail JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own logs
CREATE POLICY "Users can view own logs" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all logs
CREATE POLICY "Admins can view all logs" ON public.usage_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Only system/admins can insert logs
CREATE POLICY "System can insert logs" ON public.usage_logs
  FOR INSERT WITH CHECK (TRUE);

-- Insert default styles
INSERT INTO public.styles (name, description) VALUES
('Industrial', 'Exposed beams, concrete, raw metal, urban loft aesthetic'),
('Minimalist', 'Clean lines, clutter-free, neutral palette, simple elegance'),
('Rustic', 'Warm woods, earthy textiles, cozy cabin atmosphere'),
('Scandinavian', 'Bright, airy, light wood, hygge-inspired comfort'),
('Bohemian', 'Colorful textiles, plants, eclectic global influences'),
('Modern', 'Sleek furniture, polished surfaces, contemporary design')
ON CONFLICT (name) DO NOTHING;

-- Note: Create storage bucket manually in Supabase Dashboard
-- Go to Storage > Create bucket > name: "images" > make public

-- Storage policies (run after creating the bucket manually)
CREATE POLICY "Users can upload images to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Functions for atomic operations

-- Function to safely deduct credits
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_project_id UUID DEFAULT NULL,
  p_detail JSONB DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_credits INTEGER;
  v_result JSON;
BEGIN
  -- Get current credits with row lock
  SELECT credits INTO v_current_credits
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check if user exists
  IF v_current_credits IS NULL THEN
    RETURN '{"success": false, "error": "User not found"}'::JSON;
  END IF;

  -- Check if sufficient credits
  IF v_current_credits < p_amount THEN
    RETURN '{"success": false, "error": "Insufficient credits"}'::JSON;
  END IF;

  -- Deduct credits
  UPDATE public.users
  SET credits = credits - p_amount
  WHERE id = p_user_id;

  -- Log the deduction
  INSERT INTO public.usage_logs (user_id, project_id, type, amount, detail)
  VALUES (p_user_id, p_project_id, 'render', -p_amount, p_detail);

  -- Return success with remaining credits
  SELECT credits INTO v_current_credits
  FROM public.users
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'remaining_credits', v_current_credits
  );
END;
$$;

-- Function to add credits (admin use)
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_admin_id UUID,
  p_reason TEXT DEFAULT 'admin_adjustment'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_new_credits INTEGER;
BEGIN
  -- Check if the caller is admin
  SELECT is_admin INTO v_is_admin
  FROM public.users
  WHERE id = p_admin_id;

  IF NOT v_is_admin THEN
    RETURN '{"success": false, "error": "Unauthorized"}'::JSON;
  END IF;

  -- Add credits
  UPDATE public.users
  SET credits = credits + p_amount
  WHERE id = p_user_id;

  -- Log the addition
  INSERT INTO public.usage_logs (user_id, type, amount, detail)
  VALUES (
    p_user_id, 
    'admin_credit', 
    p_amount, 
    json_build_object('admin_id', p_admin_id, 'reason', p_reason)
  );

  -- Get new credit amount
  SELECT credits INTO v_new_credits
  FROM public.users
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'new_credits', v_new_credits
  );
END;
$$;

-- Trigger to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, display_name, credits)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    50
  );
  
  -- Log initial credit bonus
  INSERT INTO public.usage_logs (user_id, type, amount, detail)
  VALUES (
    NEW.id,
    'signup_bonus',
    50,
    '{"reason": "Welcome bonus"}'::jsonb
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_project_images_project_id ON public.project_images(project_id);
CREATE INDEX IF NOT EXISTS idx_project_images_user_id ON public.project_images(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at);

-- Views for admin dashboard
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT 
  u.id,
  u.display_name,
  u.credits,
  u.blocked,
  u.created_at,
  COUNT(DISTINCT p.id) as project_count,
  COUNT(DISTINCT pi.id) as render_count,
  COALESCE(SUM(CASE WHEN ul.type = 'render' THEN ABS(ul.amount) ELSE 0 END), 0) as total_credits_used
FROM public.users u
LEFT JOIN public.projects p ON u.id = p.user_id
LEFT JOIN public.project_images pi ON u.id = pi.user_id
LEFT JOIN public.usage_logs ul ON u.id = ul.user_id
GROUP BY u.id, u.display_name, u.credits, u.blocked, u.created_at
ORDER BY u.created_at DESC;
