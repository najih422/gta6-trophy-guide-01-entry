// store.js — the ledger's memory: earned trophies and reader prefs in localStorage,
// plus export to a file and import back. One clear job: persistence, nothing else.

export const EARNED_KEY = 'leonida-ledger-earned-v1';
export const PREFS_KEY = 'leonida-ledger-prefs-v1';

// Read the earned set from localStorage. Bad or missing data means an empty set,
// never a crash — a fresh reader starts with nothing earned.
export function loadEarned() {
  try {
    const raw = localStorage.getItem(EARNED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id) => Number.isInteger(id)));
  } catch {
    return new Set();
  }
}

// Write the earned set back. The set is stored as a sorted array of trophy ids.
export function saveEarned(earned) {
  const ids = [...earned].filter((id) => Number.isInteger(id)).sort((a, b) => a - b);
  localStorage.setItem(EARNED_KEY, JSON.stringify(ids));
}

// Read reader prefs (spoilers, kind filter, view, search). Defaults: spoilers on,
// all kinds, checklist view, no search text.
export function loadPrefs() {
  const defaults = { spoilers: true, kind: 'all', view: 'checklist', query: '' };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return { ...defaults };
    return {
      spoilers: typeof parsed.spoilers === 'boolean' ? parsed.spoilers : defaults.spoilers,
      kind: ['all', 'story', 'missable', 'collectible', 'activity', 'online'].includes(parsed.kind)
        ? parsed.kind
        : defaults.kind,
      view: parsed.view === 'roadmap' ? 'roadmap' : defaults.view,
      query: typeof parsed.query === 'string' ? parsed.query : defaults.query,
    };
  } catch {
    return { ...defaults };
  }
}

// Persist the prefs object.
export function savePrefs(prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// Build the export payload: earned ids plus a marker so an import can tell
// a ledger file from any other JSON.
export function buildExportPayload(earned) {
  return JSON.stringify(
    { app: 'leonida-ledger', version: 1, earned: [...earned].sort((a, b) => a - b) },
    null,
    2,
  );
}

// Parse an imported file's text into an earned set. Returns null when the text
// is not a ledger payload (wrong shape, wrong ids) so the caller can warn.
export function parseImportPayload(text) {
  try {
    const parsed = JSON.parse(text);
    const ids = Array.isArray(parsed) ? parsed : parsed.earned;
    if (!Array.isArray(ids)) return null;
    const clean = ids.filter((id) => Number.isInteger(id) && id >= 1 && id <= 55);
    if (clean.length === 0 && ids.length > 0) return null;
    return new Set(clean);
  } catch {
    return null;
  }
}

// Download a text blob as a file, using a temporary anchor.
export function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

// Wipe all of the ledger's saved state.
export function clearSavedState() {
  localStorage.removeItem(EARNED_KEY);
  localStorage.removeItem(PREFS_KEY);
}
