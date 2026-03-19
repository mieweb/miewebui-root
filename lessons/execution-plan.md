# @mieweb/ui Execution Plan — AI-Driven Component Migration

> Step-by-step execution plan for an AI agent (or human developer) to migrate any React + Tailwind CSS 4 project to `@mieweb/ui`. Designed to be repeatable across projects with different frameworks (Next.js, Vite, Remix, Meteor, etc.) and different source component libraries (shadcn/ui, Radix, Material UI, Chakra, custom, or raw HTML).

---

## How to Use This Document

1. Complete the **audit** from [adopting-mieweb-ui.md](adopting-mieweb-ui.md) first — you need a clear inventory of what exists.
2. Follow this plan **in order** — later steps depend on earlier ones.
3. **Validate after every step** — don't batch. Catch regressions early.
4. For AI agents: Each step is a discrete, completable unit of work. Mark steps done as you go.

---

## Pre-Flight

Before touching any code, gather this information about the target project:

### Project Profile (fill in per project)

```
Framework:           [Next.js / Vite / Remix / Meteor / etc.]
React version:       [18.x / 19.x]
CSS framework:       [Tailwind 3 / Tailwind 4 / plain CSS / etc.]
PostCSS plugin:      [tailwindcss / @tailwindcss/postcss / none]
Current UI library:  [shadcn/ui / Radix / MUI / Chakra / custom / raw HTML]
Theme system:        [next-themes / custom useTheme / CSS only / none]
State management:    [Zustand / Redux / Context / etc.]
Package manager:     [npm / pnpm / yarn]
Source directory:     [src/ / app/ / imports/ / etc.]
UI wrappers dir:     [components/ui/ / src/components/ / etc.]
```

### Pre-Flight Checklist

- [ ] Create a feature branch (e.g. `feature/mieweb-ui-migration`)
- [ ] Ensure the project builds and runs in its current state
- [ ] Run existing linting/type-checking to confirm a clean baseline
- [ ] Take note of any existing test suites (Playwright, Jest, Vitest, etc.)

---

## Step 1: Install `@mieweb/ui`

```bash
# Use the project's package manager
npm install @mieweb/ui          # npm
pnpm add @mieweb/ui             # pnpm
yarn add @mieweb/ui             # yarn
meteor npm install @mieweb/ui   # Meteor
```

**Verify installation:**
```bash
node -e "import('@mieweb/ui').then(m => console.log(Object.keys(m).length + ' exports found'))"
```

---

## Step 2: CSS Foundation

> This step MUST be completed before any component swaps. Components will look broken without the correct CSS variable system in place.

### 2.1 Update the CSS Entry Point

Every project has one CSS file that Tailwind processes (e.g. `globals.css`, `styles.css`, `main.css`). It needs these additions:

#### Required directives (add to top of file):

```css
/* 1. Import brand CSS in a layer so it can be overridden */
@import '@mieweb/ui/brands/bluehive.css' layer(theme);

/* 2. Import Tailwind (already present in most projects) */
@import 'tailwindcss';

/* 3. Tell Tailwind 4 to scan @mieweb/ui's compiled output for class names */
@source "../node_modules/@mieweb/ui/dist";

/* 4. Define dark mode variant for Tailwind 4
   The canonical @mieweb/ui selector (matches data-theme only): */
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
/* If using next-themes with attribute={["class", "data-theme"]}, use this broader
   selector that also matches the .dark class next-themes adds:
   @custom-variant dark (&:is(.dark *, [data-theme=dark] *)); */
```

#### Required theme block:

Replace existing color variable definitions with `@mieweb/ui` CSS variable mappings. The full `@theme` block is documented in [tailwind4-integration.md](tailwind4-integration.md). Key rules:

- **Primary scale**: No fallbacks needed (brand CSS always defines these)
- **All other scales** (neutral, secondary, destructive, success, warning, info): **MUST have hex fallbacks**
- **Semantic tokens** (background, foreground, border, etc.): Should have fallbacks

Example pattern:
```css
@theme {
  --color-primary: var(--mieweb-primary-500);                    /* no fallback */
  --color-neutral-900: var(--mieweb-neutral-900, #171717);       /* hex fallback */
  --color-background: var(--mieweb-background, #ffffff);         /* hex fallback */
}
```

#### Framework-specific notes:

| Framework | CSS entry point | Extra steps |
|-----------|----------------|-------------|
| Next.js (App Router) | `app/globals.css` | None |
| Next.js (Pages Router) | `styles/globals.css` | None |
| Vite | `src/index.css` or `src/App.css` | None |
| Remix | `app/root.tsx` inline or linked CSS | May need `links()` export |
| Meteor (Rspack) | `client/styles.css` | None |
| Meteor (legacy) | `client/main.css` | None |

### 2.2 Verify PostCSS Configuration

The PostCSS config **must** use `@tailwindcss/postcss`, not the old `tailwindcss` plugin:

```js
// postcss.config.cjs / postcss.config.mjs
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},  // optional but recommended
  },
};
```

If the project uses `tailwindcss` as the plugin, replace it. This is a Tailwind 3 → 4 requirement.

