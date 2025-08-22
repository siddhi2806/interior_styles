# 🚨 TROUBLESHOOTING: "Create Project" Not Working

## Quick Fix Steps

### 1. **Run Required SQL Scripts in Supabase**

Go to your Supabase Dashboard → SQL Editor and run these files **in order**:

```sql
-- 1. First, run: supabase-styles-seed.sql
INSERT INTO styles (name, description) VALUES
('Industrial', 'Exposed beams, concrete, raw metal'),
('Minimalist', 'Clean lines, clutter-free, neutral palette'),
('Rustic', 'Warm woods, earthy textiles, cozy'),
('Scandinavian', 'Bright, light wood, cozy minimal'),
('Bohemian', 'Colorful textiles, plants, eclectic'),
('Modern', 'Sleek furniture, polished surfaces')
ON CONFLICT (name) DO NOTHING;
```

```sql
-- 2. Then run: supabase-rls-policies.sql (see the file for full content)
-- This sets up Row Level Security policies
```

```sql
-- 3. Finally run: supabase-admin-view.sql
CREATE OR REPLACE VIEW admin_user_stats AS ...
```

### 2. **Check Authentication Setup**

In Supabase Dashboard:

- Go to **Authentication** → **Settings** → **URL Configuration**
- Add these redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3001/auth/callback`
  - `http://localhost:3000`
  - `http://localhost:3001`

### 3. **Enable Social Providers**

In Supabase Dashboard → Authentication → Providers:

- Enable **Google** and **GitHub**
- Add your OAuth credentials

### 4. **Test Database Connection**

Try this simple test in your browser console (F12):

```javascript
// Test if you're authenticated
console.log("User:", await supabase.auth.getUser());

// Test direct database access
console.log(
  "Direct DB test:",
  await supabase.from("users").select("*").limit(1)
);
```

### 5. **Check Browser Console**

1. Open the app: http://localhost:3001
2. Press F12 → Console tab
3. Try to create a project
4. Look for error messages

### 6. **Common Issues & Solutions**

#### Issue: "User not found"

**Solution:** Run the RLS policies SQL script above

#### Issue: "Projects not loading"

**Solution:** Make sure you're signed in and policies are set up

#### Issue: "Auth callback errors"

**Solution:** Check redirect URLs in Supabase settings

#### Issue: "Database connection failed"

**Solution:** Verify environment variables in `.env.local`

### 7. **Debug Mode**

The app now includes a debug API at `/api/debug-project` which provides detailed error messages.

Check the browser console and terminal for detailed logs.

### 8. **Step-by-Step Test**

1. **Sign in** using Google/GitHub
2. **Check browser console** for any auth errors
3. **Try creating a project**
4. **Check console logs** for detailed error messages
5. **If still failing, check:**
   - Supabase dashboard for user in Auth tab
   - Users table has a record for your user
   - Projects table exists and has proper schema

### 9. **Manual Database Check**

In Supabase Dashboard → Table Editor:

1. **Check `auth.users` table** - should have your user
2. **Check `public.users` table** - should have your profile
3. **Check `projects` table** - should be empty initially
4. **Check `styles` table** - should have 6 styles

### 10. **Reset Everything** (if needed)

If nothing works, reset the database:

```sql
-- WARNING: This deletes all data
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
-- ... (drop all policies)

TRUNCATE users CASCADE;
TRUNCATE projects CASCADE;
TRUNCATE project_images CASCADE;
TRUNCATE usage_logs CASCADE;

-- Then re-run all the setup SQL scripts
```

## Still Not Working?

If you're still having issues:

1. **Check the terminal output** for any API errors
2. **Check Supabase logs** in the dashboard
3. **Verify environment variables** are correct
4. **Try the debug API** at `/api/debug-project`

The debug version provides detailed error messages in both the browser console and terminal to help identify the exact issue.

---

## Expected Behavior

When working correctly:

1. Click "New Project" → Modal opens
2. Enter project name → Click "Create"
3. Modal closes → Project appears in grid
4. Project is selected → Render panel appears below

If this isn't happening, follow the steps above! 🚀
