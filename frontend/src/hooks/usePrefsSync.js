import { useCallback, useEffect, useRef, useState } from "react";
import { exportPrefsPayload, importPrefsPayload } from "../services/localPrefs.js";
import { syncPrefsToServer, fetchPrefsFromServer } from "../services/api";

export default function usePrefsSync({ auto = false } = {}) {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const mountedRef = useRef(true);

  useEffect(() => () => { mountedRef.current = false; }, []);

  const pull = useCallback(async () => {
    setError("");
    try {
      const remote = await fetchPrefsFromServer();
      importPrefsPayload(remote || {});
      return true;
    } catch (e) {
      setError("서버에서 환경을 불러오지 못했어요.");
      return false;
    }
  }, []);

  const push = useCallback(async () => {
    setError("");
    setSyncing(true);
    try {
      const payload = exportPrefsPayload();
      await syncPrefsToServer(payload);
      if (mountedRef.current) setSyncing(false);
      return true;
    } catch (e) {
      if (mountedRef.current) setSyncing(false);
      setError("서버와 동기화에 실패했어요.");
      return false;
    }
  }, []);

  useEffect(() => {
    if (!auto) return;
    // 초기 진입 시 서버 상태를 끌어오고, 그 후 한 번 푸시
    (async () => {
      await pull();
      await push();
    })();
  }, [auto, pull, push]);

  return { pull, push, syncing, error };
}


