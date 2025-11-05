# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Overview

This is the **CODEKIWI Next.js Template v1** - a production-ready Next.js 15 application with Auth.js v5, SQLite database, and shadcn/ui components. The project is designed for agentic development.

**Tech Stack:**
- Next.js 15 (App Router, Server Components, Server Actions)
- React 19
- TypeScript
- Auth.js v5 (Credentials Provider)
- SQLite (better-sqlite3)
- shadcn/ui (Radix UI components)
- Tailwind CSS 4

## Development Commands

### Starting Development Server
```bash
npm run dev
```
Note: This automatically clears any stale Next.js server processes and logs to `app.log`.

### Database Management
```bash
npm run db:reset    # Reset and recreate database tables
npm run db:seed     # Seed database with test data
npm run admin:create # Create admin user
```

Test accounts created by seed:
- Admin: `admin@example.com` / `12345678`
- User: `test@example.com` / `12345678`

### Build and Production
```bash
npm run build       # Build for production (clears processes, builds, runs after-build script)
npm start           # Start production server
npm run lint        # Run ESLint
```

## Architecture

### Domain-Driven Design Structure

The codebase follows a domain-driven architecture:

```
src/
├── app/                    # Next.js App Router pages and API routes
├── domain/                 # Domain layer (business logic)
│   └── user/
│       ├── backend/        # Server-side domain logic
│       │   ├── UserRepo.interface.ts
│       │   ├── SqliteUserRepo.ts
│       │   └── UserService.ts
│       └── types.ts        # Domain types
├── lib/                    # Shared utilities
│   ├── shared/database/    # Database connection
│   ├── auth-helpers.ts     # Server Component auth utilities
│   └── utils.ts            # General utilities
└── components/             # React components
    ├── ui/                 # shadcn/ui components
    └── auth/               # Authentication components
```

### Authentication Architecture

**Critical: Three-File Auth System**

The authentication system is split across three files due to Next.js Edge Runtime constraints:

1. **[src/auth.config.ts](src/auth.config.ts)** - Edge-compatible configuration
   - Used by middleware (Edge Runtime)
   - Contains `authorized` callback for route protection
   - NO database access allowed
   - NO bcrypt or heavy libraries
   - Controls public/private routes via `publicPaths` array

2. **[src/auth.ts](src/auth.ts)** - Full Auth.js configuration
   - Runs in Node.js runtime
   - Contains Credentials provider with `authorize` function
   - Database access via UserService
   - JWT and session callbacks
   - Partitioned cookies for cross-origin iframe support (CHIPS)

3. **[src/middleware.ts](src/middleware.ts)** - Next.js middleware
   - Exports `auth as middleware`
   - Runs on Edge Runtime
   - Uses Node.js runtime (`export const runtime = 'nodejs'`)
   - Matcher excludes static assets and API routes

**Authentication Flow:**
```
Login Request → auth.ts (Credentials authorize)
→ UserService.verifyPassword (bcrypt)
→ JWT callback (store user in token)
→ Session callback (copy token to session)
→ Client receives session
```

**Route Protection Flow:**
```
Request → middleware.ts → auth.config.ts (authorized callback)
→ Check publicPaths → Check !!auth → Allow/Redirect
```

### Session Management

**Critical: Dynamic Rendering Enforcement**

The root layout ([src/app/layout.tsx](src/app/layout.tsx)) calls `auth()` server-side to enforce dynamic rendering and prevent the "ghost session" issue where cached HTML shows authenticated state in incognito mode.

```tsx
export default async function RootLayout({ children }) {
  const session = await auth(); // Forces dynamic rendering
  return (
    <AuthSessionProvider session={session}>
      {children}
    </AuthSessionProvider>
  );
}
```

### Database Layer

**Repository Pattern with SQLite:**

- **Connection:** [src/lib/shared/database/sqlite.ts](src/lib/shared/database/sqlite.ts)
  - Singleton pattern with `getDatabase()`
  - Automatic table initialization
  - WAL mode enabled
  - Environment-specific DB paths (`.sqlite-dev` for dev, `.sqlite` for prod)

- **Repository:** `SqliteUserRepo` implements `IUserRepo`
  - Maps snake_case DB columns to camelCase TypeScript
  - Handles admin role management via separate `admins` table

- **Service:** `UserService` contains business logic
  - Password hashing with bcrypt (salt rounds: 10)
  - Email uniqueness validation
  - Admin role management

