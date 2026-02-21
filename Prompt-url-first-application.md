# Prompt: Redesign "New Application" Page — URL-First Flow

## Context

Refer to the project's `CLAUDE.md` for the full tech stack, project structure, conventions, and constraints. Follow the existing patterns exactly — especially:

- **next-intl** for ALL user-facing strings (zero hardcoded text)
- **shadcn/ui** components for all UI elements
- **Server Actions** (`lib/actions/applications.ts`) for mutations
- **TypeScript strict mode**, types in `types/index.ts`
- Existing file/folder structure under `app/[locale]/(dashboard)/applications/`
- Translation keys in both `messages/en.json` and `messages/ru.json` under the `applications` namespace

## Task

Redesign the **New Application** page (`app/[locale]/(dashboard)/applications/new/page.tsx` and `components/applications/ApplicationForm.tsx`) so that the **primary flow** is pasting a job URL, and **manual entry** is a secondary option.

## Desired UX

### Primary Flow: Paste URL
1. The page opens with a clean, prominent input field: **"Paste a job posting URL"** — this should feel like the main action, visually dominant.
2. User pastes a URL (e.g., from LinkedIn, Indeed, Greenhouse, Lever, company career pages, etc.) and clicks a **"Fetch & Fill"** button (or similar CTA).
3. The app calls a **new API route** (`app/api/ai/parse-job-url/route.ts`) that:
   - Fetches the page content from the URL (use a server-side fetch or a library like `cheerio` for HTML parsing)
   - Sends the extracted text to **OpenAI GPT-4o** with a structured prompt to extract: Job Title, Company, Location, Job Description, Salary Range (if found)
   - Returns the structured data as JSON
4. The form fields below auto-populate with the extracted data.
5. User reviews, edits if needed, and submits.
6. Show a **loading/spinner state** while the URL is being parsed ("Analyzing job posting..." or similar).
7. If parsing fails or returns incomplete data, show a **toast notification** informing the user, and let them fill in/correct fields manually.

### Secondary Flow: Manual Entry
- Below the URL input section, include a **collapsible or tab-based** "Or enter details manually" option.
- This should contain the same form fields that currently exist (Job Title*, Company*, Job Description, Job URL, Location, Salary Range).
- The manual form should also be visible/editable after a URL is parsed (so the user can review and tweak).

### Visual Hierarchy
- **URL input** = hero/primary section (large input, prominent button, maybe a subtle icon)
- **Form fields** = secondary section, either:
  - Always visible below the URL section (populated after fetch, or filled manually), OR
  - Revealed after URL fetch completes, with a "fill manually instead" toggle/link to show them immediately
- Pick whichever approach feels cleaner — the key is that pasting a URL should feel like the **obvious, fast path**.

## Implementation Details

### New API Route: `app/api/ai/parse-job-url/route.ts`

- **Auth check**: Verify Better Auth session (same pattern as `app/api/ai/analyze/route.ts`)
- **Input**: `{ url: string }`
- **Process**:
  1. Fetch the URL server-side (handle redirects, timeouts, error cases)
  2. Extract meaningful text from the HTML (strip nav, footer, scripts — focus on main content / job description body). Use `cheerio` or similar.
  3. Send extracted text to OpenAI with a prompt like:

```
You are a job posting parser. Extract structured data from the following job posting text.
Return ONLY valid JSON matching this exact schema:
{
  "job_title": "string",
  "company": "string",
  "location": "string or null",
  "salary_range": "string or null",
  "job_description": "string (the full job description text, preserving formatting)"
}

If a field cannot be determined, set it to null.

Job posting text:
{{extracted_text}}
```

  4. Parse the GPT response, return it as JSON.
- **Error handling**: Return appropriate error codes/messages for: invalid URL, fetch failure, parse failure, auth failure.
- **Add the prompt** to `constants/prompts.ts` alongside the existing prompts.

### Updated `ApplicationForm.tsx`

- Add a URL input section at the top with fetch button
- Add loading state for URL parsing
- After successful parse, populate form fields with returned data
- Keep existing form validation (Job Title and Company required)
- The `job_url` field should auto-fill with the pasted URL
- On submit, use the same `createApplication` server action

### Translation Keys to Add

Add these new keys to **both** `messages/en.json` and `messages/ru.json` under `applications`:

```json
// en.json additions
"pasteUrl": "Paste a job posting URL",
"pasteUrlPlaceholder": "https://...",
"fetchAndFill": "Fetch & Fill",
"fetchingJob": "Analyzing job posting...",
"fetchSuccess": "Job details extracted! Review and submit.",
"fetchError": "Couldn't extract details from this URL. Please fill in manually.",
"orEnterManually": "Or enter details manually",
"urlSection": "Quick Add from URL"
```

```json
// ru.json additions
"pasteUrl": "Вставьте ссылку на вакансию",
"pasteUrlPlaceholder": "https://...",
"fetchAndFill": "Загрузить данные",
"fetchingJob": "Анализируем вакансию...",
"fetchSuccess": "Данные извлечены! Проверьте и отправьте.",
"fetchError": "Не удалось извлечь данные по этой ссылке. Заполните вручную.",
"orEnterManually": "Или заполните вручную",
"urlSection": "Быстрое добавление по ссылке"
```

### Dependencies

- Install `cheerio` for HTML parsing: `npm install cheerio` and `npm install -D @types/cheerio` (if types exist, otherwise cheerio includes them)
- OpenAI SDK is already set up in `lib/openai.ts`

## Constraints

- Follow ALL existing project constraints from `CLAUDE.md` (no hardcoded strings, no `any` types, shadcn/ui components, etc.)
- Match the existing code style and patterns (look at `ApplicationForm.tsx`, `ApplicationDetail.tsx`, and `app/api/ai/analyze/route.ts` for reference)
- Keep the existing `createApplication` server action and `job_application` DB schema unchanged — you're only changing the **form UX** and adding a **URL parsing API route**
- Make sure the component works correctly in both `/en` and `/ru` locales