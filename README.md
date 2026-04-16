# FinanceTracker (MVP)

A lightweight browser-based finance budget tracker MVP with:

- Username/password login (local-only, no email provider yet)
- Left sidebar navigation
- Budget planner with recurring income/expense entries
- Running account total tracker for bill sinking funds
- Profile page with editable personal details

## Quick start

Open `index.html` in your browser, or run a local server:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Supabase schema auto-sync (for Vercel + GitHub)

This repo now includes a GitHub Action workflow that automatically applies SQL migrations to your remote Supabase database whenever migration files change on `main`.

### 1) Add migrations to the repo

Create migration SQL files inside `supabase/migrations/` (timestamped names recommended):

```text
supabase/migrations/20260416070000_add_transactions_table.sql
```

### 2) Configure GitHub repository secrets

In your GitHub repo settings, add:

- `SUPABASE_ACCESS_TOKEN`  
  Get this from Supabase Dashboard → **Account** (top-right profile menu) → **Access Tokens** → create/copy token.
- `SUPABASE_DB_PASSWORD`  
  This is your project database password. If you do not have it, reset it in Supabase Dashboard → **Project Settings** → **Database**.
- `SUPABASE_PROJECT_REF`  
  Found in Supabase Dashboard → **Project Settings** → **General** (Project ID / Reference ID), or from your project URL (`https://<project-ref>.supabase.co`).

### 3) How the automation works

On push to `main`, if files in `supabase/migrations/**` changed, the workflow:

1. Installs the Supabase CLI
2. Links to your Supabase project
3. Runs `supabase db push --include-all --yes`

Workflow file:

- `.github/workflows/supabase-schema-sync.yml`

## Notes

- This MVP stores app data in `localStorage` unless you wire up Supabase in app code.
- Passwords are hashed client-side with SHA-256 and a per-user salt before storage.
- For production, move auth/data to a secure backend (session cookies, CSRF protection, DB encryption, etc.).
