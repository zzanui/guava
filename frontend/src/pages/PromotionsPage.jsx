import React, { useEffect, useState } from "react";
import { listPromotions } from "../services/mockApi";
import api from "../services/api";
import { getPrefs } from "../services/localPrefs";

export default function PromotionsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [telecoms, setTelecoms] = useState([]);
  const [cards, setCards] = useState([]);
  const [filters, setFilters] = useState({
    targetType: 'all',
    targetId: '',
    telecomId: getPrefs().telecomId || '',
    cardIds: (getPrefs().cardIds || []),
    activeOnly: true,
  });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        const [telResp, cardResp, list] = await Promise.all([
          api.get('/api/telecoms/'),
          api.get('/api/cards/'),
          listPromotions(filters),
        ]);
        if (!cancelled) {
          setTelecoms(Array.isArray(telResp?.data) ? telResp.data : []);
          setCards(Array.isArray(cardResp?.data) ? cardResp.data : []);
          setRows(list);
        }
      } catch (_) {
        if (!cancelled) setError("프로모션을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [filters]);

  return (
    <div className="container-page section-y">
      <div className="mx-auto w-full max-w-5xl">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">프로모션</h1>
      {loading && <div className="text-slate-400 mt-4">불러오는 중…</div>}
      {error && <div className="text-red-400 mt-4">{error}</div>}
      {!loading && !error && (
        <>
        <div className="mt-6 rounded-2xl bg-slate-900/60 p-4 ring-1 ring-white/10">
          <div className="grid md:grid-cols-4 gap-3">
            <div>
              <label className="text-sm text-slate-400">대상</label>
              <select className="mt-1 w-full rounded-2xl bg-slate-900 border border-white/10 px-3 py-2" value={filters.targetType} onChange={(e)=> setFilters((f)=> ({...f, targetType: e.target.value}))}>
                <option value="all">전체</option>
                <option value="service">서비스</option>
                <option value="plan">요금제</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-400">대상 ID</label>
              <input className="mt-1 w-full rounded-2xl bg-slate-900 border border-white/10 px-3 py-2" placeholder="예: 1 또는 102" value={filters.targetId} onChange={(e)=> setFilters((f)=> ({...f, targetId: e.target.value}))} />
            </div>
            <div>
              <label className="text-sm text-slate-400">통신사</label>
              <select className="mt-1 w-full rounded-2xl bg-slate-900 border border-white/10 px-3 py-2" value={filters.telecomId || ''} onChange={(e)=> setFilters((f)=> ({...f, telecomId: e.target.value}))}>
                <option value="">전체/무관</option>
                {telecoms.map((t)=> (
                  <option key={t.id || t.telecom_id} value={(t.id ?? t.telecom_id) ?? ''}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-400">활성만</label>
              <div className="mt-2">
                <input type="checkbox" checked={filters.activeOnly} onChange={(e)=> setFilters((f)=> ({...f, activeOnly: e.target.checked}))} />
                <span className="ml-2 text-sm">오늘 기준 유효한 프로모션만</span>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <label className="text-sm text-slate-400">제휴 카드</label>
            <div className="mt-2 grid md:grid-cols-3 gap-2">
              {cards.map((c)=> {
                const id = String(c.id || c.card_id);
                const checked = (filters.cardIds || []).map(String).includes(id);
                return (
                  <label key={id} className="flex items-center gap-2">
                    <input type="checkbox" checked={checked} onChange={()=> setFilters((f)=> ({...f, cardIds: checked ? f.cardIds.filter((x)=> String(x)!==id) : [...f.cardIds, id]}))} />
                    <span className="truncate">{c.issuer ? `${c.issuer} ${c.name}` : c.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
        <ul className="mt-6 divide-y divide-white/10 rounded-2xl bg-slate-900/60 ring-1 ring-white/10">
          {rows.map((p) => (
            <li key={p.promo_id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">{p.name}</div>
                <div className="text-sm text-slate-400">{p.description}</div>
              </div>
              <div className="text-sm text-slate-300">
                {p.discount_type === 'percent' ? `${p.discount_value}%` : `₩ ${Number(p.discount_value||0).toLocaleString()}`}
              </div>
            </li>
          ))}
        </ul>
        </>
      )}
      </div>
    </div>
  );
}


