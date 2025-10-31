import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const GuavaDialogContext = createContext({
  alert: async (_message) => {},
  confirm: async (_message) => false,
});

export function GuavaDialogProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState("alert"); // 'alert' | 'confirm'
  const resolverRef = useRef(null);

  const close = useCallback(() => {
    setOpen(false);
    const resolve = resolverRef.current;
    resolverRef.current = null;
    if (typeof resolve === "function") resolve(mode === "confirm" ? false : true);
  }, [mode]);

  const alert = useCallback((msg) => {
    setMessage(String(msg || ""));
    setMode("alert");
    setOpen(true);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const confirm = useCallback((msg) => {
    setMessage(String(msg || ""));
    setMode("confirm");
    setOpen(true);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const value = useMemo(() => ({ alert, confirm }), [alert, confirm]);

  return (
    <GuavaDialogContext.Provider value={value}>
      {children}
      {open && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={close} />
          <div role="dialog" aria-modal="true" aria-labelledby="guava-alert-title" className="relative w-full max-w-sm rounded-2xl bg-slate-900 p-6 ring-1 ring-white/10 shadow-xl text-slate-100">
            <h3 id="guava-alert-title" className="text-lg font-semibold">구아바</h3>
            <div className="mt-3 text-slate-200 whitespace-pre-wrap break-words">{message}</div>
            {mode === "alert" ? (
              <div className="mt-5 flex justify-end">
                <button onClick={close} className="px-4 py-2 rounded-2xl btn-primary text-slate-50 font-semibold hover:opacity-95">확인</button>
              </div>
            ) : (
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={close} className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15">취소</button>
                <button onClick={() => { setOpen(false); const resolve = resolverRef.current; resolverRef.current = null; if (typeof resolve === "function") resolve(true); }} className="px-4 py-2 rounded-2xl btn-primary text-slate-50 font-semibold hover:opacity-95">확인</button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </GuavaDialogContext.Provider>
  );
}

export function useGuavaDialog() {
  return useContext(GuavaDialogContext);
}


