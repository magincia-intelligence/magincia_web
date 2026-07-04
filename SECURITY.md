# Security notes — magincia.ai

Baseline posture is sound: all SQL is parameterized with allowlisted identifiers,
the double-opt-in token is HMAC-SHA256 with a timing-safe compare, no secrets are
in the client bundle or git history, and the brief/search render paths are XSS-safe.

This branch (`feat/aesthetic-security-seo`) already applied:

- **Security response headers** (`next.config.ts`) — CSP, HSTS, `X-Frame-Options: DENY`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `poweredByHeader: false`.
- **Rate limiting** on `POST /api/subscribe` (`lib/rate-limit.ts`) — 5 sends / IP / 10 min,
  so the endpoint can't be used to spam arbitrary inboxes or burn Resend quota.
- **JSON-LD hardening** (`lib/seo.ts` `jsonLd()`) — escapes `<` and U+2028/U+2029 so
  brief content can never break out of the inline `<script>` tag.
- **Route-param validation** — brief `date` (`lib/briefs.ts`) and mobility `iso3`
  (`app/intelligence/mobility/[iso3]/page.tsx`) are shape-checked before touching the
  filesystem / DB.

## Still to do — needs your decision (touches production credentials)

### 1. Give the web app a read-only database role (highest priority)

Today `SUPABASE_DB_URL` connects as `postgres.<ref>` — the **full-privilege** role.
The site only ever runs `SELECT`s against a handful of views/marts, but a compromise of
any route or dependency would yield read/write/DDL over the **entire shared warehouse**
(the same DB the intl-student and au-education pipelines use).

Create a scoped read-only role and repoint the app at it:

```sql
-- Run once in the Supabase SQL editor. Replace the password.
create role magincia_web_ro with login password 'REPLACE_WITH_STRONG_PASSWORD';

-- Only the schemas the website reads from.
grant usage on schema gold, education, mobility, bronze, reference to magincia_web_ro;

-- Read-only on everything currently in those schemas...
grant select on all tables in schema gold, education, mobility, bronze, reference to magincia_web_ro;

-- ...and on anything added later (so new views don't 403 the site).
alter default privileges in schema gold, education, mobility, bronze, reference
  grant select to magincia_web_ro;
```

Then update `SUPABASE_DB_URL` (Vercel → Settings → Environment Variables, and local
`.env.local`) to use `magincia_web_ro` via the pooler, and redeploy. Verify every page
still loads before promoting to production.

### 2. Verify the database TLS certificate

All three pool factories use `ssl: { rejectUnauthorized: false }`, which encrypts but
does **not** authenticate the server — an on-path attacker could impersonate the pooler
and capture the credential. Prefer `sslmode=verify-full` with Supabase's CA:

```ts
ssl: { ca: process.env.SUPABASE_CA_CERT, rejectUnauthorized: true }
```

Download the CA from Supabase → Settings → Database → SSL, store it as an env var, and
apply the same change in `lib/intelligence.ts`, `lib/domestic.ts`, `lib/mobility.ts`.

## Lower priority / accepted tradeoffs

- **Confirmation URL from request Host** (`api/subscribe/route.ts`) — safe on Vercel
  (Host is constrained to deployment aliases). If ever self-hosted behind a proxy that
  forwards arbitrary `Host`, pin the production origin to `https://magincia.ai`.
- **State change on GET /confirm** — email prefetch scanners may auto-confirm; standard
  one-click-confirm tradeoff. Acceptable.
- Confirm the GitHub repo is **private** (couldn't verify — local `gh` auth is stale).
