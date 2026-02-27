# Landing Page Adjustments

Instructions for updating the marketing landing page at `app/[locale]/(marketing)/page.tsx` and related components. Every change must follow the existing design language (oklch colors, `landing-*` CSS utilities, shadcn/ui primitives, dark mode support) and the project's i18n rules (zero hardcoded strings — all text via `next-intl` translation keys in the `landing` namespace).

---

## 1. Navbar Restructure

**File:** `components/landing/LandingNavbar.tsx`

### Layout change

Redistribute the navbar into three clear zones:

| Left | Center | Right |
|---|---|---|
| Logo + Brand | Nav links (Features · How It Works · Testimonials) | ThemeToggle, LocaleSwitcher, Login, Sign Up |

Currently the ThemeToggle and LocaleSwitcher sit right after the logo and the nav links are in a separate `div` before the auth buttons. Move ThemeToggle and LocaleSwitcher to the right side alongside the auth buttons, and place the nav links in the center so the bar reads: **Brand — navigation — actions**.

### Fix hardcoded nav labels

The anchor links inside the desktop nav currently use hardcoded English strings (`"Features"`, `"How It Works"`, `"Testimonials"`). Replace them with translation keys:

```tsx
// Add these keys to the landing namespace
t('navFeatures')       // EN: "Features"         | RU: "Возможности"
t('navHowItWorks')     // EN: "How It Works"     | RU: "Как это работает"
t('navTestimonials')   // EN: "Testimonials"     | RU: "Отзывы"
```

Apply the same fix to the mobile drawer menu items.

### New translation keys (both `en.json` and `ru.json`)

```jsonc
// landing namespace additions
"navFeatures": "Features",          // RU: "Возможности"
"navHowItWorks": "How It Works",    // RU: "Как это работает"
"navTestimonials": "Testimonials"   // RU: "Отзывы"
```

---

## 2. Hero Section — Rotating Profession Words

**File:** `app/[locale]/(marketing)/page.tsx` (hero section) — this will need to become a **client component** or be extracted into a dedicated `components/landing/HeroSection.tsx` client component, because the rotating text requires `useState` + `useEffect`.

### What to build

Replace the current static `heroTitle` heading with a two-part headline:

1. A static line (e.g. *"Land Your Dream Job as a"*) — from `t('heroTitleStatic')`.
2. A rotating word that cycles through profession names with a spring-based vertical slide animation (from the reference below).

The rotating words should come from a translation key that stores them as a delimited list so both locales can define their own professions:

```jsonc
// landing namespace
"heroTitleStatic": "Land Your Dream Job as a",
// RU: "Получите работу мечты как"
"heroRotatingWords": "Software Engineer,Product Manager,Data Scientist,UX Designer,Marketing Lead",
// RU: "Разработчик,Продакт-менеджер,Data Scientist,UX Дизайнер,Маркетолог"
```

At runtime, split by comma and cycle through them on a 2-second interval.

### Animation pattern (adapted from the hero-reference)

Use `framer-motion` (already a project dependency). The rotating word container should:

- Have `overflow: hidden` and use `position: relative` sizing so only the active word is visible.
- Each word is `position: absolute`, centered.
- Active word animates to `{ y: 0, opacity: 1 }`.
- Previous word animates out to `{ y: -150, opacity: 0 }`.
- Next word waits at `{ y: 150, opacity: 0 }`.
- Transition: `{ type: "spring", stiffness: 50 }`.

### What to keep from the current hero

- The gradient background (`landing-hero-gradient`), decorative blobs, badge, subtitle, CTA buttons, and trust badges remain unchanged.
- Only the `<h1>` content changes to include the rotating word.

### What NOT to carry over from the reference

- Ignore the reference's layout, buttons, paragraph copy, and styling — only the rotating-word mechanism matters.

---

## 3. Social Proof / Stats Section — Replace "Trusted by job seekers worldwide"

**Current state:** There's a "Trusted by job seekers worldwide" heading with `stat1Value/stat1Label`, `stat2Value/stat2Label`, `stat3Value/stat3Label`.

### Replace with concrete platform metrics

Update the three stats to represent:

| # | Metric | Translation key (value) | Translation key (label) | Example EN | Example RU |
|---|---|---|---|---|---|
| 1 | Resumes downloaded | `stat1Value` | `stat1Label` | `"12,400+"` | `"12 400+"` |
| 2 | Jobs added | `stat2Value` | `stat2Label` | `"8,600+"` | `"8 600+"` |
| 3 | Resumes optimized | `stat3Value` | `stat3Label` | `"5,200+"` | `"5 200+"` |

