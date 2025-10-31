import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, Link, useSearchParams } from "react-router-dom";
import { listBookmarks, addBookmark as addBookmarkApi, removeBookmark as removeBookmarkApi } from "../services/bookmarksService.js";
// import { searchServices } from "../services/mockApi";
import { getServices, getServiceDetail } from "../services/serviceService.js";
import { addSubscription, getSubscriptions } from "../services/subscriptionService";
import useAuth from "../hooks/useAuth";
import { useGuavaDialog } from "../context/GuavaDialogContext.jsx";
// 목업 데이터는 mockApi에서 제공

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function ServiceSearchPage() {
  const query = useQuery();
  const q = query.get("q")?.trim() || "";
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { isAuthenticated } = useAuth() || {};
  const { alert: guavaAlert, confirm: guavaConfirm } = useGuavaDialog();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [sort, setSort] = useState("recommended");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [benefitChips, setBenefitChips] = useState(["FHD", "4K", "광고 제거"]);
  const [selectedBenefits, setSelectedBenefits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [opCategory, setOpCategory] = useState("or");
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const didResetRef = useRef(false);
  const [inputText, setInputText] = useState("");
  const [onlyBookmark, setOnlyBookmark] = useState(false);
  const [bookmarkIds, setBookmarkIds] = useState(new Set());
  const [selected, setSelected] = useState({}); // id -> true
  const [hint, setHint] = useState("");
  const MAX_SELECT = 5;
  const [toastMsg, setToastMsg] = useState("");
  // 구독 추가 모달 상태
  const [addOpen, setAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addPlans, setAddPlans] = useState([]);
  const [addService, setAddService] = useState({ id: null, name: "" });
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [addStep, setAddStep] = useState("select"); // select | details
  const [startDate, setStartDate] = useState("");
  const [nextPaymentDate, setNextPaymentDate] = useState("");
  const [customMemo, setCustomMemo] = useState("");

  function formatKRW(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return "-";
    return `₩ ${num.toLocaleString()}`;
  }

  // 페이지 진입/검색어 변경 시 이전 검색/필터 상태를 초기화하고 URL을 q만 남기도록 정리
  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (q) nextParams.set("q", q);
    setSearchParams(nextParams, { replace: true });
    setSort("recommended");
    setMinPrice("");
    setMaxPrice("");
    setSelectedBenefits([]);
    setCategories([]);
    setOpCategory("or");
    setOnlyBookmark(false);
    setPage(1);
    setSelected({});
    setInputText("");
    setItems([]);
    didResetRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // 북마크 초기 로드
  useEffect(() => {
    let cancelled = false;
    listBookmarks()
      .then((ids) => {
        if (!cancelled) setBookmarkIds(new Set((ids || []).map(String)));
      })
      .catch(() => {})
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    // URL -> 상태 초기화 (첫 마운트 시)
    if (didResetRef.current) return; // 초기화 직후에는 스킵
    const sortP = query.get("sort");
    if (sortP) setSort(sortP);
    const minP = query.get("min");
    const maxP = query.get("max");
    if (minP) setMinPrice(minP);
    if (maxP) setMaxPrice(maxP);
    
    const opCat = query.get("opCat");
    if (opCat === "and" || opCat === "or") setOpCategory(opCat);
    const benefitAll = query.getAll("benefit");
    if (benefitAll.length) setSelectedBenefits(benefitAll);
    const cats = query.getAll("cat");
    if (cats.length) setCategories(cats);
    const p = query.get("page");
    if (p && !Number.isNaN(Number(p))) setPage(Math.max(1, Number(p)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // 상태 -> URL 동기화
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (sort && sort !== "recommended") params.set("sort", sort);
    if (minPrice) params.set("min", String(minPrice));
    if (maxPrice) params.set("max", String(maxPrice));
    
    if (opCategory && opCategory !== "or") params.set("opCat", opCategory);
    selectedBenefits.forEach((b) => params.append("benefit", b));
    categories.forEach((c) => params.append("cat", c));
    if (page > 1) params.set("page", String(page));
    const prev = searchParams.toString();
    const next = params.toString();
    if (prev !== next) setSearchParams(params, { replace: true });
  }, [q, sort, minPrice, maxPrice, selectedBenefits, categories, opCategory, page, searchParams, setSearchParams]);

useEffect(() => {
let cancelled = false;
async function run() {
  setLoading(true);
  setError("");
  try {
    const apiParams = {
      q: q,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      // 단일 카테고리 API만 지원하므로 다중 카테고리는 현재 무시
    };

    const rows = await getServices(apiParams);

    if (!cancelled) setItems(rows);

    // 가격/주기 보강: 상세 플랜에서 최저가와 주기 계산
    Promise.allSettled((rows || []).map((s) => getServiceDetail(s.id)))
      .then((results) => {
        if (cancelled) return;
        const detailById = new Map();
        results.forEach((r) => {
          if (r.status === "fulfilled" && r.value) {
            detailById.set(String(r.value.id ?? r.value.service ?? ""), r.value);
          }
        });
        setItems((prev) =>
          prev.map((item) => {
            const d = detailById.get(String(item.id));
            const plans = Array.isArray(d?.plans) ? d.plans : [];
            if (plans.length === 0) return item;
            const normalized = plans
              .map((p) => {
                const raw = p.price ?? p.price_value ?? p.regular ?? null;
                const num = Number(String(raw).toString().replace(/[^0-9.]/g, ""));
                const cycleText = p.billing_cycle === "month" ? "월" : p.billing_cycle === "year" ? "연" : (p.cycle || "");
                return Number.isFinite(num) && num > 0 ? { num, cycleText } : null;
              })
              .filter(Boolean);
            if (normalized.length === 0) return item;
            const min = normalized.reduce((acc, x) => (x.num < acc ? x.num : acc), normalized[0].num);
            const max = normalized.reduce((acc, x) => (x.num > acc ? x.num : acc), normalized[0].num);
            const cheapest = normalized.sort((a, b) => a.num - b.num)[0];
            return { ...item, min_price: min, max_price: max, billing_cycle: cheapest.cycleText };
          })
        );
      })
      .catch(() => {});
  } catch (e) {
    console.error("API 호출 중 오류 발생:", e); // 디버깅을 위해 콘솔 로그 추가
    if (!cancelled) setError("서비스 목록을 불러오는 중 오류가 발생했어요.");
  } finally {
    if (!cancelled) setLoading(false);
  }
}

run();

return () => {
  cancelled = true;
};
}, [q, minPrice, maxPrice, categories]);

/*
  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        const rows = await getServices({
        q,
        onlyOtt, // 이 필터도 filters.py에 추가해야 합니다.
        sort,
        categories,
        opCategory,
        min_price: minPrice ? Number(minPrice) : undefined, // minPrice -> min_price
        max_price: maxPrice ? Number(maxPrice) : undefined, // maxPrice -> max_price
        benefits: selectedBenefits,
        freeTrial,
        });
        if (!cancelled) setItems(rows);
      } catch (e) {
        if (!cancelled)
        {
            setError("검색 중 오류가 발생했어요.");
            console.error("API 호출 중 오류 발생:", e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [q, onlyOtt, sort, categories, opCategory, minPrice, maxPrice, selectedBenefits, freeTrial]);
*/

  // 필터 변경 시 페이지 리셋
  useEffect(() => {
    setPage(1);
  }, [q, sort, categories, opCategory, minPrice, maxPrice, selectedBenefits]);

  // 카테고리 목록/카운트 동적 생성
  const availableCategories = useMemo(() => {
    const cats = Array.from(new Set(items.map((s) => String(s.category || "").trim()).filter(Boolean))).sort((a,b)=> a.localeCompare(b));
    return cats;
  }, [items]);
  const categoryCounts = useMemo(() => {
    const acc = new Map();
    for (const s of items) {
      const key = String(s.category || '').trim();
      if (!key) continue;
      acc.set(key, (acc.get(key) || 0) + 1);
    }
    return acc;
  }, [items]);

  // 클라이언트 측 필터링 및 정렬 (API 응답 위에서 정제)
  const filtered = useMemo(() => {
    let rows = items;
    const qLower = (q || "").trim().toLowerCase();
    if (qLower) rows = rows.filter((s) => (s.name || "").toLowerCase().includes(qLower));
    if (categories.length > 0) {
      const set = new Set(categories.map((c)=> String(c).toLowerCase()));
      rows = rows.filter((s)=> set.has(String(s.category||"").toLowerCase()));
    }
    if (onlyBookmark) {
      const bmSet = bookmarkIds;
      rows = rows.filter((s)=> bmSet.has(String(s.id)));
    }
    const minV = Number(minPrice);
    const maxV = Number(maxPrice);
    if (Number.isFinite(minV) && minPrice !== "") {
      rows = rows.filter((s)=> Number(s.min_price ?? Infinity) >= minV);
    }
    if (Number.isFinite(maxV) && maxPrice !== "") {
      rows = rows.filter((s)=> Number(s.max_price ?? 0) <= maxV);
    }
    if (sort === "priceAsc") rows = [...rows].sort((a,b)=> Number(a.min_price||0) - Number(b.min_price||0));
    else if (sort === "priceDesc") rows = [...rows].sort((a,b)=> Number(b.min_price||0) - Number(a.min_price||0));
    else if (sort === "nameAsc") rows = [...rows].sort((a,b)=> (a.name||'').localeCompare(b.name||''));
    return rows;
  }, [items, q, categories, onlyBookmark, minPrice, maxPrice, sort, bookmarkIds]);

  const selectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([k]) => k), [selected]);

  async function openAdd(serviceId, serviceName) {
    if (!isAuthenticated) {
      await guavaAlert("로그인이 필요한 서비스입니다.");
      nav("/login", { replace: false, state: { from: location } });
      return;
    }
    setAddService({ id: serviceId, name: serviceName });
    setAddOpen(true);
    setAddLoading(true);
    setAddPlans([]);
    setSelectedPlanId(null);
    setAddStep("select");
    setStartDate("");
    setNextPaymentDate("");
    setCustomMemo("");
    try {
      const detail = await getServiceDetail(serviceId);
      const plans = Array.isArray(detail?.plans) ? detail.plans : [];
      setAddPlans(plans);
    } catch (_) {
      setAddPlans([]);
    } finally {
      setAddLoading(false);
    }
  }

  async function confirmAdd() {
    if (!selectedPlanId) return;
    if (!startDate || !nextPaymentDate) {
      await guavaAlert("시작일과 다음 결제일을 입력해주세요.");
      return;
    }
    try {
      try {
        const my = await getSubscriptions();
        const myItems = Array.isArray(my?.results) ? my.results : [];
        const already = myItems.some((s)=> String(s.plan) === String(selectedPlanId));
        if (already) {
          const ok = await guavaConfirm("이미 내 구독리스트에 있습니다. 그래도 추가하시겠습니까?");
          if (!ok) return;
        }
      } catch (_) {}

      await addSubscription(selectedPlanId, {
        start_date: startDate,
        next_payment_date: nextPaymentDate,
        custom_memo: customMemo,
      });
      setToastMsg("구독 서비스가 추가되었습니다.");
      setTimeout(()=> setToastMsg(""), 1800);
      setAddOpen(false);
    } catch (e) {
      setToastMsg("구독 추가에 실패했습니다. 관리자에게 문의해주세요.");
      setTimeout(()=> setToastMsg(""), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container-page section-y">
        <div className="mx-auto w-full max-w-6xl">
        {/* 인라인 검색바 + 정렬 */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">서비스 검색</h1>
            {q && <p className="mt-1 text-slate-400">검색어: "{q}"</p>}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
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

        <div className="mt-6 rounded-2xl bg-slate-900/60 p-4 md:p-6 ring-1 ring-white/10">
        <div className="flex flex-col md:flex-row gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const next = (inputText || "").trim();
              const params = new URLSearchParams(searchParams);
              if (next) params.set("q", next); else params.delete("q");
              setSearchParams(params, { replace: true });
              setInputText("");
            }}
            className="flex-1 flex items-center gap-3 flex-wrap sm:flex-nowrap"
            role="search"
            aria-label="서비스 검색"
          >
            <input
              name="q"
              value={inputText}
              onChange={(e)=> setInputText(e.target.value)}
              placeholder="서비스 이름으로 검색 (예: 넷플릭스, 디즈니플러스)"
              className="w-full h-10 rounded-2xl bg-slate-900 border border-white/10 px-4 outline-none focus:ring-2 focus:ring-fuchsia-400"
              aria-label="검색어 입력"
            />
            <button
              type="submit"
              className="h-10 w-full sm:w-auto whitespace-nowrap rounded-2xl px-4 btn-primary text-slate-50 font-semibold hover:opacity-95 transition shadow-lg focus-ring"
              aria-label="검색 실행"
            >
              검색
            </button>
          </form>

          <div>
            <label className="text-sm block mb-1" htmlFor="sort">정렬</label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-2xl bg-slate-900 border border-white/10 px-3 py-2"
              aria-label="정렬 선택"
            >
              <option value="recommended">추천순</option>
              <option value="priceAsc">가격 낮은순</option>
              <option value="priceDesc">가격 높은순</option>
              <option value="nameAsc">가나다순</option>
            </select>
          </div>
        </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="text-sm block mb-1">카테고리</label>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((c)=>{
                  const active = categories.includes(c);
                  return (
                    <button key={c} type="button" onClick={()=> setCategories(prev=> active? prev.filter(x=>x!==c): [...prev, c])} className={`px-3 py-1 rounded-2xl ring-1 ring-white/10 ${active? 'btn-primary text-slate-50' : 'bg-white/10 text-slate-200 hover:bg-white/15'}`}>
                      #{c}
                      <span className="ml-2 text-xs text-slate-300">{categoryCounts.get(c) || 0}</span>
                    </button>
                  );
                })}
                <select value={opCategory} onChange={(e)=>setOpCategory(e.target.value)} className="rounded-2xl bg-slate-900 border border-white/10 px-3 py-2">
                  <option value="or">OR</option>
                  <option value="and">AND</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm block mb-1" htmlFor="min">최소 가격</label>
              <input id="min" type="number" inputMode="numeric" className="w-full rounded-2xl bg-slate-900 border border-white/10 px-3 py-2" placeholder="0" value={minPrice} onChange={(e)=>setMinPrice(e.target.value)} />
            </div>
            <div>
              <label className="text-sm block mb-1" htmlFor="max">최대 가격</label>
              <input id="max" type="number" inputMode="numeric" className="w-full rounded-2xl bg-slate-900 border border-white/10 px-3 py-2" placeholder="20000" value={maxPrice} onChange={(e)=>setMaxPrice(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm inline-flex items-center gap-2 mt-6 md:mt-0">
                <input type="checkbox" className="accent-fuchsia-500" checked={onlyBookmark} onChange={(e)=> setOnlyBookmark(e.target.checked)} /> 즐겨찾기만 보기
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm block mb-1">혜택</label>
              <div className="flex flex-wrap gap-2">
                {benefitChips.map((b)=>{
                  const active = selectedBenefits.includes(b);
                  return (
                    <button key={b} type="button" onClick={()=>setSelectedBenefits(prev=> active? prev.filter(x=>x!==b): [...prev,b])} className={`px-3 py-1 rounded-2xl ring-1 ring-white/10 ${active? 'btn-primary text-slate-50' : 'bg-white/10 text-slate-200 hover:bg-white/15'}`}>{b}</button>
                  )
                })}
              </div>
            </div>
            <button type="button" onClick={()=>{setMinPrice("");setMaxPrice("");setSelectedBenefits([]);setCategories([]);setOnlyBookmark(false);setSort("recommended");}} className="px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/15">필터 초기화</button>
          </div>
          {(selectedBenefits.length>0 || minPrice || maxPrice || categories.length>0) && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-slate-400 mr-1">적용된 필터:</span>
              {categories.map((c)=> (<span key={c} className="px-2 py-1 rounded-2xl bg-white/10">#{c}</span>))}
              {minPrice && <span className="px-2 py-1 rounded-2xl bg-white/10">최소 {minPrice}</span>}
              {maxPrice && <span className="px-2 py-1 rounded-2xl bg-white/10">최대 {maxPrice}</span>}
              {selectedBenefits.map((b)=> (
                <span key={b} className="px-2 py-1 rounded-2xl bg-white/10">{b}</span>
              ))}
              {onlyBookmark && <span className="px-2 py-1 rounded-2xl bg-white/10">즐겨찾기만</span>}
            </div>
          )}
        </div>

          <div className="mt-6">
          <div className="mb-2 flex items-center justify-between flex-wrap gap-2" aria-live="polite" aria-atomic="true">
            {!loading && !error && (
              <div className="text-sm text-slate-400">표시 {filtered.length}개 / 총 {items.length}개</div>
            )}
            {hint && <div className="text-amber-300 text-sm">{hint}</div>}
          </div>
          {/* 접근성: 상태 알림 */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {loading ? "로딩 중" : error ? `오류: ${error}` : `${items.length}건의 결과`}
          </div>
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" role="status" aria-live="polite">
              {Array.from({ length: pageSize }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 animate-pulse h-32" />
              ))}
            </div>
          )}
          {error && <div className="text-red-400" role="alert">{error}</div>}
          {!loading && !error && items.length === 0 && (
            <div className="text-slate-400">검색 결과가 없습니다.</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s) => {
              const checked = Boolean(selected[String(s.id)]);
              return (
                <div
                  key={s.id}
                  className={`rounded-2xl bg-slate-900/60 p-5 ring-1 ${checked ? 'ring-fuchsia-500' : 'ring-white/10'} shadow-lg transition cursor-pointer hover:bg-slate-900/70`}
                  onClick={() => {
                    const idStr = String(s.id);
                    setSelected((prev) => ({ ...prev, [idStr]: !Boolean(prev[idStr]) }));
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {s.logo_url ? (
                          <img src={s.logo_url} alt={s.name} className="h-7 w-7 rounded" />
                        ) : (
                          <div className="h-7 w-7 rounded bg-white/10 flex items-center justify-center text-xs text-slate-300">{(s.name || '?').slice(0,1)}</div>
                        )}
                        <Link to={`/services/${s.id}`} onClick={(e)=> e.stopPropagation()} className="text-xl font-bold truncate hover:underline" title={s.name}>{s.name}</Link>
                      </div>
                      <div className="text-slate-400 text-sm truncate mt-1">{s.category || '-'}</div>
                    </div>
                    <button
                      className="px-2 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-xs"
                      onClick={async (e)=> {
                        e.stopPropagation();
                        if (!isAuthenticated) {
                          await guavaAlert('로그인이 필요한 서비스 입니다.');
                          nav("/login", { replace: false, state: { from: location } });
                          return;
                        }
                        const idStr = String(s.id);
                        const isFav = bookmarkIds.has(idStr);
                        try {
                          if (isFav) {
                            const ok = await removeBookmarkApi(idStr);
                            setBookmarkIds((prev)=> { const next = new Set(prev); next.delete(idStr); return next; });
                            setToastMsg('즐겨찾기를 해제했어요.');
                          } else {
                            const ok = await addBookmarkApi(idStr);
                            setBookmarkIds((prev)=> { const next = new Set(prev); next.add(idStr); return next; });
                            setToastMsg('즐겨찾기에 추가했어요.');
                          }
                        } catch (_) {
                          setToastMsg('네트워크 오류로 즐겨찾기 변경에 실패했어요.');
                        } finally {
                          setTimeout(()=> setToastMsg(""), 1800);
                        }
                      }}
                      aria-label="즐겨찾기 토글"
                      title="즐겨찾기"
                    >
                      <span className={`${bookmarkIds.has(String(s.id)) ? 'text-yellow-400' : 'text-slate-400'} text-2xl leading-none`}>
                        {bookmarkIds.has(String(s.id)) ? '★' : '☆'}
                      </span>
                    </button>
                    <input
                      type="checkbox"
                      className="accent-fuchsia-500"
                      checked={checked}
                      onChange={(e)=> setSelected((prev)=> {
                        const idStr = String(s.id);
                        if (e.target.checked) {
                          const count = Object.values(prev).filter(Boolean).length;
                          if (count >= MAX_SELECT) {
                            setHint(`최대 ${MAX_SELECT}개까지 선택할 수 있어요.`);
                            setTimeout(()=> setHint(""), 1800);
                            return prev;
                          }
                          return { ...prev, [idStr]: true };
                        } else {
                          const next = { ...prev };
                          delete next[idStr];
                          return next;
                        }
                      })}
                      aria-label="비교 대상 선택"
                      onClick={(e)=> e.stopPropagation()}
                    />
                  </div>
                  <div className="mt-1 text-sm text-slate-300 whitespace-nowrap">
                    {s.min_price !== undefined && s.min_price !== null
                      ? `${s.billing_cycle ? `${s.billing_cycle} ` : ""}${formatKRW(s.min_price)} ~`
                      : '가격 정보 없음'}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Link to={`/services/${s.id}`} onClick={(e)=> e.stopPropagation()} className="text-fuchsia-300 hover:underline text-sm">상세 보기</Link>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openAdd(s.id, s.name); }}
                      className="px-3 py-1 rounded-xl btn-primary text-slate-50 whitespace-nowrap text-sm"
                    >
                      구독목록 추가
                    </button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && !loading && !error && (
              <div className="col-span-full text-slate-400">
                조건에 맞는 서비스가 없습니다.
              </div>
            )}
          </div>
          <div className="mt-6 flex items-center justify-between flex-wrap gap-2">
            <button
              className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              이전
            </button>
            <div className="text-sm text-slate-400">
              페이지 {page} / {Math.max(1, Math.ceil(items.length / pageSize))}
            </div>
            <button
              className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 disabled:opacity-50"
              onClick={() => setPage((p) => (p < Math.ceil(items.length / pageSize) ? p + 1 : p))}
              disabled={page >= Math.ceil(items.length / pageSize)}
            >
              다음
            </button>
          </div>
          <div className="sticky bottom-3 mt-6">
            <div className="mx-auto max-w-6xl rounded-2xl bg-slate-900/80 ring-1 ring-white/10 p-3 flex items-center justify-between gap-3">
              <div className="text-sm text-slate-300">
                선택 <span className={`px-2 py-0.5 rounded-full ${selectedIds.length >= MAX_SELECT ? 'bg-amber-400/20 text-amber-300' : 'bg-white/10'}`}>{selectedIds.length}/{MAX_SELECT}</span>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={()=> setSelected({})} className="px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/15">선택 해제</button>
                <button
                  type="button"
                  disabled={selectedIds.length < 2}
                  onClick={()=> nav(`/compare-cards?ids=${selectedIds.join(',')}`)}
                  className="px-4 py-2 rounded-2xl btn-primary text-slate-50 font-semibold hover:opacity-95 disabled:opacity-50"
                >가격 비교하기</button>
              </div>
            </div>
          </div>
      </div>
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl bg-fuchsia-600/90 text-slate-50 shadow-lg z-50" role="status" aria-live="polite">
          {toastMsg}
        </div>
      )}
      {/* 구독 추가 모달 */}
      {addOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAddOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 p-6 ring-1 ring-white/10">
            <h3 className="text-lg font-semibold">내 구독에 추가</h3>
            <p className="mt-2 text-slate-300 truncate">{addService.name}</p>
            {addStep === "select" && (
              <>
                <div className="mt-4 max-h-64 overflow-auto rounded-xl bg-slate-950/40 p-3 ring-1 ring-white/10">
                  {addLoading ? (
                    <div className="text-slate-400">플랜 정보를 불러오는 중…</div>
                  ) : addPlans.length === 0 ? (
                    <div className="text-slate-400">선택 가능한 플랜이 없어요. 상세 페이지에서 확인해보세요.</div>
                  ) : (
                    <ul className="space-y-2">
                      {addPlans.map((p) => {
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
                  )}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => setAddOpen(false)} className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15">취소</button>
                  <button
                    onClick={() => {
                      if (!selectedPlanId) return;
                      const today = new Date();
                      const yyyy = today.getFullYear();
                      const mm = String(today.getMonth() + 1).padStart(2, "0");
                      const dd = String(today.getDate()).padStart(2, "0");
                      const start = `${yyyy}-${mm}-${dd}`;
                      setStartDate(start);
                      const plan = (addPlans || []).find((x) => x.id === selectedPlanId);
                      const cycle = plan?.billing_cycle || "month";
                      setNextPaymentDate(computeNextDate(start, cycle));
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
                      onClick={confirmAdd}
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
        </div>
      </div>
    </div>
  );
}