### 2.3 Update Theme Provider / Dark Mode Toggle

`@mieweb/ui` dark mode requires **both** the `.dark` CSS class AND the `data-theme` HTML attribute on `<html>`. This ensures compatibility with:
- The Tailwind `@custom-variant dark` (for utility classes like `dark:bg-card`)
- The brand CSS dark blocks (which target `[data-theme='dark'], .dark`)

How to set this depends on the project's theme system:

#### If using `next-themes`:
```tsx
<ThemeProvider attribute={["class", "data-theme"]} defaultTheme="dark" enableSystem>
```

#### If using a custom `useTheme` hook:
```typescript
function applyTheme(t: 'light' | 'dark') {
  const root = document.documentElement;
  root.classList.toggle('dark', t === 'dark');       // for Tailwind class-based
  root.setAttribute('data-theme', t);                // for brand CSS + @custom-variant
  localStorage.setItem('theme', t);
}
```

#### If no theme system exists:
Create a `useTheme` hook — see [adopting-mieweb-ui.md](adopting-mieweb-ui.md) §2.3.

#### App-specific dark overrides

If the project has app-specific CSS variables (e.g. sidebar tokens not provided by `@mieweb/ui`), define dark overrides for **both** selectors:

```css
.dark,
[data-theme="dark"] {
  --sidebar: var(--mieweb-background, #1a1a1a);
  --sidebar-foreground: var(--mieweb-foreground, #fafafa);
  /* ... */
}
```

### 2.4 Validate CSS Foundation

After completing this step, verify:

- [ ] App renders in light mode with correct colors (no transparent/missing backgrounds)
- [ ] Dark mode toggle works — all surfaces invert
- [ ] No console CSS errors
- [ ] The app looks the same or better than before (colors may shift slightly to the `@mieweb/ui` palette)

---

## Step 3: Brand Switching Infrastructure

> Optional but recommended. Brand switching lets the project change its entire color scheme dynamically.

The `@mieweb/ui` brand CSS files (e.g. `bluehive.css`, `mieweb.css`, `webchart.css`) each define the primary color scale, semantic tokens, chart colors, typography, radius, and shadow variables in a `:root {}` block. They do **not** define neutral/accent scales — those require hex fallbacks in the `@theme` block (see Step 2.1). Because they target `:root`, they can't be scoped with `data-brand` attributes out of the box. The working approach is to serve each brand CSS as a separate static file and swap a `<link>` tag at runtime.

### 3.1 Copy Brand CSS to Public Directory

Copy all brand CSS files from the `@mieweb/ui` package into the project's public/static-serving directory so they're available at known URLs:

```bash
mkdir -p public/brands
cp node_modules/@mieweb/ui/dist/brands/*.css public/brands/
```

This makes each brand available at `/brands/{name}.css` (e.g. `/brands/bluehive.css`).

> **Note:** Add this copy step to the project's build/CI pipeline to keep brand files in sync when `@mieweb/ui` is updated.

> **Note:** As of the current build, the `copy:brand-css` script in `@mieweb/ui`'s build pipeline copies `src/brands/*.css` to `dist/brands/`, so the `cp` command above should work with the published package. If for some reason the `.css` files are missing from `dist/`, copy them from the `@mieweb/ui` source repo instead: `cp /path/to/ui/src/brands/*.css public/brands/`. For Meteor projects using `@import` in CSS, you may need to copy the brand CSS into the project (e.g. `client/brands/`) and use a relative import path instead of the package path.

**Available brands** (check your installed version — more may be added):

| File | Brand |
|------|-------|
| `bluehive.css` | BlueHive Health |
| `mieweb.css` | MIE Web |
| `ozwell.css` | Ozwell AI |
| `webchart.css` | WebChart |
| `enterprise-health.css` | Enterprise Health |
| `waggleline.css` | WaggleLine |

### 3.2 Create a `useBrand` Hook

The hook manages brand state in localStorage and injects a `<link>` element pointing to the selected brand's CSS. The dynamically-loaded brand CSS overrides the statically-imported default (from `globals.css`) because it loads later and has equal specificity.

```typescript
"use client"

import { useState, useEffect, useCallback } from "react"

const BRANDS = [
  { value: "bluehive", label: "BlueHive Health" },
  { value: "mieweb", label: "MIE Web" },
  { value: "ozwell", label: "Ozwell AI" },
  { value: "webchart", label: "WebChart" },
  { value: "enterprise-health", label: "Enterprise Health" },
  { value: "waggleline", label: "WaggleLine" },
] as const

export type BrandId = (typeof BRANDS)[number]["value"]

const STORAGE_KEY = "app-brand"
const LINK_ID = "mieweb-brand-css"

export function useBrand() {
  const [brand, setBrandState] = useState<BrandId>("bluehive")

  // Load saved brand on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as BrandId | null
    if (saved && BRANDS.some((b) => b.value === saved)) {
      setBrandState(saved)
      applyBrandCSS(saved)
    }
  }, [])

  const setBrand = useCallback((newBrand: BrandId) => {
    setBrandState(newBrand)
    localStorage.setItem(STORAGE_KEY, newBrand)
    applyBrandCSS(newBrand)
  }, [])

  return { brand, setBrand, brands: BRANDS }
}

/** Swap the brand stylesheet <link> tag to load a different brand's CSS variables */
function applyBrandCSS(brand: BrandId) {
  let link = document.getElementById(LINK_ID) as HTMLLinkElement | null
  if (!link) {
    link = document.createElement("link")
    link.id = LINK_ID
    link.rel = "stylesheet"
    document.head.appendChild(link)
  }
  link.href = `/brands/${brand}.css`
}
```

