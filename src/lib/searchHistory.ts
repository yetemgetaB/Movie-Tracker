// Centralized search history utility

export function getSearchHistory(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

export function addToSearchHistory(key: string, term: string): void {
  const history = getSearchHistory(key).filter(h => h !== term).slice(0, 9);
  localStorage.setItem(key, JSON.stringify([term, ...history]));
}
