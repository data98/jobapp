# Jobapp

AI-powered job application tracker and resume builder. Maintain one master resume, then generate tailored variants for every job you apply to — with AI analysis, ATS scoring, and one-click rewrites.

## Features

- **Master Resume Editor** — structured 7-tab form (personal info, experience, education, skills, languages, certifications, projects) with auto-save and PDF upload + AI parsing
- **Job Application Tracker** — full CRUD with status pipeline (Bookmarked → Applying → Applied → Interviewing → Negotiation → Accepted/Rejected), filtering, and sorting
- **Tailored Resume Variants** — per-application resume cloned from master, editable with live preview, section toggles, drag-and-drop reordering, and design customization
- **AI-Powered ATS Analysis** — multi-stage scoring pipeline analyzing keyword match, experience relevance, hard requirements, resume quality, and skills depth
- **One-Click Rewrites** — AI-generated bullet point suggestions targeting missing keywords, with accept/undo per suggestion
- **JD Auto-Parse** — paste a job URL and automatically extract the job description
- **Resume Templates** — Classic, Modern, and Minimal templates with live preview
- **PDF Export** — server-side PDF generation via `@react-pdf/renderer` with locale-aware section headers
- **Internationalization** — full i18n support (English, Georgian) with zero hardcoded strings
- **Dark/Light Mode** — system-aware theme toggle across all pages
- **Authentication** — email/password + Google OAuth via Better Auth

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Server Actions, API Routes) |
| Language | TypeScript (strict mode) |
| Auth | [Better Auth](https://www.better-auth.com/) (email/password + Google OAuth) |
| Database | [Supabase](https://supabase.com/) (PostgreSQL) |
| AI | [OpenAI GPT-4o](https://platform.openai.com/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| i18n | [next-intl](https://next-intl.dev/) |
| PDF Export | [@react-pdf/renderer](https://react-pdf.org/) |
| Forms | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| Animation | [Framer Motion](https://www.framer.com/motion/) |
| Drag & Drop | [dnd-kit](https://dndkit.com/) |

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com/) project
- An [OpenAI](https://platform.openai.com/) API key
- (Optional) Google OAuth credentials for social login

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/data98/jobapp.git
cd jobapp
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Better Auth
BETTER_AUTH_SECRET=<random-32-character-string>
BETTER_AUTH_URL=http://localhost:3000

# Supabase
DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# OpenAI
OPENAI_API_KEY=sk-...

# Google OAuth (optional)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

### 4. Set up the database

Run the Better Auth migration to create auth tables:

```bash
npx @better-auth/cli migrate
```

Then apply the application migrations in order. Run these SQL files in your Supabase SQL editor:

```
supabase/migrations/001_create_tables.sql
supabase/migrations/002_ats_scoring.sql
supabase/migrations/003_ats_scoring_v3.sql
supabase/migrations/004_client_baseline.sql
supabase/migrations/005_contact_linkedin.sql
supabase/migrations/006_ats_v1.sql
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
jobapp/
├── app/
│   ├── [locale]/                # All pages under locale prefix
│   │   ├── (auth)/              # Login, signup
│   │   ├── (dashboard)/         # Dashboard, applications, resume, settings
│   │   └── (marketing)/         # Landing page
│   ├── api/                     # API routes (outside locale segment)
│   │   ├── auth/[...all]/       # Better Auth handler
│   │   ├── ai/                  # AI analysis, JD parsing, rewrites
│   │   └── resume/              # PDF export, resume parsing
│   └── layout.tsx               # Root layout
├── components/
│   ├── ui/                      # shadcn/ui primitives
│   ├── landing/                 # Landing page sections
│   ├── dashboard/               # Dashboard stats and charts
│   ├── applications/            # Application CRUD components
│   ├── resume/                  # Resume form, preview, templates
│   ├── analysis/                # AI analysis UI
│   ├── resume-view/             # Variant editor with ATS scoring
│   └── shared/                  # Navbar, sidebar, locale switcher
├── lib/
│   ├── auth.ts                  # Better Auth server config
│   ├── auth-client.ts           # Better Auth React client
│   ├── openai.ts                # OpenAI SDK setup
│   ├── supabase/                # Supabase server/client instances
│   ├── actions/                 # Server actions (resume, applications, analysis)
│   └── ats-scoring/             # Multi-stage ATS scoring pipeline
├── i18n/                        # next-intl routing, navigation, config
├── messages/                    # Translation files (en.json, ka.json, ru.json)
├── types/                       # TypeScript interfaces
├── constants/                   # Status config, AI prompt templates
├── hooks/                       # Custom React hooks
├── supabase/migrations/         # SQL migration files
└── proxy.ts                     # Next.js 16 proxy (i18n + auth protection)
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Database Schema

The application uses six core tables (plus Better Auth's internal tables):

- **`master_resume`** — one per user, stores all career data as structured JSONB fields
- **`job_application`** — each tracked job with status, JD text, contact info, and notes
- **`resume_variant`** — per-application tailored resume with template selection, section toggles, and design settings
- **`ai_analysis`** — legacy AI analysis results (ATS score, keywords, rewrites)
- **`jd_profiles`** — structured job description analysis (required/preferred skills, seniority, responsibilities)
- **`ats_analysis`** — V1 multi-dimensional ATS scoring results with recommendations

All tables have Row Level Security enabled. Server-side operations use the Supabase service role key (access is gated by Better Auth session checks).

## Internationalization

The app supports multiple locales with all user-facing strings externalized to translation files. Currently active locales:

- **English** (`en`) — default
- **Georgian** (`ka`)

Translation files live in `messages/` and are organized by feature namespace. The locale switcher is available in the navbar on every page.

AI prompts are always sent in English regardless of the user's locale.

## License

Private — all rights reserved.
