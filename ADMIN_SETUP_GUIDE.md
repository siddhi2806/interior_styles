# Admin Panel Access Setup Guide

## 🔐 How to Access the Admin Panel

### Step 1: Set Up Admin Users in Supabase

1. **Go to your Supabase Dashboard**
   - Open [supabase.com](https://supabase.com)
   - Select your project
   - Go to SQL Editor

2. **Run the Admin Setup Script**
   - Copy the content from `setup-admin-access.sql`
   - **IMPORTANT**: Replace these placeholder emails with your actual admin emails:
     ```sql
     SELECT grant_admin_access('your-admin-email@gmail.com');
     SELECT grant_admin_access('second-admin@gmail.com'); 
     SELECT grant_admin_access('third-admin@gmail.com');
     ```
   - Execute the script in SQL Editor

3. **Verify Admin Setup**
   - The script will show current admins at the end
   - Make sure your 3 chosen users appear with `is_admin = TRUE`

### Step 2: Admin Users Must Sign Up First

1. **Each admin must create an account:**
   - Go to your app: `http://localhost:3000`
   - Click "Sign In" 
   - Use Google OAuth to sign up with their admin email
   - Complete the profile setup

2. **Admin status will be automatically assigned** if their email matches the ones you configured

### Step 3: Access the Admin Panel

1. **Sign in as an admin user**
   - Go to `http://localhost:3000`
   - Sign in with your admin Google account

2. **Navigate to Admin Panel**
   - Go to: `http://localhost:3000/admin`
   - Or add an admin link to your navigation

### Step 4: Admin Panel Features

The admin panel includes 4 main sections:

#### 👥 **Users Tab**
- View all registered users
- See user statistics (projects, renders, credits used)
- Give/modify credits to users
- Block/unblock users
- Search and filter users

#### 🎨 **Styles Tab** 
- Add new room styles
- Edit existing styles
- Delete unused styles
- View style popularity

#### 📊 **Reports Tab**
- User registration analytics
- Usage statistics
- Style popularity charts
- Export data to CSV
- Time-based reports (daily/weekly/monthly)

#### ⚙️ **Settings Tab**
- System configuration
- Admin management
- Bulk operations

## 🛡️ Security Features

### Access Control
- Only users with `is_admin = TRUE` can access `/admin`
- Admin status is checked on both client and server side
- Non-admin users are redirected automatically

### Audit Logging
- All admin actions are logged in `admin_actions` table
- Tracks who did what and when
- Includes details of changes made

### Limited Admin Count
- Maximum 3 admins as requested
- Easy to add/remove admins via SQL functions
- Automatic admin assignment for specified emails

## 🔧 Adding/Removing Admins

### To Add a New Admin:
```sql
SELECT grant_admin_access('new-admin@example.com');
```

### To Remove an Admin:
```sql
SELECT revoke_admin_access('old-admin@example.com');
```

### To Check Current Admins:
```sql
SELECT 
  u.email,
  p.display_name,
  p.is_admin,
  p.created_at
FROM auth.users u
JOIN public.users p ON u.id = p.id
WHERE p.is_admin = TRUE;
```

## 🚀 Quick Start Checklist

- [ ] Run `setup-admin-access.sql` in Supabase SQL Editor
- [ ] Replace placeholder emails with real admin emails
- [ ] Each admin signs up via Google OAuth
- [ ] Verify admin status in database
- [ ] Access admin panel at `/admin`
- [ ] Test all admin functions

## 📝 Notes

- Admin users get admin access automatically when they sign up (if email matches)
- Regular users cannot access admin features
- All admin actions are logged for security
- You can monitor admin activity through the Reports section

## 🆘 Troubleshooting

**Problem**: Can't access admin panel
- **Solution**: Check if user has `is_admin = TRUE` in database

**Problem**: Admin status not assigned automatically  
- **Solution**: Run the admin setup script again with correct email

**Problem**: Getting "Access Denied" error
- **Solution**: Make sure you're signed in with an admin Google account

**Problem**: Admin panel not loading
- **Solution**: Check browser console for errors, ensure development server is running
