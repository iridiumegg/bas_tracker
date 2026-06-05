export const PRIORITY_CONFIG = {
  HIGH:   { label: "HIGH", bg: "#2d0a0a", border: "#c0392b", text: "#e74c3c", dot: "#e74c3c" },
  MEDIUM: { label: "MED",  bg: "#2d1f00", border: "#d68910", text: "#f39c12", dot: "#f39c12" },
  LOW:    { label: "LOW",  bg: "#0a1f2d", border: "#1a6b8a", text: "#3498db", dot: "#3498db" },
};

export const STATUS_CONFIG = {
  OPEN:        { label: "OPEN",        bg: "#1a0a0a", border: "#7b241c", text: "#e74c3c" },
  IN_PROGRESS: { label: "IN PROGRESS", bg: "#1a1400", border: "#7d6608", text: "#f1c40f" },
  RESOLVED:    { label: "RESOLVED",    bg: "#0a1a0a", border: "#1e8449", text: "#2ecc71" },
  NOTED:       { label: "NOTED",       bg: "#0d0d1a", border: "#2c3e7a", text: "#7f8cff" },
};

export const CATEGORIES = ["All", "Programming", "Sensor Cal", "EBTRON Verify", "Airflow Review", "Setpoint Update", "FYI / No Action"];
export const PRIORITIES = ["All", "HIGH", "MEDIUM", "LOW"];
export const STATUSES   = ["All", "OPEN", "IN_PROGRESS", "RESOLVED", "NOTED"];
