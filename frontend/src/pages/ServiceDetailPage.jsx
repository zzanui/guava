import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getServiceDetail } from "../services/serviceService";
import { addSubscription } from "../services/subscriptionService";
import { addSubscription as addLocalSubscription } from "../services/localSubscriptions.js";
import { toggleFavorite } from "../services/localPrefs.js";
import { getPriceHistory, listPromotions, listBundles } from "../services/mockApi";

export default function ServiceDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [priceHistory, setPriceHistory] = useState([]);
  const [promos, setPromos] = useState([]);
  const [bundles, setBundles] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const s = await getServiceDetail(id);
      // backend ServiceDetailSerializer 매핑
      const mapped = {
        id: s.id,
        name: s.name,
        officialUrl: s.official_link || undefined,
        plans: Array.isArray(s.plans) ? s.plans.map((p) => ({
          id: p.id,
          name: p.plan_name,
          price: `₩ ${Number(p.price || 0).toLocaleString()}`,
          cycle: p.billing_cycle === 'year' ? '연' : '월',
          benefits: (p.benefits || '').split(',').map((v)=> v.trim()).filter(Boolean),
          freeTrial: false,
        })) : [],
      };
      if (!cancelled) setData(mapped);
      // 읽기 전용: 가격이력/프로모션/번들(목업)
      try {
        const [ph, pm, bd] = await Promise.all([
          getPriceHistory(id),
          listPromotions({ targetType: "service", targetId: id }),
          listBundles(),
        ]);
        if (!cancelled) {
          setPriceHistory(ph);
          setPromos(pm);
          setBundles(bd);
        }
      } catch (_) {}
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
        <div className="flex items-center justify-between">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">{data.name}</h1>
          <button onClick={()=> toggleFavorite(data.name)} className="px-3 py-1 rounded-2xl bg-white/10 hover:bg-white/15">즐겨찾기</button>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
            <h2 className="font-semibold">요금제</h2>
            <ul className="mt-3 space-y-2">
              {data.plans.map((p) => (
                <li key={p.name} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{p.cycle || "월"} 결제 {p.freeTrial ? "· 무료체험 제공" : ""}</div>
                  </div>
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
        {data.officialUrl && (
          <div className="mt-6">
            <a href={data.officialUrl} target="_blank" rel="noreferrer" className="text-cyan-300 hover:underline">공식 페이지로 이동 ↗</a>
          </div>
        )}
        {/* 읽기 전용: 가격이력/프로모션/번들 */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
            <h2 className="font-semibold">가격 이력</h2>
            {priceHistory.length === 0 ? (
              <div className="text-slate-400 mt-2">기록이 없습니다.</div>
            ) : (
              <ul className="mt-3 space-y-2">
                {priceHistory.map((h) => (
                  <li key={h.price_id} className="text-sm text-slate-300 flex justify-between">
                    <span>{new Date(h.start_date).toLocaleDateString()} ~ {h.end_date ? new Date(h.end_date).toLocaleDateString() : '현재'}</span>
                    <span>₩ {Number(h.price||0).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
            <h2 className="font-semibold">프로모션</h2>
            {promos.length === 0 ? (
              <div className="text-slate-400 mt-2">진행 중인 프로모션이 없습니다.</div>
            ) : (
              <ul className="mt-3 space-y-2">
                {promos.map((p) => (
                  <li key={p.promo_id} className="text-sm text-slate-300 flex justify-between">
                    <span className="truncate mr-2">{p.name}</span>
                    <span className="text-slate-400">{p.discount_type === 'percent' ? `${p.discount_value}%` : `₩ ${Number(p.discount_value||0).toLocaleString()}`}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
            <h2 className="font-semibold">결합상품</h2>
            {bundles.length === 0 ? (
              <div className="text-slate-400 mt-2">결합상품이 없습니다.</div>
            ) : (
              <ul className="mt-3 space-y-2">
                {bundles.map((b) => (
                  <li key={b.bundle_id} className="text-sm text-slate-300 flex justify-between">
                    <span className="truncate mr-2">{b.name}</span>
                    <span>₩ {Number(b.total_price||0).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
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
              <button
                onClick={async () => {
                  const p = data.plans.find((x)=> x.name===selectedPlan);
                  if (!p?.id) {
                    // plan id가 없으면 추가 불가
                    setOpen(false);
                    return;
                  }
                  try {
                    await addSubscription(p.id);
                    // 서버 추가 성공 시, 마이페이지(로컬 저장 기반)도 즉시 반영되도록 동기 저장
                    const priceValue = Number(String(p.price || "").replace(/[^0-9.]/g, "")) || 0;
                    addLocalSubscription({ name: `${data.name} ${p.name}`, priceValue });
                  } catch (_) {}
                  setOpen(false);
                }}
                className="px-4 py-2 rounded-2xl bg-cyan-400 text-slate-900 font-semibold hover:opacity-90"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


