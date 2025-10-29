import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, Link, useSearchParams } from "react-router-dom";
import { listFavorites, addFavorite as addFavoriteApi, removeFavorite as removeFavoriteApi } from "../services/favoritesService.js";
// import { searchServices } from "../services/mockApi";
import { getServices } from "../services/serviceService.js";
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
  const [onlyFav, setOnlyFav] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [selected, setSelected] = useState({}); // id -> true
  const [hint, setHint] = useState("");
  const MAX_SELECT = 5;
  const [toastMsg, setToastMsg] = useState("");

  function formatKRW(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return "-";
    return `₩ ${num.toLocaleString()}`;
  }

  // 페이지 최초 진입 시 검색/필터 상태 초기화 (단, URL에 q가 있으면 유지)
  useEffect(() => {
    const hasQ = Boolean(query.get("q")?.trim());
    if (!hasQ) {
      const params = new URLSearchParams();
      setSearchParams(params, { replace: true });
      setSort("recommended");
      setMinPrice("");
      setMaxPrice("");
      setSelectedBenefits([]);
      setCategories([]);
      setOpCategory("or");
      setPage(1);
      didResetRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 즐겨찾기 초기 로드
  useEffect(() => {
    let cancelled = false;
    listFavorites()
      .then((ids) => {
        if (!cancelled) setFavoriteIds(new Set((ids || []).map(String)));
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
    if (onlyFav) {
      const favSet = favoriteIds;
      rows = rows.filter((s)=> favSet.has(String(s.id)));
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
  }, [items, q, categories, onlyFav, minPrice, maxPrice, sort, favoriteIds]);

  const selectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([k]) => k), [selected]);

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
            className="flex-1 flex items-center gap-3 flex-nowrap"
            role="search"
            aria-label="서비스 검색"
          >
            <input
              name="q"
              value={inputText}
              onChange={(e)=> setInputText(e.target.value)}
              placeholder="서비스 이름으로 검색 (예: 넷플릭스, 디즈니+)"
              className="w-full h-10 rounded-2xl bg-slate-900 border border-white/10 px-4 outline-none focus:ring-2 focus:ring-fuchsia-400"
              aria-label="검색어 입력"
            />
            <button
              type="submit"
              className="h-10 whitespace-nowrap rounded-2xl px-4 btn-primary text-slate-50 font-semibold hover:opacity-95 transition shadow-lg focus-ring"
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
                <input type="checkbox" className="accent-fuchsia-500" checked={onlyFav} onChange={(e)=> setOnlyFav(e.target.checked)} /> 즐겨찾기만 보기
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
            <button type="button" onClick={()=>{setMinPrice("");setMaxPrice("");setSelectedBenefits([]);setCategories([]);setOnlyFav(false);setSort("recommended");}} className="px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/15">필터 초기화</button>
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
              {onlyFav && <span className="px-2 py-1 rounded-2xl bg-white/10">즐겨찾기만</span>}
            </div>
          )}
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between" aria-live="polite" aria-atomic="true">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map((s) => {
              const checked = Boolean(selected[String(s.id)]);
              return (
                <div
                  key={s.id}
                  className={`rounded-lg bg-slate-800 p-6 ring-1 ${checked ? 'ring-fuchsia-500' : 'ring-white/10'} hover:bg-slate-700 transition cursor-pointer`}
                  onClick={() => {
                    const idStr = String(s.id);
                    setSelected((prev) => ({ ...prev, [idStr]: !Boolean(prev[idStr]) }));
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
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
                        const idStr = String(s.id);
                        const isFav = favoriteIds.has(idStr);
                        try {
                          if (isFav) {
                            const ok = await removeFavoriteApi(idStr);
                            setFavoriteIds((prev)=> { const next = new Set(prev); next.delete(idStr); return next; });
                            setToastMsg('즐겨찾기를 해제했어요.');
                          } else {
                            const ok = await addFavoriteApi(idStr);
                            setFavoriteIds((prev)=> { const next = new Set(prev); next.add(idStr); return next; });
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
                    >{favoriteIds.has(String(s.id)) ? '★' : '☆'}</button>
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
                    (월 가격 기준) 최소 {formatKRW(s.min_price)} ~ 최대 {formatKRW(s.max_price)}
                  </div>
                  <div className="mt-3">
                    <Link to={`/services/${s.id}`} onClick={(e)=> e.stopPropagation()} className="text-fuchsia-300 hover:underline text-sm">상세 보기</Link>
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
          <div className="mt-6 flex items-center justify-between">
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
        </div>
      </div>
    </div>
  );
}


