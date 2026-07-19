# Controlled Document Approval System

A small SvelteKit app for moving documents through a controlled approval workflow
(draft → submitted → approved → published, with reject/reopen and admin archive at
any stage). Every state change is enforced by a single declarative transition map
that both the server and the UI read from, every mutation is optimistically
version-checked, and every status change is recorded in an append-only audit log
in the same database transaction as the write it describes.

## Setup

Requires **Node.js 20+** (developed and tested on Node 24).

```sh
npm install
npm run dev
```

That's it — there is no separate migration or seed step. On first connection the
app creates its SQLite schema (`data/app.db`) and seeds the 5 demo users
idempotently; both happen automatically inside `src/lib/server/db/index.ts`, and
also run before the test suite against an in-memory database. If you want to run
either step by hand instead:

```sh
npm run db:push   # apply the Drizzle schema with drizzle-kit (optional; auto-migration already does this)
npm run seed      # seed the demo users into data/app.db (optional; auto-seed already does this)
```

Open the printed local URL and log in as any of the seeded users below.

## Environment variables

Both have working defaults, so no `.env` file is required for local/dev use.
See `.env.example`.

| Variable         | Default                                   | Purpose                                                    |
| ---------------- | ------------------------------------------ | ------------------------------------------------------------ |
| `SESSION_SECRET` | a fixed dev-only string (in `auth.ts`)     | HMAC key signing the session cookie. Set a real secret for anything beyond local grading. |
| `DATABASE_PATH`  | `data/app.db`                              | Path to the SQLite file. `tests/` use an in-memory DB and ignore this. |

## Seeded users

All seeded users share the password `password123`.

| Email               | Name   | Role     |
| ------------------- | ------ | -------- |
| alice@example.com   | Alice  | author   |
| carol@example.com   | Carol  | author   |
| bob@example.com     | Bob    | reviewer |
| admin@example.com   | Admin  | admin    |
| viewer@example.com  | Viewer | viewer   |

Carol exists specifically to demonstrate that one author cannot edit another
author's draft.

## Tests

```sh
npm test
```

Runs the full Vitest suite against the service layer (`src/lib/server/documents.ts`,
`transitions.ts`, `auth.ts`), each test on a fresh in-memory SQLite database. See
`DESIGN.md` for what's covered and why.

## Project layout

- `src/lib/server/db/` — Drizzle schema, migration, connection, seed
- `src/lib/server/transitions.ts` — the workflow state machine, as data
- `src/lib/server/documents.ts` / `audit.ts` — the service layer; all mutations go
  through here, inside a single database transaction per mutation
- `src/lib/server/auth.ts` — seeded-login sessions (HMAC-signed cookie)
- `src/routes/` — pages and form actions
- `tests/` — Vitest suite
- `DESIGN.md` — design rationale and answers to the review questions
