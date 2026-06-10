import { readFileSync } from "fs";

// One-time migration of the old hardcoded project files into the database.
// Runs only when the projects table is empty; carries over any live statuses
// and notes from the legacy item_statuses / item_notes tables.
export async function seedLegacyData(pool) {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM projects");
  if (rows[0].n > 0) return;

  const data = JSON.parse(readFileSync(new URL("./legacy-data.json", import.meta.url), "utf8"));

  for (const { meta, items } of data) {
    const categories = (meta.categories || []).filter(c => c !== "All");
    const { rows: [project] } = await pool.query(
      `INSERT INTO projects (slug, name, subtitle, client, phase, source, categories, created_by_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Migration') RETURNING id`,
      [meta.id, meta.name, meta.subtitle || "", meta.client || "", meta.phase || "Active", meta.source || "", categories]
    );

    for (const item of items) {
      await pool.query(
        `INSERT INTO tasks (project_id, legacy_item_id, title, details, unit, category, priority, status, source, created_by_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Migration')`,
        [project.id, item.id, item.issue, item.action || "", item.unit || "", item.category || "",
         item.priority || "MEDIUM", item.status || "OPEN", item.source || ""]
      );
    }

    await pool.query(
      `UPDATE tasks t
       SET status = s.status, status_changed_by_name = s.changed_by_name, status_changed_at = s.changed_at
       FROM item_statuses s
       WHERE s.project_id = $1 AND t.project_id = $2 AND t.legacy_item_id = s.item_id`,
      [meta.id, project.id]
    );

    await pool.query(
      `INSERT INTO task_notes (task_id, content, created_by_id, created_by_name, created_at)
       SELECT t.id, n.content, n.created_by_id, n.created_by_name, n.created_at
       FROM item_notes n
       JOIN tasks t ON t.project_id = $2 AND t.legacy_item_id = n.item_id
       WHERE n.project_id = $1`,
      [meta.id, project.id]
    );
  }

  console.log(`Seeded ${data.length} legacy projects into the database`);
}
