# Supabase migrations

Place SQL migration files in this directory using a timestamped prefix, for example:

- `20260416070000_add_transactions_table.sql`
- `20260416073000_add_index_on_transactions_user_id.sql`

Any push to `main` that changes files in `supabase/migrations/` will trigger the GitHub Action workflow at `.github/workflows/supabase-schema-sync.yml`, which runs `supabase db push` against your linked remote project.

Tip: use the Supabase CLI to generate migrations so they stay consistent with your local schema changes.
