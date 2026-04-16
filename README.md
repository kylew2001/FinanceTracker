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

## Notes

- This MVP stores data in `localStorage`.
- Passwords are hashed client-side with SHA-256 and a per-user salt before storage.
- For production, move auth/data to a secure backend (session cookies, CSRF protection, DB encryption, etc.).
