# 🏗️ Complete Supabase Setup from Scratch

## Step 1: Create New Supabase Project

1. **Go to** https://supabase.com/
2. **Sign in** or create an account
3. **Click "New Project"**
4. **Fill in details:**
   - Organization: Select your organization
   - Project name: `ai-room-styler`
   - Database password: Generate a strong password (save it!)
   - Region: Choose closest to you
5. **Click "Create new project"**
6. **Wait 2-3 minutes** for project to be ready

---

## Step 2: Get Project Credentials

1. **Go to Project Settings** (gear icon in sidebar)
2. **Click "API"** in the left menu
3. **Copy these values:**
   - Project URL
   - Project API keys → `anon` `public`
   - Project API keys → `service_role` `secret`

**Update your `.env.local` file:**

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
HUGGINGFACE_API_KEY=your_huggingface_token_here
NEXT_PUBLIC_HF_MODEL=stabilityai/stable-diffusion-2-1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Step 3: Create Database Tables

**Go to SQL Editor** (in Supabase dashboard sidebar)

**Copy and paste this SQL, then click "RUN":**

```sql
-- 1. Create users table (extends auth.users)
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name text,
  is_admin boolean DEFAULT false,
  credits integer DEFAULT 50,
  blocked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2. Create projects table
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. Create styles table
CREATE TABLE public.styles (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- 4. Create project_images table
CREATE TABLE public.project_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  before_path text,
  after_path text,
  style_id integer REFERENCES public.styles(id),
  created_at timestamptz DEFAULT now()
);

-- 5. Create usage_logs table
CREATE TABLE public.usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id),
  project_id uuid REFERENCES public.projects(id),
  type text,
  amount integer,
  detail jsonb,
  created_at timestamptz DEFAULT now()
);
```

**You should see:** ✅ Success. No rows returned

---

## Step 4: Insert Style Data

**In the same SQL Editor, run this:**

```sql
-- First, check if styles already exist
SELECT * FROM public.styles;

-- If the table is empty, insert the styles
-- If it shows existing data, skip this step
INSERT INTO public.styles (name, description) VALUES
('Industrial', 'Exposed beams, concrete, raw metal'),
('Minimalist', 'Clean lines, clutter-free, neutral palette'),
('Rustic', 'Warm woods, earthy textiles, cozy'),
('Scandinavian', 'Bright, light wood, cozy minimal'),
('Bohemian', 'Colorful textiles, plants, eclectic'),
('Modern', 'Sleek furniture, polished surfaces')
ON CONFLICT (name) DO NOTHING;

-- Verify the styles were inserted
SELECT * FROM public.styles ORDER BY id;
```

**You should see:** ✅ Either "6 rows inserted" (if table was empty) or "Success. No rows returned" (if styles already exist)

**Then verify with SELECT:** You should see 6 styles listed

---

## Step 5: Create Admin View

**Run this SQL:**

```sql
-- Create admin stats view for dashboard
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT
  u.id,
  u.display_name,
  u.credits,
  u.blocked,
  u.is_admin,
  u.created_at,
  COALESCE(p.project_count, 0) as project_count,
  COALESCE(r.render_count, 0) as render_count,
  COALESCE(ABS(cr.total_credits_used), 0) as total_credits_used
FROM users u
LEFT JOIN (
  SELECT user_id, COUNT(*) as project_count
  FROM projects
  GROUP BY user_id
) p ON u.id = p.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as render_count
  FROM project_images
  GROUP BY user_id
) r ON u.id = r.user_id
LEFT JOIN (
  SELECT user_id, SUM(amount) as total_credits_used
  FROM usage_logs
  WHERE type = 'render'
  GROUP BY user_id
) cr ON u.id = cr.user_id;
```

---

## Step 6: Set Up Row Level Security (RLS)

**Run this large SQL block:**

```sql
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can manage their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- Styles are readable by everyone
CREATE POLICY "Styles are viewable by all" ON public.styles
  FOR SELECT USING (true);

-- Project images policies
CREATE POLICY "Users can view own project images" ON public.project_images
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own project images" ON public.project_images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project images" ON public.project_images
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own project images" ON public.project_images
  FOR DELETE USING (auth.uid() = user_id);

-- Usage logs policies
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own usage logs" ON public.usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## Step 7: Set Up Storage

1. **Go to Storage** (in Supabase sidebar)
2. **Click "Create a new bucket"**
3. **Settings:**
   - Name: `images`
   - Public bucket: ✅ **YES** (checked)
   - File size limit: 50MB
   - Allowed file types: Leave empty (allows all)
4. **Click "Save"**

**Then run this SQL for storage policies:**

```sql
-- Storage policies for images bucket
CREATE POLICY "Users can upload their own images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Images are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Users can update their own images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## Step 8: Configure Authentication

1. **Go to Authentication** → **Settings** (in Supabase sidebar)

