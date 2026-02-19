# Prompt: Build "Jobapp" — AI-Powered Job Application Tracker & Resume Builder

## Project Overview

Build a full-stack job application tracking platform called **"Jobapp"**. Users manage a single **master resume** (their complete career data), then create **tailored resume variants** for each job application. AI analyzes job descriptions against the user's profile, identifies gaps, and offers one-click rewrites to optimize the resume for each specific role.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Server Actions, API Routes) |
| Language | TypeScript (strict mode) |
| Auth | Better Auth (email + password, OAuth later) |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage (resume uploads) |
| AI | OpenAI GPT-4o (via `openai` npm SDK) |
| Styling | Tailwind CSS 4 + shadcn/ui |
| i18n | next-intl (English + Russian) |
| PDF Export | `@react-pdf/renderer` |
| Deployment | Vercel |

---

## Documentation References

Before writing ANY code, read the relevant docs:

- **Better Auth setup:** https://www.better-auth.com/llms.txt → read `docs/installation.md`, `docs/basic-usage.md`, `docs/integrations/next.md`, `docs/authentication/email-password.md`, `docs/concepts/client.md`, `docs/concepts/session-management.md`, `docs/adapters/postgresql.md`
- **Supabase JS client:** https://supabase.com/docs/reference/javascript/introduction
- **shadcn/ui:** https://ui.shadcn.com/docs/installation/next
- **OpenAI SDK:** https://platform.openai.com/docs/api-reference
- **@react-pdf/renderer:** https://react-pdf.org/
- **next-intl (i18n):** https://next-intl.dev/docs/getting-started/app-router/with-i18n-routing — follow the "with i18n routing" setup for App Router. Also read https://next-intl.dev/docs/usage/messages and https://next-intl.dev/docs/usage/configuration

---

## Database Schema (Supabase / PostgreSQL)

Design and create these tables. Better Auth will also create its own tables (`user`, `session`, `account`, `verification`) — do NOT manually create those; let Better Auth handle them via its migration CLI (`npx @better-auth/cli migrate`).

### `master_resume`
One per user. Stores all the user's career data as structured JSON.

```sql
create table master_resume (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user"(id) on delete cascade,
  personal_info jsonb not null default '{}',
  -- personal_info shape: { fullName, email, phone, location, linkedIn, portfolio, summary }
  experience jsonb not null default '[]',
  -- experience shape: [{ id, company, title, startDate, endDate, current, location, bullets: string[] }]
  education jsonb not null default '[]',
  -- education shape: [{ id, institution, degree, field, startDate, endDate, gpa }]
  skills jsonb not null default '[]',
  -- skills shape: [{ id, category, items: string[] }]  e.g. { category: "Programming", items: ["Python", "TypeScript"] }
  languages jsonb not null default '[]',
  -- languages shape: [{ id, language, proficiency }]
  certifications jsonb not null default '[]',
  -- certifications shape: [{ id, name, issuer, date, url }]
  projects jsonb not null default '[]',
  -- projects shape: [{ id, name, description, url, bullets: string[] }]
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);
```

### `job_application`
Each job the user is tracking.

```sql
create table job_application (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user"(id) on delete cascade,
  job_title text not null,
  company text not null,
  job_description text, -- full JD text pasted by user
  job_url text,
  status text not null default 'bookmarked'
    check (status in ('bookmarked', 'applying', 'applied', 'interviewing', 'negotiation', 'accepted', 'rejected')),
  contact_name text,
  contact_email text,
  contact_phone text,
  notes text,
  salary_range text,
  location text,
  applied_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### `resume_variant`
Per-application tailored version of the master resume. Stores the AI-modified data.

```sql
create table resume_variant (
  id uuid primary key default gen_random_uuid(),
  job_application_id uuid not null references job_application(id) on delete cascade,
  user_id text not null references "user"(id) on delete cascade,
  template_id text not null default 'classic',
  -- Tailored content (same shape as master_resume fields, but with AI modifications)
  personal_info jsonb not null default '{}',
  experience jsonb not null default '[]',
  education jsonb not null default '[]',
  skills jsonb not null default '[]',
  languages jsonb not null default '[]',
  certifications jsonb not null default '[]',
  projects jsonb not null default '[]',
  -- Which sections to include in this variant
  included_sections jsonb not null default '["personal_info","experience","education","skills"]',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(job_application_id)
);
```

### `ai_analysis`
Stores AI feedback per job application.

```sql
create table ai_analysis (
  id uuid primary key default gen_random_uuid(),
  job_application_id uuid not null references job_application(id) on delete cascade,
  ats_score integer, -- 0-100
  summary text, -- overall assessment
  missing_keywords jsonb default '[]', -- ["Docker", "CI/CD", ...]
  improvement_areas jsonb default '[]', -- [{ section, issue, suggestion, priority }]
  matching_strengths jsonb default '[]', -- [{ area, detail }]
  rewrite_suggestions jsonb default '[]',
  -- rewrite_suggestions shape: [{ id, section, original_index, original_text, suggested_text, keywords_addressed: string[], accepted: boolean }]
  raw_response jsonb, -- full GPT response for debugging
  created_at timestamptz default now(),
  unique(job_application_id)
);
```

### Row Level Security (RLS)
Enable RLS on ALL tables. Policies should ensure users can only read/write their own data:

```sql
-- Example pattern for each table:
alter table master_resume enable row level security;
create policy "Users can CRUD own master_resume"
  on master_resume for all
  using (user_id = current_setting('request.jwt.claims')::json->>'sub')
  with check (user_id = current_setting('request.jwt.claims')::json->>'sub');
