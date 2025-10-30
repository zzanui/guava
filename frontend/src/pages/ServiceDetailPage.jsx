import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
// 💡 1. Mock API 대신 실제 API 서비스 함수를 import 합니다.
import { getServiceDetail } from "../services/serviceService";
import DetailServiceCard from "../components/ServiceCard"; // 요금제 표시에 필요하다면 사용
import { addSubscription, getSubscriptions } from "../services/subscriptionService";
import { addSubscription as addLocalSubscription } from "../services/localSubscriptions.js";
import { getBookmarkMemo, setBookmarkMemo } from "../services/bookmarksService";
import { addBookmark as addFavApi, isBookmarked as isFavApi } from "../services/bookmarksService";
import { getPriceHistory, listPromotions, listBundles } from "../services/mockApi";
import SidebarLayout from "../layouts/SidebarLayout.jsx";
import useAuth from "../hooks/useAuth";

export default function ServiceDetailPage() {
  // 💡 2. URL의 동적인 ID 값을 가져옵니다.
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth() || {};

  const [service, setService] = useState(null); // 상세 정보 (요금제 포함)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addStep, setAddStep] = useState("select"); // select | details
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [nextPaymentDate, setNextPaymentDate] = useState("");
  const [customMemo, setCustomMemo] = useState("");
  const [priceHistory, setPriceHistory] = useState([]);
  const [promos, setPromos] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    // URL의 id가 바뀔 때마다 실행됩니다.
    if (!id) return; // id가 없으면 실행하지 않음

    let cancelled = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        const s = await getServiceDetail(id);
        if (cancelled) return;
        setService(s);
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
        setData(mapped);
        try {
          const memo = await getBookmarkMemo(id);
          setNoteText(memo || "");
        } catch (_) { setNoteText(""); }
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
      } catch (e) {
        if (!cancelled) {
          console.error("상세 정보 로딩 실패:", e);
          setError("서비스 정보를 불러오는 데 실패했습니다.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [id]); // 💡 4. 의존성 배열에 id를 꼭 넣어줍니다.

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;
  if (!service) return <div>서비스 정보가 없습니다.</div>;
  const openAdd = async (planId) => {
    if (!isAuthenticated) {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/login", { replace: false, state: { from: location } });
      return;
    }
    setSelectedPlanId(planId || null);
    // 기본값: 오늘 날짜, 주기에 따른 다음 결제일 자동 채움
    try {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const start = `${yyyy}-${mm}-${dd}`;
      setStartDate(start);
      const plan = (service?.plans || []).find((p) => p.id === planId);
      const cycle = plan?.billing_cycle || "month";
      const next = (() => {
        const base = new Date(start);
        if (cycle === "year") {
          return `${base.getFullYear() + 1}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(base.getDate()).padStart(2, "0")}`;
        }
        const y = base.getFullYear();
        const m = base.getMonth();
        const d = base.getDate();
        const nx = new Date(y, m + 1, d);
        return `${nx.getFullYear()}-${String(nx.getMonth() + 1).padStart(2, "0")}-${String(nx.getDate()).padStart(2, "0")}`;
      })();
      setNextPaymentDate(next);
    } catch (_) {
      setStartDate("");
      setNextPaymentDate("");
    }
    setCustomMemo("");
    setAddStep("select");
    setAddOpen(true);
  };

  const handleAddSubscription = async () => {
    if (!selectedPlanId) return;
    try {
      // 현재 내 구독 리스트 조회 후 중복 확인
      try {
        const my = await getSubscriptions();
        const items = Array.isArray(my?.results) ? my.results : [];
        const already = items.some((s)=> String(s.plan) === String(selectedPlanId));
        if (already) {
          const ok = window.confirm("이미 내 구독리스트에 있습니다. 그래도 추가하시겠습니까?");
          if (!ok) return;
        }
      } catch (_) {}

      // API 호출 (인증 토큰은 api.js가 자동으로 처리)
      await addSubscription(selectedPlanId, {
        start_date: startDate,
        next_payment_date: nextPaymentDate,
        custom_memo: customMemo,
      });

      // 3. 성공 피드백 (하이라이트 토스트)
      setToastMsg("구독 서비스가 추가되었습니다.");
      setTimeout(()=> setToastMsg(""), 1800);
      setAddOpen(false);

    } catch (error) {
      console.error("구독 추가 실패:", error);
      const serverMsg = error?.response?.data ? JSON.stringify(error.response.data) : null;
      // 서버 실패 시 로컬에만 저장하는 폴백
      try {
        const p = Array.isArray(service?.plans) ? service.plans.find((x)=> x.id === selectedPlanId) : null;
        const priceValue = Number(String(p?.price || "").toString().replace(/[^0-9.]/g, "")) || 0;
        addLocalSubscription({ name: `${service?.name || ""} ${p?.plan_name || ""}`.trim(), priceValue });
        setToastMsg(serverMsg ? "서버 오류로 로컬에만 추가되었습니다." : "서버 오류로 로컬에만 추가되었습니다.");
        setTimeout(()=> setToastMsg(""), 2000);
      } catch (_) {
        setToastMsg("구독 추가에 실패했습니다. 관리자에게 문의해주세요.");
        setTimeout(()=> setToastMsg(""), 2000);
      }
    }
  };
  return (
    <SidebarLayout>
      <div className="container-page section-y">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight truncate">{data?.name || service?.name || ""}</h1>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={async ()=> {
                const sid = service?.id ?? data?.id;
                if (!sid) return;
                if (!isAuthenticated) {
                  setToastMsg('로그인이 필요한 서비스 입니다.');
                  setTimeout(()=> setToastMsg(""), 1800);
                  return;
                }
                try {
                  const exists = await isFavApi(sid);
                  if (exists) {
                    setToastMsg("이미 즐겨찾기에 있습니다.");
                    setTimeout(()=> setToastMsg(""), 1800);
                    return;
                  }
                  await addFavApi(sid);
                  setToastMsg("즐겨찾기에 추가되었습니다.");
                  setTimeout(()=> setToastMsg(""), 1800);
                } catch (_) {
                  setToastMsg("즐겨찾기 처리 중 문제가 발생했습니다.");
                  setTimeout(()=> setToastMsg(""), 2000);
                }
              }}
              className="px-4 py-2 rounded-2xl btn-primary text-slate-50 font-semibold hover:opacity-95"
            >
              즐겨찾기
            </button>
            <button onClick={()=> setNoteOpen(true)} className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 font-semibold">메모</button>
          </div>
        </div>

        {noteText && (
          <div className="mt-3 rounded-2xl bg-slate-900/60 p-4 ring-1 ring-white/10 text-slate-200">
            <div className="text-xs text-slate-400 mb-1">내 메모</div>
            <div className="whitespace-pre-wrap break-words">{noteText}</div>
          </div>
        )}

    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.isArray(service?.plans) && service.plans.map((plan) => {
        const cycleText = plan.billing_cycle === 'month' ? '월' : '연';
        const priceNum = Number(plan.price || 0);
        const formattedPrice = `₩ ${priceNum.toLocaleString('ko-KR')}`;

        return (
          <DetailServiceCard
            key={plan.id}
            name={plan.plan_name}
            price={formattedPrice} // 가공된 가격 문자열
            benefits={plan.benefits}
            billing_cycle={cycleText} // '월' 또는 '연'
            onAdd={() => openAdd(plan.id)}
            priceVariant="detail"
          />
        );
    })}
          <div className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10 sm:col-span-2 lg:col-span-3">
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
            <a href={data.officialUrl} target="_blank" rel="noreferrer" className="text-fuchsia-300 hover:underline">공식 페이지로 이동 ↗</a>
          </div>
        )}
        {/* 읽기 전용: 가격이력/프로모션/번들 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
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
      {addOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAddOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 p-6 ring-1 ring-white/10">
            <h3 className="text-lg font-semibold">내 구독에 추가</h3>
            <p className="mt-2 text-slate-300">{service?.name}</p>
            {addStep === "select" && (
              <>
                <div className="mt-4 max-h-64 overflow-auto rounded-xl bg-slate-950/40 p-3 ring-1 ring-white/10">
                  {Array.isArray(service?.plans) && service.plans.length > 0 ? (
                    <ul className="space-y-2">
                      {service.plans.map((p) => {
                        const cycleText = p.billing_cycle === 'month' ? '월' : p.billing_cycle === 'year' ? '연' : (p.cycle || '');
                        const priceNum = Number(p.price || p.price_value || 0);
                        const priceText = Number.isFinite(priceNum) ? `₩ ${priceNum.toLocaleString()}` : String(p.price || '');
                        return (
                          <li key={p.id} className="flex items-center gap-3">
                            <input
                              id={`plan-${p.id}`}
                              type="radio"
                              name="plan"
                              className="accent-fuchsia-500"
                              checked={selectedPlanId === p.id}
                              onChange={() => setSelectedPlanId(p.id)}
                            />
                            <label htmlFor={`plan-${p.id}`} className="flex-1 cursor-pointer flex items-center justify-between gap-3">
                              <span className="truncate">{p.plan_name || p.name}</span>
                              <span className="text-slate-300 whitespace-nowrap">{cycleText} {priceText}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="text-slate-400">선택 가능한 플랜이 없어요.</div>
                  )}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => setAddOpen(false)} className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15">취소</button>
                  <button
                    onClick={() => {
                      if (!selectedPlanId) return;
                      // startDate/nextPaymentDate는 openAdd에서 기본값 설정됨
                      setAddStep("details");
                    }}
                    disabled={!selectedPlanId}
                    className="px-4 py-2 rounded-2xl btn-primary text-slate-50 font-semibold hover:opacity-95 disabled:opacity-50"
                  >
                    다음
                  </button>
                </div>
              </>
            )}

            {addStep === "details" && (
              <>
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-sm block mb-1">구독 시작일</label>
                    <input type="date" value={startDate} onChange={(e)=> setStartDate(e.target.value)} className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2" />
                  </div>
                  <div>
                    <label className="text-sm block mb-1">다음 결제일</label>
                    <input type="date" value={nextPaymentDate} onChange={(e)=> setNextPaymentDate(e.target.value)} className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2" />
                  </div>
                  <div>
                    <label className="text-sm block mb-1">메모</label>
                    <textarea rows={4} value={customMemo} onChange={(e)=> setCustomMemo(e.target.value)} className="w-full rounded-xl bg-slate-950 border border-white/10 p-3" placeholder="예: 프리미엄 1개월만 사용 후 해지" />
                  </div>
                </div>
                <div className="mt-4 flex justify-between gap-2">
                  <button onClick={() => setAddStep("select")} className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15">이전</button>
                  <div className="flex gap-2">
                    <button onClick={() => setAddOpen(false)} className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15">취소</button>
                    <button
                      onClick={() => {
                        if (!startDate || !nextPaymentDate) {
                          alert("시작일과 다음 결제일을 입력해주세요.");
                          return;
                        }
                        handleAddSubscription();
                      }}
                      disabled={!selectedPlanId}
                      className="px-4 py-2 rounded-2xl btn-primary text-slate-50 font-semibold hover:opacity-95 disabled:opacity-50"
                    >
                      추가
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {noteOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setNoteOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 p-6 ring-1 ring-white/10">
            <h3 className="text-lg font-semibold">메모</h3>
            <p className="mt-1 text-slate-400 text-sm">서비스에 대한 개인 메모를 저장합니다. 로컬에만 보관됩니다.</p>
            <textarea
              value={noteText}
              onChange={(e)=> setNoteText(e.target.value)}
              rows={8}
              className="mt-3 w-full rounded-xl bg-slate-950 border border-white/10 p-3 text-slate-100 outline-none focus:ring-2 focus:ring-fuchsia-400"
              placeholder="예: 프리미엄 요금제 써보기. 다음 결제일 전 해지 예정."
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setNoteOpen(false)} className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15">닫기</button>
              <button
                onClick={async () => { try { await setBookmarkMemo(service?.id, noteText); } catch (_) {} setNoteOpen(false); }}
                className="px-4 py-2 rounded-2xl btn-primary text-slate-50 font-semibold hover:opacity-95"
              >저장</button>
            </div>
          </div>
        </div>
      )}
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl bg-fuchsia-600/90 text-slate-50 shadow-lg z-50" role="status" aria-live="polite">
          {toastMsg}
        </div>
      )}
    </SidebarLayout>
  );
}