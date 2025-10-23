import React, { useEffect, useState } from "react";
import { listBundles } from "../services/mockApi";

export default function BundlesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        const list = await listBundles();
        if (!cancelled) setRows(list);
      } catch (_) {
        if (!cancelled) setError("결합상품을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
      <h1 className="text-3xl font-extrabold">결합상품</h1>
      {loading && <div className="text-slate-400 mt-4">불러오는 중…</div>}
      {error && <div className="text-red-400 mt-4">{error}</div>}
      {!loading && !error && (
        <ul className="mt-6 divide-y divide-white/10 rounded-2xl bg-slate-900/60 ring-1 ring-white/10">
          {rows.map((b) => (
            <li key={b.bundle_id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">{b.name}</div>
                <div className="text-sm text-slate-400">{b.description}</div>
              </div>
              <div className="text-sm text-slate-300">₩ {Number(b.total_price||0).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


