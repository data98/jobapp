# Prompt: Reimagine Sidebar using shadcn/ui Sidebar Component

## Objective

Replace the current custom `<Sidebar />` component with the official **shadcn/ui Sidebar** component (`npx shadcn@latest add sidebar`). The new sidebar must be **retractable/collapsible** — expanding to show icons + labels, and collapsing to show **icons only** (including a mini avatar at the bottom). Move the user avatar/menu from the Navbar into the sidebar footer. Simplify the Navbar to be a contextual breadcrumb/title bar.

---

## Current State (what exists today)

### `components/shared/Sidebar.tsx`
- Fixed `w-56` sidebar with: logo ("Jobapp" + icon), 4 nav items (Dashboard, Applications, Resume, Settings) using `lucide-react` icons, active state highlighting via `usePathname()`, `next-intl` translations via `useTranslations('nav')`.

### `components/shared/Navbar.tsx`
- Top bar with: `<LocaleSwitcher />` and `<UserMenu />` (avatar dropdown with user name/email, Settings link, Sign Out).

### `components/shared/UserMenu.tsx`
- Avatar with initials fallback, dropdown menu with user info, settings link, sign out action. Uses `useSession()` hook and `signOut()` from auth-client.

### `app/[locale]/(dashboard)/layout.tsx`
- Flex layout: `<Sidebar />` on the left, `<Navbar showUserMenu />` + `<main>` on the right.

---

## Target Architecture

### 1. Install shadcn/ui Sidebar

```bash
npx shadcn@latest add sidebar
```

Read the official docs at https://ui.shadcn.com/docs/components/sidebar before implementing. Use the `SidebarProvider`, `Sidebar`, `SidebarContent`, `SidebarHeader`, `SidebarFooter`, `SidebarGroup`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarTrigger`, and `useSidebar` primitives.

### 2. New Sidebar (`components/shared/AppSidebar.tsx`)

**Structure:**

```
┌─────────────────────────┐     ┌────┐
│ [J] Jobapp        [<<]  │     │[J] │  ← collapsed
├─────────────────────────┤     ├────┤
│ 📊 Dashboard            │     │ 📊 │
│ 💼 Applications         │     │ 💼 │
│ 📄 Resume               │     │ 📄 │
│ ⚙️ Settings              │     │ ⚙️  │
│                         │     │    │
│                         │     │    │
│         (spacer)        │     │    │
│                         │     │    │
├─────────────────────────┤     ├────┤
│ [Avatar] John Doe    ⋮  │     │[AV]│  ← footer
│          john@mail.com  │     │    │
└─────────────────────────┘     └────┘
```

**Header (`SidebarHeader`):**
- Logo icon + "Jobapp" text (same as current)
- `<SidebarTrigger />` collapse/expand button aligned to the right
- When collapsed: show only the logo icon

**Content (`SidebarContent` → `SidebarGroup` → `SidebarMenu`):**
- Same 4 nav items: Dashboard, Applications, Resume, Settings
- Use `SidebarMenuItem` + `SidebarMenuButton` with `asChild` wrapping `<Link>` from `@/i18n/navigation`
- Each item has its `lucide-react` icon + translated label
- Active state: derive from `usePathname()` and set `isActive` on `SidebarMenuButton`  
- When collapsed: show only icons (shadcn sidebar handles this with `collapsible="icon"`)
- Keep using `useTranslations('nav')` for i18n labels

**Footer (`SidebarFooter`):**
- Move user avatar + dropdown menu here (absorb `UserMenu` logic)
- Show: Avatar (initials fallback), user's name, user's email
- Dropdown menu (triggered by a `⋮` button or clicking the footer area) with:
  - User info (name + email) at top
  - Settings link
  - Sign Out action
- When collapsed: show only the avatar circle (small), dropdown still works on click
- Use `SidebarMenu` + `SidebarMenuItem` + `SidebarMenuButton` in the footer for proper styling
- Wrap the dropdown in `DropdownMenu` from existing `@/components/ui/dropdown-menu`
- Use `useSidebar()` hook to detect `open` state and conditionally render name/email text

### 3. Updated Navbar (`components/shared/Navbar.tsx`)

Simplify the Navbar — it no longer holds the UserMenu:

- **Left side:** `<SidebarTrigger />` (hamburger/toggle button for mobile or alternative toggle), then a contextual title area (for future use: page title, breadcrumb, or back button when viewing an application/resume detail)
- **Right side:** `<LocaleSwitcher />` only
- Remove `showUserMenu` prop entirely
- Remove the `<UserMenu />` import and usage

### 4. Updated Dashboard Layout (`app/[locale]/(dashboard)/layout.tsx`)

- Wrap everything in `<SidebarProvider>` (from shadcn sidebar)
- Replace `<Sidebar />` with `<AppSidebar />`
- The layout structure becomes:

```tsx
<SidebarProvider>
  <AppSidebar />
  <SidebarInset>
    <Navbar />
    <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
      {children}
    </main>
  </SidebarInset>
</SidebarProvider>
```

### 5. Sidebar Configuration

- Set `collapsible="icon"` on the `<Sidebar>` component so it collapses to an icon rail
- Use `side="left"` (default)
- Use `variant="sidebar"` (default, with border)
- The sidebar should persist its collapsed/expanded state (shadcn sidebar uses a cookie `sidebar_state` by default — keep this behavior)

---

## Key Implementation Details

- **i18n:** All labels must continue using `useTranslations('nav')` — no hardcoded strings
- **Auth:** Use the existing `useSession()` hook from `@/hooks/use-session` for user data, and `signOut()` from `@/lib/auth-client`
- **Routing:** Use `<Link>` from `@/i18n/navigation` for all nav links, `usePathname()` for active detection
- **Avatar:** Use existing `<Avatar>` + `<AvatarFallback>` from `@/components/ui/avatar` with the same initials logic currently in `UserMenu.tsx`
- **Styling:** Follow the project's existing conventions — Tailwind CSS 4, shadcn "new-york" style, neutral base color, CSS variables enabled
- **Tooltip on collapsed:** When sidebar is collapsed, nav items should show a tooltip with the label on hover (shadcn sidebar does this automatically with `SidebarMenuButton tooltip` prop)

---

## Files to Create / Modify

| Action | File | Notes |
|--------|------|-------|
| **Create** | `components/shared/AppSidebar.tsx` | New sidebar component using shadcn primitives |
| **Modify** | `components/shared/Navbar.tsx` | Remove UserMenu, add SidebarTrigger + contextual title area |
| **Modify** | `app/[locale]/(dashboard)/layout.tsx` | Wrap in SidebarProvider, use AppSidebar + SidebarInset |
| **Delete** | `components/shared/Sidebar.tsx` | Old sidebar, fully replaced |
| **Keep** | `components/shared/UserMenu.tsx` | Can be deleted or kept for reference — its logic moves into AppSidebar footer |
| **Install** | shadcn sidebar | `npx shadcn@latest add sidebar` |

---

## What NOT to Change

- Do not change auth logic, session handling, or sign-out flow
- Do not change the nav items or their routes
- Do not change `LocaleSwitcher` — it stays in the Navbar
- Do not change any page content or functionality
- Do not remove any existing shadcn/ui components