# Amuse Ke - Children's Nature Camp Platform

## About Amuse Ke

Amuse Ke is a comprehensive full-stack platform for a children's nature camp located in Kenya's beautiful Karura Forest. The platform serves as both a public-facing website for families to learn about and register for camp programs, and a robust internal management system with role-based portals for staff across multiple departments.

## Key Features

### Public-Facing Features
- **Interactive Landing Page**
  - Dynamic hero slider with content management
  - Real-time announcements system
  - Program highlights and seasonal camp offerings
  - Interactive yearly calendar
  - Parent testimonials and reviews
  - Team member profiles
  - Contact form with email integration

- **Program Registration System**
  - Multiple program types: Day Camps, Holiday Camps (Easter, Summer, Mid-Term, End Year)
  - Kenyan Experiences, Homeschooling, School Experience programs
  - Team Building and Birthday Party bookings
  - Online payment processing with QR code generation
  - Automated confirmation emails
  - Registration tracking and management

- **Content Management**
  - Dynamic "Who We Are" section with pillars
  - FAQ system with categorization
  - Gallery management with image optimization
  - Navigation settings control

### Administrative & Staff Portals
- **Marketing Portal**
  - Content management for all public pages
  - Lead and customer management
  - Email campaign management with Postmark integration
  - Email health dashboard and deliverability tracking
  - Campaign analytics and reporting
  - Navigation and SEO settings

- **CEO Dashboard**
  - Executive analytics and KPI tracking
  - Approval workflows
  - Strategic planning tools
  - Company-wide reports
  - System settings and configurations

- **HR Portal**
  - Employee management
  - Team recruitment section
  - Staff profiles and roles

- **Accounts Portal**
  - Invoice management
  - Financial tracking
  - Payment reconciliation

- **Governance Portal**
  - Policy management
  - Compliance framework
  - Risk management
  - Audit trails and logs
  - Document management
  - Data governance

- **Coach Portal**
  - Camp attendance tracking with QR scanner
  - Registration management
  - Activity planning and reporting

- **Admin Portal**
  - User management and approval system
  - Role-based access control
  - Camp and program registration management
  - Ground registration for walk-ins
  - Attendance marking system
  - System health monitoring
  - Data migration tools

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: 
  - Tailwind CSS with custom design system
  - Semantic color tokens (HSL-based)
  - Shadcn UI component library
  - Radix UI primitives
- **State Management**: 
  - TanStack React Query for server state
  - React Context for authentication
  - Local state with React hooks
- **Routing**: React Router DOM v6
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**:
  - Custom components built on Radix UI
  - Responsive design patterns
  - Accessible ARIA-compliant components
- **Utilities**:
  - date-fns for date handling
  - Recharts for data visualization
  - Sonner for toast notifications
  - Lucide React for icons
  - QR code generation (qrcode, html5-qrcode)
  - PDF generation (jspdf, html2canvas)
  - Rich text editing (Quill, React Quill)

### Backend (Supabase)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: 
  - Supabase Auth with JWT
  - Email/password authentication
  - Role-based access control with custom app_role enum
  - User approval system
- **Storage**: Supabase Storage for images and assets
- **Edge Functions**: 
  - Email webhook handling (Postmark integration)
  - Program confirmation emails
  - Marketing system automation
- **Real-time**: Supabase real-time subscriptions for live updates
- **Security**: 
  - Row Level Security policies on all tables
  - Custom security functions (has_role)
  - Audit logging system

### Key Integrations
- **Email**: Postmark for transactional emails and campaigns
- **Analytics**: Custom analytics dashboard with usage tracking
- **Payment Processing**: Integrated payment gateway (Stripe-ready)
- **SEO**: React Helmet Async for meta tags and SEO optimization

## Architecture
- **Frontend**: Single Page Application (SPA)
- **Backend**: Supabase (PostgreSQL + Edge Functions + Storage + Auth)
- **State Management**: Server-client synchronization with React Query
- **Security Model**: Role-based access control (RBAC) with RLS policies
- **Content Delivery**: Optimized asset delivery with lazy loading

