# findyourjersey.org Scraper

Periodically scrapes vintage football shirt sale data from [findyourjersey.org](https://www.findyourjersey.org) and stores it in the `jersey_price_references` Supabase table.

## Requirements

- Python 3.10+
- pip packages: `requests`, `beautifulsoup4`, `supabase`

## Setup

```bash
pip install requests beautifulsoup4 supabase
```

## Environment Variables

| Variable                     | Description                  |
| ---------------------------- | ---------------------------- |
| `SUPABASE_URL`               | Supabase project URL         |
| `SUPABASE_SERVICE_ROLE_KEY`  | Supabase service role key    |

## Usage

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

python3 findyourjersey_scraper.py
```

## Cron Setup (weekly)

```bash
crontab -e
# Add: run every Monday at 3 AM
0 3 * * 1 cd /home/opencode/projects/vintage-league-V2/scrapers && \
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  python3 findyourjersey_scraper.py >> scraper.log 2>&1
```

## Data Collected

Per sale listing:
- Team / Club name
- Season / Year
- Condition (if available)
- Size (if available)
- Sale price (in cents)
- Sale date
- Source URL

## Target Table

`jersey_price_references` — created by the Supabase Backend Engineer migration.
