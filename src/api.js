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
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  login: (username, password) => req("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  register: (username, display_name, password, signup_code) => req("/auth/register", { method: "POST", body: JSON.stringify({ username, display_name, password, signup_code }) }),
  me: () => req("/auth/me"),

  getStatuses: (projectId) => req(`/projects/${projectId}/statuses`),
  setStatus: (projectId, itemId, status) =>
    req(`/projects/${projectId}/items/${itemId}/status`, { method: "PUT", body: JSON.stringify({ status }) }),

  getNotes: (projectId, itemId) => req(`/projects/${projectId}/items/${itemId}/notes`),
  addNote: (projectId, itemId, content) =>
    req(`/projects/${projectId}/items/${itemId}/notes`, { method: "POST", body: JSON.stringify({ content }) }),
};
