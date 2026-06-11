export const PRIORITY_CONFIG = {
  HIGH:   { label: "HIGH", bg: "#2d0a0a", border: "#c0392b", text: "#e74c3c" },
  MEDIUM: { label: "MED",  bg: "#2d1f00", border: "#d68910", text: "#f39c12" },
  LOW:    { label: "LOW",  bg: "#0a1f2d", border: "#1a6b8a", text: "#3498db" },
};

export const STATUS_CONFIG = {
  OPEN:        { label: "OPEN",        bg: "#1a0a0a", border: "#7b241c", text: "#e74c3c" },
  IN_PROGRESS: { label: "IN PROGRESS", bg: "#1a1400", border: "#7d6608", text: "#f1c40f" },
  RESOLVED:    { label: "RESOLVED",    bg: "#0a1a0a", border: "#1e8449", text: "#2ecc71" },
  NOTED:       { label: "NOTED",       bg: "#0d0d1a", border: "#2c3e7a", text: "#7f8cff" },
};

export const PRIORITIES = ["HIGH", "MEDIUM", "LOW"];
export const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "NOTED"];

export const ACTIVITY_CONFIG = {
  task_completed:     { label: "CHECKED OFF", color: "#2ecc71" },
  status_changed:     { label: "STATUS",      color: "#f1c40f" },
  note_added:         { label: "NOTE",        color: "#8a9ab8" },
  note_edited:        { label: "NOTE EDIT",   color: "#5a6580" },
  note_resolved:      { label: "NOTE DONE",   color: "#2ecc71" },
  note_reopened:      { label: "NOTE REOPEN", color: "#f1c40f" },
  task_created:       { label: "NEW TASK",    color: "#8ab4f8" },
  task_updated:       { label: "EDITED",      color: "#5a6580" },
  task_deleted:       { label: "DELETED",     color: "#e74c3c" },
  project_created:    { label: "NEW PROJECT", color: "#8ab4f8" },
  project_updated:    { label: "PROJECT",     color: "#5a6580" },
  project_archived:   { label: "ARCHIVED",    color: "#e74c3c" },
  status_bar_changed: { label: "STATUS BAR",  color: "#5a6580" },
  user_created:       { label: "NEW USER",    color: "#8ab4f8" },
};

export function fmtTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isOverdue(task) {
  return task.due_date && task.status !== "RESOLVED" && task.status !== "NOTED" &&
    task.due_date.slice(0, 10) < todayISO();
}
