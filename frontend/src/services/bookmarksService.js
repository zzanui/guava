// Unified bookmarks client: tries backend first, falls back to localPrefs
import api from "./api";
import { getAccessToken } from "./tokenStorage";
import {
  getBookmarkIds as getLocalIds,
  isBookmarked as isLocalBookmarked,
  toggleBookmarkById as toggleLocalById,
  removeBookmarkById as removeLocalById,
  getNote as getLocalNote,
  setNote as setLocalNote,
  exportPrefsPayload,
} from "./localPrefs";

async function listFromServer() {
  try {
    // 백엔드 표준: /api/my/bookmarks/ → [{ id, service, memo, created_at }, ...]
    const { data } = await api.get("/api/my/bookmarks/");
    const list = Array.isArray(data) ? data : [];
    const ids = list.map((b) => b?.service).filter((v) => v !== undefined && v !== null);
    return ids.map(String);
  } catch (_) {
    return null;
  }
}

export async function listBookmarks() {
  const token = getAccessToken();
  if (!token) {
    // 비로그인 상태에서는 로컬 즐겨찾기를 노출하지 않음
    return [];
  }
  const server = await listFromServer();
  if (server) return server;
  return getLocalIds();
}

export async function addBookmark(serviceId) {
  const id = String(serviceId);
  try {
    // 백엔드 필드명: service
    await api.post("/api/my/bookmarks/", { service: id });
    return { ok: true, source: "server" };
  } catch (err) {
    // 인증 오류(401/403)인 경우 로컬 폴백 금지
    const status = err?.response?.status;
    if (status === 401 || status === 403 || !getAccessToken()) {
      throw err;
    }
    // 기타 네트워크 오류 시에만 로컬 폴백 허용
    toggleLocalById(id);
    return { ok: true, source: "local" };
  }
}

export async function removeBookmark(serviceId) {
  const id = String(serviceId);
  try {
    // 서비스 ID로 대응되는 북마크 ID를 조회 후 삭제
    const { data } = await api.get("/api/my/bookmarks/");
    const list = Array.isArray(data) ? data : [];
    const found = list.find((b) => String(b?.service) === id);
    if (found && found.id !== undefined && found.id !== null) {
      await api.delete(`/api/my/bookmarks/${found.id}/`);
    }
    return { ok: true, source: "server" };
  } catch (err) {
    // 인증 오류(401/403)인 경우 로컬 폴백 금지
    const status = err?.response?.status;
    if (status === 401 || status === 403 || !getAccessToken()) {
      throw err;
    }
    // 기타 네트워크 오류 시에만 로컬 폴백 허용
    removeLocalById(id);
    return { ok: true, source: "local" };
  }
}

export async function isBookmarked(serviceId) {
  const id = String(serviceId);
  try {
    const ids = await listBookmarks();
    return ids.includes(id);
  } catch (_) {
    return isLocalBookmarked(id);
  }
}

// --- Memo helpers (backed by bookmarks.memo) ---
export async function getBookmarkMemo(serviceId) {
  const id = String(serviceId);
  try {
    const { data } = await api.get("/api/my/bookmarks/");
    const list = Array.isArray(data) ? data : [];
    const found = list.find((b) => String(b?.service) === id);
    return String(found?.memo || "");
  } catch (_) {
    try { return String(getLocalNote(id) || ""); } catch { return ""; }
  }
}

export async function setBookmarkMemo(serviceId, memoText) {
  const id = String(serviceId);
  const memo = String(memoText || "").trim();
  try {
    const { data } = await api.get("/api/my/bookmarks/");
    const list = Array.isArray(data) ? data : [];
    const found = list.find((b) => String(b?.service) === id);
    if (found && found.id !== undefined && found.id !== null) {
      await api.patch(`/api/my/bookmarks/${found.id}/`, { memo });
    } else {
      await api.post("/api/my/bookmarks/", { service: id, memo });
    }
    return { ok: true, source: "server" };
  } catch (_) {
    try { setLocalNote(id, memo); } catch {}
    return { ok: true, source: "local" };
  }
}

export async function listBookmarkEntries() {
  try {
    const { data } = await api.get("/api/my/bookmarks/");
    return Array.isArray(data) ? data : [];
  } catch (_) {
    try {
      const payload = exportPrefsPayload();
      const notes = payload?.notes && typeof payload.notes === 'object' ? payload.notes : {};
      return Object.entries(notes).map(([service, memo]) => ({ service: String(service), memo: String(memo || "") }));
    } catch {
      return [];
    }
  }
}

export async function clearBookmarkMemo(serviceId) {
  return setBookmarkMemo(serviceId, "");
}


