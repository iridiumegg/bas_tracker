import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";
import { readFileSync } from "fs";
import { seedLegacyData } from "./seed.js";
import { sendNotification } from "./email.js";

const { Pool } = pg;
const app = express();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("railway") ? { rejectUnauthorized: false } : false,
});

const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://iridiumegg.github.io";
const TZ = process.env.TIMEZONE || "America/Chicago";
const APP_URL = process.env.APP_URL || "https://iridiumegg.github.io/bas_tracker";

app.use(cors({ origin: [ALLOWED_ORIGIN, "http://localhost:5173"], credentials: true }));
app.use(express.json());

async function migrate() {
  const sql = readFileSync(new URL("./migrate.sql", import.meta.url), "utf8");
  await pool.query(sql);
  await seedLegacyData(pool);
  console.log("Migrations applied");
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

async function requireAdmin(req, res, next) {
  try {
    const { rows } = await pool.query("SELECT role FROM users WHERE id = $1 AND active", [req.user.id]);
    if (rows[0]?.role !== "admin") return res.status(403).json({ error: "Admin only" });
    next();
  } catch {
    res.status(500).json({ error: "Server error" });
  }
}

function signToken(u) {
  return jwt.sign({ id: u.id, name: u.display_name, username: u.username, role: u.role }, JWT_SECRET, { expiresIn: "30d" });
}

function publicUser(u) {
  return { id: u.id, name: u.display_name, username: u.username, email: u.email, role: u.role, notify_email: u.notify_email };
}

function todayLocal() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date()); // YYYY-MM-DD
}

