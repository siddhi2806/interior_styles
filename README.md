# AI Room Styler

Transform your room with AI-powered interior design. Upload a photo and watch as AI transforms your space into stunning interior designs in different styles.

## 🚀 Features

- **AI-Powered Style Transfer**: Transform rooms using advanced AI models
- **6 Interior Styles**: Industrial, Minimalist, Rustic, Scandinavian, Bohemian, Modern
- **Credits System**: Fair usage with 50 free credits to start
- **Project Management**: Organize your transformations in projects
- **Admin Dashboard**: Complete admin panel for user and credit management
- **Secure Authentication**: Google OAuth integration via Supabase
- **Responsive Design**: Beautiful UI with Tailwind CSS and GSAP animations
- **Real-time Storage**: Image storage and metadata via Supabase

## 🛠 Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage)
- **AI**: Hugging Face Inference API / Replicate
- **Animations**: GSAP
- **Hosting**: Vercel (recommended)

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Supabase account and project
- A Hugging Face account and API key (free tier available)
- Google OAuth app configured

## 🔧 Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd ai-room-styler
npm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your keys
3. Run the SQL commands from `supabase-schema.sql` in your Supabase SQL Editor
4. Enable Google OAuth in Authentication > Providers
5. Create a storage bucket named `images` with public access

### 3. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
HUGGINGFACE_API_KEY=hf_your-api-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Hugging Face API

1. Sign up at [huggingface.co](https://huggingface.co)
2. Go to Settings > Access Tokens
3. Create a new token with read permissions
4. Add it to your `.env.local` file

### 5. Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
6. Add the client ID and secret to Supabase Auth settings

### 6. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to see your application.

## 🎨 AI Model Configuration

The app uses Hugging Face's Stable Diffusion models. You can customize the model by updating the API calls in `/src/app/api/render/route.ts`.

### Recommended Models:
- `stabilityai/stable-diffusion-2-1` (default)
- `runwayml/stable-diffusion-v1-5`
- `stabilityai/stable-diffusion-xl-base-1.0`

## 🔐 Security Features

- **Row Level Security**: All database operations are secured
- **Credit Validation**: Server-side credit checking prevents cheating
- **Admin Controls**: Block users and manage credits
- **Rate Limiting**: Built-in protection against abuse
- **Secure File Upload**: Images stored securely in Supabase Storage

## 📊 Admin Features

Access `/admin` as an admin user to:

- View user statistics and usage
- Manage user credits
- Block/unblock users
- Monitor platform activity
- View detailed usage logs

To make a user admin, update their record in the database:
```sql
UPDATE users SET is_admin = true WHERE id = 'user-id';
```

## 🎯 Usage Flow

1. **Sign Up**: Users sign in with Google OAuth
2. **Welcome Credits**: 50 free credits automatically added
3. **Create Project**: Organize renders into projects
4. **Upload & Transform**: Upload room photo and select style
5. **AI Processing**: Image sent to AI model for transformation
6. **Credit Deduction**: 5 credits deducted per successful render
7. **View Results**: Before/after images saved to project

## 🔄 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app works on any platform that supports Next.js:
- Netlify
- Railway
- AWS Amplify
- Digital Ocean App Platform

## 🐛 Troubleshooting

### Common Issues:

1. **"Insufficient credits" error**: Check user credits in database
2. **Upload fails**: Verify Supabase storage bucket permissions
3. **AI render fails**: Check Hugging Face API key and quotas
4. **Auth issues**: Verify Google OAuth configuration

### Database Queries for Debugging:

```sql
-- Check user credits
SELECT id, display_name, credits FROM users WHERE id = 'user-id';

-- View usage logs
SELECT * FROM usage_logs WHERE user_id = 'user-id' ORDER BY created_at DESC;

-- Check project images
SELECT * FROM project_images WHERE user_id = 'user-id';
```

## 📈 Scaling Considerations

For production use:

1. **Rate Limiting**: Implement per-user rate limits
2. **Image Optimization**: Add image compression/resizing
3. **CDN**: Use Supabase CDN or Cloudflare for images
4. **Monitoring**: Add error tracking (Sentry) and analytics
5. **Caching**: Implement Redis for session caching
6. **Queue System**: Use job queues for AI processing

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- Open an issue for bugs or feature requests
- Check the [Supabase docs](https://supabase.com/docs) for database issues
- Visit [Hugging Face docs](https://huggingface.co/docs) for AI model help

## 🎉 Acknowledgments

- Supabase team for the amazing backend platform
- Hugging Face for providing free AI model access
- Next.js team for the excellent framework
- Tailwind CSS for the utility-first styling approach