### 3.3 Add a `BrandInitializer` to the Root Layout

> **CRITICAL:** The `useBrand` hook is used on settings/account pages where the user *changes* the brand. But if the user navigates to a different page and refreshes, `useBrand` never runs — the `<link>` tag is gone and the app falls back to the default brand from the static CSS import.
>
> To fix this, a separate `BrandInitializer` component must be rendered in the **root layout** so it runs on every page load.

```tsx
"use client"

import { useEffect } from "react"

const STORAGE_KEY = "app-brand"   // must match useBrand
const LINK_ID = "mieweb-brand-css" // must match useBrand

/**
 * Reads the saved brand from localStorage on mount and injects the
 * corresponding <link> tag.  Must be rendered in the root layout so
 * the brand is applied on every page — not just the settings page.
 */
export function BrandInitializer() {
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      let link = document.getElementById(LINK_ID) as HTMLLinkElement | null
      if (!link) {
        link = document.createElement("link")
        link.id = LINK_ID
        link.rel = "stylesheet"
        document.head.appendChild(link)
      }
      link.href = `/brands/${saved}.css`
    }
  }, [])

  return null
}
```

Add it to the root layout, **inside** the theme provider but **before** any page content:

```tsx
// app/layout.tsx (Next.js) or equivalent root layout
import { BrandInitializer } from "@/components/brand-initializer"

<ThemeProvider attribute={["class", "data-theme"]} defaultTheme="dark" enableSystem>
  <BrandInitializer />
  <AppShell>{children}</AppShell>
</ThemeProvider>
```

For Meteor projects, add `<BrandInitializer />` at the top of your root React component.

**Why two pieces?**
- `BrandInitializer` — **read-only**, runs on every page load, restores the saved brand
- `useBrand()` — **read-write**, used only on the settings/account page where the user picks a brand

They share the same `STORAGE_KEY` and `LINK_ID` constants. If you extract them to a shared module, keep the initializer dependency-free (no state, no callbacks).

### 3.4 How It Works

1. **Default brand** is statically imported in `globals.css` via `@import '@mieweb/ui/brands/bluehive.css' layer(theme)` — this ensures the app always has valid CSS variables even before JS runs.
2. **`BrandInitializer`** runs in the root layout on every page load. It reads localStorage and injects a `<link>` tag pointing to the saved brand's CSS.
3. **Runtime brand switch** via `useBrand()` on the settings page updates both localStorage and the `<link>` tag immediately.
4. **Persistence** — because `BrandInitializer` is in the root layout, a full-page refresh on *any* page restores the saved brand.

### 3.5 Validate Brand Switching

- [ ] Switch to at least 2 brands (e.g. bluehive → webchart)
- [ ] Primary color changes on buttons, focus rings, links, active states
- [ ] Dark mode still works with non-default brand
- [ ] Switching back to default brand restores original colors
- [ ] Navigate to a different page and **hard-refresh** — brand persists
- [ ] Open a new tab to a non-settings page — brand loads correctly

---

## Step 4: Component Replacement — Execution Order

Replace components in this order. Each category is a discrete step. **Validate after each.**

### Replacement Rules

For every component swap:

1. **Change the import** — `from '@/components/ui/button'` → `from '@mieweb/ui'`
2. **Map the API** — shadcn props → `@mieweb/ui` props (most are identical or very close)
3. **Preserve functionality** — all `onClick`, `onChange`, `onSubmit`, etc. handlers stay
4. **Preserve accessibility** — keep existing `aria-label`, `aria-describedby`, etc.
5. **Add missing accessibility** — if interactive elements lack ARIA labels, add them
6. **Delete the wrapper file** — once no files import the shadcn wrapper, delete it
7. **Test** — verify the component renders and functions correctly in light and dark mode

### 4a. Buttons (Highest Priority)

Buttons are typically the most numerous component. Replace them first because:
- Most files import Button
- The API is usually the simplest to map
- Validates the entire import pipeline works

**What to replace:**
1. All imports from the local Button wrapper → `import { Button } from '@mieweb/ui'`
2. All raw `<button>` elements → `<Button>` with appropriate `variant` and `size`

**Common shadcn → @mieweb/ui Button prop mapping:**

