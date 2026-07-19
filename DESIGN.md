# Design

## 1. Most important invariants

- A document's status changes only through the transition map in
  `transitions.ts` — no other code path writes `status`.
- Every state change commits atomically with its audit event: the `UPDATE`
  and `INSERT` happen inside one `better-sqlite3` transaction, so a crash or
  thrown error between them leaves neither behind.
- `version` only increases; a mutation is rejected if the caller's
  `expectedVersion` doesn't match what's actually stored.
- Viewers can never read a non-published document, in listings or by direct
  ID (a disallowed ID returns 404, not 403, so existence isn't leaked).
- The audit log is append-only: `audit.ts` only ever `insert`s, never
  `update`s or `delete`s.

## 2. DB-enforced vs. app-enforced

The database enforces shape: `NOT NULL`, a `CHECK` constraint restricting
`status`/`role`/`action` to their known enum values, and foreign keys from
`documents.owner_id` and `audit_events.document_id`/`actor_id`. The
application enforces everything that depends on *who* is asking and *what
else is true right now*: transition legality for the current status, role +
ownership together, the reject-requires-comment rule, and read-scoping by
role. SQLite has no row-level security, so "a viewer may only read published
rows" is necessarily an app-level `WHERE`, applied identically in the list
query and the single-document loader. In Postgres, some of this could move
further down — row-level security policies, or a trigger rejecting illegal
status transitions — but here it all lives in `transitions.ts`.

## 3. Permissions design

`transitions.ts` exports one `TRANSITIONS` map keyed by action, each entry
carrying its `from` status (or statuses, for `archive`), its `to` status, and
an `allowed(ctx)` predicate over `{ user, doc }`. `availableActions(user, doc)`
filters that map to what's currently legal, and is called from both the page
load function (which buttons to render) and, via the same map, from
`transition()` (what to actually allow). There's no second, separately
maintained list of "what reviewers can do" — UI and server enforcement read
the same data, so they can't drift. Read permissions are a smaller, separate
set of rules (`canRead` / `listDocumentsForUser`), applied server-side in
every load function; hiding a button never substitutes for a server check.

## 4. Handling stale updates

Every document has a `version` column. Every mutating form carries a hidden
`expectedVersion` taken from the page the user is looking at. `transition()`
and `editDocument()` compare `doc.version` to `expectedVersion` inside the
transaction, right after loading the row and before any other check (see
below for why it's first). A mismatch throws `VersionConflictError` → HTTP
409. The document page renders a conflict banner whenever the last action
failed with `conflict: true`; since SvelteKit reruns `load` after a failed
action, the rest of the page already shows the fresh state alongside it.

One deliberate ordering choice: version is checked *before* transition
legality. If two writes race — A approves a submitted doc, then B tries to
reject it using the version they both loaded — by the time B's write runs
the document is no longer `submitted`, so "check legality first" would
report `InvalidTransitionError` ("cannot reject a document in status
'approved'"), which is true but misleading: B's real problem is stale data.
Checking version first means any stale write is reported as a conflict,
consistently, regardless of what the document turned into meanwhile.

## 5. Audit consistency

`documents.ts` never calls `tx.update(documents)` without also calling
`insertAuditEvent(tx, ...)` inside the same `db.transaction(...)` callback.
Since both run against the same `tx` handle inside `better-sqlite3`'s
synchronous transaction wrapper, a thrown error anywhere in the callback —
including from the audit insert itself — rolls back the whole transaction.
`tests/atomicity.test.ts` proves this: it mocks `insertAuditEvent` to throw,
calls `transition()`, and asserts the document's status/version are
unchanged — the status `UPDATE` just before the mocked throw is rolled back
with everything else.

## 6. Failure cases considered

Concurrent approve/reject on the same document (§4); a crash or exception
between the status write and the audit write (§5); a client bypassing the UI
and calling an action directly (every check re-runs server-side regardless of
what buttons were rendered); an empty/whitespace reject comment; a viewer
guessing a draft's URL (404, not listed, not 403); double-submitting the same
mutation (the resubmission's `expectedVersion` is now stale, so it 409s
rather than double-applying); and archiving from every valid source status
while rejecting it from non-admins or from `archived` itself (archive isn't
in its own `from` list, so it's a true absorbing state).

## 7. With more time

Real auth (e.g. Better Auth) instead of a shared demo password; Postgres
instead of SQLite, with `SELECT ... FOR UPDATE` for pessimistic locking under
higher write concurrency; versioned content snapshots so the audit log
captures *what* changed in an edit, not just that one happened; a
restore-from-archive flow (one-way by design here); pagination once document
counts grow; and Playwright tests over the actual form flows, not just the
service layer.

## 8. Production changes

Postgres with pooled connections instead of a single `better-sqlite3` file; a
real session store or auth provider instead of an HMAC cookie holding a user
ID; a `role_assignments` table instead of one enum column, if roles need to
get more granular; structured logging/tracing around the transition/audit
path specifically, since that's where correctness matters most; rate
limiting on mutation endpoints; a real migrations pipeline (drizzle-kit
generate + migrate, checked in) instead of the idempotent
`CREATE TABLE IF NOT EXISTS` used here for zero-friction local setup; and a
real secrets manager instead of a checked-in dev session secret.

## Judgment calls

- **Audit history visibility**: viewers can see history for documents they
  can already read (published ones), via the same authorization check
  `getAuditHistoryForUser` reuses from `getDocumentForUser`. Hiding history
  from viewers entirely would remove non-sensitive information (who
  published this, and when) for no real security benefit.
- **Comments on non-reject actions**: any action may carry a trimmed,
  non-empty comment, stored on its audit event; only `reject` requires one.
  Nothing in the UI currently offers a comment box elsewhere, but the service
  layer doesn't need to special-case it.
- **Migrations**: schema creation is one idempotent function
  (`runMigrations`) run against whatever connection it's given, rather than a
  generated migrations folder — so the same function sets up the on-disk dev
  database and each test's fresh in-memory database, with no drift between
  generated files and what tests actually run against.
