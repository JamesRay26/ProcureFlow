# ProcureFlow: Project Memory & Anti-Hallucination Rules

*This file acts as the persistent "brain" for this project. Any AI assistant working in this repository MUST read and adhere to these rules to prevent hallucinations and maintain perfect context.*

## 1. Project Context & Identity
- **Project Name:** ProcureFlow
- **Type:** B2B Enterprise Procurement & Inventory Management Platform.
- **Role/Persona:** We are a 4-person software agency (PM, Frontend, Backend, DevOps). Always use "we" instead of "I".
- **Tech Stack:** Next.js 14 (App Router), React Server Components (RSC), Tailwind CSS, Prisma ORM, SQLite (local `dev.db`), NextAuth.js (Google OAuth).

## 2. Strict Anti-Hallucination Rules
To ensure smooth, bug-free conversations, the AI MUST follow these constraints:
1. **Never guess the schema:** Before writing any database queries, physically check `prisma/schema.prisma`.
2. **Never hallucinate packages:** Do not suggest or import npm packages that are not explicitly listed in `package.json`.
3. **Strict Type Safety (The "Zero-Any" Rule):** Do NOT use `any` types. We secured 100/100 on our Lab Defense for strict TypeScript interfaces. Use `unknown` or define proper `Record` / `Array` types if absolutely necessary.
4. **Component Colocation:** All shared UI components MUST be placed inside the `src/app/_components` private folder. Do not create a generic `src/components` folder.
5. **REST vs Server Actions:** Use Next.js Server Actions (in `src/app/actions.ts`) for database mutations. Use standard API routes (`src/app/api/...`) ONLY when strict HTTP status codes (200/400) are required for external connectivity.

## 3. Currently Completed Features (As of Oct 2026)
- **DevOps:** GitHub Branch Protection enabled, Dockerized (`Dockerfile` & `docker-compose.yml`), CI/CD Vitest pipeline active.
- **Frontend UI:** Component-driven dashboard, WCAG 2.1 AA `*:focus-visible` global keyboard rings in `globals.css`.
- **Top Header (`TopHeaderNav.tsx`):** Functional interactive Notification Bell (stock alerts, approvals, mark-as-read, clear) and System Admin dropdown menu (profile info, quick links, sign out).
- **Inventory Page (`InventoryClient.tsx`):** Working "Export CSV" with dynamic formatted download, real-time status filtering (All, In Stock, Low Stock, Out of Stock), category/warehouse filters, and live search.
- **E-Commerce Route Tracking & Stock Anticipation (`TrackingMapClient.tsx`):** 
  - Interactive Leaflet polyline transit route connecting origin warehouse -> sorting hub -> en-route corridor -> destination bay.
  - Animated delivery truck marker with vehicle fleet info and "Simulate Transit" progression.
  - Vertical milestone checkpoint timeline with live status badges.
  - **Stock Anticipation Radar:** Real-time calculation and alert showing incoming units, current stock, anticipated stock, and threshold safety health.
  - **Localization & GPS Tracking:** Localized to **Digos City, Davao del Sur** with authentic regional checkpoints (Santa Cruz Logistics Depot -> Digos North Sorting Hub -> Quezon Avenue Corridor -> Digos City Central Warehouse).
- **Approval Queue (`ApprovalsClient.tsx`):** Dynamic working filter tabs (All, Pending, Returned) with live badge counts and search filter. Shows approval decisions and status badges for reviewed requests.
- **Core Functionality:** 
  - Item Creation & Restocking Requests via `FormData`.
  - Editable requests when PENDING; automatically locked and protected against alteration once APPROVED/REJECTED.
  - Multi-Tenancy database (all queries must include `where: { organizationId: user.organizationId }`).
- **Week 7 Backend & Database Lead Audit Compliance:**
  - **B-Tree Indexing & Left-Prefix Rules:** `@@index` added to all foreign keys across `User`, `Invitation`, `InventoryItem`, `Request`, and `AuditLog`, plus compound indexes (`@@index([organizationId, stock])` and `@@index([organizationId, status])`).
  - **Migration Pipeline:** Official human-readable SQL migration script generated at `prisma/migrations/20261014000000_week_7_backend_lead_audit/migration.sql`.
  - **Idempotent Data Seeding:** Configured `prisma/seed.ts` in `package.json` (`"seed": "npx tsx prisma/seed.ts"`) using upsert patterns to eliminate primary key collisions.
  - **Connection Pool Hygiene:** Global Prisma Singleton Pattern implemented in `src/lib/prisma.ts` using `globalThis` to prevent HMR connection leaks.
  - **Runtime Validation Boundaries (Zod):** Implemented in `src/lib/validations.ts` and integrated via `schema.safeParse()` across all backend Server Actions in `src/app/actions.ts`.
  - **ACID Transactional Integrity & Eager Loading:** All multi-table mutations wrapped in `prisma.$transaction`, with eager loading (`include`) to completely eliminate N+1 query execution loops.

## 4. Operational Instructions for the AI
- **Always update this file:** If a major new feature, database model, or architectural rule is added, the AI must proactively update this `GEMINI.md` file to keep the memory fresh.
- **Port Management:** The development server must run on port `3001` (`npx next dev -p 3001`) to match the Google Cloud Console redirect URI for NextAuth.
