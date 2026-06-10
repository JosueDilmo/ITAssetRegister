# IT Asset Register

**IT Asset Register** is an internal full-stack web application for managing IT assets and staff assignments, with an integrated support ticketing system powered by email ingestion.

## Why This Project?

As the sole IT department employee, I needed a proper management system — not Excel sheets. This app provides full accountability, an audit trail for every change, and a support desk workflow, all in one place.

---

## Features

### Asset Management
- Create, edit, and list IT assets.
- Track serial number, asset number, type, status, condition, purchase date, assignment dates, and notes.
- Assign and unassign assets to staff with full history tracking.
- Reassignment confirmation flow to prevent accidental reassignments.

### Staff Management
- Create, edit, and list staff members.
- Track name, email, department, job title, status, and notes.
- View complete asset history and changelog per staff member.

### Assignment & History
- Atomic assign/unassign operations update both asset and staff records in a single transaction.
- Append-only history — no record is ever overwritten or deleted.
- Change logs capture who changed what and when for both assets and staff.

### Support Ticket System
- **Email ingestion** — tickets are created automatically when staff email the IT support address.
- **Email reply detection** — replies containing a `TKT-XXXX` reference in the subject add a comment to the existing ticket instead of creating a duplicate.
- **Confirmation emails** — requester receives an automated confirmation with their ticket reference and a tracking link.
- **SharePoint attachment uploads** — email attachments are uploaded to a per-ticket SharePoint folder via Microsoft Graph; inline images are annotated in the ticket description.
- **Kanban board** (admin only) — drag-and-drop style board for triaging and managing all tickets by status.
- **Self-service portal** (`/support`) — staff can view their own submitted tickets and read agent responses.
- **Ticket detail pages** — full thread view with comments from both agents and email replies.
- **Priority and status tracking** — NEW, IN PROGRESS, RESOLVED, CLOSED with priority levels.
- **Comment system** — agents can add internal or public comments; email replies are recorded as comments automatically.

### Authentication & Authorization
- Sign-in via **Microsoft Entra ID** (Azure AD) — organisation emails only.
- Role-based access: `admin` (full access) and `viewer` (read-only).
- Role enforcement in both frontend UI and backend route guards.

### Audit Trails
- Every change to an asset or staff record is logged with timestamp, actor, and the specific fields changed.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend runtime** | Node.js + TypeScript |
| **Backend framework** | Fastify 5 |
| **ORM** | Drizzle ORM |
| **Database** | PostgreSQL |
| **Validation** | Zod (via `fastify-type-provider-zod`) |
| **API contract** | OpenAPI / Swagger (auto-generated) |
| **API client** | Orval (generates `web/src/http/api.ts` from OpenAPI) |
| **Frontend framework** | Next.js 15 (App Router) |
| **UI library** | React 19 |
| **Styling** | Tailwind CSS v4 |
| **Forms** | React Hook Form + Zod |
| **Auth** | next-auth v5 beta — Microsoft Entra ID provider |
| **Email & files** | Microsoft Graph API (send mail + SharePoint uploads) |
| **Linting / formatting** | Biome |
| **Testing** | Vitest |

---

## Project Structure

```
ITAssetRegister/
├── server/          # Fastify backend
│   └── src/
│       ├── features/
│       │   ├── assets/       # Asset CRUD + services
│       │   ├── staff/        # Staff CRUD + services
│       │   ├── assignments/  # Assign / unassign logic
│       │   └── tickets/      # Email ingest, CRUD, comments
│       ├── drizzle/
│       │   └── schema/       # DB table definitions
│       ├── shared/
│       │   └── services/     # Graph mail + SharePoint clients
│       └── server.ts         # Fastify bootstrap
└── web/             # Next.js frontend
    └── src/
        ├── app/
        │   └── (project)/
        │       ├── manager/   # Admin dashboard
        │       ├── tickets/   # Kanban board (admin)
        │       └── support/   # Self-service portal (all staff)
        ├── features/          # Feature-colocated components
        └── http/api.ts        # Generated — do not edit
```

---

## Data Integrity

- **Append-only history** — asset and staff history records are never overwritten.
- **Atomic transactions** — assignment/removal updates both sides in a single DB transaction.
- **Server-side validation** — Zod schemas enforce all input at the API boundary.
- **Role-gated mutations** — write operations are guarded in both frontend and backend.

---

## Developer Setup

### Prerequisites

- Node.js (LTS)
- PostgreSQL
- Microsoft Entra ID app registration (for auth)
- Microsoft Graph app registration (for email ingest + SharePoint uploads)

### Environment

Copy and fill in the environment files:

```bash
# server/
cp server/.env.example server/.env

# web/
cp web/.env.local.example web/.env.local
```

### Commands

| Task | Command | Directory |
|---|---|---|
| Backend dev (watch) | `npm run dev` | `server/` |
| Backend build | `npm run build` | `server/` |
| Backend start | `npm run start` | `server/` |
| DB generate migration | `npm run db:generate` | `server/` |
| DB migrate | `npm run db:migrate` | `server/` |
| DB studio | `npm run db:studio` | `server/` |
| Run tests | `npm run test` | `server/` |
| Frontend dev | `npm run dev` | `web/` |
| Frontend build | `npm run build` | `web/` |
| Frontend start | `npm run start` | `web/` |
| Regenerate API client | `npx orval` | `web/` |

> After any backend route or schema change, regenerate the API client with `npx orval` in `web/`.

---

## Testing

Backend unit and integration tests are written with **Vitest**. Run them from `server/`:

```bash
npm run test          # run once
npm run test:watch    # watch mode
npm run test:coverage # coverage report
```

---

## Deployment (Internal Windows Server)

### Prerequisites

- Windows Server with IIS, Application Request Routing (ARR), and URL Rewrite modules
- Node.js LTS
- PostgreSQL (local or remote)
- Internal DNS entry (e.g. `itassetregister.company.local`)
- Firewall rules: ports 80, 443, 3333

### Steps

1. **Build both packages** on your dev machine:
   ```bash
   cd server && npm run build
   cd web    && npm run build
   ```

2. **Copy output to the server:**
   - `server/dist/` → server machine backend folder
   - `web/.next/standalone/`, `web/public/`, config files → server machine web folder

3. **Configure IIS:**
   - Site pointing to the web folder
   - HTTP (80) + HTTPS (443) bindings for your DNS name
   - Self-signed certificate on the HTTPS binding
   - ARR + URL Rewrite rule proxying all traffic to `http://localhost:3000/{R:0}`
   - Add a separate reverse-proxy rule forwarding `/api/*` to `http://localhost:3333/api/{R:0}`

4. **Configure internal DNS:** A record for your hostname pointing to the server IP.

5. **Start the apps on the server:**
   ```bash
   # backend
   cd server && npm run start

   # frontend
   cd web && node .next/standalone/server.js
   ```

6. **Test:** Visit `https://itassetregister.company.local` and sign in with a Microsoft Entra ID account.

> See [SETUP.md](SETUP.md) and [WINDOWS_AUTOSTART.md](WINDOWS_AUTOSTART.md) for full runbook and autostart configuration.

---

## Contributing

Open an issue or pull request to discuss any changes.

## License

Intended for internal use. License details to be determined.

---

*Developed by [JosueDilmo](https://github.com/JosueDilmo) for internal management.*
