const KEY = "guava:prefs";

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { notifications: { email: false, push: false, sms: false }, favorites: [] };
  } catch (_) {
    return { notifications: { email: false, push: false, sms: false }, favorites: [] };
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