2. **Site URL Configuration:**

   - Site URL: `http://localhost:3000`
   - Redirect URLs:
     ```
     http://localhost:3000/auth/callback
     http://localhost:3000
     ```

3. **Enable Providers:**

   - Go to **Authentication** → **Providers**
   - **Enable Google:**

     - Toggle ON
     - Get credentials from Google Console:
       1. Go to https://console.cloud.google.com/
       2. Create/select project → APIs & Services → Credentials
       3. Create OAuth 2.0 Client ID
       4. Set authorized redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`
       5. Copy Client ID and Client Secret
     - **Paste in Supabase:** Client ID → Client ID field, Client Secret → Client Secret field
     - **Click "Save"**

   - **Enable GitHub:**
     - Toggle ON
     - Get credentials from GitHub:
       1. Go to https://github.com/settings/developers
       2. New OAuth App
       3. Set Authorization callback URL: `https://your-project-ref.supabase.co/auth/v1/callback`
       4. Copy Client ID and Client Secret
     - **Paste in Supabase:** Client ID → Client ID field, Client Secret → Client Secret field
     - **Click "Save"**

---

## 🔐 Detailed OAuth Setup (If You Need Help)

### **Google OAuth Setup:**

1. **Go to Google Cloud Console:** https://console.cloud.google.com/
2. **Create/Select Project:** Create new or select existing project
3. **Enable Google+ API:**
   - Go to "APIs & Services" → "Library"
   - Search "Google+ API" → Enable it
4. **Create Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - **If prompted to configure OAuth consent screen:**
     - Click "Configure Consent Screen"
     - Choose "External" (unless you have a Google Workspace)
     - Fill required fields:
       - App name: "AI Room Styler"
       - User support email: Your email
       - Developer contact email: Your email
     - Click "Save and Continue" through all steps
     - Go back to "Credentials"
   - **Create OAuth Client ID:**
     - Click "Create Credentials" → "OAuth 2.0 Client ID"
     - Application type: "Web application"
     - Name: "AI Room Styler"
     - Authorized JavaScript origins: `http://localhost:3001`
     - Authorized redirect URIs: `https://your-project-ref.supabase.co/auth/v1/callback`
     - Click "Create"
   - **You'll see a popup with Client ID and Client Secret** - Copy both!
5. **Copy to Supabase:**
   - **Go back to your Supabase project dashboard**
   - **In the left sidebar: click "Authentication"**
   - **Click "Providers" (under Authentication section)**
   - **Find "Google" in the providers list**
   - **Click on Google to expand the settings**
   - **Toggle "Enable sign in with Google" to ON**
   - **Fill in the fields:**
     - Client ID → Paste your Google Client ID
     - Client Secret → Paste your Google Client Secret
   - **Click "Save" at the bottom**

### **GitHub OAuth Setup:**

1. **Go to GitHub Developer Settings:** https://github.com/settings/developers
2. **Create OAuth App:**
   - Click "New OAuth App"
   - Application name: "AI Room Styler"
   - Homepage URL: `http://localhost:3001`
   - Authorization callback URL: `https://your-project-ref.supabase.co/auth/v1/callback`
   - Click "Register application"
3. **Get Credentials:**
   - Copy Client ID → Paste in Supabase GitHub provider
   - Generate Client Secret → Copy → Paste in Supabase GitHub provider
   - Click "Save" in Supabase

**⚠️ Replace `your-project-ref` with your actual Supabase project reference URL!**

---

## 📋 **Detailed Google OAuth 2.0 Setup Guide**

### **Step-by-Step with What You'll See:**

#### **1. Access Google Cloud Console**

- Go to: https://console.cloud.google.com/
- Sign in with your Google account

#### **2. Create or Select Project**

- **If no project:** Click "Select a project" → "New Project"
  - Project name: "ai-room-styler"
  - Click "Create"
- **If you have projects:** Click project dropdown → Select existing or create new

#### **3. Enable Required API**

- In the left sidebar: "APIs & Services" → "Library"
- Search: "Google+ API" or "People API"
- Click on it → Click "Enable"
- Wait for it to enable (30 seconds)

#### **4. Configure OAuth Consent Screen (REQUIRED)**

- Go to: "APIs & Services" → "OAuth consent screen"
- **Choose User Type:**
  - Select "External" (for personal Gmail accounts)
  - Click "Create"
- **Fill App Information:**
  - App name: `AI Room Styler`
  - User support email: Your email address
  - App logo: Skip (optional)
  - App domain: Skip (optional)
  - Developer contact information: Your email
