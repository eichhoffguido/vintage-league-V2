# VintageLeague — Agent Rules

## Project
React + TypeScript + Vite + Supabase marketplace for vintage football jerseys.
Repo: https://github.com/eichhoffguido/vintage-league-V2
Live: https://vintage-league-v2.vercel.app

## Working Directory
ALWAYS: /home/opencode/projects/vintage-league-V2
NEVER clone again. NEVER work in /app.
First command: cd /home/opencode/projects/vintage-league-V2 && git pull origin main

## Git Rules — NON-NEGOTIABLE
1. NEVER push to main — always use feature branches
2. Branch naming: feature/TASKID-short-description
3. After push create PR: gh pr create --base main --head BRANCHNAME --title "TITLE" --body "SUMMARY"
4. NEVER merge your own PR — Guido merges

## Issue Status Rules — NON-NEGOTIABLE
1. When your work is done: mark issue as DONE immediately
2. Do NOT wait for anyone's approval to mark DONE
3. DONE means "my work is finished" — not "approved for production"

## Workflow for every task
1. cd /home/opencode/projects/vintage-league-V2 && git pull origin main
2. git checkout -b feature/TASKID-description
3. Do the work
4. npm run build — must be green
5. git add <files> && git commit -m "feat(TASKID): description"
6. git push https://eichhoffguido:$GITHUB_TOKEN@github.com/eichhoffguido/vintage-league-V2.git feature/TASKID-description
7. gh pr create --base main --head feature/TASKID-description --title "feat(TASKID): description" --body "Summary"
8. Mark issue as DONE
9. STOP — wait for CTO or Guido

## Never without Guido approval
- supabase db push
- Any deployment
- Modify .env files
- Push to main

## Tech Stack
- price_cents (integer) for all money — never price_estimate
- src/utils/currency.ts: eurosToCents, centsToEuros, formatEuros
- Supabase project: napzgxpxkoiujjqwtzvz
- Storage bucket: jersey-images (live)

## CTO Coordination Rules
1. Break task into subtasks, delegate to right agent
2. After agent done: immediately assign QA Engineer — no waiting
3. After QA approved: report to Guido with PR link
4. NEVER contact Guido between steps — only at completion
5. NEVER do the coding yourself — always delegate
