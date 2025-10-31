import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import SidebarLayout from "../layouts/SidebarLayout.jsx";
import { getServices, getServiceDetail } from "../services/serviceService";
import { addSubscription, getSubscriptions } from "../services/subscriptionService";
import useAuth from "../hooks/useAuth";
import { useGuavaDialog } from "../context/GuavaDialogContext.jsx";
import { listBookmarks, addBookmark as addBookmarkApi, removeBookmark as removeBookmarkApi } from "../services/bookmarksService.js";

export default function CategoryPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth() || {};
  const { alert: guavaAlert, confirm: guavaConfirm } = useGuavaDialog();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [bookmarkIds, setBookmarkIds] = useState(new Set());
  const [selected, setSelected] = useState({}); // id -> true
  const MAX_SELECT = 5;
  const selectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([k]) => k), [selected]);
  const [hint, setHint] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("recommended");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inputText, setInputText] = useState("");
  const [view, setView] = useState("card"); // card | list
  const [addOpen, setAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addPlans, setAddPlans] = useState([]);
  const [addService, setAddService] = useState({ id: null, name: "" });
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [addStep, setAddStep] = useState("select"); // select | details
  const [startDate, setStartDate] = useState("");
  const [nextPaymentDate, setNextPaymentDate] = useState("");
  const [customMemo, setCustomMemo] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  // 카테고리 전환 시 검색/필터 초기화
  useEffect(() => {
    setQ("");
    setMinPrice("");
    setMaxPrice("");
    setSort("recommended");
    setView("card");
    setSelected({});
    setBookmarkIds(new Set());
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        const rows = await getServices({
          q,
          categories: [slug],
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          sort,
        });
        // 백엔드 필터가 적용되지 않는 경우를 대비한 클라이언트 보정 필터
        const baseRows = Array.isArray(rows)
          ? (slug ? rows.filter((s) => String(s.category || "").toLowerCase() === String(slug || "").toLowerCase()) : rows)
          : [];
        if (!cancelled) setItems(baseRows.map((s)=> ({
          id: s.id,
          name: s.name,
          price: undefined,
          tags: [],
          icon: s.logo_url || undefined,
          nextBilling: undefined,
        })));
        // 가격 미리보기: 각 서비스의 상세 플랜 중 최저가를 비동기로 조회해 표시
        Promise.allSettled((baseRows || []).map((s) => getServiceDetail(s.id))).then((results) => {
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

              // 플랜 가격/주기 정규화
              const normalized = plans
                .map((p) => {
                  const raw = p.price ?? p.price_value ?? p.regular ?? null;
                  const priceNum = Number(String(raw).toString().replace(/[^0-9.]/g, ""));
                  const hasNum = Number.isFinite(priceNum) && priceNum > 0;
                  const priceText = hasNum ? `₩ ${priceNum.toLocaleString()}` : (typeof raw === "string" ? raw : "");
                  const cycleText = p.billing_cycle === "month" ? "월" : p.billing_cycle === "year" ? "연" : (p.cycle || "");
                  return { priceNum: hasNum ? priceNum : Infinity, priceText, cycleText };
                })
                .filter((x) => x.priceNum !== Infinity);

              if (normalized.length === 0) return item;
              const cheapest = normalized.sort((a, b) => a.priceNum - b.priceNum)[0];
              return { ...item, price: cheapest.priceText, billing_cycle: cheapest.cycleText };
            })
          );
        }).catch(() => {});

        // 북마크 초기 로드
        listBookmarks()
          .then((ids) => { if (!cancelled) setBookmarkIds(new Set((ids || []).map(String))); })
          .catch(() => {});
      } catch (e) {
        if (!cancelled) setError("데이터를 불러오는 중 오류가 발생했어요.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [slug, q, sort, minPrice, maxPrice]);

  async function openAdd(serviceId, serviceName) {
    if (!isAuthenticated) {
      await guavaAlert("로그인이 필요한 서비스입니다.");
      navigate("/login", { replace: false, state: { from: location } });
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

  function computeNextDate(baseDateStr, cycle) {
    try {
      const base = baseDateStr ? new Date(baseDateStr) : new Date();
      if (cycle === "year") {
        return `${base.getFullYear() + 1}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(base.getDate()).padStart(2, "0")}`;
      }
      // month default
      const y = base.getFullYear();
      const m = base.getMonth();
      const d = base.getDate();
      const next = new Date(y, m + 1, d);
      return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
    } catch (_) {
      return "";
    }
  }

  async function confirmAdd() {
    if (!selectedPlanId) return;
    if (!startDate || !nextPaymentDate) {
      await guavaAlert("시작일과 다음 결제일을 입력해주세요.");
      return;
    }
    try {
      // 중복 추가 방지: 내 구독 리스트에서 동일 플랜이 있는지 확인
      try {
        const my = await getSubscriptions();
        const items = Array.isArray(my?.results) ? my.results : [];
        const already = items.some((s)=> String(s.plan) === String(selectedPlanId));
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
    <SidebarLayout hideSidebarOnMobile>
      <div className="container-page section-y">
        <div className="mx-auto w-full max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">카테고리: {slug}</h1>
          {q && <p className="mt-1 text-slate-400">검색어: "{q}"</p>}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
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
              <option value="nextBillingAsc">결제일 빠른순</option>
            </select>
          </div>
          <div>
            <label className="text-sm block mb-1">보기</label>
            <div className="inline-flex rounded-2xl ring-1 ring-white/10 overflow-hidden">
              <button
                className={`px-3 py-2 ${view === "card" ? "bg-white/10" : "bg-transparent"}`}
                onClick={() => setView("card")}
                aria-label="카드 보기"
              >
                카드
              </button>
              <button
                className={`px-3 py-2 ${view === "list" ? "bg-white/10" : "bg-transparent"}`}
                onClick={() => setView("list")}
                aria-label="리스트 보기"
              >
                리스트
              </button>
            </div>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQ((inputText || "").trim());
          setInputText("");
        }}
        className="mt-6 flex items-center gap-3 flex-wrap sm:flex-nowrap"
        role="search"
        aria-label="카테고리 내 검색"
      >
        <input
          name="q"
          value={inputText}
          onChange={(e)=> setInputText(e.target.value)}
          placeholder="이 카테고리에서 검색"
            className="w-full h-10 rounded-2xl bg-slate-900 border border-white/10 px-4 outline-none focus:ring-2 focus:ring-fuchsia-400"
          aria-label="검색어 입력"
        />
        <button type="submit" className="h-10 w-full sm:w-auto whitespace-nowrap rounded-2xl px-4 btn-primary text-slate-50 font-semibold hover:opacity-95 transition">검색</button>
      </form>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-sm block mb-1" htmlFor="min">최소 가격</label>
          <input
            id="min"
            type="number"
            inputMode="numeric"
            className="w-full rounded-2xl bg-slate-900 border border-white/10 px-3 py-2"
            placeholder="0"
            value={minPrice}
            onChange={(e)=> setMinPrice(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm block mb-1" htmlFor="max">최대 가격</label>
          <input
            id="max"
            type="number"
            inputMode="numeric"
            className="w-full rounded-2xl bg-slate-900 border border-white/10 px-3 py-2"
            placeholder="20000"
            value={maxPrice}
            onChange={(e)=> setMaxPrice(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={()=> {
            setMinPrice("");
            setMaxPrice("");
            setQ("");
            setInputText("");
            setSort("recommended");
            setView("card");
          }}
          className="self-end h-10 whitespace-nowrap rounded-2xl px-4 btn-primary text-slate-50 font-semibold hover:opacity-95 transition"
        >
          필터 초기화
        </button>
      </div>

      <div className="mt-8" aria-live="polite" aria-atomic="true">
        {loading && <div className="text-slate-400">로딩 중…</div>}
        {error && <div className="text-red-400">{error}</div>}
        {!loading && !error && items.length === 0 && (
          <div className="text-slate-400">결과가 없습니다.</div>
        )}

        {view === "card" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((s) => {
              const checked = Boolean(selected[String(s.id)]);
              return (
                <div
                  key={s.id}
                  className={`rounded-2xl bg-slate-900/60 p-5 ring-1 ${checked ? 'ring-fuchsia-500' : 'ring-white/10'} shadow-lg transition cursor-pointer hover:bg-slate-900/70`}
                  onClick={() => {
                    const idStr = String(s.id);
                    setSelected((prev) => {
                      if (prev[idStr]) {
                        const next = { ...prev };
                        delete next[idStr];
                        return next;
                      }
                      const count = Object.values(prev).filter(Boolean).length;
                      if (count >= MAX_SELECT) {
                        setHint(`최대 ${MAX_SELECT}개까지 선택할 수 있어요.`);
                        setTimeout(() => setHint(""), 1800);
                        return prev;
                      }
                      return { ...prev, [idStr]: true };
                    });
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {s.icon ? (
                          <img src={s.icon} alt={s.name} className="h-7 w-7 rounded" />
                        ) : (
                          <div className="h-7 w-7 rounded bg-white/10 flex items-center justify-center text-xs text-slate-300">{(s.name || '?').slice(0,1)}</div>
                        )}
                        {s.id ? (
                          <Link to={`/services/${s.id}`} className="text-xl font-bold truncate hover:underline" title={s.name} onClick={(e)=> e.stopPropagation()}>
                            {s.name}
                          </Link>
                        ) : (
                          <div className="text-xl font-bold truncate" title={s.name}>{s.name}</div>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-slate-300 whitespace-nowrap">
                        {s.price ? `${s.billing_cycle ? `${s.billing_cycle} ` : ""} ${s.price} ~` : "가격 정보 없음"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="px-2 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-xs"
                        onClick={async (e)=> {
                          e.stopPropagation();
                          if (!isAuthenticated) {
                            await guavaAlert('로그인이 필요한 서비스 입니다.');
                            navigate("/login", { replace: false, state: { from: location } });
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
                            setToastMsg('즐겨찾기 추가에 실패했어요. 관리자에게 문의해주세요.');
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
                        className="accent-fuchsia-500 mt-1"
                        checked={checked}
                        onChange={(e)=> {
                          const idStr = String(s.id);
                          setSelected((prev)=> {
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
                          });
                        }}
                        aria-label="비교 대상 선택"
                        onClick={(e)=> e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {s.id && <Link to={`/services/${s.id}`} className="text-fuchsia-300 hover:underline text-sm" onClick={(e)=> e.stopPropagation()}>상세 보기</Link>}
                    {s.id && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openAdd(s.id, s.name); }}
                        className="px-3 py-1 rounded-xl btn-primary text-slate-50 whitespace-nowrap text-sm"
                      >
                        구독목록 추가
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <ul className="divide-y divide-white/10">
            {items.map((s) => (
              <li key={s.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-3">
                <div className="flex items-center gap-3 min-w-0">
                  {s.icon && <img src={s.icon} alt="로고" className="w-6 h-6 rounded" />}
                  {s.id ? (
                    <Link to={`/services/${s.id}`} className="font-medium hover:underline truncate">
                      {s.name}
                    </Link>
                  ) : (
                    <span className="font-medium truncate">{s.name}</span>
                  )}
                </div>
                <div className="flex items-center gap-6 text-sm text-left sm:text-right">
                  <div className="text-slate-300 whitespace-nowrap">{s.price ? `${s.billing_cycle ? `${s.billing_cycle} ` : ""} ${s.price} ~` : "가격 정보 없음"}</div>
                  {s.nextBilling && (
                    <div className="text-slate-400 whitespace-nowrap">다음 결제일: {s.nextBilling}</div>
                  )}
                  {s.id && (
                    <button
                      type="button"
                      onClick={() => openAdd(s.id, s.name)}
                      className="px-3 py-1 rounded-xl btn-primary text-slate-50 whitespace-nowrap"
                    >
                      구독목록 추가
                    </button>
                  )}
                  <button
                    className="px-2 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-xs"
                    onClick={async ()=> {
                      if (!isAuthenticated) {
                        await guavaAlert('로그인이 필요한 서비스 입니다.');
                        navigate("/login", { replace: false, state: { from: location } });
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
                  {/* 비교 선택 체크박스 */}
                  <input
                    type="checkbox"
                    className="accent-fuchsia-500"
                    checked={Boolean(selected[String(s.id)])}
                    onChange={(e)=> {
                      const idStr = String(s.id);
                      setSelected((prev)=> {
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
                      });
                    }}
                    aria-label="비교 대상 선택"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
        {(hint || selectedIds.length>0) && (
          <div className="mt-3 flex items-center justify-between gap-3 text-sm">
            {hint ? <div className="text-amber-300">{hint}</div> : <div />}
            <div className="text-slate-400">선택 {selectedIds.length}/{MAX_SELECT}</div>
          </div>
        )}
        {/* 하단 고정 비교 바 */}
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
                onClick={()=> navigate(`/compare-cards?ids=${selectedIds.join(',')}`)}
                className="px-4 py-2 rounded-2xl btn-primary text-slate-50 font-semibold hover:opacity-95 disabled:opacity-50"
              >가격 비교하기</button>
            </div>
          </div>
        </div>
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
        {toastMsg && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl bg-fuchsia-600/90 text-slate-50 shadow-lg z-50" role="status" aria-live="polite">
            {toastMsg}
          </div>
        )}
      </div>
        </div>
      </div>
    </SidebarLayout>
  );
}


