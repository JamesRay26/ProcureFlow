# ProcureFlow: Project Memory & Anti-Hallucination Rules

*This file acts as the persistent "brain" for this project. Any AI assistant working in this repository MUST read and adhere to these rules to prevent hallucinations and maintain perfect context.*

## 1. Project Context & Identity
- **Project Name:** ProcureFlow Enterprise
- **Type:** B2B Enterprise Procurement & Inventory Management Platform.
- **Role/Persona:** We are a 4-person software agency (PM, Frontend, Backend, DevOps). Always use "we" instead of "I".
- **Tech Stack:** Next.js 14 (App Router), React Server Components (RSC), Tailwind CSS, Prisma ORM, SQLite (local `dev.db`), NextAuth.js (Google OAuth), Vitest.
- **Current Active Branch:** `feature/readme-update`
- **Port Standard:** Port `3001` (`npx next dev -p 3001`) to match Google Cloud Console OAuth callback URI. Prisma Studio runs on port `5555`.

## 2. Strict Anti-Hallucination Rules
To ensure smooth, bug-free conversations, the AI MUST follow these constraints:
1. **Never guess the schema:** Before writing any database queries, physically check `prisma/schema.prisma`.
2. **Never hallucinate packages:** Do not suggest or import npm packages that are not explicitly listed in `package.json`.
3. **Strict Type Safety (The "Zero-Any" Rule):** Do NOT use `any` types. We secured 100/100 on our Lab Defense for strict TypeScript interfaces. Use `unknown` or define proper `Record` / `Array` types if absolutely necessary.
4. **Component Colocation:** All shared UI components MUST be placed inside the `src/app/_components` private folder. Do not create a generic `src/components` folder.
5. **REST vs Server Actions:** Use Next.js Server Actions (in `src/app/actions.ts`) for database mutations. Use standard API routes (`src/app/api/...`) ONLY when strict HTTP status codes (200/400) are required for external connectivity.

## 3. Test Accounts & Role-Based Access Control (RBAC)
Configured in `prisma/seed.ts` (Password for all: `password123`):
- **System Administrator:** `admin@procureflow.com` (Role: `ADMIN`) — **James Ray Gemilga**
  - Responsibilities: Manage Team (`/dashboard/team`), Settings (`/dashboard/settings`), workspace invitations.
  - Constraint: Restricted from approving procurement requests without assigned role (**TC-RBAC-03**: Separation of Duties).
- **Procurement Manager:** `manager@procureflow.com` (Role: `PROCUREMENT_MANAGER`) — **Danielle Kylle Espiritu**
  - Responsibilities: Sole authority to Approve (**TC-RW-03**), Reject with required reason (**TC-RW-04**), and Return for Correction with notes (**TC-RW-05**).
- **Warehouse Staff:** `staff@procureflow.com` (Role: `WAREHOUSE_STAFF`) — **Jaylord Deloy**
  - Responsibilities: View inventory, create restocking requests (**TC-RW-01/02**), edit requests in `PENDING` or `RETURNED` status.
  - Constraint: Blocked from approval queue in UI, Server Actions, and direct URL navigation (**TC-RBAC-01**, **TC-RBAC-04** 403 Forbidden screen).
- **Compliance Auditor:** `auditor@procureflow.com` (Role: `AUDITOR`) — **Orlian Digap**
  - Responsibilities: Read-Only inspection across all modules (**TC-RBAC-02**). Can view all records and Audit Trail (**TC-AUD-01 to 03**), but creation, editing, and approval buttons are locked.

- **Currency Standard:** Philippine Peso (`₱` / PHP) across all dashboards, budget caps, and price estimates.

### Testing & Grading Helpers:
1. **Login Page 1-Click Fill (`src/app/page.tsx`):** 4 quick-fill buttons for Admin, Manager, Staff, Auditor.
2. **Top Bar Role Switcher (`src/app/_components/TopHeaderNav.tsx`):** Instant test account switching from the user profile dropdown without signing out.

