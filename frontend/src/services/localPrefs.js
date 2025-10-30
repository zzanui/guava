const KEY = "guava:prefs";

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const base = raw ? JSON.parse(raw) : {
      notifications: { email: false, push: false, sms: false },
      bookmarks: [],
      notes: {},
      notesHistory: {},
      telecomId: null,
      cardIds: []
    };
    // migrate favorites -> bookmarks if needed and cleanup legacy key
    let dirty = false;
    if (!Array.isArray(base.bookmarks) && Array.isArray(base.favorites)) {
      base.bookmarks = base.favorites.map(String);
      dirty = true;
    }
    if (Object.prototype.hasOwnProperty.call(base, 'favorites')) {
      delete base.favorites;
      dirty = true;
    }
    if (dirty) {
      try { localStorage.setItem(KEY, JSON.stringify(base)); } catch (_) {}
    }
    return base;
  } catch (_) {
    return {
      notifications: { email: false, push: false, sms: false },
      bookmarks: [],
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

// --- Name-based bookmarks ---
export function toggleBookmark(name) {
  const p = read();
  const list = Array.isArray(p.bookmarks) ? p.bookmarks.map(String) : [];
  const has = list.includes(String(name));
  p.bookmarks = has ? list.filter((n) => n !== String(name)) : [...list, String(name)];
  write(p);
  return p.bookmarks;
}

export function removeBookmark(name) {
  const p = read();
  const list = Array.isArray(p.bookmarks) ? p.bookmarks.map(String) : [];
  p.bookmarks = list.filter((n) => n !== String(name));
  write(p);
  return p.bookmarks;
}

// --- ID-based bookmarks (recommended) ---
function normalizeId(value) {
  if (value == null) return null;
  return String(value);
}

export function getBookmarkIds() {
  const p = read();
  const list = Array.isArray(p.bookmarks) ? p.bookmarks : [];
  return list.map((x) => String(x));
}

export function isBookmarked(serviceId) {
  const id = normalizeId(serviceId);
  if (!id) return false;
  const set = new Set(getBookmarkIds());
  return set.has(id);
}

export function toggleBookmarkById(serviceId) {
  const id = normalizeId(serviceId);
  if (!id) return getBookmarkIds();
  const p = read();
  const list = (Array.isArray(p.bookmarks) ? p.bookmarks : []).map((x) => String(x));
  const has = list.includes(id);
  p.bookmarks = has ? list.filter((x) => x !== id) : [...list, id];
  write(p);
  return p.bookmarks;
}

export function removeBookmarkById(serviceId) {
  const id = normalizeId(serviceId);
  if (!id) return getBookmarkIds();
  const p = read();
  const list = (Array.isArray(p.bookmarks) ? p.bookmarks : []).map((x) => String(x));
  p.bookmarks = list.filter((x) => x !== id);
  write(p);
  return p.bookmarks;
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
    bookmarks: (p.bookmarks || []).map(String),
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
      bookmarks: Array.isArray(payload.bookmarks)
        ? payload.bookmarks.map(String)
        : (Array.isArray(payload.favorites) ? payload.favorites.map(String) : (current.bookmarks || [])),
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