| shadcn/ui | @mieweb/ui | Notes |
|-----------|------------|-------|
| `variant="default"` | `variant="primary"` | **Renamed** — shadcn "default" maps to `@mieweb/ui` "primary" |
| `variant="destructive"` | `variant="danger"` | **Renamed** — "destructive" → "danger" |
| `variant="outline"` | `variant="outline"` | Same |
| `variant="secondary"` | `variant="secondary"` | Same |
| `variant="ghost"` | `variant="ghost"` | Same |
| `variant="link"` | `variant="link"` | Same |
| `size="sm"` | `size="sm"` | Same |
| `size="lg"` | `size="lg"` | Same |
| `size="icon"` | `size="icon"` | Verify availability |
| `asChild` | *(not supported)* | `@mieweb/ui` Button renders a native `<button>`, no Radix Slot |
| `disabled` | `disabled` | Same |
| `className` | `className` | Same |

> **⚠ Critical:** The variant renames are **component-specific**, not universal. Button uses `primary` (not `default`) and `danger` (not `destructive`). However, Badge keeps `default` as a valid variant and uses `danger` (not `destructive`). Always check each component's actual variant type in the source or Storybook.

**Raw `<button>` replacement pattern:**
```tsx
// BEFORE — raw HTML
<button onClick={fn} className="... custom classes ...">Click</button>

// AFTER — @mieweb/ui
<Button onClick={fn} variant="ghost" className="... custom classes ...">Click</Button>
```

Choose the variant that most closely matches the button's visual style:
- Filled/solid → `variant="primary"`
- Outlined → `variant="outline"`
- Transparent with hover → `variant="ghost"`
- Red/danger → `variant="danger"`
- Looks like a link → `variant="link"`

### 4b. Dialog / Modal

**API mapping:**

| shadcn/ui | @mieweb/ui |
|-----------|------------|
| `Dialog` | `Modal` |
| `DialogTrigger` | Controlled via `open` prop |
| `DialogContent` | Children of `Modal` (or `ModalBody`) |
| `DialogHeader` | `ModalHeader` |
| `DialogTitle` | Child of `ModalHeader` or `title` prop |
| `DialogDescription` | Content in `ModalBody` |
| `DialogFooter` | `ModalFooter` |
| `DialogClose` | `onClose` prop on `Modal` |
| `AlertDialog` | `Modal` (same component, different usage) |
| `Sheet` | `Modal` with slide-over / drawer variant |
| `Drawer` (vaul) | `Modal` with drawer variant |

**Pattern:**
```tsx
// BEFORE — shadcn Dialog
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    <div>Body content</div>
    <DialogFooter>
      <Button onClick={save}>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// AFTER — @mieweb/ui Modal
<Modal open={open} onOpenChange={(isOpen) => setOpen(isOpen)}>
  <ModalHeader>Title</ModalHeader>
  <ModalBody>
    <p>Description</p>
    <div>Body content</div>
  </ModalBody>
  <ModalFooter>
    <Button onClick={save}>Save</Button>
  </ModalFooter>
</Modal>
```

