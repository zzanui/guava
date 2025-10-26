const KEY = "guava:prefs";

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {
      notifications: { email: false, push: false, sms: false },
      favorites: [],
      notes: {},
      notesHistory: {},
      telecomId: null,
      cardIds: []
    };
  } catch (_) {
    return {
      notifications: { email: false, push: false, sms: false },
      favorites: [],
      notes: {},
      notesHistory: {},
      telecomId: null,
      cardIds: []
    };
  }
}

function write(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (_) {}
}

export function getPrefs() {
  return read();
}

export function setNotification(key, value) {
  const p = read();
  p.notifications[key] = Boolean(value);
  write(p);
  return p.notifications;
}

export function toggleFavorite(name) {
  const p = read();
  const has = p.favorites.includes(name);
  p.favorites = has ? p.favorites.filter((n) => n !== name) : [...p.favorites, name];
  write(p);
  return p.favorites;
}

export function removeFavorite(name) {
  const p = read();
  p.favorites = p.favorites.filter((n) => n !== name);
  write(p);
  return p.favorites;
}

// --- ID-based favorites (recommended) ---
function normalizeId(value) {
  if (value == null) return null;
  return String(value);
}

export function getFavoriteIds() {
  const p = read();
  // Backward compat: allow non-id entries (names) but prefer ids
  return (p.favorites || []).map((x) => String(x));
}

export function isFavorite(serviceId) {
  const id = normalizeId(serviceId);
  if (!id) return false;
  const set = new Set(getFavoriteIds());
  return set.has(id);
}

export function toggleFavoriteById(serviceId) {
  const id = normalizeId(serviceId);
  if (!id) return getFavoriteIds();
  const p = read();
  const list = (p.favorites || []).map((x) => String(x));
  const has = list.includes(id);
  p.favorites = has ? list.filter((x) => x !== id) : [...list, id];
  write(p);
  return p.favorites;
}

export function removeFavoriteById(serviceId) {
  const id = normalizeId(serviceId);
  if (!id) return getFavoriteIds();
  const p = read();
  const list = (p.favorites || []).map((x) => String(x));
  p.favorites = list.filter((x) => x !== id);
  write(p);
  return p.favorites;
}

// --- Service notes (memo) ---
export function getNote(serviceId) {
  const p = read();
  const id = serviceId == null ? null : String(serviceId);
  if (!id) return "";
  return (p.notes || {})[id] || "";
}

export function setNote(serviceId, text) {
  const p = read();
  const id = serviceId == null ? null : String(serviceId);
  if (!id) return "";
  p.notes = p.notes || {};
  const nextText = String(text || "");
  // 히스토리 적재(변경된 경우만)
  p.notesHistory = p.notesHistory || {};
  const prev = p.notes[id] ?? "";
  if (prev !== nextText && prev !== "") {
    const entry = { ts: Date.now(), value: prev };
    const hist = Array.isArray(p.notesHistory[id]) ? p.notesHistory[id] : [];
    // 최근 항목 우선, 최대 10개 보관
    p.notesHistory[id] = [entry, ...hist].slice(0, 10);
  }
  p.notes[id] = nextText;
  write(p);
  return p.notes[id];
}

export function deleteNote(serviceId) {
  const p = read();
  const id = serviceId == null ? null : String(serviceId);
  if (!id) return false;
  if (p.notes && Object.prototype.hasOwnProperty.call(p.notes, id)) {
    delete p.notes[id];
    write(p);
    return true;
  }
  return false;
}

export function getNoteHistory(serviceId) {
  const p = read();
  const id = serviceId == null ? null : String(serviceId);
  if (!id) return [];
  return Array.isArray(p.notesHistory?.[id]) ? p.notesHistory[id] : [];
}

// --- Backend sync helpers (client stub) ---
export function exportPrefsPayload() {
  const p = read();
  return {
    favorites: (p.favorites || []).map(String),
    notes: p.notes || {},
    notesHistory: p.notesHistory || {},
    updatedAt: Date.now(),
  };
}

export function importPrefsPayload(payload = {}) {
  // naive merge: server is authoritative
  try {
    const current = read();
    const next = {
      ...current,
      favorites: Array.isArray(payload.favorites) ? payload.favorites.map(String) : (current.favorites || []),
      notes: typeof payload.notes === 'object' && payload.notes ? payload.notes : (current.notes || {}),
      notesHistory: typeof payload.notesHistory === 'object' && payload.notesHistory ? payload.notesHistory : (current.notesHistory || {}),
    };
    write(next);
    return next;
  } catch (_) {
    return read();
  }
}

// --- Telecom & Card selections ---
export function setTelecom(telecomId) {
  const p = read();
  p.telecomId = telecomId == null ? null : String(telecomId);
  write(p);
  return p.telecomId;
}

export function toggleCard(cardId) {
  const p = read();
  const id = String(cardId);
  const has = (p.cardIds || []).includes(id);
  p.cardIds = has ? p.cardIds.filter((x) => x !== id) : [...(p.cardIds || []), id];
  write(p);
  return p.cardIds;
}

