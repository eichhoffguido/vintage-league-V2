# VintageLeague

A React/TypeScript application for vintage jersey trading and collecting.

## Environment Variables

### Required

- `VITE_SUPABASE_URL` — Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Your Supabase anonymous key

### Optional

- `VITE_TENOR_API_KEY` — Tenor API key for the GIF picker feature
  - Get your key from https://tenor.com/developer/dashboard
  - If not provided, the GIF picker button will not appear in the rich text editor