```

IMPORTANT: Since Better Auth manages its own sessions (not Supabase Auth), you'll need to handle the Supabase client differently. Use the **Supabase service role key** in server-side API routes (which are already auth-gated by Better Auth middleware), rather than relying on Supabase RLS with JWTs. This is simpler and avoids token-bridging complexity. Apply RLS only if you also want defense-in-depth; otherwise, rely on Better Auth session checks in your API routes.

---

## Project Structure

```
jobapp/
├── messages/                        # Translation files
│   ├── en.json                      # English translations
│   └── ru.json                      # Russian translations
├── i18n/
│   ├── config.ts                    # Locale list, default locale, config
│   ├── request.ts                   # next-intl getRequestConfig (server)
│   └── routing.ts                   # defineRouting() — locales, defaultLocale, pathnames
├── app/
│   ├── [locale]/                    # ← ALL pages go inside [locale] segment
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── applications/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── analysis/page.tsx
│   │   │   │       └── resume/page.tsx
│   │   │   ├── resume/
│   │   │   │   └── page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── (marketing)/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   └── layout.tsx               # Locale root layout (wraps NextIntlClientProvider)
│   ├── api/                         # ← API routes stay OUTSIDE [locale]
│   │   ├── auth/[...all]/route.ts
│   │   ├── ai/
│   │   │   └── analyze/route.ts
│   │   ├── resume/
│   │   │   ├── parse/route.ts
│   │   │   └── export/route.ts
│   │   └── applications/
│   │       └── route.ts
│   ├── layout.tsx                   # Root layout (html, body — NO NextIntlClientProvider here)
│   └── globals.css
├── components/
│   ├── ui/                          # shadcn/ui components
│   ├── landing/                     # Landing page sections
│   ├── resume/
│   │   ├── ResumeForm.tsx
│   │   ├── ResumePreview.tsx
│   │   ├── ResumeUploader.tsx
│   │   ├── TemplateSelector.tsx
│   │   └── templates/
│   │       ├── ClassicTemplate.tsx
│   │       ├── ModernTemplate.tsx
│   │       └── MinimalTemplate.tsx
│   ├── applications/
│   │   ├── ApplicationCard.tsx
│   │   ├── ApplicationForm.tsx
│   │   ├── StatusBadge.tsx
│   │   └── StatusFilter.tsx
│   ├── analysis/
│   │   ├── ScoreGauge.tsx
│   │   ├── KeywordChips.tsx
│   │   ├── ImprovementList.tsx
│   │   └── RewriteCard.tsx
│   └── shared/
│       ├── Navbar.tsx
│       ├── Sidebar.tsx
│       ├── Footer.tsx
│       ├── UserMenu.tsx
│       └── LocaleSwitcher.tsx       # Language toggle (EN / RU)
├── lib/
│   ├── auth.ts
│   ├── auth-client.ts
│   ├── supabase/
│   │   ├── server.ts
│   │   └── client.ts
│   ├── openai.ts
│   ├── pdf.ts
│   └── utils.ts
├── hooks/
│   ├── use-session.ts
│   └── use-master-resume.ts
├── types/
│   └── index.ts
├── constants/
│   ├── prompts.ts                   # AI prompt templates (always in English — AI works in English)
│   └── statuses.ts                  # Status value/color config (labels come from translations)
├── .env.local
├── middleware.ts                    # Combines next-intl middleware + Better Auth route protection
├── next.config.ts                   # Includes next-intl plugin via createNextIntlPlugin
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Internationalization (next-intl)

