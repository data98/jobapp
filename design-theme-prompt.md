# Design Language Assessment & Light Theme Planning Prompt

## Role

You are a senior product designer + design systems architect + front‑end UX engineer. Your task is to analyze an existing application that currently only has a **dark theme**, then design a **light theme** that follows the **same design language** and adopts visual patterns from a provided reference website. Reference website is https://www.marco.fyi/?ref=godly

You must NOT redesign the product. You must extend it consistently.

---

## Objective

1. Understand and document the existing dark theme design language
2. Extract reusable design principles from the reference website
3. Create a matching light theme using those principles
4. Keep both themes visually related — they must feel like the same product
5. Do NOT change dark theme colors for now (except tokenization if needed)

---

## Inputs (I will provide)

* Current project codebase (UI components + styles)
* Screenshots of current UI (dark theme)
* A reference website URL

---

## Core Rules

### Design Consistency

* Dark and light themes must share identical:

  * spacing
  * border radius
  * typography scale
  * layout hierarchy 
  * component structure
  * interaction patterns
* Only color & contrast logic should differ

### Color Policy

* Dark theme colors: KEEP as‑is
* Light theme colors: derive from reference website
* Convert both into a token system

### No Artistic Guessing

If something is unclear → infer from reference website system, NOT personal taste.

---

## Phase 1 — Analyze Current Dark Theme

Produce a structured audit:

### 1. Foundations

* Background levels (primary / secondary / tertiary / elevated)
* Text hierarchy levels
* Border usage & visibility
* Shadows / elevation logic
* Spacing system (4pt, 8pt, etc.)
* Corner radius system
* Typography scale & weights

### 2. Component Patterns

For each component identify visual logic, not colors:

* Buttons (primary / secondary / ghost / destructive)
* Inputs
* Cards
* Modals
* Navigation elements
* Tables
* Badges / chips
* Tooltips
* Dropdowns

Document patterns like:

> "Primary actions rely on filled emphasis, secondary actions rely on outline contrast"

### 3. Interaction Language

* Hover behavior type (brightness shift, opacity, overlay, tint)
* Focus style
* Active style
* Disabled logic
* Motion speed & easing philosophy

Output: A concise "Design Language DNA" document.

---

## Phase 2 — Analyze Reference Website

Extract transferable design principles (NOT copy‑paste styles):

### Extract:

* Contrast philosophy
* Surface layering strategy
* Light surface tinting rules
* Border visibility logic
* Accent usage philosophy
* Color temperature bias (warm / cool / neutral)
* How they differentiate surfaces WITHOUT shadows
* How they use whitespace instead of dividers

Then translate into:

> Portable rules that can apply to our existing component structures

---

## Phase 3 — Create Theme Token System

Create a full semantic token system.

### Required Token Layers

#### Primitive Tokens

Raw palette (light theme only from reference site):

* neutral scale (50–950)
* accent scale
* success
* warning
* danger

#### Semantic Tokens

Do NOT use color names — use intent:

Background

* bg.app
* bg.surface
* bg.elevated
* bg.subtle
* bg.inverse

Text

* text.primary
* text.secondary
* text.muted
* text.inverse
* text.accent

Border

* border.default
* border.subtle
* border.strong
* border.focus

Interactive

* action.primary
* action.primary.hover
* action.secondary
* action.secondary.hover
* action.disabled

State

* success
* warning
* danger
* info

---

## Phase 4 — Generate Light Theme

Apply the reference philosophy onto our existing components.

### Requirements

* Do NOT redesign layouts
* Do NOT change spacing
* Do NOT add decorative elements
* Only adapt visual logic

For each component provide:

1. Visual reasoning
2. Token usage
3. Accessibility contrast check
4. Why it matches the dark theme identity

---

## Phase 5 — Cross‑Theme Consistency Check

Verify parity:

For every component answer:

> If user switches theme, does the component still feel identical in behavior and hierarchy?

Fix mismatches if hierarchy perception changes.

---

## Accessibility Rules

* Meet WCAG AA minimum contrast
* Prefer AAA where possible for text
* Never rely on color alone for meaning
* Focus states must be visible in both themes

---

## Phase 6 — Theme Persistence (Required)

The application must persist the selected theme (dark or light) using localStorage.

### Requirements

* Store theme preference in localStorage (e.g., `theme = 'dark' | 'light'`)
* On app initialization:

  1. Check localStorage for saved theme
  2. If present → apply immediately before first paint (avoid flash)
  3. If absent → default to system preference (`prefers-color-scheme`)
* Theme switching must update:

  * localStorage
  * document root attribute/class (e.g., `data-theme="dark"`)
  * design token context

### Technical Expectations

* No layout shift during theme switch
* No flicker between themes on reload
* Token-based architecture must support runtime switching
* SSR-safe implementation (if applicable)

### Validation

Confirm:

* Theme remains consistent after refresh
* Theme remains consistent after logout/login
* Theme persists across sessions and browser restarts

---

## Output Format (STRICT)

Return in this structure:

1. Dark Theme Design DNA
2. Reference Design Principles
3. Token System
4. Light Theme Specification per Component
5. Parity Validation Report
6. Migration Implementation Steps (for developers)

Do NOT include opinions, only system reasoning.
