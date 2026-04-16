# FinanceTracker (Supabase MVP)

A lightweight finance budget tracker MVP with:

- Username/password login (stored in Supabase `users` table)
- Left sidebar navigation
- Budget planner with recurring income/expense entries
- Running account total tracker for bill sinking funds
- Profile page with editable personal details

## Setup

1. Run the SQL schema in your Supabase SQL editor:

```sql
-- file: supabase.sql
```

2. Copy config template and fill your values:

```bash
cp supabase-config.example.js supabase-config.js
```

3. Start the app:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Security note

This is a frontend-only MVP with custom username/password logic and permissive demo RLS policies.
For production, move auth/session logic to a secure backend and tighten RLS to JWT-based ownership rules.