## Development Approach
- Component-based architecture with TypeScript
- Mobile-first responsive design
- Accessibility-first UI components (WCAG compliant)
- Progressive enhancement patterns
- Comprehensive CMS for non-technical content management
- Real-time data synchronization
- Optimistic UI updates for better UX

---

## Local Development Setup

### Prerequisites

Before running this project locally, ensure you have the following installed:

| Tool | Version | Download Link |
|------|---------|---------------|
| **Node.js** | v18.0.0 or higher | [nodejs.org](https://nodejs.org/) |
| **npm** | v9.0.0 or higher (comes with Node.js) | Included with Node.js |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

Optional but recommended:
- **VS Code** - [code.visualstudio.com](https://code.visualstudio.com/)
- **Bun** (alternative package manager) - [bun.sh](https://bun.sh/)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   
   Or if using Bun:
   ```bash
   bun install
   ```

3. **Environment Configuration**
   
   Create a `.env.local` file in the root directory with the following variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   > **Note**: Contact the project administrator to obtain the Supabase credentials.

4. **Start the development server**
   ```bash
   npm run dev
   ```
   
   Or with Bun:
   ```bash
   bun run dev
   ```

5. **Access the application**
   
   Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build production-ready bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality checks |

### IDE Setup (VS Code Recommended)

For the best development experience, install these VS Code extensions:

1. **Essential Extensions**
   - ESLint (`dbaeumer.vscode-eslint`)
   - Prettier (`esbenp.prettier-vscode`)
   - Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)
   - TypeScript Vue Plugin (Volar) - for `.tsx` files

2. **Recommended Extensions**
   - Auto Rename Tag (`formulahendry.auto-rename-tag`)
   - Path Intellisense (`christian-kohler.path-intellisense`)
   - Error Lens (`usernamehw.errorlens`)

3. **VS Code Settings** (`.vscode/settings.json`)
   ```json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     },
     "tailwindCSS.includeLanguages": {
       "typescript": "javascript",
       "typescriptreact": "javascript"
     }
   }
   ```

### Troubleshooting

**Port already in use?**
```bash
# Kill process on port 8080
npx kill-port 8080
# Then restart
npm run dev
```

**Dependencies not installing?**
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors?**
```bash
# Restart TypeScript server in VS Code
# Press Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

---

## File Structure Overview

- `/src` - Main source code directory
  - `/components` - React components
    - `/ui` - Shadcn UI components (Radix-based)
    - `/portals` - Role-based portal components (CEO, Marketing, HR, etc.)
    - `/admin` - Admin dashboard components
    - `/gallery` - Gallery management components
    - `/calendar` - Calendar and event components
    - `/team` - Team member components
    - `/announcements` - Announcement system
    - `/content` - CMS content components
    - `/forms` - Program registration forms
    - `/analytics` - Analytics dashboard
    - `/attendance` - QR scanner and attendance tracking
    - `/communication` - Messaging and email components
  - `/hooks` - Custom React hooks (useAuth, useContent, useSupabaseAuth, etc.)
  - `/lib` - Utility functions and helpers
  - `/pages` - Main page components
    - `/about` - About section pages (Team, Who We Are, What We Do)
    - `/camps` - Camp program pages
    - `/experiences` - Experience program pages
    - `/group-activities` - Team building and parties
    - `/programs` - Program detail pages
  - `/services` - API service layer for Supabase integration
  - `/types` - TypeScript type definitions
  - `/integrations` - Third-party integrations (Supabase client)
  - `/utils` - Utility functions and default configurations

- `/public/supabase/migrations` - Database migration files
- `/supabase/functions` - Edge functions for serverless backend logic

---

## Database Setup

All database migrations are located in `public/supabase/migrations/` and include:
- Authentication system setup
- User roles and permissions
- Content management tables
- Program registration tables
- Marketing and CMS tables
- Email management system
- Calendar and events

Migrations are applied through the Supabase dashboard or CLI.

---

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the existing code style
3. Test thoroughly in development
4. Submit a pull request with a clear description

---

## License

This project is proprietary and confidential.