## 4. Completed Features & User Stories Matrix (RBAC.docx & Week 7 Audit)
- **TC-RBAC-01:** Warehouse Staff blocked from approving or rejecting requests.
- **TC-RBAC-02:** Auditor provided strictly read-only inspection access; mutations locked.
- **TC-RBAC-03:** Administrator restricted from approving requests (Separation of Duties).
- **TC-RBAC-04:** Warehouse Staff blocked from direct URL access (`/dashboard/approvals`) with a dedicated 403 screen.
- **TC-RW-01:** Valid restocking request created with initial `PENDING` status.
- **TC-RW-02:** Required fields validated through Zod runtime boundaries (`src/lib/validations.ts`).
- **TC-RW-03:** Procurement Manager approval sets status to `APPROVED`, increments stock, dispatches logistics, and records audit log.
- **TC-RW-04:** Rejection requires recorded reason notes from Manager. Status becomes `REJECTED`.
- **TC-RW-05:** Manager can return for correction with instructions (`RETURNED`). Requester can edit and resubmit, returning status to `PENDING`. Once accepted (`APPROVED` or `REJECTED`), orders are permanently locked against alteration.
- **TC-AUD-01 & TC-AUD-02:** Audit Trail records creation and status change history with user, previous status, new status, IP, and timestamp.
- **TC-AUD-03:** Audit records are append-only and permanently immutable.
- **TC-TXN-01 to TC-TXN-03:** Atomic transactions prevent over-allocation, process simultaneous allocations safely, and reject duplicate processing (Idempotency).
- **TC-ERR-01 & TC-ERR-02:** Transaction rollbacks on failure prevent partial or corrupted database records.
- **Digos City E-Commerce Parcel Tracking & Barcode Scan Simulator (`TrackingMapClient.tsx` & `TrackingClient.tsx`):**
  - Interactive Leaflet polyline transit route connecting Santa Cruz Logistics Depot -> Digos North Sorting Hub -> Quezon Avenue Corridor -> Digos City Central Warehouse.
  - Animated delivery vehicle marker with speed/simulation controls and Stock Anticipation Radar.
  - **Sorting Center Barcode & Tracking ID Scan Simulator**:
    - Replaced static checkpoint buttons with an enterprise optical barcode scanner terminal.
    - Code 128 SVG barcode display with laser sweep animation (`@keyframes laserSweep` in `globals.css`).
    - Handheld scanner audio feedback (950Hz confirmation beep via Web Audio API).
    - Advances carrier location smoothly on the Leaflet map and recenters viewport.
    - Updates database shipment scans via `scanShipmentCheckpoint` Server Action.
    - Handheld barcode gun input emulation with Enter key submit.
    - Quick "Reset Route Demo" button for repeatable presentations.
    - Strict RBAC compliance: Auditors locked in Read-Only inspection mode (**TC-RBAC-02**).
- **Automated Restocking Pipeline (`InventoryClient.tsx` & `page.tsx`):**
  - Items below threshold with active requests display clickable `Req #... Pending` badges with direct links to approval queue.
  - Items without requests offer 1-click automated restock triggers with optimal batch quantity calculations.
- **Presentation Dataset (`prisma/seed.ts`):**
  - Pristine, enterprise-grade presentation dataset with 18 items across 5 categories and 3 regional warehouses (`Digos City Central HQ`, `Santa Cruz Regional Depot`, `Davao South Logistics Hub`).
  - **10 Realistic Requests Across All Workflow States:**
    - **In-Transit Shipments for Live Tracking Demo:**
      - `CHR-AERO-03` (AeroMesh Chairs) in-transit at **Stop 2** (Digos North Sorting Hub) -> Ready for Barcode Scanner demo.
      - `SWT-CISCO-10` (Cisco Catalyst Switches) in-transit at **Stop 3** (Quezon Avenue Corridor) -> Approaching Destination.
      - `UPS-APC-11` (APC Smart-UPS Backup) fully delivered at **Stop 4** (Central Receiving Bay 3).
    - **Pending Approvals Queue for Manager Demo:**
      - `DSK-STAND-02` (Dual-Motor Standing Desk, Out of Stock 0/40) -> High priority onboarding order.
      - `SRV-RACK-09` (42U Enterprise Server Rack Enclosure) -> High priority data center order.
      - `DOC-THINK-14` (Lenovo ThinkPad Workstation Dock) -> Medium priority developer deployment.
    - **Returned for Correction for Staff Revision Demo (TC-RW-05):**
      - `PRNT-HP-04` (HP Color LaserJet Pro) -> Bay storage limit feedback notes.
      - `FAC-SPILL-16` (55-Gallon Chemical Spill Kit) -> Missing Hazmat MSDS documentation notes.
    - **Rejected with Reason for Auditor Review Demo (TC-RW-04):**
      - `MON-DELL-05` (Dell UltraSharp 4K Monitor) -> Exceeds quarterly electronics budget cap (`₱750,000 threshold`).
      - `FBR-OPT-15` (10G Fiber Patch Cable) -> Sufficient stock buffer (85 units in stock).
    - **Unrequested Items for 1-Click Auto Restock Demo:**
      - `LOG-SCAN-01` (Barcode Scanner Terminal, 12/15)
      - `SFT-GLV-12` (Kevlar Gloves, 6/20)
      - `TBL-CONF-17` (Boardroom Table, 1/2)
- **Automated Vitest Test Suite (`npm test`):**
  - 18/18 unit and integration tests passing (`src/tests/`).
  - Zero TypeScript errors (`npx tsc --noEmit: Clean`).

## 5. Startup Commands Reference
```powershell
# 1. Start Web App (Port 3001)
cd c:\Users\GEMILGA\Documents\FullStack\procureflow-app
npx next dev -p 3001

# 2. Start Prisma Studio (Database GUI on Port 5555)
cd c:\Users\GEMILGA\Documents\FullStack\procureflow-app
npx prisma studio

# 3. Run Automated RBAC Test Suite
cd c:\Users\GEMILGA\Documents\FullStack\procureflow-app
npm test

# 4. Re-Seed Database (If needed)
cd c:\Users\GEMILGA\Documents\FullStack\procureflow-app
npx tsx prisma/seed.ts
```