Update the section heading translation key (`socialProofHeading` or equivalent) to something like:

```jsonc
"socialProofHeading": "Our Impact in Numbers"
// RU: "Наши результаты в цифрах"
```

**Note:** These are placeholder/static numbers for now. A future ticket will make them dynamic (fetched from the database). The values live in the translation files so they're easy to update in the meantime.

---

## 4. Features Section — Image Comparison Slider ("Visual Clearance")

**Current state:** The section headed *"Everything You Need to Land More Interviews"* displays a features grid.

### What to change

Replace the **entire section** (the heading + the 6-card features grid stays as-is elsewhere) with a new **image comparison slider** component. The purpose is to visually show the before/after difference between an un-optimized and an optimized resume.

> **Clarification:** Do NOT remove the features grid. Instead, this new slider section is inserted **in place of the heading area** (the `<h2>` that says "Everything You Need…") to serve as visual proof, while the feature cards remain below it or the section is restructured to house both. If the original intent is to replace the full section, coordinate with the team — but the safest interpretation is: **replace the heading + intro text with the comparison slider, keep the feature cards.**

### Component: `components/landing/ResumeCompareSlider.tsx` (client component)

Adapted from the visual-clearance reference:

- Full-width container with `aspect-video`, `rounded-2xl`, `overflow-hidden`.
- Two images stacked: the **optimized resume** screenshot as the base layer, the **un-optimized resume** screenshot clipped on top via `clipPath: inset(0 0 0 ${inset}%)`.
- A draggable vertical divider with a `GripVertical` icon handle.
- Supports both mouse and touch events.
- Default slider position: 50%.

### Images

Two screenshot images are needed (placeholder paths for now):

- `/images/landing/resume-before.png` — un-optimized resume screenshot
- `/images/landing/resume-optimized.png` — optimized resume screenshot

Use `next/image` with `priority` loading. Until real screenshots are ready, use placeholder colored `div`s with text labels ("Before" / "After") so the layout works.

### Section heading

```jsonc
"compareHeading": "See the Difference",
// RU: "Почувствуйте разницу"
"compareSubtitle": "Drag to compare an un-optimized resume with one enhanced by our AI.",
// RU: "Перетащите ползунок, чтобы сравнить обычное резюме с улучшенным нашим ИИ."
"compareBadge": "Before & After"
// RU: "До и После"
```

### Styling

- Use the existing `landing-fade-in` animation classes for entrance.
- The divider bar and handle should use `bg-muted` to match the current theme tokens.
- Add `select-none` on all interactive/image elements to prevent accidental text selection during drag.

---

## 5. Testimonials Section — Glassmorphic Card Layout

**File:** Testimonials section in `app/[locale]/(marketing)/page.tsx`

### Design update (inspired by Untitled UI glassmorphic cards)

Replace the current simple card grid with a more visually striking layout:

- **Container:** A wide section with a centered heading and subtitle, plus two small CTAs ("Our customers" link and "Create account" button).
- **Card grid:** A staggered grid (not a strict 3-column equal grid). Cards of varying sizes, some featuring just the avatar + name + role, and one "hero" card prominently displaying the quote.
- **Glassmorphism effect:** Cards use `backdrop-blur-xl`, semi-transparent backgrounds (`bg-background/60` light / `bg-background/40` dark), and subtle border (`border border-white/10 dark:border-white/5`).
- Keep the 5-star rating on quote cards.
- Avatar: either a small `rounded-full` placeholder with initial letter (current approach) or an actual image if available.

### CSS additions (`globals.css`)

```css
.landing-glass-card {
  background: oklch(1 0 0 / 60%);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid oklch(1 0 0 / 15%);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

:is(.dark) .landing-glass-card {
  background: oklch(0.15 0 0 / 50%);
  border: 1px solid oklch(1 0 0 / 8%);
}

.landing-glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px oklch(0 0 0 / 8%);
}
```

### Translation keys

Keep existing testimonial keys (`testimonial1Quote`, `testimonial1Author`, `testimonial1Role`, etc.) and add:

```jsonc
"testimonialsSubtitle": "Hear from people who landed their dream jobs.",
// RU: "Послушайте тех, кто нашёл работу мечты."
```

### Data shape stays the same

The testimonial data array (`quote`, `author`, `role`) is already fine. The visual treatment changes, not the data.

---

## 6. CTA Section — Screen Mockup Layout

**File:** Final CTA section in `app/[locale]/(marketing)/page.tsx`