The app supports **English (en)** and **Russian (ru)** with locale-prefixed routes (`/en/dashboard`, `/ru/dashboard`). English is the default locale.

### Setup

1. Install: `npm install next-intl`
2. Wrap `next.config.ts` with `createNextIntlPlugin`:

```ts
// next.config.ts
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
export default withNextIntl({ /* other Next.js config */ });
```

3. Configure routing:

```ts
// i18n/routing.ts
import { defineRouting } from 'next-intl/routing';
export const routing = defineRouting({
  locales: ['en', 'ru'],
  defaultLocale: 'en',
});
```

```ts
// i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

### Middleware (combining i18n + auth)

`middleware.ts` must handle BOTH locale routing (next-intl) and auth protection (Better Auth). The pattern:

```ts
// middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

// Routes that require authentication (after locale prefix is stripped)
const protectedPaths = ['/dashboard', '/applications', '/resume', '/settings'];

export default async function middleware(req: NextRequest) {
  // 1. Run next-intl middleware first (handles locale detection, redirects)
  const intlResponse = intlMiddleware(req);

  // 2. Check if the path (without locale prefix) is protected
  const pathname = req.nextUrl.pathname;
  const pathnameWithoutLocale = pathname.replace(/^\/(en|ru)/, '') || '/';
  const isProtected = protectedPaths.some(p => pathnameWithoutLocale.startsWith(p));

  if (isProtected) {
    // 3. Check Better Auth session (read session cookie)
    // Use Better Auth's recommended approach for Next.js middleware
    const sessionCookie = req.cookies.get('better-auth.session_token');
    if (!sessionCookie) {
      const locale = pathname.match(/^\/(en|ru)/)?.[1] || 'en';
      return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
    }
  }

  return intlResponse;
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
```

### Locale Layout

```tsx
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as any)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
```

### Translation File Structure

Organize messages by feature namespace. Both `en.json` and `ru.json` must have identical key structures.

```json
// messages/en.json
{
  "common": {
    "appName": "Jobapp",
    "loading": "Loading...",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "back": "Back",
    "next": "Next",
    "submit": "Submit",
    "search": "Search",
    "noResults": "No results found",
    "error": "Something went wrong",
    "retry": "Try again"
  },
  "nav": {
    "dashboard": "Dashboard",
    "applications": "Applications",
    "resume": "Master Resume",
    "settings": "Settings",
    "signOut": "Sign out"
  },
  "auth": {
    "login": "Sign in",
    "signup": "Create account",
    "email": "Email",
    "password": "Password",
    "confirmPassword": "Confirm password",
    "forgotPassword": "Forgot password?",
    "noAccount": "Don't have an account?",
    "hasAccount": "Already have an account?",
    "loginError": "Invalid email or password",
    "signupError": "Could not create account"
  },
  "landing": {
    "heroTitle": "Land your dream job, one tailored resume at a time",
    "heroSubtitle": "AI-powered resume optimization that adapts to every job you apply for",
    "ctaPrimary": "Get Started Free",
    "ctaSecondary": "See How It Works",
    "step1Title": "Add your experience",
    "step1Desc": "Build your master resume with all your career data",
    "step2Title": "Paste a job description",
    "step2Desc": "Add the job you're targeting",
    "step3Title": "Get AI-optimized resume",
    "step3Desc": "Receive tailored suggestions and one-click rewrites"
  },
  "statuses": {
    "bookmarked": "Bookmarked",
    "applying": "Applying",
    "applied": "Applied",
    "interviewing": "Interviewing",
    "negotiation": "Negotiation",
    "accepted": "Accepted",
    "rejected": "Rejected"
  },
  "applications": {
    "title": "Applications",
    "new": "New Application",
    "jobTitle": "Job Title",
    "company": "Company",
    "jobDescription": "Job Description",
    "jobUrl": "Job URL",
    "location": "Location",
    "salaryRange": "Salary Range",
    "contactName": "Contact Name",
    "contactEmail": "Contact Email",
    "notes": "Notes",
    "analyze": "Analyze with AI",
    "viewResume": "View Tailored Resume",
    "appliedOn": "Applied on {date}",
    "noApplications": "No applications yet. Start tracking your job search!"
  },
  "resume": {
    "title": "Master Resume",
    "uploadTab": "Upload & Parse",
    "formTab": "Build Manually",
    "personalInfo": "Personal Information",
    "experience": "Experience",
    "education": "Education",
    "skills": "Skills",
    "languages": "Languages",
    "certifications": "Certifications",
    "projects": "Projects",
    "addEntry": "Add {section}",
    "removeEntry": "Remove",
    "addBullet": "Add bullet point",
    "uploadPrompt": "Upload your existing resume (PDF)",
    "parseSuccess": "We extracted the following from your resume. Please review and save.",
    "resetToMaster": "Reset to Master Resume",
    "exportPdf": "Export PDF",
    "selectTemplate": "Select Template",
    "templateClassic": "Classic",
    "templateModern": "Modern",
    "templateMinimal": "Minimal"
  },
  "analysis": {
    "title": "AI Analysis",
    "atsScore": "ATS Score",
    "summary": "Summary",
    "strengths": "Matching Strengths",
    "missingKeywords": "Missing Keywords",
    "improvements": "Areas to Improve",
    "rewrites": "Suggested Rewrites",
    "accept": "Accept",
    "acceptAll": "Accept All",
    "reject": "Reject",
    "original": "Original",
    "suggested": "Suggested",
    "reanalyze": "Re-analyze to see updated score",
    "analyzing": "Analyzing your resume...",
    "priorityHigh": "High priority",
    "priorityMedium": "Medium priority",
    "priorityLow": "Low priority"
  }
}
```

```json
// messages/ru.json — same structure, Russian translations
{
  "common": {
    "appName": "Jobapp",
    "loading": "Загрузка...",
    "save": "Сохранить",
    "cancel": "Отмена",
    "delete": "Удалить",
    "edit": "Редактировать",
    "back": "Назад",
    "next": "Далее",
    "submit": "Отправить",
    "search": "Поиск",
    "noResults": "Ничего не найдено",
    "error": "Что-то пошло не так",
    "retry": "Попробовать снова"
  },
  "nav": {
    "dashboard": "Панель управления",
    "applications": "Заявки",
    "resume": "Основное резюме",
    "settings": "Настройки",
    "signOut": "Выйти"
  },
  "auth": {
    "login": "Войти",
    "signup": "Создать аккаунт",
    "email": "Электронная почта",
    "password": "Пароль",
    "confirmPassword": "Подтвердите пароль",
    "forgotPassword": "Забыли пароль?",
    "noAccount": "Нет аккаунта?",
    "hasAccount": "Уже есть аккаунт?",
    "loginError": "Неверный email или пароль",
    "signupError": "Не удалось создать аккаунт"
  },
  "landing": {
    "heroTitle": "Получите работу мечты — с резюме, подобранным под каждую вакансию",
    "heroSubtitle": "ИИ-оптимизация резюме, которая адаптируется к каждой вакансии",
    "ctaPrimary": "Начать бесплатно",
    "ctaSecondary": "Как это работает",
    "step1Title": "Добавьте свой опыт",
    "step1Desc": "Создайте основное резюме со всеми данными о карьере",
    "step2Title": "Вставьте описание вакансии",
    "step2Desc": "Добавьте вакансию, на которую хотите откликнуться",
    "step3Title": "Получите оптимизированное резюме",
    "step3Desc": "Получите рекомендации и исправления в один клик"
  },
  "statuses": {
    "bookmarked": "В закладках",
    "applying": "Подготовка",
    "applied": "Отправлено",
    "interviewing": "Собеседование",
    "negotiation": "Переговоры",
    "accepted": "Принято",
    "rejected": "Отказ"
  },
  "applications": {
    "title": "Заявки",
    "new": "Новая заявка",
    "jobTitle": "Название должности",
    "company": "Компания",
    "jobDescription": "Описание вакансии",
    "jobUrl": "Ссылка на вакансию",
    "location": "Местоположение",
    "salaryRange": "Зарплатная вилка",
    "contactName": "Контактное лицо",
    "contactEmail": "Email контакта",
    "notes": "Заметки",
    "analyze": "Анализ с ИИ",
    "viewResume": "Посмотреть адаптированное резюме",
    "appliedOn": "Отправлено {date}",
    "noApplications": "Заявок пока нет. Начните отслеживать свой поиск работы!"
  },
  "resume": {
    "title": "Основное резюме",
    "uploadTab": "Загрузить и распознать",
    "formTab": "Заполнить вручную",
    "personalInfo": "Личная информация",
    "experience": "Опыт работы",
    "education": "Образование",
    "skills": "Навыки",
    "languages": "Языки",
    "certifications": "Сертификаты",
    "projects": "Проекты",
    "addEntry": "Добавить: {section}",
    "removeEntry": "Удалить",
    "addBullet": "Добавить пункт",
    "uploadPrompt": "Загрузите существующее резюме (PDF)",
    "parseSuccess": "Мы извлекли следующие данные из вашего резюме. Проверьте и сохраните.",
    "resetToMaster": "Сбросить к основному резюме",
    "exportPdf": "Экспорт в PDF",
    "selectTemplate": "Выбрать шаблон",
    "templateClassic": "Классический",
    "templateModern": "Современный",
    "templateMinimal": "Минимальный"
  },
  "analysis": {
    "title": "ИИ-анализ",
    "atsScore": "ATS-рейтинг",
    "summary": "Сводка",
    "strengths": "Сильные стороны",
    "missingKeywords": "Недостающие ключевые слова",
    "improvements": "Области для улучшения",
    "rewrites": "Предлагаемые исправления",
    "accept": "Принять",
    "acceptAll": "Принять все",
    "reject": "Отклонить",
    "original": "Оригинал",
    "suggested": "Предложение",
    "reanalyze": "Повторите анализ, чтобы увидеть обновлённый рейтинг",
    "analyzing": "Анализируем ваше резюме...",
    "priorityHigh": "Высокий приоритет",
    "priorityMedium": "Средний приоритет",
    "priorityLow": "Низкий приоритет"
  }
}
```

### Usage Pattern in Components

**Server Components** — use `getTranslations()`:
```tsx
import { getTranslations } from 'next-intl/server';