> **Note:** Verify the exact `@mieweb/ui` Modal API by checking [ui.mieweb.org](https://ui.mieweb.org) Storybook. The prop names may differ slightly between versions.

### 4c. Form Elements

| Component | shadcn Import | @mieweb/ui Import |
|-----------|--------------|-------------------|
| Text input | `Input` | `Input` |
| Textarea | `Textarea` | `Textarea` |
| Select | `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` | `Select` (verify compound API) |
| Checkbox | `Checkbox` | `Checkbox` |
| Radio | `RadioGroup`, `RadioGroupItem` | `Radio` |
| Switch | `Switch` | `Switch` |
| Slider | `Slider` | `Slider` |
| Label | `Label` | `Label` (or built into Field) |

**Select migration — compound → props-based API:**

`@mieweb/ui` Select uses a flat `options` array instead of shadcn's compound children pattern:

```tsx
// BEFORE — shadcn compound Select
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

<Select value={priority} onValueChange={setPriority}>
  <SelectTrigger>
    <SelectValue placeholder="Select priority" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="low">Low</SelectItem>
    <SelectItem value="medium">Medium</SelectItem>
    <SelectItem value="high">High</SelectItem>
  </SelectContent>
</Select>

// AFTER — @mieweb/ui props-based Select
import { Select } from '@mieweb/ui'

<Select
  value={priority}
  onValueChange={setPriority}
  options={[
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ]}
  placeholder="Select priority"
/>
```

> **Note:** Both shadcn and `@mieweb/ui` Select use `onValueChange(value: string)` — the callback receives the value string directly, not a native event.

### 4d. Data Display

| Component | shadcn Import | @mieweb/ui Import |
|-----------|--------------|-------------------|
| Avatar | `Avatar`, `AvatarFallback`, `AvatarImage` | `Avatar` |
| Badge | `Badge` | `Badge` |

**Avatar migration — compound → props-based API:**

```tsx
// BEFORE — shadcn compound Avatar
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

<Avatar>
  <AvatarImage src={user.avatarUrl} alt={user.name} />
  <AvatarFallback>{initials}</AvatarFallback>
</Avatar>

// AFTER — @mieweb/ui props-based Avatar
import { Avatar } from '@mieweb/ui'

<Avatar src={user.avatarUrl} name={user.name} />
```

The `name` prop auto-generates initials for the fallback. No separate `AvatarFallback` needed.
| Card | `Card`, `CardHeader`, `CardContent`, `CardFooter` | `Card`, `CardHeader`, `CardContent` |
| Table | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` |
| Tabs | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | `Tabs` |

**Also replace inline patterns:**
- `<span className="... badge-like styles ...">` → `<Badge>`
- `<div className="rounded-xl border bg-card p-4">` → `<Card><CardContent>`

### 4e. Feedback Components

| Component | shadcn Import | @mieweb/ui Import |
|-----------|--------------|-------------------|
| Toast/Sonner | `toast()` / `<Toaster>` | `Toast` system from `@mieweb/ui` |
| Spinner | `Spinner` | `Spinner` |
| Skeleton | `Skeleton` | `Skeleton` |
| Progress | `Progress` | `Progress` |
| Alert | `Alert` | `Alert` |

**Custom toast systems**: Many projects have custom toast implementations (Zustand store, custom components). Replace the rendering with `@mieweb/ui` Toast but keep the store dispatch logic if it's deeply integrated.

### 4f. Navigation Components

| Component | shadcn Import | @mieweb/ui Import |
|-----------|--------------|-------------------|
| Sidebar | `Sidebar` | `Sidebar` |
| Breadcrumb | `Breadcrumb` | `Breadcrumb` |
| Pagination | `Pagination` | `Pagination` |

### 4g. Overlay Components

| Component | shadcn Import | @mieweb/ui Import |
|-----------|--------------|-------------------|
| Tooltip | `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger` | `Tooltip` |
| Popover | `Popover`, `PopoverContent`, `PopoverTrigger` | Evaluate |
| DropdownMenu | `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuTrigger` | `Dropdown` |
| Command | `Command`, `CommandInput`, `CommandList`, `CommandItem` | `CommandPalette` |
| Context Menu | `ContextMenu` | `Dropdown` (with right-click trigger) |

**Dropdown migration — compound → trigger-prop API:**

```tsx
// BEFORE — shadcn DropdownMenu (compound children)
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={handleEdit}>
      <Pencil className="mr-2 h-4 w-4" /> Edit
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleDelete} className="text-danger">
      <Trash2 className="mr-2 h-4 w-4" /> Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

// AFTER — @mieweb/ui Dropdown (trigger prop)
import { Dropdown, DropdownItem, Button } from '@mieweb/ui'

<Dropdown
  trigger={
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  }
>
  <DropdownItem icon={<Pencil className="h-4 w-4" />} onClick={handleEdit}>
    Edit
  </DropdownItem>
  <DropdownItem icon={<Trash2 className="h-4 w-4" />} onClick={handleDelete} className="text-danger">
    Delete
  </DropdownItem>
</Dropdown>
```

> **Key differences:** Trigger element is passed via `trigger` prop (not a compound child). Menu items use an `icon` prop instead of inline icon children. Check the Storybook for separator/group support.

### 4h. Evaluate & Decide — Components Without Direct Equivalents

Some components may not have a 1:1 `@mieweb/ui` equivalent. For each:

| Decision | Action |
|----------|--------|
| `@mieweb/ui` has equivalent | Replace |
| No equivalent, but simple | Keep local, restyle with `@mieweb/ui` CSS variables |
| No equivalent, complex | Keep local, follow [component-policy.md](component-policy.md) Tier 2 rules |
| Wrapper around third-party | Keep (e.g. recharts, embla-carousel, react-resizable-panels) |
| Pure utility / hook | Keep (not a UI component) |

**Commonly kept components** (typically no `@mieweb/ui` equivalent):
- Carousel (embla-carousel wrapper)
- Resizable panels (react-resizable-panels wrapper)
- Chart wrappers (recharts integration)
- Input OTP
- Aspect Ratio (CSS utility)
- Calendar (if deeply customized beyond DatePicker)
- Form (react-hook-form integration layer)

**Confirmed gaps** (verified missing from `@mieweb/ui` as of v0.2.x):

| Component | Recommendation |
|-----------|----------------|
| `ScrollArea` | Keep local wrapper (Radix-based). Used for constrained scrollable regions. |
| `Separator` | Keep local wrapper or use `<hr>` / `<div className="border-t">`. |
| `Label` | Use native `<label>` element — no dedicated component needed. |
| `Sheet` (side panel) | Use `Modal` with drawer/slide-over variant if available, otherwise keep local. |

If you encounter additional gaps, document them in your project's migration notes for potential upstream contribution.

---

## Step 5: Icon Migration

`@mieweb/ui` standardises on **lucide-react** as its icon library. It re-exports ~150 commonly used icons with an `*Icon` suffix (e.g. `HomeIcon`, `TrashIcon`, `CalendarIcon`) and also re-exports the `LucideIcon` and `LucideProps` types. Consumers can import these convenience aliases from `@mieweb/ui` or import directly from `lucide-react` for the full set of 1 400+ icons.

### 5.1 Audit Current Icon Usage

Run these commands from the project root to understand the starting state:

```bash
# Count lucide-react imports (already compliant)
grep -rn "from.*lucide-react" --include="*.tsx" --include="*.ts" src/ app/ components/ | grep -v node_modules | wc -l

