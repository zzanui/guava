import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getServiceDetail } from "../services/mockApi";

export default function ServiceDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const d = await getServiceDetail(id);
      if (!cancelled) setData(d);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-7xl px-4 py-10">로딩 중…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">{data.name}</h1>

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
            <h2 className="font-semibold">요금제</h2>
            <ul className="mt-3 space-y-2">
              {data.plans.map((p) => (
                <li key={p.name} className="flex items-center justify-between">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-slate-300">{p.price}</div>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <label className="text-sm block mb-1" htmlFor="plan">내 구독에 추가할 요금제</label>
              <select
                id="plan"
                className="w-full rounded-2xl bg-slate-900 border border-white/10 px-3 py-2"
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
              >
                <option value="">선택하기</option>
                {data.plans.map((p) => (
                  <option key={p.name} value={p.name}>{p.name} — {p.price}</option>
                ))}
              </select>
              <button
                onClick={() => setOpen(true)}
                disabled={!selectedPlan}
                className="mt-3 rounded-2xl px-4 py-2 bg-cyan-400 text-slate-900 font-semibold hover:opacity-90 disabled:opacity-50 transition"
                aria-label="내 구독에 추가"
              >
                내 구독에 추가
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
            <h2 className="font-semibold">주요 혜택</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {Array.from(
                new Set(data.plans.flatMap((p) => p.benefits || []))
              ).map((b) => (
                <span key={b} className="text-xs px-2 py-1 rounded-full bg-white/10 text-slate-300">
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 p-6 ring-1 ring-white/10">
            <h3 className="text-lg font-semibold">내 구독에 추가</h3>
            <p className="mt-2 text-slate-300">{data.name} · {selectedPlan}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15">취소</button>
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-2xl bg-cyan-400 text-slate-900 font-semibold hover:opacity-90">추가</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


