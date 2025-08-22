# AI Room Styler - Complete Setup Guide

This guide will help you set up the AI Room Styler application with all its features.

## Prerequisites

1. Node.js 18+ installed
2. Supabase account
3. Hugging Face account (for AI API)

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

Run these SQL commands in your Supabase SQL Editor:

1. **Create the admin stats view:**

```sql
-- See supabase-admin-view.sql
```

2. **Seed the styles table:**

```sql
-- See supabase-styles-seed.sql
```

### 3. Environment Variables

Update your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
HUGGINGFACE_API_KEY=your_hf_api_key
NEXT_PUBLIC_HF_MODEL=stabilityai/stable-diffusion-2-1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Get Hugging Face API Key

1. Go to https://huggingface.co/
2. Create account / Sign in
3. Go to Settings > Access Tokens
4. Create a new token with "Read" permission
5. Add to `.env.local`

### 5. Run the Application

```bash
npm run dev
```

Open http://localhost:3000

## Features Implemented

✅ **Authentication & User Management**

- Supabase Auth with social login
- Automatic profile creation with 50 initial credits
- User roles (admin/regular)

✅ **Project Management**

- Create and manage projects
- Project gallery with before/after comparisons

✅ **AI Style Transfer**

- Upload room images
- Transform with 6 different styles:
  - Industrial
  - Minimalist
  - Rustic
  - Scandinavian
  - Bohemian
  - Modern

✅ **Credits System**

- 50 initial credits per user
- 5 credits per render
- Credit deduction with transaction safety

✅ **Admin Dashboard**

- User management
- Credit management
- Usage statistics
- Block/unblock users

✅ **Gallery & Comparison**

- Before/after image slider
- Project history
- Download and share options

✅ **UI/UX**

- Tailwind CSS styling
- GSAP animations
- Responsive design
- Glassmorphism effects

## Testing the App

1. **Sign up** using Google/GitHub
2. **Create a project** with a name
3. **Upload a room image** and select a style
4. **Render** and watch credits deduct
5. **View gallery** with before/after comparison
6. **Test admin features** (set is_admin=true in database)

## Production Deployment

1. Deploy to Vercel
2. Set environment variables in Vercel dashboard
3. Update NEXT_PUBLIC_SITE_URL to your domain
4. Configure Supabase RLS policies for production

## API Integration

The current setup uses a simulated AI response. To integrate with real Hugging Face API:

1. Uncomment the actual HF API call in `/api/render/route.ts`
2. Test with your HF API key
3. Handle rate limits and errors appropriately

## Customization

- **Add more styles**: Update the styles table and prompts in render API
- **Adjust credits**: Modify initial credits and cost per render
- **Custom animations**: Extend GSAP animations in components
- **Additional features**: Add favorites, collections, social sharing

## Troubleshooting

- **Upload errors**: Check Supabase Storage bucket permissions
- **Auth issues**: Verify Supabase redirect URLs
- **API errors**: Check Hugging Face API key and model availability
- **Database errors**: Ensure all tables and views are created

## Support

For issues or questions:

1. Check Supabase logs for database errors
2. Check browser console for frontend errors
3. Check Vercel function logs for API errors

Enjoy building amazing room transformations! 🏠✨
