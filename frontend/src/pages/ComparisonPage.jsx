import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getComparison as getComparisonApi, getServiceDetail as getServiceDetailApi } from "../services/serviceService";
import { getComparison as getComparisonMock, getServiceDetail as getServiceDetailMock } from "../services/mockApi";
import ServiceCard from "../components/ServiceCard";

function formatCurrency(krw) {
  return `₩ ${krw.toLocaleString()}`;
}

export default function ComparisonPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [serviceDetails, setServiceDetails] = useState([]); // ids가 있을 때: 서비스별 플랜 목록
  const [selectedPlans, setSelectedPlans] = useState([]); // 다중 선택: [{ serviceId, serviceName, planId, planName, priceNum, priceText, cycleText, benefitsText, benefits }]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("recommended");
  const [selected, setSelected] = useState({});
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const ids = useMemo(() => (searchParams.get('ids') || searchParams.get('plan_id') || '').split(',').map((v)=> v.trim()).filter(Boolean), [searchParams]);
  const isCardMode = ids.length > 0; // 서비스 ID가 주어지면 카드 뷰로 전환
  const [compareOpen, setCompareOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const handleSelectPlan = (service, plan) => {
    const svcId = service?.id;
    if (!svcId) return;
    const planId = plan?.id || null;
    const idStr = String(planId || '');
    // 토글: 이미 선택되어 있으면 해제
    setSelectedPlans((prev) => {
      const exists = prev.some((p) => String(p.planId || '') === idStr);
      if (exists) return prev.filter((p) => String(p.planId || '') !== idStr);
      // 최대 5개 제한
      if (prev.length >= 5) {
        try {
          setToastMsg("최대 5개까지 선택 가능합니다.");
          setTimeout(() => setToastMsg(""), 1800);
        } catch (_) {}
        return prev;
      }

      const rawPrice = plan?.price ?? plan?.price_value ?? null;
      const num = Number(String(rawPrice).toString().replace(/[^0-9.]/g, ""));
      const priceText = Number.isFinite(num) && num > 0 ? `₩ ${num.toLocaleString()}` : (typeof rawPrice === 'string' ? rawPrice : undefined);
      const cycleCode = plan?.billing_cycle || plan?.cycle || 'month';
      const cycleText = cycleCode === 'year' ? '연' : '월';
      const benefitsArr = Array.isArray(plan?.benefits)
        ? plan.benefits.map((v)=> String(v).trim()).filter(Boolean)
        : String(plan?.benefits || '')
            .split(',')
            .map((v)=> v.trim())
            .filter(Boolean);
      const benefitsText = benefitsArr.join(', ');
      const planName = plan?.plan_name || plan?.name || `${service?.name || ''} 플랜`;
      return [
        ...prev,
        {
          serviceId: svcId,
          serviceName: service?.name || '',
          planId,
          planName,
          priceNum: Number.isFinite(num) ? num : null,
          priceText,
          cycleText,
          benefitsText,
          benefits: benefitsArr,
        },
      ];
    });
  };

  const handleResetSelected = () => setSelectedPlans([]);

  // 자동 오픈 제거: '비교하기' 버튼으로만 오픈

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        if (ids.length > 0) {
          // 카드 모드: 서비스 상세(플랜 포함) 병렬 로드
          const apiResults = await Promise.allSettled(ids.map((id) => getServiceDetailApi(id)));
          let services = apiResults.filter((r) => r.status === 'fulfilled' && r.value).map((r) => r.value);
          if (services.length === 0) {
            // 서버 실패 시 목업으로 폴백
            const mockResults = await Promise.allSettled(ids.map((id) => getServiceDetailMock(id)));
            services = mockResults.filter((r) => r.status === 'fulfilled' && r.value).map((r) => r.value);
          }
          if (!cancelled) {
            setServiceDetails(Array.isArray(services) ? services : []);
            setRows([]);
          }
        } else {
          const data = await getComparisonMock({ sort });
          if (!cancelled) setRows(data);
        }
      } catch (e) {
        // 서버 비교/상세 API가 실패할 경우 목업 데이터로 폴백
        try {
          if (ids.length > 0) {
            const mockResults = await Promise.allSettled(ids.map((id) => getServiceDetailMock(id)));
            const services = mockResults.filter((r) => r.status === 'fulfilled' && r.value).map((r) => r.value);
            if (!cancelled) {
              setServiceDetails(services);
              setError("");
            }
          } else {
            const data = await getComparisonMock({ sort });
            if (!cancelled) {
              setRows(data);
              setError("");
            }
          }
        } catch (_) {
          if (!cancelled) setError("비교 데이터를 불러오는 중 오류가 발생했어요.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [sort, ids]);

  const visibleRows = useMemo(() => {
    const base = rows.filter((r)=> showSelectedOnly ? Boolean(selected[r.name]) : true);
    if (sort === 'priceAsc') return [...base].sort((a,b)=> (a.regular||0) - (b.regular||0));
    if (sort === 'priceDesc') return [...base].sort((a,b)=> (b.regular||0) - (a.regular||0));
    if (sort === 'nameAsc') return [...base].sort((a,b)=> (a.name||'').localeCompare(b.name||''));
    return base; // recommended: 서버/목업 기본
  }, [rows, sort, showSelectedOnly, selected]);

  // 선택 개수에 따라 모달 카드 열 수(최대 5) 동적 계산
  const modalColsClass = useMemo(() => {
    const n = Math.min(Math.max(selectedPlans.length || 1, 1), 5);
    if (n === 1) return "grid-cols-1";
    if (n === 2) return "grid-cols-2";
    if (n === 3) return "grid-cols-3";
    if (n === 4) return "grid-cols-4";
    return "grid-cols-5";
  }, [selectedPlans.length]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container-page section-y">
        <div className="mx-auto w-full max-w-6xl">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">가격 비교</h1>
        <p className="mt-2 text-slate-400">서비스별 가격을 한 눈에 비교해 보세요.</p>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
          <div>
            <label className="text-sm block mb-1" htmlFor="sort-compare">정렬</label>
            <select
              id="sort-compare"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-2xl bg-slate-900 border border-white/10 px-3 py-2"
              aria-label="정렬 선택"
            >
              <option value="recommended">추천순</option>
              <option value="priceAsc">정가 낮은순</option>
              <option value="priceDesc">정가 높은순</option>
              <option value="nameAsc">가나다순</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowSelectedOnly((v) => !v)}
              aria-pressed={showSelectedOnly}
              className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 transition"
            >
              {showSelectedOnly ? "전체 보기" : "선택만 보기"}
            </button>
            <button
              type="button"
              onClick={() => {
                const headers = ["상품","정가","할인","번들"];
                const visible = rows.filter((r)=> showSelectedOnly ? Boolean(selected[r.name]) : true);
                const data = visible.map((r)=> [r.name, r.regular||"", r.discount||"", r.bundle||""]);
                const csv = [headers, ...data].map(row => row.map(v => `"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'comparison.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 transition"
            >
              CSV 내보내기
            </button>
            <button
              type="button"
              onClick={() => nav(-1)}
              className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 transition"
              aria-label="이전 페이지로 이동"
            >
              이전
            </button>
            <Link
              to="/"
              className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 transition"
              aria-label="홈으로 이동"
            >
              홈으로
            </Link>
          </div>
        </div>

        {!isCardMode && (
          <>
            <div className="mt-8 overflow-x-auto rounded-2xl ring-1 ring-white/10">
              <table className="min-w-full text-left">
                <caption className="sr-only">구독 서비스의 정가, 할인, 번들 가격 비교 테이블</caption>
                <thead className="bg-white/5 text-slate-300">
                  <tr>
                    <th scope="col" className="px-4 py-3">선택</th>
                    <th scope="col" className="px-4 py-3">상품</th>
                    <th scope="col" className="px-4 py-3">정가</th>
                    <th scope="col" className="px-4 py-3">할인</th>
                    <th scope="col" className="px-4 py-3">번들</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-slate-400">로딩 중…</td>
                    </tr>
                  )}
                  {error && (
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-red-400">{error}</td>
                    </tr>
                  )}
                  {!loading && !error && visibleRows.map((r) => (
                    <tr key={r.name} className="border-t border-white/10">
                      <td className="px-4 py-3"><input type="checkbox" className="accent-fuchsia-500" checked={Boolean(selected[r.name])} onChange={(e)=> setSelected(prev=> ({...prev, [r.name]: e.target.checked}))} /></td>
                      <th scope="row" className="px-4 py-3 font-medium whitespace-nowrap">{r.name}</th>
                      <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(r.regular)}</td>
                      <td className="px-4 py-3 text-fuchsia-300 whitespace-nowrap">
                        {r.discount ? formatCurrency(r.discount) : "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.bundle ? (
                          <span className="inline-flex items-center gap-2" title={(r.benefits || []).join(", ") || undefined}>
                            {formatCurrency(r.bundle)}
                            <span className="text-xs px-2 py-1 rounded-full bg-white/10">번들</span>
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-sm text-slate-400">선택 {Object.values(selected).filter(Boolean).length}개 · 표시 {visibleRows.length}개</div>
          </>
        )}

        {isCardMode && (
          <div className="mt-8 space-y-8">
            {loading && <div className="px-4 py-3 text-slate-400">로딩 중…</div>}
            {error && <div className="px-4 py-3 text-red-400">{error}</div>}
            {!loading && !error && serviceDetails.map((svc) => (
              <section key={svc.id}>
                <h2 className="text-2xl font-bold mb-3">{svc.name}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.isArray(svc.plans) && svc.plans.length > 0 ? (
                    svc.plans.map((p) => {
                      const rawPrice = p.price ?? p.price_value ?? null;
                      const num = Number(String(rawPrice).toString().replace(/[^0-9.]/g, ""));
                      const priceText = Number.isFinite(num) && num > 0 ? `₩ ${num.toLocaleString()}` : (typeof rawPrice === 'string' ? rawPrice : undefined);
                      const cycleCode = p.billing_cycle || p.cycle || 'month';
                      const cycleText = cycleCode === 'year' ? '연' : '월';
                      const benefitsText = Array.isArray(p.benefits) ? p.benefits.join(', ') : String(p.benefits || '');
                      const planName = p.plan_name || p.name || `${svc.name} 플랜`;
                      const isSelected = selectedPlans.some((sp) => String(sp.planId || '') === String(p.id || ''));
                      return (
                        <ServiceCard
                          key={p.id || planName}
                          name={planName}
                          price={priceText}
                          benefits={benefitsText}
                          billing_cycle={cycleText}
                          priceVariant="detail"
                          onAdd={() => handleSelectPlan(svc, p)}
                          actionLabel={isSelected ? "선택됨" : "선택"}
                          selectable
                          selected={isSelected}
                        />
                      );
                    })
                  ) : (
                    <div className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10 text-slate-300">등록된 플랜이 없습니다.</div>
                  )}
                </div>
              </section>
            ))}
            {/* 선택한 플랜 비교 카드 섹션 */}
            <section>
              <div className="mt-10 flex items-center justify-between">
                <h2 className="text-2xl font-bold">선택한 플랜 비교</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">{selectedPlans.length}/5 선택됨</span>
                  <button
                    type="button"
                    onClick={() => setCompareOpen(true)}
                    disabled={selectedPlans.length === 0}
                    className="px-3 py-2 rounded-xl btn-primary text-slate-50 disabled:opacity-50"
                  >비교하기</button>
                  <button type="button" onClick={handleResetSelected} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15">초기화</button>
                </div>
              </div>
              {selectedPlans.length === 0 ? (
                <div className="mt-3 text-slate-400">각 서비스에서 원하는 플랜을 선택해 비교해 보세요.</div>
              ) : (
                <div className={`mt-4 grid ${modalColsClass} gap-4`}>
                  {selectedPlans.map((it) => (
                    <div
                      key={`${it.serviceId}-${it.planId || it.planName}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => setCompareOpen(true)}
                      onKeyDown={(e)=> { if(e.key==='Enter' || e.key===' ') { e.preventDefault(); setCompareOpen(true); } }}
                      className="focus:outline-none focus:ring-2 focus:ring-fuchsia-400 rounded-2xl"
                    >
                      <ServiceCard
                        name={`${it.serviceName} · ${it.planName}`}
                        price={it.priceText}
                        benefits={it.benefitsText}
                        billing_cycle={it.cycleText}
                        priceVariant="detail"
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* 중앙 비교 오버레이 */}
        {isCardMode && compareOpen && (
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30 backdrop-blur" onClick={() => setCompareOpen(false)} />
            <div className="relative w-full max-w-7xl mx-auto rounded-3xl bg-slate-900/85 p-6 md:p-8 ring-1 ring-white/10 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg md:text-xl font-semibold">선택한 플랜 비교</h3>
                <button type="button" onClick={() => setCompareOpen(false)} className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/15">닫기</button>
              </div>
              <div className="mt-4 max-h-[80vh] overflow-y-auto pr-1">
                <div className={`grid ${modalColsClass} gap-5`}>
                  {[...selectedPlans]
                    .sort((a,b)=>{
                      const ai = ids.findIndex((x)=> String(x) === String(a.serviceId));
                      const bi = ids.findIndex((x)=> String(x) === String(b.serviceId));
                      const ax = ai === -1 ? 999 : ai;
                      const bx = bi === -1 ? 999 : bi;
                      if (ax !== bx) return ax - bx;
                      return 0; // 같은 서비스 내는 선택 순서 유지
                    })
                    .map((it) => (
                      <div
                        key={`modal-${it.serviceId}-${it.planId || it.planName}`}
                        className="rounded-2xl bg-slate-950/60 ring-1 ring-white/10 p-6 md:p-7 shadow-lg flex flex-col"
                      >
                        <div className="text-slate-200 text-lg font-bold truncate" title={it.serviceName}>{it.serviceName}</div>
                        <div className="mt-1 text-base text-slate-300 truncate" title={it.planName}>{it.planName}</div>
                        <div className="mt-3 text-2xl md:text-3xl font-extrabold">{it.priceText} <span className="text-base md:text-lg font-semibold text-slate-300">/ {it.cycleText}</span></div>
                        <ul className="mt-4 space-y-1 text-sm md:text-base text-slate-300 list-none">
                          {(it.benefits && it.benefits.length > 0 ? it.benefits : [it.benefitsText || '혜택 정보 없음']).map((b, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-slate-400">-</span>
                              <span className="break-words">{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast: 선택 개수 초과 등 경고 */}
        {toastMsg && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-3 rounded-2xl bg-slate-900/90 text-slate-50 shadow-lg z-50 ring-1 ring-white/10" role="alert" aria-live="assertive">
            {toastMsg}
          </div>
        )}

        <div className="mt-6">
          <Link to="/" className="text-fuchsia-300 hover:underline">홈으로 돌아가기 →</Link>
      </div>
        </div>
      </div>
    </div>
  );
}