# Detect other icon libraries
grep -rn 'from.*react-icons\|from.*@heroicons\|from.*phosphor-react\|from.*@tabler/icons\|from.*@fortawesome\|from.*@iconify' \
  --include="*.tsx" --include="*.ts" src/ app/ components/ | grep -v node_modules

# Detect inline SVGs used as icons
grep -rn '<svg' --include="*.tsx" --include="*.ts" src/ app/ components/ | grep -v node_modules | grep -v "components/ui/"
```

Record the results. If only `lucide-react` is found (and zero hits for other libraries / inline SVGs), this step is already complete — skip to Step 6.

### 5.2 Map Icons to lucide-react Equivalents

For each non-lucide icon found, find the closest lucide-react match:

| Source Library | Example Icon | lucide-react Equivalent |
|---|---|---|
| `react-icons/fa` | `FaUser` | `User` from `lucide-react` |
| `react-icons/hi` | `HiOutlineSearch` | `Search` from `lucide-react` |
| `@heroicons/react` | `MagnifyingGlassIcon` | `Search` from `lucide-react` |
| `phosphor-react` | `MagnifyingGlass` | `Search` from `lucide-react` |
| Inline `<svg>` | custom icon | Find closest match at https://lucide.dev/icons or keep as local component |

**Tips:**
- Browse the full lucide catalogue at https://lucide.dev/icons
- `@mieweb/ui` re-exports are listed in `src/components/Icons/index.ts` — prefer these aliases when available
- If no exact match exists, keep the icon as a local SVG component (do NOT force-fit)

### 5.3 Replace Imports

**Pattern A — Other library → lucide-react (direct import):**

```typescript
// BEFORE
import { FaUser, FaSearch } from 'react-icons/fa';

// AFTER
import { User, Search } from 'lucide-react';
```

Then update JSX: `<FaUser />` → `<User />`, etc.

**Pattern B — Other library → @mieweb/ui alias (when available):**

```typescript
// BEFORE
import { HiOutlineSearch } from 'react-icons/hi';

// AFTER
import { SearchIcon } from '@mieweb/ui';
```

**Pattern C — Inline SVG → lucide-react:**

```tsx
// BEFORE
const Arrow = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

// AFTER
import { ArrowRight } from 'lucide-react';
// then use <ArrowRight className="h-5 w-5" />
```

### 5.4 Adjust Icon Props

lucide-react icons accept standard SVG props plus convenience props:

| Common prop | Example |
|---|---|
| `size` | `<User size={20} />` — sets both width and height |
| `strokeWidth` | `<User strokeWidth={1.5} />` — default is 2 |
| `className` | `<User className="h-5 w-5 text-muted-foreground" />` |
| `color` | `<User color="currentColor" />` (default) |

If the old library used different sizing (e.g. react-icons defaults to `1em`), you may need to add explicit `size` or `className` to preserve visual consistency.

### 5.5 Remove Old Icon Dependencies

After all icons are replaced:

```bash
# Verify zero remaining imports from old libraries
grep -rn 'from.*react-icons\|from.*@heroicons\|from.*phosphor-react' \
  --include="*.tsx" --include="*.ts" src/ app/ components/ | grep -v node_modules

# If clean, uninstall
npm uninstall react-icons @heroicons/react phosphor-react  # adjust to your package manager
```

### 5.6 Verify

```bash
# App should build and type-check with no icon-related errors
npm run typecheck
npm run lint
```

Visually spot-check pages that previously used non-lucide icons to confirm correct rendering and sizing.

---

## Step 6: Clean Up

### 6.1 Replace Utility Imports

```typescript
// BEFORE — local cn utility
import { cn } from '@/lib/utils';