### Design update (inspired by Untitled UI screen-mockup CTA)

Replace the current gradient CTA block with a more impactful layout:

- **Heading:** Large, bold heading (existing `ctaHeading` key).
- **Subtitle:** Supporting text with a social proof snippet, e.g. *"Join over X,000+ job seekers already landing interviews."* — new key `ctaSubtitleWithProof`.
- **Two CTA buttons** side by side: a primary "Get Started" (`ctaPrimary`) and a secondary/outline "Learn More" (`ctaLearnMore`).
- **Below the buttons:** A large browser/screen mockup image showing the Jobapp dashboard. This gives visitors a preview of the product.
  - Placeholder image: `/images/landing/dashboard-mockup.png`
  - Use `next/image`, responsive, with rounded corners and a subtle shadow.
  - Should have light/dark variants if possible (swap via `dark:hidden` / `hidden dark:block` pattern on two `<Image>` tags).

### Remove the gradient background

Instead of the current `landing-cta-gradient`, use a clean background consistent with the rest of the page (`bg-background` or a very subtle accent), so the mockup image is the visual anchor.

### New/updated translation keys

```jsonc
"ctaSubtitleWithProof": "Join over 4,000+ job seekers already landing more interviews with Jobapp.",
// RU: "Присоединяйтесь к 4 000+ соискателям, которые уже получают больше собеседований с Jobapp."
"ctaLearnMore": "Learn More"
// RU: "Узнать больше"
```

---

## 7. Translation Keys — Full Summary of Additions

All keys go inside the `"landing"` namespace of both `messages/en.json` and `messages/ru.json`.

```jsonc
{
  // Navbar
  "navFeatures": "Features",
  "navHowItWorks": "How It Works",
  "navTestimonials": "Testimonials",

  // Hero rotating words
  "heroTitleStatic": "Land Your Dream Job as a",
  "heroRotatingWords": "Software Engineer,Product Manager,Data Scientist,UX Designer,Marketing Lead",

  // Stats (update existing values)
  "socialProofHeading": "Our Impact in Numbers",
  // stat1Value, stat1Label, stat2Value, stat2Label, stat3Value, stat3Label — update values

  // Compare slider
  "compareBadge": "Before & After",
  "compareHeading": "See the Difference",
  "compareSubtitle": "Drag to compare an un-optimized resume with one enhanced by our AI.",

  // Testimonials
  "testimonialsSubtitle": "Hear from people who landed their dream jobs.",

  // CTA
  "ctaSubtitleWithProof": "Join over 4,000+ job seekers already landing more interviews with Jobapp.",
  "ctaLearnMore": "Learn More"
}
```

Corresponding Russian translations must be added to `messages/ru.json`.

---

## 8. New Components to Create

| Component | Path | Type | Notes |
|---|---|---|---|
| `HeroSection` | `components/landing/HeroSection.tsx` | Client (`'use client'`) | Rotating words + existing hero layout |
| `ResumeCompareSlider` | `components/landing/ResumeCompareSlider.tsx` | Client (`'use client'`) | Image comparison drag slider |

Both should accept no required props (they read translations internally via `useTranslations`).

---

## 9. Sections NOT to Touch

The following sections must remain unchanged:

- **How It Works** (3-step pillar cards)
- **Features grid** (6 icon cards) — only the section heading above it changes
- **Footer** (`components/landing/LandingFooter.tsx`)

---

## 10. Placeholder Assets Needed

| Asset | Path | Description |
|---|---|---|
| Resume before screenshot | `/public/images/landing/resume-before.png` | Screenshot of an un-optimized, plain resume |
| Resume optimized screenshot | `/public/images/landing/resume-optimized.png` | Screenshot of a resume enhanced by Jobapp's AI features |
| Dashboard mockup (light) | `/public/images/landing/dashboard-mockup-light.png` | Browser-framed screenshot of Jobapp dashboard, light theme |
| Dashboard mockup (dark) | `/public/images/landing/dashboard-mockup-dark.png` | Same, dark theme |

Until these are ready, implement colored placeholder `div`s with descriptive text labels so the layout is fully testable.

---

## Implementation Order

1. **Navbar** — quick layout + i18n fix
2. **Hero rotating words** — extract to client component, add framer-motion animation
3. **Stats section** — update translation values and heading
4. **Compare slider** — new component + integrate into page
5. **Testimonials** — glassmorphic restyle
6. **CTA** — screen mockup restyle
7. **Translation QA** — switch between `/en` and `/ru`, verify all new keys render