# How to Run This Project Locally

This is a full-stack application with a React frontend and Express.js backend.

## Prerequisites

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Supabase Account** - [Sign up for free here](https://supabase.com/)
- **npm** or **bun** (comes with Node.js)

## Step-by-Step Setup

### 1. Install Frontend Dependencies

From the project root directory:

```bash
npm install
```

Or if you're using Bun:

```bash
bun install
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
cd ..
```

### 3. Set Up Supabase

1. **Create a Supabase Project:**
   - Go to [supabase.com](https://supabase.com/) and sign up/login
   - Create a new project
   - Wait for the project to finish setting up (takes a few minutes)

2. **Get Your Supabase Credentials:**
   - Go to your project's **Settings** → **API**
   - Copy the following:
     - **Project URL** (e.g., `https://xxxxx.supabase.co`)
     - **anon/public key** (for frontend)
     - **service_role key** (for backend - keep this secret!)

3. **Run Database Migrations:**
   - Go to **SQL Editor** in your Supabase dashboard
   - The migrations are in `public/supabase/migrations/` folder
   - Run them in order (they're dated, so run from oldest to newest)
   - OR use the Supabase CLI to apply migrations automatically

### 4. Set Up Backend Environment Variables

Create a `.env` file in the `server/` directory:

```bash
cd server
# On Windows PowerShell:
New-Item -Path .env -ItemType File

# On Windows CMD or Linux/Mac:
# touch .env
```

Add the following variables to `server/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
# Note: Use service_role key for backend, NOT the anon key

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (for contact form and notifications)
# The backend uses Supabase Edge Functions for email, but you may need:
RESEND_API_KEY=your-resend-api-key
# OR
SENDGRID_API_KEY=your-sendgrid-api-key

# Stripe Payment Configuration (optional for development)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

**Important:** 
- The `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security (RLS) - keep it secret!
- Get your keys from Supabase Dashboard → Settings → API

### 5. Set Up Frontend Environment Variables

Create a `.env` file in the project root:

```bash
# From project root
# On Windows PowerShell:
New-Item -Path .env -ItemType File

# On Windows CMD or Linux/Mac:
# touch .env
```

Add to root `.env`:

```env
# Supabase Configuration (for frontend)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Backend API URL (if using the Express backend)
VITE_API_URL=http://localhost:5000/api
```

**Note:** The Supabase URL and anon key are already hardcoded in `src/integrations/supabase/client.ts`, but you can override them with environment variables.

### 6. Set Up Supabase Edge Functions (Optional)

If you need email functionality, set up Supabase Edge Functions:

1. Install Supabase CLI: [Installation Guide](https://supabase.com/docs/guides/cli)
2. Link your project:
   ```bash
   supabase link --project-ref your-project-id
   ```
3. Set secrets for Edge Functions:
   ```bash
   supabase secrets set RESEND_API_KEY=your-resend-key
   # OR
   supabase secrets set SENDGRID_API_KEY=your-sendgrid-key
   ```

### 7. Start the Backend Server (Optional)

**Important Note:** The backend server (`server/` folder) currently has MongoDB code, but you're using Supabase. You have two options:

1. **Skip the backend** - If your frontend uses Supabase directly for all data operations, you may not need the Express backend at all. Just run the frontend.

2. **Update the backend** - If you need the backend API endpoints, you'll need to:
   - Replace MongoDB/Mongoose with Supabase client in the backend
   - Update `server/config/db.js` to use Supabase instead of MongoDB
   - Update all models and controllers to use Supabase

If you need the backend and want to use it with Supabase:

In one terminal window, from the `server/` directory:

```bash
cd server
npm run dev
```

The backend will run on **http://localhost:5000**

### 8. Start the Frontend Development Server

In a **second terminal window**, from the project root:

```bash
# Option 1: Using Bun (if you have bun installed)
bun run dev

# Option 2: Using Vite directly (if vite is installed)
npx vite

# Option 3: If you have vite installed globally
vite
```

The frontend will run on **http://localhost:8080**

**Note:** If you get an error that vite is not found, make sure you've installed the frontend dependencies. The project uses Bun (based on `bun.lockb`), so you may need to install Bun first: [Download Bun](https://bun.sh/)

## Access the Application

- **Frontend:** Open http://localhost:8080 in your browser
- **Backend API:** Available at http://localhost:5000/api

## Default Admin Credentials

Admin users are managed through Supabase Auth. To create an admin user:

1. **Via Supabase Dashboard:**
   - Go to **Authentication** → **Users** in your Supabase dashboard
   - Create a new user
   - Assign the appropriate role in your database

2. **Via Application:**
   - Use the registration/login flow in the application
   - Admin roles are managed through Supabase Row Level Security (RLS) policies

⚠️ **Important:** Make sure your RLS policies are properly configured for security!

## Troubleshooting

### Supabase Connection Issues

If you get Supabase connection errors:

1. **Check Your Credentials:**
   - Verify your `SUPABASE_URL` is correct (should end with `.supabase.co`)
   - Make sure you're using the right key:
     - Frontend: Use `anon` key (public)
     - Backend: Use `service_role` key (secret)

2. **Check Network Access:**
   - Supabase projects are accessible from anywhere by default
   - If you have IP restrictions, make sure your IP is whitelisted

3. **Database Migrations:**
   - Make sure all migrations in `public/supabase/migrations/` have been run
   - Check the Supabase dashboard → **Database** → **Migrations** to see which ones are applied

4. **Row Level Security (RLS):**
   - If you can't access data, check RLS policies in Supabase Dashboard
   - Go to **Authentication** → **Policies** to review and adjust policies

### Port Already in Use

If port 5000 or 8080 is already in use:

1. **Backend:** Change `PORT` in `server/.env`
2. **Frontend:** Change port in `vite.config.ts` (line 10)

### CORS Errors

If you see CORS errors, make sure:
- Backend is running on port 5000
- Frontend is configured to use `http://localhost:5000/api` in `.env`

## Quick Start (Summary)

```bash
# 1. Install dependencies
npm install
# OR
bun install

# 2. Create Supabase project at supabase.com and get your credentials

# 3. Set up environment variables:
#    - Create server/.env with SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc.
#    - Create root .env with VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

# 4. Run Supabase migrations (via Supabase Dashboard SQL Editor or CLI)

# 5. Start frontend (Terminal 1)
bun run dev
# OR
npx vite

# 6. (Optional) Start backend if needed (Terminal 2)
cd server && npm run dev
```

## Production Build

To build for production:

**Frontend:**
```bash
npm run build
```

**Backend:**
```bash
cd server
npm start
```

---

Need help? Check the `server/README.md` for more backend API documentation.