export default async function DashboardPage() {
  const t = await getTranslations('nav');
  return <h1>{t('dashboard')}</h1>;
}
```

**Client Components** — use `useTranslations()`:
```tsx
'use client';
import { useTranslations } from 'next-intl';

export function Navbar() {
  const t = useTranslations('nav');
  return <span>{t('dashboard')}</span>;
}
```

**LocaleSwitcher component** (`components/shared/LocaleSwitcher.tsx`):
- Dropdown or toggle button showing current locale (EN / RU)
- Uses `useRouter()` and `usePathname()` from `next-intl/navigation` to switch locale while preserving the current path
- Place in the Navbar (visible on all pages)

### i18n Rules
- **ZERO hardcoded user-facing strings.** Every label, button, placeholder, error message, toast, and empty state must use a translation key.
- **AI prompts stay in English.** The prompts in `constants/prompts.ts` are always sent to GPT-4o in English regardless of the user's locale. AI responses (analysis summaries, rewrite suggestions) are also in English since they relate to English-language resumes and job descriptions. If the user's resume or JD is in Russian, the AI will adapt naturally.
- **Status values stay in English** in the database (`'bookmarked'`, `'applied'`, etc.). The display labels come from `t('statuses.bookmarked')`.
- **PDF export** uses the resume data as-is (which is in whatever language the user entered). Template chrome (section headers like "Experience", "Education") should be translated based on the user's current locale passed to the export endpoint.
- **Dates** — use `useFormatter()` from `next-intl` for locale-aware date formatting.

---

## Feature Specifications

### Feature 1: Landing Page

**Route:** `/[locale]/(marketing)/page.tsx`

A modern, conversion-focused landing page. All text comes from `messages/{locale}.json` under the `"landing"` namespace. Sections:
1. **Hero** — headline (`t('landing.heroTitle')`), subheadline, CTA buttons
2. **How It Works** — 3-step visual flow using `step1Title`/`step2Title`/`step3Title` keys
3. **Features grid** — 4-6 feature cards with icons (AI Analysis, ATS Scoring, One-Click Optimize, PDF Export, Application Tracking, Multiple Templates)
4. **Social proof / stats** — placeholder section for testimonials or metrics
5. **Final CTA** — repeated sign-up prompt
6. **Footer** — links, copyright

Design notes:
- Use shadcn/ui components where applicable (Button, Card, Badge)
- Dark/light mode support via `next-themes`
- **LocaleSwitcher** in the Navbar (EN / RU toggle)
- Responsive (mobile-first)
- Smooth scroll animations (use CSS or minimal Framer Motion)

### Feature 2: Authentication (Better Auth)

**Routes:** `/[locale]/(auth)/login/page.tsx`, `/[locale]/(auth)/signup/page.tsx`

Setup Better Auth with:
- **Server:** `lib/auth.ts` — configure Better Auth instance with PostgreSQL adapter pointing to Supabase's connection string (use `DATABASE_URL` env var with Supabase's direct connection string, NOT the pooler). Enable `emailAndPassword` auth.
- **Client:** `lib/auth-client.ts` — `createAuthClient()` with `baseURL` pointing to the app URL
- **API handler:** `app/api/auth/[...all]/route.ts` — catch-all route that delegates to Better Auth's `toNextJsHandler()`. NOTE: API routes live OUTSIDE the `[locale]` segment.

Auth pages:
- Clean centered card layout
- Email + password fields (labels from `t('auth.email')`, `t('auth.password')`, etc.)
- Toggle between sign-in / sign-up (or separate pages with links between them)
- Form validation (use `zod` + shadcn/ui form components)
- Show loading state during submission
- Redirect to `/${locale}/dashboard` after successful auth (preserve current locale)
- Error handling (duplicate email, wrong password, etc.) — error messages from translation keys

**Middleware** (`middleware.ts`):
- Combined next-intl + Better Auth middleware (see i18n section above for the pattern)
- Protect all `/(dashboard)/*` routes
- Redirect unauthenticated users to `/${locale}/login`

### Feature 3: Master Resume Editor

**Route:** `/[locale]/(dashboard)/resume/page.tsx`

Two modes of input:

**Mode A: Structured Form (Wizard)**
- Multi-step form with tabs or stepper: Personal Info → Experience → Education → Skills → Languages → Certifications → Projects
- Each section is independently saveable (auto-save on blur or explicit save button)
- Experience & Projects: dynamic list with add/remove, each entry has bullet points (add/remove individual bullets)
- Skills: grouped by category (user creates categories, adds items)
- Use shadcn/ui form components: Input, Textarea, Select, DatePicker, Button, Card
- Data saves to `master_resume` table via Server Action or API route

**Mode B: Upload & Parse**
- File uploader (PDF only, max 5MB)
- Upload goes to Supabase Storage
- Server-side: send PDF text to GPT-4o with a structured extraction prompt
- AI returns JSON matching the master_resume schema
- User reviews the parsed data in the structured form (pre-filled), can edit before saving
- Show a confirmation step: "We extracted the following from your resume. Please review and save."

The AI parsing prompt (`constants/prompts.ts`):
```
You are a resume parser. Extract structured data from the following resume text.
Return ONLY valid JSON matching this exact schema: { personal_info: {...}, experience: [...], education: [...], skills: [...], languages: [...], certifications: [...], projects: [...] }
[Include the full schema shapes from the database section above]
Resume text:
{{resume_text}}
```

### Feature 4: Job Applications — CRUD & List

**Routes:**
- `/[locale]/(dashboard)/applications/page.tsx` — list view
- `/[locale]/(dashboard)/applications/new/page.tsx` — create new
- `/[locale]/(dashboard)/applications/[id]/page.tsx` — detail view

**New Application Form:**
- Fields: Job Title*, Company*, Job URL, Job Description* (large textarea), Location, Salary Range
- Optional: Upload your current resume PDF (if they haven't set up master resume yet — this gets parsed into a resume variant)
- Status defaults to "bookmarked"
- On submit: creates `job_application` record, also creates a `resume_variant` record initialized as a copy of the master resume
- After creation, redirect to the application detail page

**Application List:**
- Filterable by status (tabs or dropdown)
- Sortable by date, company, status
- Each card shows: company logo placeholder, job title, company, status badge (color-coded), date applied, ATS score (if analyzed)
- Click → goes to detail page

**Application Detail Page:**
- Header: Job title, Company, Status dropdown (changeable), applied date
- Tabs or sections:
  - **Overview** — job description, contact info, notes, links
  - **AI Analysis** — (see Feature 5)
  - **Tailored Resume** — (see resume variant editor below)
- Edit mode for contact info, notes, status

**Status config** (`constants/statuses.ts`) — labels come from translations, not this file:
```ts
export const APPLICATION_STATUSES = [
  { value: 'bookmarked', translationKey: 'statuses.bookmarked', color: 'gray' },
  { value: 'applying', translationKey: 'statuses.applying', color: 'blue' },
  { value: 'applied', translationKey: 'statuses.applied', color: 'indigo' },
  { value: 'interviewing', translationKey: 'statuses.interviewing', color: 'yellow' },
  { value: 'negotiation', translationKey: 'statuses.negotiation', color: 'orange' },
  { value: 'accepted', translationKey: 'statuses.accepted', color: 'green' },
  { value: 'rejected', translationKey: 'statuses.rejected', color: 'red' },
] as const;

// In components, use: t(status.translationKey) to get the localized label
```

### Feature 5: AI Analysis & One-Click Rewrite

**Route:** `/[locale]/(dashboard)/applications/[id]/analysis/page.tsx`
**API:** `app/api/ai/analyze/route.ts`

**Trigger:** User clicks "Analyze" button on an application detail page (or automatically on application creation).

**Analysis API flow:**
1. Auth check (Better Auth session)
2. Fetch the job application (job description) and the user's resume variant (or master resume if no variant)
3. Send to GPT-4o with a detailed analysis prompt
4. Parse the structured response
5. Save to `ai_analysis` table
6. Return results

**Analysis prompt** (`constants/prompts.ts`):
```
You are an expert ATS (Applicant Tracking System) analyst and career coach.

Analyze the following resume against the job description. Return ONLY valid JSON matching this schema:

{
  "ats_score": <number 0-100>,
  "summary": "<2-3 sentence overall assessment>",
  "missing_keywords": ["keyword1", "keyword2", ...],
  "matching_strengths": [{ "area": "<area>", "detail": "<why this is strong>" }],
  "improvement_areas": [{ "section": "<experience|skills|education|summary>", "issue": "<what's wrong>", "suggestion": "<how to fix>", "priority": "<high|medium|low>" }],
  "rewrite_suggestions": [
    {
      "id": "<uuid>",
      "section": "experience",
      "original_index": <index in experience array>,
      "bullet_index": <index of bullet in that experience entry>,
      "original_text": "<the current bullet point>",
      "suggested_text": "<rewritten version optimized for this job>",
      "keywords_addressed": ["keyword1", "keyword2"]
    }
  ]
}

JOB DESCRIPTION:
{{job_description}}

RESUME:
{{resume_json}}
```

**Analysis Results UI:**
- **ATS Score** — large circular gauge (0-100), color-coded (red < 40, yellow < 70, green >= 70)
- **Summary** — text card at top
- **Matching Strengths** — green-tinted cards showing what's strong
- **Missing Keywords** — chip/badge list of keywords not found in resume
- **Improvement Areas** — ordered list by priority, each with section label, issue, suggestion
- **Rewrite Suggestions** — this is the key feature:
  - Each suggestion shows original text vs. suggested text (side by side or diff-style)
  - Shows which missing keywords the rewrite addresses (as badges)
  - **"Accept" button** — applies the rewrite to the `resume_variant` (updates the specific bullet point in the JSONB)
  - **"Accept All" button** — applies all suggestions at once
  - **"Reject" button** — dismisses individual suggestion
  - After accepting, the ATS score area shows a note: "Re-analyze to see updated score"

### Feature 6: Resume Variant Editor & Preview

**Route:** `/[locale]/(dashboard)/applications/[id]/resume/page.tsx`

Split-pane layout:
- **Left:** Editable form (same structure as master resume form, but pre-filled with this variant's data)
- **Right:** Live preview of the resume using the selected template

**Template Selector:**
- Dropdown or thumbnail picker at the top of the preview pane
- 3 templates for MVP:
  1. **Classic** — traditional single-column, serif headings, clean lines
  2. **Modern** — two-column, accent color sidebar, sans-serif
  3. **Minimal** — ultra-clean, lots of whitespace, single-column
- Changing template updates preview in real-time, saves `template_id` to `resume_variant`

**Section Toggles:**
- Checkboxes to include/exclude sections (e.g., hide Projects for a role that doesn't need it)
- Saved in `included_sections` JSONB array

**"Reset to Master" button** — reverts the variant back to the master resume data.

### Feature 7: PDF Export

**API:** `app/api/resume/export/route.ts`

- Uses `@react-pdf/renderer` to generate PDF server-side
- Takes `resume_variant_id` and `locale` as input
- Fetches the variant data and template_id
- Renders the correct template as a PDF
- **Section headers in the PDF** (e.g., "Experience", "Education") are translated based on the `locale` param — load the appropriate translation strings server-side and pass them to the PDF template
- Returns the PDF as a downloadable file
- Button on the resume variant page: "Export PDF" → triggers download

Each template needs a `@react-pdf/renderer` version (separate from the React preview component). These are in `components/resume/templates/pdf/`:
- `ClassicPDF.tsx`
- `ModernPDF.tsx`
- `MinimalPDF.tsx`

---

## Environment Variables

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Better Auth
BETTER_AUTH_SECRET=<random-32-char-string>
BETTER_AUTH_URL=http://localhost:3000

# Supabase
DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# OpenAI
OPENAI_API_KEY=sk-...
```

---

## Implementation Order

Build in this exact sequence. Each step should result in a working (if incomplete) app:

### Phase 1: Foundation
1. Initialize Next.js 15 project with TypeScript, Tailwind CSS 4, shadcn/ui
2. Set up **next-intl**: install, create `i18n/` config files, `messages/en.json` + `messages/ru.json` (start with `common`, `nav`, `auth` namespaces), wrap `next.config.ts` with `createNextIntlPlugin`, create `app/[locale]/layout.tsx` with `NextIntlClientProvider`, build `LocaleSwitcher` component
3. Set up Supabase project, get connection strings
4. Set up Better Auth (server + client + API route)
5. Create combined middleware (`middleware.ts`): next-intl locale routing + Better Auth route protection
6. Create auth pages (login/signup) with translated labels — verify auth works end-to-end at `/en/login` and `/ru/login`
7. Create dashboard layout (sidebar, topbar, user menu with sign-out, LocaleSwitcher) — all labels from translation keys

### Phase 2: Data Layer
6. Create database tables (run SQL in Supabase SQL editor)
7. Set up Supabase server client in `lib/supabase/server.ts`
8. Create TypeScript types in `types/index.ts`

### Phase 3: Core Features
9. Build master resume editor (structured form + auto-save). Add `resume` namespace translations for all form labels.
10. Build resume upload + AI parsing flow
11. Build job application CRUD (new form, list, detail page). Add `applications` namespace translations.
12. Build resume variant system (copy master on creation, editable per-application)

### Phase 4: AI Features
13. Build AI analysis endpoint + prompt engineering (prompts always in English)
14. Build analysis results UI (score gauge, keywords, improvements). Add `analysis` namespace translations.
15. Build one-click rewrite system (accept/reject suggestions, update variant)

### Phase 5: Polish
16. Build resume preview components (3 templates, live preview)
17. Build PDF export (server-side rendering with @react-pdf/renderer — pass `locale` for section headers)
18. Build landing page (fully translated using `landing` namespace)
19. Add loading states, error handling, empty states throughout — all messages via translation keys
20. Responsive design pass
21. **i18n QA pass**: manually switch between `/en` and `/ru` on every page, verify no untranslated strings

---

## Key Constraints

- **Use Server Actions** for mutations (creating/updating applications, saving resume data) where it simplifies the code. Use API routes for things that need streaming or complex processing (AI analysis, PDF export).
- **No ORMs.** Use Supabase JS client (`@supabase/supabase-js`) for all database operations. Write queries directly.
- **Type safety.** Define all interfaces in `types/index.ts`. No `any` types.
- **Component composition.** Keep components small and focused. Reuse shadcn/ui primitives.
- **Error boundaries.** Add `error.tsx` files in route segments. Show user-friendly error states.
- **Loading states.** Add `loading.tsx` files or Suspense boundaries. Use shadcn/ui Skeleton components.
- **ZERO hardcoded user-facing strings.** Every label, button text, placeholder, error message, empty state, and toast MUST use `t('key')` from next-intl. The only English strings in code should be in `constants/prompts.ts` (AI prompts) and database enum values. If you're typing a user-visible English word inside a component, it's wrong — use a translation key.
- **Statuses, labels, prompt templates** — all in `constants/` with display text coming from translations.
- **All navigation links** must use `Link` from `next-intl/navigation` (not `next/link`) to preserve locale in URLs.

---

## Deliverables

For each phase, provide:
1. All new/modified files with complete code
2. Any commands to run (installs, migrations, etc.)
3. What to test manually before moving to the next phase
4. Any `.env` values that need to be set

Start with **Phase 1: Foundation**.