async function logActivity({ type, user, project, task, detail = "" }) {
  try {
    await pool.query(
      `INSERT INTO activity (type, user_id, user_name, project_id, project_name, task_id, task_title, detail)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [type, user?.id ?? null, user?.name ?? "System", project?.id ?? null, project?.name ?? null,
       task?.id ?? null, task?.title ?? null, detail]
    );
  } catch (e) {
    console.error("Activity log failed:", e.message);
  }
}

// Fire-and-forget email to everyone with notifications on, except the actor.
function notifyTeam(actorId, subject, body) {
  pool.query(
    "SELECT email FROM users WHERE notify_email AND active AND email IS NOT NULL AND email <> '' AND id <> $1",
    [actorId]
  )
    .then(({ rows }) => sendNotification(rows.map(r => r.email), subject, `${body}\n\n${APP_URL}`))
    .catch(e => console.error("Notify failed:", e.message));
}

// ── Auth ──────────────────────────────────────────────────────────────────────

app.get("/auth/needs-setup", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM users");
    res.json({ needsSetup: rows[0].n === 0 });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// First-run bootstrap: creates the initial admin account. Locked once any user exists.
app.post("/auth/setup", async (req, res) => {
  const { username, display_name, email, password } = req.body;
  if (!username || !display_name || !password) return res.status(400).json({ error: "Missing fields" });
  try {
    const { rows: countRows } = await pool.query("SELECT COUNT(*)::int AS n FROM users");
    if (countRows[0].n > 0) return res.status(403).json({ error: "Setup already completed" });
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (username, display_name, email, password_hash, role) VALUES ($1, $2, $3, $4, 'admin') RETURNING *`,
      [username.toLowerCase().trim(), display_name, email || null, hash]
    );
    res.json({ token: signToken(rows[0]), user: publicUser(rows[0]) });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Missing fields" });
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE username = $1 AND active", [username.toLowerCase().trim()]);
    if (!rows[0]) return res.status(401).json({ error: "Invalid username or password" });
    const ok = await bcrypt.compare(password, rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid username or password" });
    res.json({ token: signToken(rows[0]), user: publicUser(rows[0]) });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/auth/me", auth, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1 AND active", [req.user.id]);
    if (!rows[0]) return res.status(401).json({ error: "Account disabled" });
    res.json({ user: publicUser(rows[0]) });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// Update own profile / notification preference / password
app.put("/me", auth, async (req, res) => {
  const { display_name, email, notify_email, password, current_password } = req.body;
  try {
    if (password) {
      const { rows } = await pool.query("SELECT password_hash FROM users WHERE id = $1", [req.user.id]);
      const ok = current_password && await bcrypt.compare(current_password, rows[0].password_hash);
      if (!ok) return res.status(403).json({ error: "Current password is incorrect" });
      await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [await bcrypt.hash(password, 10), req.user.id]);
    }
    const { rows } = await pool.query(
      `UPDATE users SET
         display_name = COALESCE($1, display_name),
         email = COALESCE($2, email),
         notify_email = COALESCE($3, notify_email)
       WHERE id = $4 RETURNING *`,
      [display_name ?? null, email ?? null, notify_email ?? null, req.user.id]
    );
    res.json({ user: publicUser(rows[0]) });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ── Users (admin) ─────────────────────────────────────────────────────────────

app.get("/users", auth, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, username, display_name, email, role, notify_email, active, created_at FROM users ORDER BY id"
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/users", auth, requireAdmin, async (req, res) => {
  const { username, display_name, email, password, role } = req.body;
  if (!username || !display_name || !password) return res.status(400).json({ error: "Missing fields" });
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (username, display_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, display_name, email, role, notify_email, active, created_at`,
      [username.toLowerCase().trim(), display_name, email || null, hash, role === "admin" ? "admin" : "member"]
    );
    await logActivity({ type: "user_created", user: req.user, detail: `Added user ${display_name} (@${rows[0].username})` });
    res.json(rows[0]);
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Username already taken" });
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/users/:id", auth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  const { display_name, email, role, notify_email, active, password } = req.body;
  if (id === req.user.id && active === false) return res.status(400).json({ error: "You can't deactivate yourself" });
  if (id === req.user.id && role === "member") return res.status(400).json({ error: "You can't demote yourself" });
  try {
    if (password) {
      await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [await bcrypt.hash(password, 10), id]);
    }
    const { rows } = await pool.query(
      `UPDATE users SET
         display_name = COALESCE($1, display_name),
         email = COALESCE($2, email),
         role = COALESCE($3, role),
         notify_email = COALESCE($4, notify_email),
         active = COALESCE($5, active)
       WHERE id = $6
       RETURNING id, username, display_name, email, role, notify_email, active, created_at`,
      [display_name ?? null, email ?? null, role ?? null, notify_email ?? null, active ?? null, id]
    );
    if (!rows[0]) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ── Settings (status bar) ─────────────────────────────────────────────────────

app.get("/settings", auth, async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT key, value FROM settings");
    res.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/settings/status", auth, async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: "Missing message" });
  const value = { message: message.trim(), date: todayLocal() };
  try {
    await pool.query(
      "INSERT INTO settings (key, value) VALUES ('status_bar', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
      [JSON.stringify(value)]
    );
    await logActivity({ type: "status_bar_changed", user: req.user, detail: value.message });
    res.json(value);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/settings/status-options", auth, requireAdmin, async (req, res) => {
  const { options } = req.body;
  if (!Array.isArray(options)) return res.status(400).json({ error: "Options must be an array" });
  const clean = options.map(o => String(o).trim()).filter(Boolean);
  try {
    await pool.query(
      "INSERT INTO settings (key, value) VALUES ('status_options', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
      [JSON.stringify(clean)]
    );
    res.json(clean);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ── Projects ──────────────────────────────────────────────────────────────────

const PROJECT_COUNTS = `
  SELECT p.*,
    COUNT(t.id) FILTER (WHERE NOT t.archived)::int AS total,
    COUNT(t.id) FILTER (WHERE NOT t.archived AND t.status = 'OPEN')::int AS open,
    COUNT(t.id) FILTER (WHERE NOT t.archived AND t.status = 'IN_PROGRESS')::int AS in_progress,
    COUNT(t.id) FILTER (WHERE NOT t.archived AND t.status = 'RESOLVED')::int AS resolved,
    COUNT(t.id) FILTER (WHERE NOT t.archived AND t.status NOT IN ('RESOLVED','NOTED') AND t.due_date < CURRENT_DATE)::int AS overdue
  FROM projects p
  LEFT JOIN tasks t ON t.project_id = p.id`;

app.get("/projects", auth, async (_req, res) => {
  try {
    const { rows } = await pool.query(`${PROJECT_COUNTS} WHERE NOT p.archived GROUP BY p.id ORDER BY p.created_at`);
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "project";
}

app.post("/projects", auth, async (req, res) => {
  const { name, subtitle, client, phase, source, categories } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Missing name" });
  try {
    let slug = slugify(name);
    const { rows: existing } = await pool.query("SELECT slug FROM projects WHERE slug LIKE $1 || '%'", [slug]);
    const taken = new Set(existing.map(r => r.slug));
    if (taken.has(slug)) {
      let n = 2;
      while (taken.has(`${slug}-${n}`)) n++;
      slug = `${slug}-${n}`;
    }
    const { rows } = await pool.query(
      `INSERT INTO projects (slug, name, subtitle, client, phase, source, categories, created_by_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [slug, name.trim(), subtitle || "", client || "", phase || "Active", source || "",
       (categories || []).map(c => String(c).trim()).filter(Boolean), req.user.name]
    );
    const project = rows[0];
    await logActivity({ type: "project_created", user: req.user, project, detail: project.name });
    notifyTeam(req.user.id, `[BAS Workspace] ${req.user.name} created project "${project.name}"`,
      `${req.user.name} created a new project: ${project.name}${client ? ` (${client})` : ""}.`);
    res.json(project);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/projects/by-slug/:slug", auth, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM projects WHERE slug = $1 AND NOT archived", [req.params.slug]);
    if (!rows[0]) return res.status(404).json({ error: "Project not found" });
    const project = rows[0];
    const { rows: tasks } = await pool.query(
      `SELECT t.*, (SELECT COUNT(*) FROM task_notes n WHERE n.task_id = t.id)::int AS note_count
       FROM tasks t WHERE t.project_id = $1 AND NOT t.archived ORDER BY t.id`,
      [project.id]
    );
    res.json({ project, tasks });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/projects/:id", auth, async (req, res) => {
  const { name, subtitle, client, phase, source, categories } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE projects SET
         name = COALESCE($1, name),
         subtitle = COALESCE($2, subtitle),
         client = COALESCE($3, client),
         phase = COALESCE($4, phase),
         source = COALESCE($5, source),
         categories = COALESCE($6, categories)
       WHERE id = $7 RETURNING *`,
      [name ?? null, subtitle ?? null, client ?? null, phase ?? null, source ?? null,
       categories ? categories.map(c => String(c).trim()).filter(Boolean) : null, parseInt(req.params.id)]
    );
    if (!rows[0]) return res.status(404).json({ error: "Project not found" });
    await logActivity({ type: "project_updated", user: req.user, project: rows[0], detail: rows[0].name });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/projects/:id", auth, async (req, res) => {
  try {
    const { rows } = await pool.query("UPDATE projects SET archived = TRUE WHERE id = $1 RETURNING *", [parseInt(req.params.id)]);
    if (!rows[0]) return res.status(404).json({ error: "Project not found" });
    await logActivity({ type: "project_archived", user: req.user, project: rows[0], detail: rows[0].name });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ── Tasks ─────────────────────────────────────────────────────────────────────

async function resolveAssignee(assignee_id) {
  if (!assignee_id) return { id: null, name: null };
  const { rows } = await pool.query("SELECT id, display_name FROM users WHERE id = $1", [assignee_id]);
  return rows[0] ? { id: rows[0].id, name: rows[0].display_name } : { id: null, name: null };
}

app.post("/projects/:id/tasks", auth, async (req, res) => {
  const { title, details, unit, category, priority, status, due_date, assignee_id, source } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: "Missing title" });
  try {
    const { rows: pr } = await pool.query("SELECT * FROM projects WHERE id = $1", [parseInt(req.params.id)]);
    if (!pr[0]) return res.status(404).json({ error: "Project not found" });
    const project = pr[0];
    const assignee = await resolveAssignee(assignee_id);
    const { rows } = await pool.query(
      `INSERT INTO tasks (project_id, title, details, unit, category, priority, status, due_date, assignee_id, assignee_name, source, created_by_id, created_by_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *, 0 AS note_count`,
      [project.id, title.trim(), details || "", unit || "", category || "", priority || "MEDIUM",
       status || "OPEN", due_date || null, assignee.id, assignee.name, source || "", req.user.id, req.user.name]
    );
    const task = rows[0];
    await logActivity({ type: "task_created", user: req.user, project, task, detail: task.title });
    notifyTeam(req.user.id, `[BAS Workspace] ${req.user.name} added a task in ${project.name}`,
      `${req.user.name} added a task in ${project.name}:\n\n${task.title}${task.unit ? `\nUnit: ${task.unit}` : ""}\nPriority: ${task.priority}`);
    res.json(task);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/tasks/:id", auth, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const { rows: existing } = await pool.query(
      "SELECT t.*, p.name AS project_name, p.id AS pid FROM tasks t JOIN projects p ON p.id = t.project_id WHERE t.id = $1", [id]
    );
    if (!existing[0]) return res.status(404).json({ error: "Task not found" });
    const before = existing[0];
    const project = { id: before.pid, name: before.project_name };

    const { title, details, unit, category, priority, status, due_date, assignee_id } = req.body;
    const statusChanged = status !== undefined && status !== before.status;
    const assignee = assignee_id !== undefined ? await resolveAssignee(assignee_id) : { id: before.assignee_id, name: before.assignee_name };

    const { rows } = await pool.query(
      `UPDATE tasks SET
         title = COALESCE($1, title),
         details = COALESCE($2, details),
         unit = COALESCE($3, unit),
         category = COALESCE($4, category),
         priority = COALESCE($5, priority),
         status = COALESCE($6, status),
         due_date = $7,
         assignee_id = $8,
         assignee_name = $9,
         status_changed_by_name = CASE WHEN $10 THEN $11 ELSE status_changed_by_name END,
         status_changed_at = CASE WHEN $10 THEN NOW() ELSE status_changed_at END
       WHERE id = $12
       RETURNING *, (SELECT COUNT(*) FROM task_notes n WHERE n.task_id = tasks.id)::int AS note_count`,
      [title ?? null, details ?? null, unit ?? null, category ?? null, priority ?? null, status ?? null,
       due_date !== undefined ? (due_date || null) : before.due_date,
       assignee.id, assignee.name, statusChanged, req.user.name, id]
    );
    const task = rows[0];

    if (statusChanged) {
      const completed = status === "RESOLVED";
      await logActivity({
        type: completed ? "task_completed" : "status_changed",
        user: req.user, project, task,
        detail: completed ? task.title : `${before.status} → ${status}`,
      });
      const verb = completed ? "checked off" : `moved to ${status.replace("_", " ")}`;
      notifyTeam(req.user.id, `[BAS Workspace] ${req.user.name} ${verb}: ${task.title}`,
        `${req.user.name} ${verb} a task in ${project.name}:\n\n${task.title}${task.unit ? `\nUnit: ${task.unit}` : ""}\nStatus: ${before.status} → ${status}`);
    } else {
      await logActivity({ type: "task_updated", user: req.user, project, task, detail: task.title });
    }
    res.json(task);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE tasks SET archived = TRUE WHERE id = $1
       RETURNING *, (SELECT name FROM projects WHERE id = tasks.project_id) AS project_name`,
      [parseInt(req.params.id)]
    );
    if (!rows[0]) return res.status(404).json({ error: "Task not found" });
    const task = rows[0];
    await logActivity({
      type: "task_deleted", user: req.user,
      project: { id: task.project_id, name: task.project_name }, task, detail: task.title,
    });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ── Notes ─────────────────────────────────────────────────────────────────────

app.get("/tasks/:id/notes", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, content, created_by_name, created_at FROM task_notes WHERE task_id = $1 ORDER BY created_at",
      [parseInt(req.params.id)]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/tasks/:id/notes", auth, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: "Empty note" });
  try {
    const { rows: tr } = await pool.query(
      "SELECT t.*, p.name AS project_name FROM tasks t JOIN projects p ON p.id = t.project_id WHERE t.id = $1",
      [parseInt(req.params.id)]
    );
    if (!tr[0]) return res.status(404).json({ error: "Task not found" });
    const task = tr[0];
    const { rows } = await pool.query(
      "INSERT INTO task_notes (task_id, content, created_by_id, created_by_name) VALUES ($1, $2, $3, $4) RETURNING *",
      [task.id, content.trim(), req.user.id, req.user.name]
    );
    await logActivity({
      type: "note_added", user: req.user,
      project: { id: task.project_id, name: task.project_name }, task, detail: content.trim(),
    });
    notifyTeam(req.user.id, `[BAS Workspace] ${req.user.name} added a note on: ${task.title}`,
      `${req.user.name} added a field note in ${task.project_name}:\n\nTask: ${task.title}\n\n"${content.trim()}"`);
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ── Activity & daily summary ──────────────────────────────────────────────────

app.get("/activity", auth, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  const projectId = parseInt(req.query.project_id) || null;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM activity WHERE ($1::int IS NULL OR project_id = $1) ORDER BY created_at DESC LIMIT $2`,
      [projectId, limit]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/summary", auth, async (req, res) => {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date || "") ? req.query.date : todayLocal();
  const userId = req.query.scope === "me" ? req.user.id : null;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM activity
       WHERE (created_at AT TIME ZONE $1)::date = $2::date
         AND ($3::int IS NULL OR user_id = $3)
       ORDER BY created_at`,
      [TZ, date, userId]
    );
    res.json({ date, activity: rows });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ── Health ────────────────────────────────────────────────────────────────────

app.get("/health", (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
migrate().then(() => {
  app.listen(PORT, () => console.log(`API running on port ${PORT}`));
}).catch(e => { console.error("Migration failed", e); process.exit(1); });
