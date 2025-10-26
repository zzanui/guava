// Unified favorites client: tries backend first, falls back to localPrefs
import api from "./api";
import {
  getFavoriteIds as getLocalIds,
  isFavorite as isLocalFavorite,
  toggleFavoriteById as toggleLocalById,
  removeFavoriteById as removeLocalById,
} from "./localPrefs";

export async function listFavorites() {
  try {
    const { data } = await api.get("/api/my/favorites/");
    // Expecting { ids: ["1","2",...] } or array
    const ids = Array.isArray(data) ? data : Array.isArray(data?.ids) ? data.ids : [];
    return ids.map(String);
  } catch (_) {
    return getLocalIds();
  }
}

export async function addFavorite(serviceId) {
  const id = String(serviceId);
  try {
    await api.post("/api/my/favorites/", { service_id: id });
    return { ok: true, source: "server" };
  } catch (_) {
    toggleLocalById(id);
    return { ok: true, source: "local" };
  }
}

export async function removeFavorite(serviceId) {
  const id = String(serviceId);
  try {
    await api.delete(`/api/my/favorites/${id}/`);
    return { ok: true, source: "server" };
  } catch (_) {
    removeLocalById(id);
    return { ok: true, source: "local" };
  }
}

export async function isFavorite(serviceId) {
  const id = String(serviceId);
  try {
    const ids = await listFavorites();
    return ids.includes(id);
  } catch (_) {
    return isLocalFavorite(id);
  }
}


