export function readLocalItems<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") {
    return [...fallback];
  }
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return [...fallback];
  }
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [...fallback];
  }
}

export function writeLocalItems<T>(key: string, items: T[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(items));
}

export function upsertLocalItem<T extends { id: number }>(items: T[], item: T) {
  return [item, ...items.filter((current) => current.id !== item.id)];
}

export function formatLocalDateTime() {
  return new Date().toISOString().replace("T", " ").slice(0, 16);
}

export function formatLocalDate() {
  return new Date().toISOString().slice(0, 10);
}