**Important: Users Schema is FIXED**
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```
This schema is Auth.js compatible and should NEVER be modified.

### Pre-built Auth Components

**Server-Side Utilities** ([src/lib/auth-helpers.ts](src/lib/auth-helpers.ts)):
- `requireAuth(redirectTo?)` - Protect routes (Server Components)
- `requireAdmin(redirectTo?)` - Admin-only routes
- `checkIsAdmin()` - Check admin status without redirect

**Client Components:**
- `<SignedIn>` - Show content only to authenticated users
- `<SignedOut>` - Show content only to unauthenticated users
- `<AdminOnly>` - Show content only to admins
- `<SignInButton>` - Navigates to `/login`
- `<UserButton>` - User avatar with logout dropdown

### Pre-built Pages

- **[/login](src/app/login/page.tsx)** - Glassmorphism login form
- **[/signup](src/app/signup/page.tsx)** - Glassmorphism signup form
- **[/codekiwi-dashboard](src/app/codekiwi-dashboard/page.tsx)** - Development dashboard (delete before production)

## Auth.js v5 Implementation Details

### Cross-Origin Support

**CHIPS (Cookies Having Independent Partitioned State):**

All auth cookies have `partitioned: true` and `sameSite: "none"` to support embedding in iframes across different domains (required for e2b.app integration).

### Domain Policy (Production)

For production deployments:
- Enforce single canonical domain (e.g., www.codekiwi.ai)
- Redirect non-www to www using `next.config.ts` redirects
- Prevents cookie collision between www/non-www variants

## Common Tasks

### Adding a Public Route

Edit [src/auth.config.ts](src/auth.config.ts):
```typescript
const publicPaths = [
  '/',
  '/login',
  '/signup',
  '/your-new-page',  // Add here
]
```

### Creating Admin-Only Pages

**Option A - Server Component:**
```typescript
import { requireAdmin } from '@/lib/auth-helpers'

export default async function AdminPage() {
  await requireAdmin(); // Redirects if not admin
  return <div>Admin content</div>
}
```

**Option B - Client Component:**
```typescript
import { AdminOnly } from '@/components/auth/AdminOnly'

export default function AdminPage() {
  return <AdminOnly><div>Admin content</div></AdminOnly>
}
```

### Accessing Current User

**Server Component:**
```typescript
import { auth } from '@/auth'

const session = await auth()
if (session) {
  console.log(session.user.email, session.user.isAdmin)
}
```

**Client Component:**
```typescript
'use client'
import { useSession } from 'next-auth/react'

const { data: session, status } = useSession()
```

### Extending Session Data

1. Update [src/domain/user/types.ts](src/domain/user/types.ts) - `SessionUser` interface
2. Update [src/auth.ts](src/auth.ts) - Return new fields in `authorize` function
3. TypeScript will enforce the changes through module augmentation

## Edge Runtime Constraints

**Never in Edge Runtime (middleware.ts or auth.config.ts):**
- ❌ Database connections
- ❌ `bcrypt` or heavy crypto
- ❌ Node.js-specific APIs (fs, crypto, etc.)

**Safe locations for these:**
- ✅ [src/auth.ts](src/auth.ts) `authorize` function
- ✅ API routes ([src/app/api/](src/app/api/))
- ✅ Server Actions
- ✅ Server Components

## Cross-Origin Configuration

**Next.js Config** ([next.config.ts](next.config.ts)):
- `serverActions.allowedOrigins`: `['*.e2b.app', '*.e2b.dev']`
- CSP headers: `frame-ancestors 'self' *` (allows iframe embedding)
- Remote image patterns configured for Unsplash

## Project Guidelines

### Task Management System

This project uses a custom task management system with YAML-based task definitions. Guidelines are located in:
- [.opencode/guideline/add-task.md](.opencode/guideline/add-task.md)
- [.opencode/guideline/edit-task.md](.opencode/guideline/edit-task.md)

When adding features, follow the User Story → Acceptance Criteria → Uncertainty resolution workflow.

### Development Dashboard

The `/codekiwi-dashboard` route provides a development-time dashboard. Remove this before production deployment.

## Important Notes

1. **Database Location:** Dev DB is in `.sqlite-dev/`, production in `.sqlite/` (both gitignored)
2. **Auth Session Provider:** All pages are wrapped in `<AuthSessionProvider>` via root layout
3. **Script Automation:** Build and dev scripts automatically clear stale Next.js processes
4. **Storage Access:** [src/lib/storage-access.ts](src/lib/storage-access.ts) handles Storage Access API for cross-origin scenarios
5. **Middleware Matcher:** Excludes static assets, `_next/*`, and `favicon.ico` from auth checks
