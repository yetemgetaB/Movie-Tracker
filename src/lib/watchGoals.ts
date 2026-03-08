// Watch time goals — monthly targets stored in localStorage

const KEY = "movie_tracker_watch_goals";

export interface WatchGoal {
  month: string; // "YYYY-MM"
  targetHours: number;
}

function getGoals(): WatchGoal[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

function saveGoals(goals: WatchGoal[]) {
  localStorage.setItem(KEY, JSON.stringify(goals));
}

export function getCurrentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export function getGoal(month?: string): WatchGoal | null {
  const key = month || getCurrentMonthKey();
  return getGoals().find(g => g.month === key) || null;
}

export function setGoal(targetHours: number, month?: string): void {
  const key = month || getCurrentMonthKey();
  const goals = getGoals().filter(g => g.month !== key);
  goals.push({ month: key, targetHours });
  saveGoals(goals);
}

export function removeGoal(month?: string): void {
  const key = month || getCurrentMonthKey();
  saveGoals(getGoals().filter(g => g.month !== key));
}
