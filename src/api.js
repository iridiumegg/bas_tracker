const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function req(path, options = {}) {
  const token = localStorage.getItem("bas_token");
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`The server returned an unexpected response (HTTP ${res.status}). The backend may be down, still deploying, or running an old version.`);
  }
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

const post = (path, body) => req(path, { method: "POST", body: JSON.stringify(body) });
const put = (path, body) => req(path, { method: "PUT", body: JSON.stringify(body) });
const del = (path) => req(path, { method: "DELETE" });

export const api = {
  // Auth
  needsSetup: () => req("/auth/needs-setup"),
  setup: (body) => post("/auth/setup", body),
  login: (username, password) => post("/auth/login", { username, password }),
  me: () => req("/auth/me"),
  updateMe: (body) => put("/me", body),

  // Users
  getUsers: () => req("/users"),
  createUser: (body) => post("/users", body),
  updateUser: (id, body) => put(`/users/${id}`, body),

  // Settings / status bar
  getSettings: () => req("/settings"),
  setStatusBar: (message) => put("/settings/status", { message }),
  setStatusOptions: (options) => put("/settings/status-options", { options }),

  // Projects
  getProjects: () => req("/projects"),
  getProject: (slug) => req(`/projects/by-slug/${slug}`),
  createProject: (body) => post("/projects", body),
  updateProject: (id, body) => put(`/projects/${id}`, body),
  archiveProject: (id) => del(`/projects/${id}`),

  // Tasks
  createTask: (projectId, body) => post(`/projects/${projectId}/tasks`, body),
  updateTask: (id, body) => put(`/tasks/${id}`, body),
  archiveTask: (id) => del(`/tasks/${id}`),

  // Notes
  getNotes: (taskId) => req(`/tasks/${taskId}/notes`),
  addNote: (taskId, content) => post(`/tasks/${taskId}/notes`, { content }),
  updateNote: (noteId, body) => put(`/notes/${noteId}`, body),

  // Activity & summary
  getActivity: (params = {}) => req(`/activity?${new URLSearchParams(params)}`),
  getSummary: (date, scope) => req(`/summary?${new URLSearchParams({ date, scope })}`),
};
