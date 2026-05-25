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

## Sequential PR Rule — Same-File Changes
1. Only one PR per file may be open at a time
2. Before opening a new PR that touches a file, check if any open PR already modifies that file
3. If yes: wait for that PR to be merged first, then rebase onto main before starting work
4. Wave-based execution (Wave 1, Wave 2 etc.) does NOT override this rule — if Wave 1 tasks share files, they must be sequential within the wave

### Common high-traffic files to watch:
- src/pages/Shop.tsx
- src/pages/JerseyDetail.tsx
- src/components/JerseyCard.tsx
- src/App.tsx

## PR Rules — NON-NEGOTIABLE
1. **Agents NEVER close PRs** — only Guido (Product Owner) closes or merges PRs. PRs stay open until Guido takes action.
   - ⚠️ **CRITICAL**: Closing a PR is equivalent to merging — strictly forbidden without Guido's explicit instruction
   - This includes using `gh pr close`, API calls to update PR state, or any other method
   - Violation of this rule will result in immediate task reassignment and agent pausal
2. Title format: `feat(TASKID): description` or `fix(TASKID): description`
3. Body must include: what changed, why it changed, QA checklist (testing steps)
4. Link related issue in body: `Closes #ISSUE_NUMBER` or `Related to #ISSUE_NUMBER`
5. PR must pass CI (npm run build green) before merging
6. NO .env files in PR — verify with: `git diff --cached --name-only | grep "^\.env$"`
7. One PR per task — do not combine multiple TASKID in single PR
8. Rebase on main before requesting review if conflicts exist

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

## Frontend Preview Verification Rule — NON-NEGOTIABLE
For any UI or frontend changes:
1. Start the dev server and test the feature in a browser before submitting the PR
2. Test the golden path (primary user flow) and edge cases
3. Monitor for regressions in other features
4. If you cannot test the UI (e.g., for infrastructure changes), state this explicitly in the PR body
5. Never mark a task as complete without verifying the UI works as expected

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
