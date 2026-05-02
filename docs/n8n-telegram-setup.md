# n8n + Telegram Setup Guide for VintageLeague

This guide walks you through setting up an n8n workflow that sends Telegram notifications whenever a new GitHub Pull Request is opened in the VintageLeague repo.

---

## Overview: What the Workflow Does

```
GitHub (PR opened) → n8n Webhook → Format Message → Telegram Bot → Team Chat
```

The workflow listens for GitHub `pull_request` events (action: `opened`), extracts key PR details, and sends a formatted message to a Telegram chat via a Bot.

---

## Part 1: Create a Telegram Bot

### Step 1.1 — Talk to BotFather

1. Open Telegram and search for **@BotFather**.
2. Start a chat and send: `/newbot`
3. Follow the prompts:
   - **Display name:** `VintageLeague Notifier`
   - **Username:** `VintageLeagueBot` (must end in `bot`)
4. BotFather will reply with a **Bot Token** that looks like:
   ```
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
5. **Copy and save this token** — you need it in Part 3.

### Step 1.2 — Get your Chat ID

1. Add your new bot to the target Telegram group/channel (or start a 1:1 chat with it).
2. Send a test message to the chat (e.g., "hello").
3. Visit this URL in your browser (replace `<BOT_TOKEN>` with your token):
   ```
   https://api.telegram.org/bot<BOT_TOKEN>/getUpdates
   ```
4. Look for the `"chat":{"id":...}` field in the JSON response.
5. **Copy the chat ID** (e.g., `-1001234567890` for groups, or a positive number for 1:1 chats).

---

## Part 2: Set Up n8n

### Step 2.1 — Access n8n

- **Self-hosted:** Open your n8n instance (e.g., `https://n8n.vintageleague.app`).
- **n8n Cloud:** Go to [https://n8n.io](https://n8n.io) and sign in.

### Step 2.2 — Create a New Workflow

1. Click **Create Workflow**.
2. Name it: `VintageLeague GitHub PR → Telegram`.

---

## Part 3: Build the Workflow

### Step 3.1 — Add GitHub Webhook Trigger

1. Click **+** → search for **GitHub**.
2. Select **GitHub Trigger** node.
3. Configure:
   - **Authentication:** Click **Create New Credential** → enter your GitHub Personal Access Token (PAT) with `repo` scope.
   - **Owner:** `eichhoffguido`
   - **Repository:** `vintage-league-V2`
   - **Events:** check **Pull Request**
4. Click **Test Step** to register the webhook in GitHub.
5. n8n will give you a webhook URL like:
   ```
   https://your-n8n-instance/webhook/abc123def456
   ```

### Step 3.2 — Add IF Condition (Filter for PR Opened)

1. Click **+** → search for **IF**.
2. Connect it to the GitHub Trigger node.
3. Configure:
   - **Condition:** `{{$json.body.action}}` **Equals** `opened`
   - **Condition:** `{{$json.body.pull_request.state}}` **Equals** `open`
4. This ensures only newly opened PRs (not closed/edited) trigger the notification.

### Step 3.3 — Add Telegram Send Message Node

1. Click **+** on the **true** branch → search for **Telegram**.
2. Select **Telegram: Send Message** node.
3. Configure credential:
   - Click **Create New Credential** → paste your **Bot Token** from Step 1.1.
4. Configure message:
   - **Chat ID:** paste your chat ID from Step 1.2.
   - **Text:** paste the template below:

```
🔔 *New Pull Request: {{$json.body.pull_request.title}}*

*Repo:* {{$json.body.repository.full_name}}
*Author:* {{$json.body.pull_request.user.login}}
*Branch:* \`{{$json.body.pull_request.head.ref}}\` → \`{{$json.body.pull_request.base.ref}}\`

📝 {{$json.body.pull_request.body}}

🔗 [View PR]({{$json.body.pull_request.html_url}})
```

5. Set **Parse Mode** to `Markdown` for bold/italic formatting.

### Step 3.4 — Save and Activate

1. Click **Save**.
2. Toggle **Active** to **ON** in the top-right corner.

---

## Part 4: Test the Workflow

1. Go to the GitHub repo: `https://github.com/eichhoffguido/vintage-league-V2`
2. Create a test PR (or ask a teammate to open one).
3. Watch the n8n execution log — you should see a successful run.
4. Check your Telegram chat — the notification should appear within seconds.

---

## Part 5: Example GitHub Webhook Payload (PR Opened)

This is what GitHub sends to n8n when a PR is opened:

```json
{
  "action": "opened",
  "number": 42,
  "pull_request": {
    "title": "Add Google OAuth login button",
    "html_url": "https://github.com/eichhoffguido/vintage-league-V2/pull/42",
    "state": "open",
    "body": "Implements Google Sign-In using Supabase OAuth.",
    "head": {
      "ref": "feature/google-oauth"
    },
    "base": {
      "ref": "main"
    },
    "user": {
      "login": "frontend-dev"
    }
  },
  "repository": {
    "full_name": "eichhoffguido/vintage-league-V2"
  }
}
```

---

## Environment Variables (for n8n Self-Hosted)

If you run n8n via Docker/CLI, these variables are relevant:

| Variable | Purpose | Example |
|---|---|---|
| `N8N_HOST` | n8n instance URL | `n8n.vintageleague.app` |
| `N8N_PORT` | Port (default 5678) | `5678` |
| `N8N_PROTOCOL` | http or https | `https` |
| `WEBHOOK_URL` | Public webhook URL | `https://n8n.vintageleague.app` |

*No environment variables are needed inside the VintageLeague app itself — n8n runs independently.*

---

## Troubleshooting

| Issue | Likely Cause | Fix |
|---|---|---|
| No Telegram message received | Wrong Chat ID | Re-check Step 1.2 — group IDs are negative numbers |
| `401 Unauthorized` from Telegram | Wrong Bot Token | Re-create bot with BotFather, copy token carefully |
| GitHub webhook not firing | Wrong PAT scope | Ensure GitHub PAT has `repo` scope |
| n8n shows no executions | Webhook not registered | Re-test the GitHub Trigger node in n8n |
| Message sent but formatting broken | Parse Mode mismatch | Set Telegram node Parse Mode to `Markdown` |

---

## Summary Checklist

| Step | Action | Status |
|---|---|---|
| 1.1 | Telegram bot created via BotFather | ☐ |
| 1.2 | Chat ID retrieved | ☐ |
| 2.1 | n8n accessed | ☐ |
| 3.1 | GitHub Trigger configured + webhook registered | ☐ |
| 3.2 | IF node filters for `action=opened` | ☐ |
| 3.3 | Telegram node configured with message template | ☐ |
| 3.4 | Workflow activated | ☐ |
| 4 | Test PR created and notification received | ☐ |

---

*Guide written for VintageLeague — GitHub repo `eichhoffguido/vintage-league-V2`*
