const KEY = "guava:subscriptions";

function readStore() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function writeStore(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (_) {}
}

export function listSubscriptions() {
  return readStore();
}

export function addSubscription(item) {
  const list = readStore();
  const id = item?.id || Date.now();
  const next = [...list, { ...item, __id: id }];
  writeStore(next);
  return id;
}

export function removeSubscription(id) {
  const list = readStore();
  writeStore(list.filter((s) => s.__id !== id));
}

export function monthlyTotal() {
  const list = readStore();
  return list
    .map((s) => Number(s.priceValue || s.price || 0))
    .filter((n) => Number.isFinite(n))
    .reduce((a, b) => a + b, 0);
}


