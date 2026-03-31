<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

---

## Project Stack

- **Next.js 16** (App Router only — do NOT use Pages Router)
- **React 19**
- **TypeScript 5** (strict mode)
- **Tailwind CSS 4** (PostCSS plugin, no `tailwind.config.js`)

---

## Critical Breaking Changes in This Version

### 1. `params` and `searchParams` are now Promises

In Next.js 16, route props are asynchronous. Always `await` them.

```tsx
// ✅ Correct
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
}

// ❌ Wrong — will throw in Next.js 16
export default function Page({ params }: { params: { slug: string } }) {
  const { slug } = params;
}
```

### 2. Caching: `fetch` is NOT cached by default

Requests are uncached by default. Use the `use cache` directive explicitly.

```ts
// ✅ Cached data fetch
export async function getUsers() {
  "use cache";
  return fetch("...").then((r) => r.json());
}

// ✅ Streaming uncached data — wrap in <Suspense>
// ❌ Do NOT rely on fetch caching like Next.js 13/14
```

To enable Cache Components, add to `next.config.ts`:

```ts
const nextConfig: NextConfig = { cacheComponents: true };
```

### 3. Tailwind CSS 4 — no config file

Tailwind 4 uses PostCSS. There is no `tailwind.config.js`.

```css
/* app/globals.css */
@import "tailwindcss";
```

```js
/* postcss.config.mjs */
export default { plugins: { "@tailwindcss/postcss": {} } };
```

### 4. Server Functions replace "Server Actions" terminology

The term is now **Server Function**. When used in forms/mutations, they're called **Server Actions**. Use `'use server'` directive.

```ts
// app/lib/actions.ts
export async function createPost(formData: FormData) {
  "use server";
  // always verify auth inside every Server Function
}
```

### 5. Instant navigation — export `unstable_instant`

To make client-side navigations instant (especially with Suspense/streaming), export `unstable_instant` from the route:

```tsx
// app/blog/page.tsx
export const unstable_instant = true;
```

---

## File & Folder Conventions

| Path                    | Purpose                        |
| ----------------------- | ------------------------------ |
| `app/layout.tsx`        | Root layout (wraps all routes) |
| `app/page.tsx`          | Index route `/`                |
| `app/[slug]/page.tsx`   | Dynamic route                  |
| `app/(group)/`          | Route group — omitted from URL |
| `app/blog/_components/` | Private folder — not routable  |
| `app/api/route.ts`      | API route handler              |
| `app/loading.tsx`       | Suspense skeleton              |
| `app/error.tsx`         | Error boundary                 |
| `app/not-found.tsx`     | 404 page                       |

---

## Server vs Client Components

**Default: Server Component.** Add `'use client'` only when needed.

| Use Client Component when               | Use Server Component when |
| --------------------------------------- | ------------------------- |
| `useState`, `useEffect`                 | DB/API data fetching      |
| `onClick`, `onChange`                   | Secrets / API keys        |
| Browser APIs (`window`, `localStorage`) | Large data processing     |
| Custom hooks                            | SEO-critical content      |

---

## Data Fetching Patterns

```tsx
// Server Component — fetch directly
export default async function Page() {
  const data = await fetch("https://api.example.com/data").then((r) =>
    r.json(),
  );
  return <div>{data.title}</div>;
}

// Client Component — use SWR/React Query or fetch in useEffect
("use client");
import useSWR from "swr";
```

---

## Path Alias

Use `@/` for imports from the project root (configured in `tsconfig.json`):

```ts
import { Button } from "@/components/Button";
import { getUser } from "@/lib/data";
```

---

## What to Read Before Writing Code

Full docs are in `node_modules/next/dist/docs/01-app/`. Key files:

- `01-getting-started/02-project-structure.md` — file conventions
- `01-getting-started/05-server-and-client-components.md` — RSC model
- `01-getting-started/06-fetching-data.md` — data fetching
- `01-getting-started/07-mutating-data.md` — Server Functions
- `01-getting-started/08-caching.md` — `use cache` directive
- `01-getting-started/04-linking-and-navigating.md` — `<Link>`, `unstable_instant`
- `01-getting-started/11-css.md` — Tailwind 4 setup
<!-- END:nextjs-agent-rules -->
