# CLAUDE.md — Project Instructions

## Architecture

- **Frontend**: React 19 + Vite + Tailwind CSS v4 (`src/`). Deploys to GitHub Pages from `main` via `.github/workflows/deploy.yml`. Uses HashRouter so deep links work on Pages.
- **Backend**: Express + Postgres (`backend/`), deployed on Railway. `migrate.sql` runs on every boot (idempotent); `seed.js` does a one-time import of the legacy hardcoded projects.
- All workspace data (projects, tasks, notes, activity, users, status bar) lives in Postgres — nothing is hardcoded in the frontend anymore.

## Status Updates

The status banner is edited **in the app** (click the banner, pick a preset or type a custom message). It is stored in the `settings` table — do NOT edit source files or push to `main` to change the status.

Admins manage the preset list on the Admin page.

## Deploys

- Frontend: push to `main` → GitHub Pages workflow deploys `dist/`. The live site deploys from `main` only; changes on feature branches will not appear on the site.
- Backend: Railway deploys from `backend/`. Env vars: `DATABASE_URL`, `JWT_SECRET`, `ALLOWED_ORIGIN`, `APP_URL`, `TIMEZONE`, and SMTP settings (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`) for email alerts. Email alerts are silently disabled if `SMTP_HOST` is unset.

## Auth

No signup codes. The first account is created via the in-app first-run setup screen (only available while the users table is empty); admins create all other accounts from the Admin page. The oldest existing user is auto-promoted to admin by the migration.
