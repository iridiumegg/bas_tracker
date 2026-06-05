import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";
import { readFileSync } from "fs";

const { Pool } = pg;
const app = express();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("railway") ? { rejectUnauthorized: false } : false,
});

const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://iridiumegg.github.io";

app.use(cors({ origin: [ALLOWED_ORIGIN, "http://localhost:5173"], credentials: true }));
app.use(express.json());

// Run migrations on startup
async function migrate() {
  const sql = readFileSync(new URL("./migrate.sql", import.meta.url), "utf8");
  await pool.query(sql);
  console.log("Migrations applied");
}

// Auth middleware
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

// ── Auth routes ──────────────────────────────────────────────────────────────

app.post("/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, hash]
    );
    const token = jwt.sign({ id: rows[0].id, name: rows[0].name, email: rows[0].email }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, user: rows[0] });
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "Email already registered" });
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Missing fields" });
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (!rows[0]) return res.status(401).json({ error: "Invalid email or password" });
    const ok = await bcrypt.compare(password, rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid email or password" });
    const token = jwt.sign({ id: rows[0].id, name: rows[0].name, email: rows[0].email }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, user: { id: rows[0].id, name: rows[0].name, email: rows[0].email } });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/auth/me", auth, (req, res) => res.json({ user: req.user }));

// ── Status routes ─────────────────────────────────────────────────────────────

app.get("/projects/:projectId/statuses", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT item_id, status, changed_by_name, changed_at FROM item_statuses WHERE project_id = $1",
    [req.params.projectId]
  );
  res.json(rows);
});

app.put("/projects/:projectId/items/:itemId/status", auth, async (req, res) => {
  const { projectId, itemId } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: "Missing status" });
  const { rows } = await pool.query(
    `INSERT INTO item_statuses (project_id, item_id, status, changed_by_id, changed_by_name, changed_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (project_id, item_id) DO UPDATE
       SET status = $3, changed_by_id = $4, changed_by_name = $5, changed_at = NOW()
     RETURNING *`,
    [projectId, parseInt(itemId), status, req.user.id, req.user.name]
  );
  res.json(rows[0]);
});

// ── Notes routes ──────────────────────────────────────────────────────────────

app.get("/projects/:projectId/items/:itemId/notes", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT id, content, created_by_name, created_at FROM item_notes WHERE project_id = $1 AND item_id = $2 ORDER BY created_at ASC",
    [req.params.projectId, parseInt(req.params.itemId)]
  );
  res.json(rows);
});

app.post("/projects/:projectId/items/:itemId/notes", auth, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: "Empty note" });
  const { rows } = await pool.query(
    "INSERT INTO item_notes (project_id, item_id, content, created_by_id, created_by_name) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [req.params.projectId, parseInt(req.params.itemId), content.trim(), req.user.id, req.user.name]
  );
  res.json(rows[0]);
});

// ── Health check ──────────────────────────────────────────────────────────────

app.get("/health", (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
migrate().then(() => {
  app.listen(PORT, () => console.log(`API running on port ${PORT}`));
}).catch(e => { console.error("Migration failed", e); process.exit(1); });
