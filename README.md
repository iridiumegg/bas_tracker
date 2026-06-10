# BAS Workspace

A self-hosted Notion-style workspace for ES2 Building Automation Systems field work: projects, tasks, field notes, daily summaries, email alerts, and user management — in a dark terminal-flavored UI (IBM Plex Mono).

## Features

- **Projects & tasks** — create/edit/archive projects and tasks from the UI. Tasks have priority, status (OPEN / IN PROGRESS / RESOLVED / NOTED), unit/equipment, category, due date, and assignee. Overdue tasks are flagged.
- **Field notes** — threaded notes on any task, attributed and timestamped.
- **Daily Summary** — pick a date, see everything completed / status-changed / noted that day (just you, or the whole team), and **Copy for Email** to paste a formatted plain-text summary into Outlook/Gmail.
- **Activity feed** — full audit trail of who did what, when.
- **Email alerts** — teammates get an email when someone checks a task off, changes a status, adds a note, or creates a task/project. Each user can opt out in My Settings.
- **Status banner** — live status message editable in-app (click the banner); presets managed on the Admin page. No more git pushes to update it.
- **Users, no signup codes** — admins create accounts from the Admin page; users manage their own email, password, and notification preference.

## Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, react-router (HashRouter for GitHub Pages). Deployed to GitHub Pages from `main`.
- **Backend**: Express 5 + Postgres on Railway. Migrations are idempotent and run at boot; the old hardcoded project files are seeded into the DB once (including existing statuses/notes from the legacy tables).

## Development

```sh
# Frontend
npm install
npm run dev          # http://localhost:5173

# Backend (needs a local Postgres + DATABASE_URL in backend/.env)
cd backend
npm install
npm run dev          # http://localhost:3001
```

## Backend environment variables (Railway)

| Var | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string |
| `JWT_SECRET` | yes | Token signing secret |
| `ALLOWED_ORIGIN` | no | CORS origin (default `https://iridiumegg.github.io`) |
| `APP_URL` | no | Link appended to alert emails |
| `TIMEZONE` | no | Day boundary for summaries (default `America/Chicago`) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM` | for email alerts | Any SMTP provider (Gmail app password, Office 365, Resend, SendGrid, etc.). Alerts are disabled if `SMTP_HOST` is unset. |

## First run

If the database has no users, the login page shows a one-time "create admin account" form. Existing deployments keep their users; the oldest account is promoted to admin automatically.
