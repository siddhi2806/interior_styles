# Supabase Setup Guide for AI Room Styler

## Step-by-Step Supabase Configuration

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project name: "ai-room-styler"
5. Enter database password (save this!)
6. Select region closest to you
7. Click "Create new project"

### 2. Get API Keys
1. Go to Project Settings > API
2. Copy the following values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJ...` (starts with eyJ)
   - **service_role key**: `eyJ...` (starts with eyJ) - **Keep this secret!**

### 3. Run Database Schema

**Option A: SQL Editor (Recommended)**
1. Go to SQL Editor in your Supabase dashboard
2. Create a new query
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click "Run" to execute all commands

**Option B: Run Commands Separately**
If you get errors, run these sections one by one:

#### Section 1: Core Tables
```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  credits INTEGER DEFAULT 50,
  blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

#### Section 2: Projects Table
```sql
-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
```

#### Section 3: Styles Table
```sql
-- Styles table (admin managed)
CREATE TABLE public.styles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.styles ENABLE ROW LEVEL SECURITY;
```

#### Section 4: Project Images Table
```sql
-- Project images table
CREATE TABLE public.project_images (
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
```

#### Section 5: Usage Logs Table
```sql
-- Usage logs table (for tracking credits and admin actions)
CREATE TABLE public.usage_logs (
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
```

### 4. Create Storage Bucket
1. Go to Storage in your Supabase dashboard
2. Click "Create bucket"
3. Bucket name: `images`
4. **Check "Public bucket"** (important!)
5. Click "Create bucket"

### 5. Set Up Authentication
1. Go to Authentication > Providers
2. Enable Google provider
3. You'll need to set up Google OAuth:

#### Google OAuth Setup:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
5. Application type: Web application
6. Authorized redirect URIs: `https://your-project-id.supabase.co/auth/v1/callback`
7. Copy Client ID and Client Secret
8. Paste them in Supabase Auth > Providers > Google

### 6. Insert Default Data
Run this in SQL Editor:
```sql
-- Insert default styles
INSERT INTO public.styles (name, description) VALUES
('Industrial', 'Exposed beams, concrete, raw metal, urban loft aesthetic'),
('Minimalist', 'Clean lines, clutter-free, neutral palette, simple elegance'),
('Rustic', 'Warm woods, earthy textiles, cozy cabin atmosphere'),
('Scandinavian', 'Bright, airy, light wood, hygge-inspired comfort'),
('Bohemian', 'Colorful textiles, plants, eclectic global influences'),
('Modern', 'Sleek furniture, polished surfaces, contemporary design');
```

### 7. Update Environment Variables
Update your `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
HUGGINGFACE_API_KEY=hf_your-api-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 8. Test the Setup
1. Start your Next.js app: `npm run dev`
2. Visit `http://localhost:3000`
3. Try signing in with Google
4. Check if user is created in Database > Users table

### 9. Make First Admin User
After your first successful login:
1. Go to Database > Users table in Supabase
2. Find your user record
3. Edit the record and set `is_admin` to `true`
4. Save changes
5. Now you can access `/admin` in your app

## Troubleshooting Common Issues

### Error: "relation does not exist"
- Make sure all tables are created in the `public` schema
- Check if the SQL commands ran successfully

### Error: "permission denied for table"
- Verify RLS policies are created correctly
- Check that user authentication is working

### Error: "bucket does not exist"
- Make sure you created the `images` bucket manually
- Verify the bucket name is exactly "images"
- Ensure the bucket is set to public

### Error: "invalid token"
- Check that environment variables are set correctly
- Verify API keys are copied completely (they're very long)

### Storage upload fails
- Verify bucket policies are created
- Check that bucket is public
- Test bucket access in Supabase dashboard

## Verification Checklist

- [ ] Tables created: users, projects, styles, project_images, usage_logs
- [ ] RLS enabled on all tables
- [ ] Storage bucket "images" created and public
- [ ] Google OAuth configured
- [ ] Default styles inserted (6 styles)
- [ ] Environment variables set
- [ ] Test user can sign in
- [ ] Admin user created
- [ ] App runs without errors

## Next Steps

Once setup is complete:
1. Test the complete user flow (signup → create project → upload → render)
2. Test admin features
3. Deploy to Vercel or your preferred platform
4. Set up monitoring and analytics

## Support

If you encounter issues:
1. Check the Supabase logs in your dashboard
2. Verify all SQL commands executed successfully
3. Test authentication flow manually
4. Check browser console for errors