// AFTER — @mieweb/ui exports cn
import { cn } from '@mieweb/ui';
```

If `@mieweb/ui` exports `cn`, you have two options:

**Option A — Re-export bridge (recommended for large codebases):**

Update `lib/utils.ts` to re-export from `@mieweb/ui`. This avoids touching every file that imports `cn`:

```typescript
// lib/utils.ts — bridge file
export { cn } from '@mieweb/ui';
```

All existing `import { cn } from '@/lib/utils'` imports continue to work with zero changes.

**Option B — Direct replacement:**

Find-and-replace all `from '@/lib/utils'` → `from '@mieweb/ui'` across the codebase. Cleaner long-term but touches many files.

The bridge approach (Option A) is recommended because it's a one-line change, avoids merge conflicts, and can be cleaned up incrementally later.

### 6.2 Remove Unused Dependencies

After all component wrappers are deleted, remove packages that are no longer directly imported:

**Typically removable:**

| Package | Condition for Removal |
|---------|-----------------------|
| `@radix-ui/react-*` (all) | No remaining direct imports |
| `class-variance-authority` | No remaining direct usage in app code |
| `clsx` | Replaced by `cn` from `@mieweb/ui` |
| `tailwind-merge` | Replaced by `cn` from `@mieweb/ui` |
| `cmdk` | Replaced by `@mieweb/ui` CommandPalette |
| `sonner` | Replaced by `@mieweb/ui` Toast |
| `vaul` | Replaced by `@mieweb/ui` Modal/Drawer |
| `react-day-picker` | Replaced by `@mieweb/ui` DateRangePicker |
| `input-otp` | Only if `@mieweb/ui` provides equivalent |
| `tailwindcss-animate` / `tw-animate-css` | Only if no custom animations depend on it |

**Verify before removing:**
```bash
# Check for any remaining direct imports of a package
grep -rn 'from.*@radix-ui' --include='*.tsx' --include='*.ts' src/ app/ components/ | grep -v node_modules
grep -rn 'from.*clsx\|from.*class-variance-authority\|from.*tailwind-merge' --include='*.tsx' --include='*.ts' src/ app/ components/ | grep -v node_modules
```

### 6.3 Delete Empty Wrapper Directory

Once all `components/ui/*.tsx` files are either deleted or confirmed as kept, check if the directory can be cleaned:

```bash
# What's left in the UI wrappers directory?
ls -la components/ui/   # or src/components/ui/
```

If only kept files remain (hooks, third-party wrappers), consider renaming to clarify they're local extensions, not shadcn/ui.

---

## Step 7: Accessibility Pass

After all components are replaced, run a focused accessibility audit:

```bash
# Interactive elements without ARIA labels
grep -rn '<Button\|<Input\|<Select\|<Modal\|<Dropdown' --include='*.tsx' src/ app/ components/ \
  | grep -v 'aria-\|aria_\|label\|Label\|sr-only'
```

For each finding:
- Add `aria-label` to icon-only buttons
- Add `aria-label` to inputs without visible labels
- Ensure modals have title/description for screen readers
- Verify keyboard navigation works (Tab, Enter, Escape)

---

## Step 8: Testing & Verification

### 8.1 Visual Smoke Tests

| Test | How | Pass Criteria |
|------|-----|---------------|
| Light mode | Load app (default) | All components visible, correct colors, no transparent gaps |
| Dark mode | Toggle theme | All surfaces invert. No white flashes, no transparent sections |
| Brand switch | Switch to 2+ brands | Primary color changes on buttons, focus rings, links, active states |
| Dark + non-default brand | Switch brand then toggle dark | Both work simultaneously |
| Responsive | Resize to mobile width | Components reflow correctly |
| Keyboard | Tab through page | Focus indicators visible on all interactive elements |

### 8.2 Build Verification

```bash
# TypeScript
npx tsc --noEmit

# Lint
npm run lint          # or pnpm lint, yarn lint

# Build
npm run build         # must complete without errors

# Existing tests
npm test              # run any existing test suite
```

### 8.3 Final Compliance Report

Run the compliance audit commands from [adopting-mieweb-ui.md](adopting-mieweb-ui.md) §1.4 and compare before/after:

```bash
echo "=== Post-Migration Compliance ==="
echo "Raw <button>:    $(grep -rn '<button' --include='*.tsx' --include='*.jsx' src/ app/ components/ | grep -v node_modules | grep -v 'components/ui/' | wc -l)"
echo "Raw <input>:     $(grep -rn '<input' --include='*.tsx' --include='*.jsx' src/ app/ components/ | grep -v node_modules | grep -v 'components/ui/' | wc -l)"
echo "Raw <select>:    $(grep -rn '<select' --include='*.tsx' --include='*.jsx' src/ app/ components/ | grep -v node_modules | grep -v 'components/ui/' | wc -l)"
echo "Raw <table>:     $(grep -rn '<table' --include='*.tsx' --include='*.jsx' src/ app/ components/ | grep -v node_modules | grep -v 'components/ui/' | wc -l)"
echo "Raw <textarea>:  $(grep -rn '<textarea' --include='*.tsx' --include='*.jsx' src/ app/ components/ | grep -v node_modules | grep -v 'components/ui/' | wc -l)"
echo "@mieweb/ui used: $(grep -rn '@mieweb/ui' --include='*.tsx' --include='*.jsx' --include='*.ts' src/ app/ components/ | grep -v node_modules | wc -l)"
```

**Target:** Zero raw elements, all imports from `@mieweb/ui`.

---

## Step 9: Gap Detection & Documentation

### 9.1 Components Without @mieweb/ui Equivalents

```bash
# Local components that don't import from @mieweb/ui
grep -rn 'export.*function\|export.*const' --include='*.tsx' components/ src/components/ \
  | grep -v '@mieweb/ui\|node_modules\|test\|spec\|story'
```

For each gap found:
1. **Document it** — component name, file, purpose, screenshot
2. **Is it project-specific?** → Keep local, follow [component-policy.md](component-policy.md) Tier 2
3. **Is it reusable?** → Candidate for upstream contribution to `@mieweb/ui`

### 9.2 Remaining Non-@mieweb CSS Variables

```bash
grep -rn 'var(--' --include='*.css' --include='*.tsx' src/ app/ components/ \
  | grep -v 'mieweb\|tw-\|node_modules' \
  | sort -u
```

App-specific variables (e.g. `--sidebar-*`) are expected. Hardcoded color variables (e.g. `--my-blue: #1234ef`) should be migrated to `@mieweb/ui` semantic tokens where possible.

---

## Common Traps (Quick Reference)

| Symptom | Cause | Fix |
|---------|-------|-----|
| Components render with missing styles | Tailwind 4 tree-shaking | Add `@source "../node_modules/@mieweb/ui/dist"` |
| Dark mode toggle does nothing | Missing `@custom-variant dark` | Add to CSS entry |
| Dark mode toggles but some surfaces stay light | CSS variable fallbacks missing | Add hex fallbacks to `@theme` |
| Brand switch has no effect | `<link>` tag not updating | Verify `useBrand` hook is swapping the `<link href>` to `/brands/{name}.css` (see Step 3.2) |
| PostCSS does nothing | Wrong plugin | Use `@tailwindcss/postcss`, not `tailwindcss` |
| `var()` resolves to transparent | No CSS variable defined | Add fallback: `var(--token, #hex)` |
| TypeScript errors on imports | Subpath resolution | Use barrel imports from `@mieweb/ui`, not subpaths |
| Modal/Dialog doesn't close | API mismatch | Both shadcn and `@mieweb/ui` use `onOpenChange(open: boolean)` |
| Select dropdown empty | Compound API mismatch | `@mieweb/ui` Select uses `options` array, not compound children |
| Brand resets on page refresh | `useBrand` only runs on settings page | Add `BrandInitializer` to root layout (see Step 3.3) |
| Button `variant="default"` has no effect | Variant renamed (Button only) | Use `variant="primary"` — but Badge keeps `variant="default"` |
| `variant="destructive"` has no effect | Variant renamed | Use `variant="danger"` instead |
| `asChild` prop not working | Not supported | `@mieweb/ui` Button renders native `<button>`, no Radix Slot |
| Brand CSS import fails in Meteor/Rspack | CSS file not found | Copy brand CSS into project; use relative import path |

---

## AI Agent Instructions

When an AI agent is executing this plan:

1. **Work one step at a time.** Complete each step fully before starting the next.
2. **Validate after every step.** Run type-checking and visually confirm before proceeding.
3. **Don't batch-delete wrapper files.** Delete each only after confirming zero remaining imports.
4. **Preserve all event handlers.** The migration is import-only — behavior must not change.
5. **Check the Storybook** at [ui.mieweb.org](https://ui.mieweb.org) to verify component API before mapping.
6. **When in doubt, keep the local component.** It's better to have a working local component than a broken `@mieweb/ui` replacement.
7. **Never commit or push without explicit user confirmation.**

### Audit Commands for AI Agents

Before starting, generate the audit inventory:

```bash
# Count all violation categories
echo "=== @mieweb/ui Compliance Audit ==="
echo "Raw <button>:    $(grep -rn '<button' --include='*.tsx' --include='*.jsx' [SRC_DIR]/ | grep -v node_modules | wc -l)"
echo "Raw <input>:     $(grep -rn '<input' --include='*.tsx' --include='*.jsx' [SRC_DIR]/ | grep -v node_modules | wc -l)"
echo "Raw <select>:    $(grep -rn '<select' --include='*.tsx' --include='*.jsx' [SRC_DIR]/ | grep -v node_modules | wc -l)"
echo "Raw <table>:     $(grep -rn '<table' --include='*.tsx' --include='*.jsx' [SRC_DIR]/ | grep -v node_modules | wc -l)"
echo "Raw <textarea>:  $(grep -rn '<textarea' --include='*.tsx' --include='*.jsx' [SRC_DIR]/ | grep -v node_modules | wc -l)"
echo "shadcn wrappers: $(ls -1 [UI_DIR]/*.tsx 2>/dev/null | wc -l)"
echo "@mieweb/ui used: $(grep -rn '@mieweb/ui' --include='*.tsx' --include='*.ts' [SRC_DIR]/ | grep -v node_modules | wc -l)"
```

Replace `[SRC_DIR]` and `[UI_DIR]` with the project's actual paths.

After each component category is complete:

```bash
# Verify no remaining imports of the deleted wrapper
grep -rn 'from.*@/components/ui/[COMPONENT_NAME]' --include='*.tsx' --include='*.ts' . | grep -v node_modules
```

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [adopting-mieweb-ui.md](adopting-mieweb-ui.md) | Audit methodology, component mapping table, testing checklist |
| [compliance-prompt.md](compliance-prompt.md) | Copy-paste AI prompt for a single-session migration |
| [component-policy.md](component-policy.md) | When to use, build locally, or contribute upstream |
| [tailwind4-integration.md](tailwind4-integration.md) | Full CSS variable tables, fallback values, PostCSS setup |
| [migration-meteor-blaze-to-react.md](migration-meteor-blaze-to-react.md) | Meteor-specific migration details |
| [recommended-changes.md](recommended-changes.md) | Library improvements that would make this plan simpler |
