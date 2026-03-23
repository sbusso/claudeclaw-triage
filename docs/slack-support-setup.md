# Slack Support Bot Setup Guide

Set up ClaudeClaw with Slack channel for support: users @mention the bot, it replies in threads, investigates bugs using your codebase and database, and creates GitHub issues when code changes are needed.

## Prerequisites

- macOS or Linux
- Node.js 20+ (`node --version`)
- [Claude Code](https://claude.ai/download) installed (`claude --version`)
- Anthropic API key (or Claude Code OAuth — if `claude` works, you're good)
- A Slack workspace where you can create apps
- Your project repo and a read-only database connection string

## 1. Clone and initialize

```bash
git clone https://github.com/sbusso/claudeclaw.git
cd claudeclaw
npm install
npm run build
claude
```

In Claude Code:

```
/setup
```

Choose:
- **Runtime:** `sandbox` (default)
- **Channel:** Slack

## 2. Create Slack app

`/setup` guides you through this. What you'll do:

1. [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**
2. Name it (e.g., "Support Bot"), pick your workspace

**Bot Token Scopes** (OAuth & Permissions):
- `app_mentions:read`, `channels:history`, `channels:read`, `chat:write`
- `groups:history`, `groups:read`, `reactions:write`, `users:read`

**Event Subscriptions** → Enable → Subscribe to bot events:
- `app_mention`, `message.channels`, `message.groups`

**Socket Mode** → Enable

**App-Level Token**: Create with scope `connections:write`

**Install to workspace** → copy Bot Token (`xoxb-...`) and App-Level Token (`xapp-...`)

Paste both when Claude asks. Setup auto-detects the bot's display name and lists channels to pick from.

## 3. Install extensions

```
/install-extension slack
/install-extension triage
```

## 4. Test basic Slack flow

1. Invite the bot to a channel: `/invite @YourBotName`
2. Send: `@YourBotName hello, are you working?`
3. Bot replies in a thread
4. Reply in the thread without @mentioning — conversation continues

No response? Check `tail -50 logs/claudeclaw.log`

## 5. Configure triage for your project

Find your group folder:

```bash
sqlite3 store/messages.db "SELECT jid, name, folder FROM registered_groups"
```

Edit `groups/<folder>/CLAUDE.md`:

```markdown
## Project Context

- **Source code:** mounted at /path/to/your/project
- **GitHub repo:** owner/repo-name
- **Read-only DB:** use $DATABASE_READONLY_URL

## Triage Behavior

When users report bugs or request features:
1. Investigate using the source code and database
2. Answer in plain language — no code in user threads
3. If a code change is needed, create a GitHub issue with full technical details
4. Tell the user an issue was opened
```

## 6. Add project code as a mount

Tell Claude Code:

```
Add /path/to/your/project as a read-only mount for the support group
```

This updates the group's `allowedRoots` so the sandbox grants read access on next agent spawn.

## 7. Add read-only database access

Add to `.env`:

```
DATABASE_READONLY_URL="postgresql://user:password@host:port/dbname"
```

Then:

```
Add DATABASE_READONLY_URL to the container env keys for the triage extension
```

## 8. Configure GitHub CLI

```bash
gh auth login
```

Tell Claude:

```
Set the default GitHub repo for triage to owner/repo-name
```

## 9. End-to-end test

In Slack:

```
@YourBotName I'm getting a 500 error when I try to save my profile
```

Expected:
1. Bot replies in thread: investigates the issue
2. Checks source code and queries DB
3. Replies with plain-language explanation
4. If code fix needed → creates GitHub issue → tells user

## Verify

```bash
# Service status
launchctl list | grep claudeclaw   # macOS

# Recent runs
sqlite3 store/messages.db \
  "SELECT group_folder, trigger_type, estimated_cost_usd FROM agent_runs ORDER BY run_at DESC LIMIT 5"

# Logs
tail -f logs/claudeclaw.log
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Bot doesn't respond | Check logs. Is service running? Is bot invited to channel? |
| "No conversation found" | `sqlite3 store/messages.db "DELETE FROM sessions"` |
| Agent can't read project | Check mount: `sqlite3 store/messages.db "SELECT * FROM registered_groups"` |
| Agent can't reach DB | Verify `DATABASE_READONLY_URL` in `.env` and exposed via `containerEnvKeys` |
| Sandbox EPERM | All srt settings fields must be present, even empty arrays |
