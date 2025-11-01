import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getServices, getServiceDetail } from "../services/serviceService";
import { getNote } from "../services/localPrefs.js";
import { listBookmarks, addBookmark as addBookmarkApi, removeBookmark as removeBookmarkApi } from "../services/bookmarksService.js";
import { addSubscription, getSubscriptions } from "../services/subscriptionService";
import useAuth from "../hooks/useAuth";
import { useGuavaDialog } from "../context/GuavaDialogContext.jsx";

export default function AllServicesPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth() || {};
  const { alert: guavaAlert, confirm: guavaConfirm } = useGuavaDialog();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState({}); // id -> true
  const [query, setQuery] = useState("");
  const [hint, setHint] = useState("");
  const MAX_SELECT = 5;
  const [sort, setSort] = useState("recommended");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [categories, setCategories] = useState([]); // 전체 데이터에서 채워짐
  const [selectedCategories, setSelectedCategories] = useState([]); // 다중 선택
  
  const [bookmarkIds, setBookmarkIds] = useState(new Set()); // 서버 동기화 기반
  const [inputText, setInputText] = useState("");
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

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        const rows = await getServices();
        if (!cancelled) {
          const list = Array.isArray(rows) ? rows : [];
          setItems(list);
          // 카테고리 목록 생성 (사이드바 순서와 정렬 일치, books 포함)
          const rawCats = Array.from(new Set(list.map((s) => String(s.category || "").trim()).filter(Boolean)));
          const sidebarOrder = ['video', 'music', 'books', 'shopping', 'delivery', 'ai', 'cloud_storage', 'productivity', 'design'];
          const withBooks = Array.from(new Set([...rawCats, 'books']));
          const ordered = sidebarOrder.filter((c) => withBooks.includes(c));
          const remaining = withBooks.filter((c) => !sidebarOrder.includes(c)).sort((a,b)=> a.localeCompare(b));
          setCategories([...ordered, ...remaining]);

          // 가격 정보 보강: 각 서비스 상세 플랜에서 최소/최대 가격 및 주기 계산
          Promise.allSettled((list || []).map((s) => getServiceDetail(s.id)))
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

          // 서버 북마크 초기 로드
          listBookmarks().then((ids) => {
            if (cancelled) return;
            setBookmarkIds(new Set((ids || []).map(String)));
          }).catch(() => {});
        }
      } catch (e) {
        if (!cancelled) setError("서비스 목록을 불러오는 중 오류가 발생했어요.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = items;
    if (q) rows = rows.filter((s) => (s.name || "").toLowerCase().includes(q));
    if (selectedCategories.length > 0) {
      const set = new Set(selectedCategories.map((c)=> String(c).toLowerCase()));
      rows = rows.filter((s)=> set.has(String(s.category||"").toLowerCase()));
    }
    
    const minV = Number(minPrice);
    const maxV = Number(maxPrice);
    if (Number.isFinite(minV) && minPrice !== "") {
      rows = rows.filter((s)=> Number(s.min_price ?? Infinity) >= minV);
    }
    if (Number.isFinite(maxV) && maxPrice !== "") {
      rows = rows.filter((s)=> Number(s.max_price ?? 0) <= maxV);
    }
    // 정렬
    if (sort === "priceAsc") rows = [...rows].sort((a,b)=> Number(a.min_price||0) - Number(b.min_price||0));
    else if (sort === "priceDesc") rows = [...rows].sort((a,b)=> Number(b.min_price||0) - Number(a.min_price||0));
    else if (sort === "nameAsc") rows = [...rows].sort((a,b)=> (a.name||'').localeCompare(b.name||''));
    return rows;
  }, [items, query, selectedCategories, minPrice, maxPrice, sort]);

  const selectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([k]) => k), [selected]);
  const selectedNameById = useMemo(() => Object.fromEntries(items.map((s) => [String(s.id), s.name])), [items]);
  const categoryCounts = useMemo(() => {
    const acc = new Map();
    for (const s of items) {
      const key = String(s.category || '').trim();
      if (!key) continue;
      acc.set(key, (acc.get(key) || 0) + 1);
    }
    return acc;
  }, [items]);

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
      // 중복 추가 방지
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
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">전체 서비스</h1>
              <p className="mt-1 text-slate-400">원하는 서비스를 선택해 가격을 비교해보세요.</p>
            </div>
          <div className="flex items-center gap-2"></div>
          </div>

        {/* 검색/정렬 및 필터 영역 - 검색 페이지와 유사한 카드 스타일 */}
        <div className="mt-6 rounded-2xl bg-slate-900/60 p-4 md:p-6 ring-1 ring-white/10">
          <div className="flex flex-col md:flex-row gap-3">
            <form
              onSubmit={(e)=> { e.preventDefault(); setQuery((inputText || "").trim()); }}
              className="flex-1 flex items-center gap-3 flex-nowrap"
              role="search"
              aria-label="서비스 검색"
            >
              <input
                value={inputText}
                onChange={(e)=> setInputText(e.target.value)}
                placeholder="서비스 이름으로 검색 (예: 넷플릭스)"
                className="w-full h-10 rounded-2xl bg-slate-900 border border-white/10 px-4 outline-none focus:ring-2 focus:ring-fuchsia-400"
                aria-label="이름 검색"
              />
              <button type="submit" className="h-10 whitespace-nowrap rounded-2xl px-4 btn-primary text-slate-50 font-semibold hover:opacity-95 transition">검색</button>
              <button
                type="button"
                onClick={()=> {
                  setInputText("");
                  setQuery("");
                  setSelectedCategories([]);
                  setMinPrice("");
                  setMaxPrice("");
                  setSort("recommended");
                }}
                className="h-10 whitespace-nowrap rounded-2xl px-4 bg-white/10 hover:bg-white/15"
              >초기화</button>
            </form>
            <div>
              <label className="text-sm block mb-1" htmlFor="sort">정렬</label>
              <div className="flex items-center gap-2">
                <select id="sort" value={sort} onChange={(e)=> setSort(e.target.value)} className="rounded-2xl bg-slate-900 border border-white/10 px-3 h-10">
                  <option value="recommended">추천순</option>
                  <option value="priceAsc">가격 낮은순</option>
                  <option value="priceDesc">가격 높은순</option>
                  <option value="nameAsc">가나다순</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2 md:col-span-2">
              <label className="text-sm block mb-1">카테고리</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {categories.map((c)=> {
                  const active = selectedCategories.includes(c);
                  return (
                    <button key={c} type="button" onClick={()=> setSelectedCategories((prev)=> active ? prev.filter(x=>x!==c) : [...prev, c])} className={`px-3 py-1 rounded-2xl ring-1 ring-white/10 w-full flex items-center justify-between text-left ${active? 'btn-primary text-slate-50' : 'bg-white/10 text-slate-200 hover:bg-white/15'}`}>
                      <span className="truncate">#{c}</span>
                      <span className="ml-2 shrink-0 text-xs text-slate-300">{categoryCounts.get(c) || 0}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-sm block mb-1" htmlFor="min">최소 가격</label>
              <input id="min" type="number" inputMode="numeric" className="w-full rounded-2xl bg-slate-900 border border-white/10 px-3 py-2" placeholder="0" value={minPrice} onChange={(e)=> setMinPrice(e.target.value)} />
            </div>
            <div>
              <label className="text-sm block mb-1" htmlFor="max">최대 가격</label>
              <input id="max" type="number" inputMode="numeric" className="w-full rounded-2xl bg-slate-900 border border-white/10 px-3 py-2" placeholder="20000" value={maxPrice} onChange={(e)=> setMaxPrice(e.target.value)} />
              <button
                type="button"
                onClick={()=> { setSelectedCategories([]); setMinPrice(""); setMaxPrice(""); setSort("recommended"); }}
                className="mt-2 w-full h-10 whitespace-nowrap rounded-2xl px-4 btn-primary text-slate-50 font-semibold hover:opacity-95 transition"
              >
                필터 초기화
              </button>
            </div>
          </div>

          {(selectedCategories.length>0 || minPrice || maxPrice) && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-slate-400 mr-1">적용된 필터:</span>
              {selectedCategories.map((c)=> (<span key={c} className="px-2 py-1 rounded-2xl bg-white/10">#{c}</span>))}
              {minPrice && <span className="px-2 py-1 rounded-2xl bg-white/10">최소 {minPrice}</span>}
              {maxPrice && <span className="px-2 py-1 rounded-2xl bg-white/10">최대 {maxPrice}</span>}
            </div>
          )}
        </div>

          <div className="mt-6 flex items-center justify-between" aria-live="polite" aria-atomic="true">
            {loading && <div className="text-slate-400">로딩 중…</div>}
            {error && <div className="text-red-400">{error}</div>}
            {hint && <div className="text-amber-300">{hint}</div>}
            {!loading && !error && (
              <div className="text-sm text-slate-400">표시 {filtered.length}개 / 총 {items.length}개</div>
            )}
          </div>

          {loading && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" role="status" aria-live="polite">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 animate-pulse h-32" />
              ))}
            </div>
          )}

          {!loading && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                              setToastMsg(ok && ok.source === 'local' ? '즐겨찾기를 해제했어요.' : '즐겨찾기를 해제했어요.');
                            } else {
                              const ok = await addBookmarkApi(idStr);
                              setBookmarkIds((prev)=> { const next = new Set(prev); next.add(idStr); return next; });
                              setToastMsg(ok && ok.source === 'local' ? '즐겨찾기에 추가했어요.' : '즐겨찾기에 추가했어요.');
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
                    {/* 메모 요약 뱃지 */}
                    {getNote(s.id) && (
                      <div className="mt-2 text-xs px-2 py-1 rounded-xl bg-white/10 text-slate-300 truncate" title={getNote(s.id)}>
                        메모: {getNote(s.id)}
                      </div>
                    )}
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
              {filtered.length === 0 && (
                <div className="col-span-full text-slate-400">
                  조건에 맞는 서비스가 없습니다. <button type="button" onClick={()=> { setSelectedCategories([]); setMinPrice(""); setMaxPrice(""); setSort("recommended"); setQuery(""); }} className="underline hover:text-slate-200">필터 초기화</button>
                </div>
              )}
            </div>
          )}

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
  );
}

function computeNextDate(baseDateStr, cycle) {
  try {
    const base = baseDateStr ? new Date(baseDateStr) : new Date();
    if (cycle === "year") {
      return `${base.getFullYear() + 1}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(base.getDate()).padStart(2, "0")}`;
    }
    const y = base.getFullYear();
    const m = base.getMonth();
    const d = base.getDate();
    const next = new Date(y, m + 1, d);
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
  } catch (_) {
    return "";
  }
}

// (컴포넌트 내부 정의 사용)


