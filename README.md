# Student Management System — Registry Module

PEN Global technical assessment: focused Registry workflows on **Next.js (App Router)**, **PostgreSQL**, and **Prisma**. Mutations use **Server Actions** (no separate API framework). One Route Handler serves file downloads.

Two audiences share one app: Registry staff who keep the records, and students who
read their own. Both get a responsive interface with light and dark themes.

## Requirements

- Node.js 20+
- Docker (for local Postgres) or any PostgreSQL instance
- pnpm 11+ (`corepack enable pnpm`)
- GNU Make (optional — for the `make` shortcuts below)

## Quick start

```bash
make dev
```

That is the whole thing. It writes `.env` if missing, starts Postgres and waits
until it accepts connections, installs dependencies, generates the Prisma client,
applies migrations, and runs the dev server on
[http://localhost:3000](http://localhost:3000).

Add demo data on a fresh database with `make setup` (same steps, plus a seed, and
it stops before the server). Override the port with `make dev PORT=4000`.

<details>
<summary>Without Make</summary>

```bash
docker compose up -d --wait
pnpm install
cp .env.example .env
# Default local URL (matches docker-compose.yml):
# DATABASE_URL="postgresql://sms:sms@localhost:5432/sms?schema=public"
pnpm prisma migrate deploy
pnpm db:seed
pnpm dev
```

</details>

### Demo role toggle

Use the **Registry staff** / **Student** buttons under "Viewing as" at the foot of the sidebar (auth is intentionally a toggle). On small screens they are inside the navigation drawer.

In Student view, pick a seeded student and click **Switch student**.

Appearance (light / match system / dark) sits directly below.

## `.env` variables

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string, used by both Prisma Migrate (`prisma.config.ts`) and the runtime driver adapter |

See `.env.example`. Never commit real credentials.

## What was built

1. **Student enrolment** — create/edit/list/search; auto `SMS-YYYY-NNNN` IDs; statuses Enrolled / Deferred / Withdrawn / Completed
2. **Fees & payments** — programme fee snapshot; payments with unique references; live outstanding balance; overdue flags on the Registry dashboard
3. **Assessment submission** — staff create assessments; students upload PDF/DOCX; one submission per student; resubmit before deadline; late flagged
4. **Marksheet & results** — grades 0–100; Pass ≥ 40 / Merit ≥ 60 / Distinction ≥ 70; publish/withhold per student; students see Pending until published
5. **Interface** — staff and student shells, light/dark themes, and a layout that works from 390px up (see [Interface](#interface))

## Interface

### The measured rule

Every figure in the app that has a scale is drawn on the same primitive
(`components/ui/meter.tsx`): a grade against the 40 / 60 / 70 classification
thresholds, a fee against what has been paid, a cohort against its statuses,
marking progress against what is published. One device, used consistently, so a
bar means the same thing wherever it appears.

Classification rank is carried by weight rather than hue — a distinction fills its
chip, a merit tints it — which keeps the palette free to mean status only.

### Theme

`data-theme` on `<html>`, set by a synchronous inline script in `<head>` before
first paint, so there is no flash of the wrong theme. The toggle is three-way:
Light / Match system / Dark, persisted in `localStorage` and read through
`useSyncExternalStore` so the server's guess and the browser's real preference
never collide during hydration.

Colour lives entirely in tokens defined once in `app/globals.css` (`--canvas`,
`--surface`, `--ink`, `--brand`, `--caution`, `--negative`, …) and mapped to
Tailwind via `@theme inline`. Components reference `bg-surface` or `text-ink`,
never a raw palette value, so neither theme can drift.

### Type

| Role | Face | Used for |
| --- | --- | --- |
| Display | Libre Caslon Text | Page and card headings |
| UI | Public Sans | Body, labels, controls |
| Record | IBM Plex Mono | Student IDs, module codes, payment references |

### Responsive

- Sidebar from `lg` up; below that a sticky bar with a slide-in drawer
- Wide tables become card lists below `md` (or `sm`) rather than scrolling sideways
- Verified with a layout probe at 390px on every page: no horizontal overflow

## Product decisions

- Fee amount is snapshotted at enrolment; changing programme default fee does not rewrite existing students
- Overdue = outstanding &gt; 0 and `now` &gt; `feeDueDate` (academic-year start 1 Sep + 90 days)
- Payments cannot exceed outstanding balance
- Deferred/Withdrawn students keep fee history (no auto write-off)
- Late submissions accepted after deadline; resubmission blocked after deadline
- Files stored under `uploads/` (gitignored), max 10 MB

## Seed data

`make seed` (or `pnpm db:seed`) loads:

- 2 programmes (BSc CS, MBA)
- 5 students across statuses
- Mix of paid / partial / overdue balances
- 2 assessments (open + past deadline)
- On-time and late submissions
- Published and withheld grades

Reset with:

```bash
make reset
```

## Project structure

```
app/                 Routes (App Router) + Server Actions in app/actions/
components/          Composed UI: app shell, page header, stats, meters, forms
components/ui/       Primitives: button, card, badge, input, select, table, meter
lib/                 Domain logic: fees, classification, role/session, theme, utils
prisma/              Schema, migrations, seed
prisma.config.ts     Prisma 7 config: schema path, migrations path, seed command
```

## Make targets

`make help` lists them all. The ones you need day to day:

| Target | Purpose |
| --- | --- |
| `make dev` | Everything: database, deps, schema, dev server |
| `make setup` | Same, plus seed, without starting the server |
| `make check` | Typecheck, lint and production build |
| `make migrate-create` | Create a migration from schema changes |
| `make reset` | Drop, re-migrate and re-seed |
| `make psql` / `make studio` | Query the dev database |
| `make down` | Stop Postgres (data kept) |

Each wraps a pnpm script, so `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm lint`,
`pnpm db:seed` and `pnpm db:reset` still work directly.

## AI usage

Claude Code was used throughout: scaffolding the Next.js App Router app, Prisma schema/migrations/seed, Server Actions and the Staff/Student UI from the technical assessment brief and `PLAN.md`; then the interface design (tokens, theming, responsive shell, the meter primitive), the pnpm migration, the Prisma 7 upgrade, and the Makefile.

**Human ownership** covered product decisions (fee snapshot, overdue rule, late vs resubmit), checklist tracking, and verifying migrate/seed/`next build`. AI output was reviewed for role guards (students must not mutate enrolment/fees/grades) and for ensuring unpublished grades never appear on the student marksheet.

## Stack notes

- App lives at repo root (`app/`, `lib/`, `components/`) — no `src/` folder
- Styling: Tailwind CSS v4, token-driven, with lightweight in-repo UI primitives (no component library dependency)
- Prisma 7 + PostgreSQL 16 (Docker Compose). Prisma 7 moved the connection URL out of `schema.prisma`: Migrate reads it from `prisma.config.ts`, and the app connects at runtime through the `@prisma/adapter-pg` driver adapter in `lib/prisma.ts`
- Two dependencies are deliberately held one major behind, both capped by `eslint-config-next@16.3.1`:
  - **TypeScript 6**, because `typescript-eslint` refuses to load under TypeScript 7
  - **ESLint 9**, because `eslint-plugin-react` peers at `^9.7` and crashes on ESLint 10

  Everything else is on latest. Both lift when Next ships an updated lint config.
