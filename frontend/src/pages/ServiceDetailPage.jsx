import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
// 💡 1. Mock API 대신 실제 API 서비스 함수를 import 합니다.
import { getServiceDetail } from "../services/serviceService";
import DetailServiceCard from "../components/ServiceCard"; // 요금제 표시에 필요하다면 사용
import { addSubscription } from "../services/subscriptionService";
import { getServiceDetail } from "../services/serviceService";
import { addSubscription } from "../services/subscriptionService";
import { addSubscription as addLocalSubscription } from "../services/localSubscriptions.js";
import { toggleFavorite } from "../services/localPrefs.js";
import { getPriceHistory, listPromotions, listBundles } from "../services/mockApi";

export default function ServiceDetailPage() {
  // 💡 2. URL의 동적인 ID 값을 가져옵니다.
  const { id } = useParams();

  const [service, setService] = useState(null); // 상세 정보 (요금제 포함)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [priceHistory, setPriceHistory] = useState([]);
  const [promos, setPromos] = useState([]);
  const [bundles, setBundles] = useState([]);

  useEffect(() => {
    // URL의 id가 바뀔 때마다 실행됩니다.
    if (!id) return; // id가 없으면 실행하지 않음

    async function run() {
      setLoading(true);
      setError("");
      try {
        // 💡 3. URL에서 가져온 id로 실제 API를 호출합니다.
        const data = await getServiceDetail(id);
        setService(data);
      } catch (e) {
        console.error("상세 정보 로딩 실패:", e);
        setError("서비스 정보를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
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
  }, [id]); // 💡 4. 의존성 배열에 id를 꼭 넣어줍니다.

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;
  if (!service) return <div>서비스 정보가 없습니다.</div>;
  const handleAddSubscription = async (planId) => {
    try {
      // API 호출 (인증 토큰은 api.js가 자동으로 처리)
      await addSubscription(planId);

      // 3. 성공 피드백
      alert("구독이 성공적으로 추가되었습니다! '마이페이지'에서 확인하세요.");

    } catch (error) {
      console.error("구독 추가 실패:", error);
      // 401 오류(로그인 안 됨) 등 다양한 에러 처리
      alert("구독 추가에 실패했습니다. 로그인 상태를 확인해주세요.");
    }
  };
  return (
    <div>
      <h1>{service.name}</h1>
      <p>{service.description}</p>
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">{data.name}</h1>
          <button onClick={()=> toggleFavorite(data.name)} className="px-3 py-1 rounded-2xl bg-white/10 hover:bg-white/15">즐겨찾기</button>
        </div>

    <div>
    {service.plans && service.plans.map((plan) => {
        const cycleText = plan.billing_cycle === 'month' ? '월' : '연';
        const formattedPrice = `₩ ${parseInt(plan.price).toLocaleString('ko-KR')}`;

        return (
          <DetailServiceCard
            key={plan.id}
            name={plan.plan_name}
            price={formattedPrice} // 가공된 가격 문자열
            benefits={plan.benefits}
            billing_cycle={cycleText} // '월' 또는 '연'
            onAdd={() => handleAddSubscription(plan.id)}
          />
        );
    })}
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
  </div>
  );
}