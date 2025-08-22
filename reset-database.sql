-- COMPLETE DATABASE RESET SCRIPT
-- Run this FIRST to remove all existing policies and tables
-- Then run the supabase-schema-fixed.sql

-- ============================================================
-- STEP 1: DROP ALL EXISTING POLICIES (INCLUDING PROBLEMATIC ONES)
-- ============================================================

-- Drop ALL policies on users table
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.users';
    END LOOP;
END $$;

-- Drop ALL policies on projects table
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'projects' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.projects';
    END LOOP;
END $$;

-- Drop ALL policies on styles table
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'styles' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.styles';
    END LOOP;
END $$;

-- Drop ALL policies on project_images table
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'project_images' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.project_images';
    END LOOP;
END $$;

-- Drop ALL policies on usage_logs table
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'usage_logs' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.usage_logs';
    END LOOP;
END $$;

-- Drop ALL storage policies
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
    END LOOP;
END $$;

-- ============================================================
-- STEP 2: DROP ALL TRIGGERS AND FUNCTIONS
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS deduct_credits(UUID, INTEGER, UUID, JSONB);
DROP FUNCTION IF EXISTS add_credits(UUID, INTEGER, UUID, TEXT);

-- ============================================================
-- STEP 3: DROP ALL VIEWS
-- ============================================================

DROP VIEW IF EXISTS admin_user_stats;

-- ============================================================
-- STEP 4: DROP ALL TABLES (CAREFUL - THIS DELETES ALL DATA!)
-- ============================================================

-- Uncomment the lines below if you want to completely reset all data
-- WARNING: This will delete ALL your data!

-- DROP TABLE IF EXISTS public.usage_logs CASCADE;
-- DROP TABLE IF EXISTS public.project_images CASCADE;
-- DROP TABLE IF EXISTS public.projects CASCADE;
-- DROP TABLE IF EXISTS public.styles CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================================
-- STEP 5: DISABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.styles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.project_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.usage_logs DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================

DO $$ 
BEGIN 
    RAISE NOTICE 'Database reset completed successfully!';
    RAISE NOTICE 'Now run the supabase-schema-fixed.sql file to create the new schema.';
END $$;