- **Click "Save and Continue"**
- **Scopes page:** Just click "Save and Continue" (don't add any)
- **Test users page:** Click "Save and Continue" (leave empty)
- **Summary page:** Click "Back to Dashboard"

#### **5. Create OAuth 2.0 Client ID**

- Go to: "APIs & Services" → "Credentials"
- Click "➕ Create Credentials" → "OAuth 2.0 Client ID"
- **Configure the Client:**
  - Application type: "Web application"
  - Name: `AI Room Styler`
  - **Authorized JavaScript origins:**
    - Add: `http://localhost:3000`
    - Add: `http://localhost:3001`
  - **Authorized redirect URIs:**
    - Add: `https://your-project-ref.supabase.co/auth/v1/callback`
    - ⚠️ Replace `your-project-ref` with your actual Supabase project URL
- Click "Create"

#### **6. Copy Credentials**

- A popup will show your:
  - **Client ID** (looks like: `123456789-abc123.apps.googleusercontent.com`)
  - **Client Secret** (looks like: `GOCSPX-abcd1234...`)
- **Copy both values** - you'll paste them in Supabase

#### **7. Paste in Supabase**

- Go back to your Supabase project
- Authentication → Providers → Google
- **Client ID:** Paste the Google Client ID
- **Client Secret:** Paste the Google Client Secret
- Click "Save"

### **🚨 Common Issues:**

#### **"OAuth consent screen not configured"**

- **Solution:** Complete step 4 above (configure consent screen first)

#### **"Invalid redirect URI"**

- **Solution:** Make sure the redirect URI exactly matches your Supabase URL
- Format: `https://your-project-ref.supabase.co/auth/v1/callback`

#### **"App domain not verified"**

- **Solution:** You can skip app domain for development/testing

#### **Where to find your Supabase project URL:**

- In Supabase: Settings → API → Project URL
- Example: `https://abcdefghijk.supabase.co`
- Your callback URL: `https://abcdefghijk.supabase.co/auth/v1/callback`

### **🎯 Visual Guide: Where to Find Supabase Google Provider**

1. **Open your Supabase project** (supabase.com → your project)
2. **Look at the left sidebar menu:**
   ```
   📊 Home
   📝 Table Editor
   🔐 Authentication    ← Click this
   📁 Storage
   💾 Database
   ⚙️ Settings
   ```
3. **Under Authentication, you'll see:**
   ```
   👥 Users
   🔑 Providers         ← Click this
   📋 Policies
   ⚙️ Settings
   ```
4. **In Providers page, scroll down to find:**
   ```
   📧 Email
   📱 Phone
   🔍 Google            ← This is what you want!
   🐙 GitHub
   ```
5. **Click on Google and you'll see:**
   ```
   ☐ Enable sign in with Google    ← Toggle this ON
   📝 Client ID: [paste here]
   🔑 Client Secret: [paste here]
   💾 Save                         ← Click this
   ```

---

## Step 9: Verify Setup

**Check these in Table Editor:**

1. **Users table** - Should be empty initially ✓
2. **Projects table** - Should be empty initially ✓
3. **Styles table** - Should have 6 styles ✓
4. **Project_images table** - Should be empty initially ✓
5. **Usage_logs table** - Should be empty initially ✓

**Check Storage:**

- Should see `images` bucket ✓

---

## Step 10: Test Your Setup

1. **Start the app:**

   ```bash
   npm run dev
   ```

2. **Visit:** http://localhost:3001

3. **Test health check:** http://localhost:3001/api/health

   - Should show all checks as `true`

4. **Try signing in** with Google/GitHub

5. **Try creating a project**

---

## 🚨 Common Issues & Solutions

### Issue: "Sign In Required" but no sign-in options visible

**This is likely your current issue!**

**Solutions:**

1. **Check if OAuth providers are properly enabled in Supabase:**

   - Go to Supabase → Authentication → Providers
   - Make sure Google and/or GitHub are toggled ON
   - Verify Client ID and Client Secret are filled in correctly

2. **Verify redirect URLs match:**

   - In Google Console: `http://localhost:3000` should be in "Authorized JavaScript origins"
   - In Google Console: `https://mrppguihisvniqredmgf.supabase.co/auth/v1/callback` should be in "Authorized redirect URIs"
   - In Supabase: Site URL should be `http://localhost:3000`
   - In Supabase: Redirect URLs should include `http://localhost:3000/auth/callback`

3. **Debug the authentication:**
   - Visit: http://localhost:3000/auth/debug
   - Check browser console for errors
   - Look for authentication state information

### Issue: "RLS policy violation"

**Solution:** Make sure you ran all the RLS policies in Step 6

### Issue: "Bucket does not exist"

**Solution:** Create the `images` bucket in Step 7

### Issue: "Auth redirect errors"

**Solution:** Check redirect URLs in Step 8

### Issue: "No styles found"

**Solution:** Re-run the styles insert in Step 4

---

## ✅ Success Indicators

When everything is working:

- Health check shows all `true`
- You can sign in with Google/GitHub
- Creating projects works
- No errors in browser console

Your Supabase is now completely set up! 🎉
