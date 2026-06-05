import { useState } from "react";

function storageKey(projectId, itemId) {
  return `bas_status_${projectId}_${itemId}`;
}

export function useProjectItems(projectId, initialItems) {
  const [items, setItems] = useState(() =>
    initialItems.map(item => {
      const saved = localStorage.getItem(storageKey(projectId, item.id));
      return saved ? { ...item, status: saved } : item;
    })
  );

  const setStatus = (id, status) => {
    localStorage.setItem(storageKey(projectId, id), status);
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };

  return { items, setStatus };
}

export function getStoredCounts(projectId, initialItems) {
  let open = 0, inProgress = 0, resolved = 0, noted = 0;
  for (const item of initialItems) {
    const status = localStorage.getItem(storageKey(projectId, item.id)) || item.status;
    if (status === "OPEN") open++;
    else if (status === "IN_PROGRESS") inProgress++;
    else if (status === "RESOLVED") resolved++;
    else if (status === "NOTED") noted++;
  }
  return { open, inProgress, resolved, noted, total: initialItems.length };
}
