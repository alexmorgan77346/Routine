// ============================================================
//  storage.js — LocalStorage Layer
//  All data lives in the browser. No login needed.
// ============================================================

const KEYS = {
  fixed:   'routine_fixed',
  daily:   'routine_daily',
  history: 'routine_history',
};

// ── Helpers ──────────────────────────────────────────────────

function todayKey() {
  return new Date().toISOString().split('T')[0]; // "2026-02-19"
}

function formatDate(key) {
  const [y, m, d] = key.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun',
                  'Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
}

function lsGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

function lsSet(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function calcPct(tasks) {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter(t => t.done).length / tasks.length) * 100);
}

// ── Fixed Routine ─────────────────────────────────────────────

function getFixedTasks() {
  return lsGet(KEYS.fixed, []);
}

function saveFixedTasks(tasks) {
  lsSet(KEYS.fixed, tasks);
}

// ── Daily Tasks ───────────────────────────────────────────────

function getDailyTasks() {
  const all = lsGet(KEYS.daily, {});
  return all[todayKey()] || [];
}

function saveDailyTasks(tasks) {
  const all = lsGet(KEYS.daily, {});
  all[todayKey()] = tasks;
  lsSet(KEYS.daily, all);
}

// ── History ───────────────────────────────────────────────────

function getHistory() {
  const obj = lsGet(KEYS.history, {});
  return Object.entries(obj)
    .sort((a, b) => b[0].localeCompare(a[0]))  // newest first
    .map(([date, pct]) => ({ date, pct }));
}

function saveHistoryEntry(pct) {
  const obj = lsGet(KEYS.history, {});
  obj[todayKey()] = pct;
  lsSet(KEYS.history, obj);
}
