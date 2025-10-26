import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getServices, getServiceDetail } from "../services/serviceService";
import { getNote } from "../services/localPrefs.js";
import { listFavorites, addFavorite as addFavoriteApi, removeFavorite as removeFavoriteApi } from "../services/favoritesService.js";

export default function AllServicesPage() {
  const nav = useNavigate();
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
  const [onlyFav, setOnlyFav] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(new Set()); // 서버 동기화 기반
  const [inputText, setInputText] = useState("");
  const [toastMsg, setToastMsg] = useState("");
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
          // 카테고리 목록 생성
          const cats = Array.from(new Set(list.map((s) => String(s.category || "").trim()).filter(Boolean))).sort((a,b)=> a.localeCompare(b));
          setCategories(cats);

          // 가격 정보 보강: 각 서비스 상세 플랜에서 최소/최대 가격 계산
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
                  const prices = plans
                    .map((p) => {
                      const raw = p.price ?? p.price_value ?? p.regular ?? null;
                      const num = Number(String(raw).toString().replace(/[^0-9.]/g, ""));
                      return Number.isFinite(num) && num > 0 ? num : null;
                    })
                    .filter((v) => v !== null);
                  if (prices.length === 0) return item;
                  const min = Math.min(...prices);
                  const max = Math.max(...prices);
                  return { ...item, min_price: min, max_price: max };
                })
              );
            })
            .catch(() => {});

          // 서버 즐겨찾기 초기 로드
          listFavorites().then((ids) => {
            if (cancelled) return;
            setFavoriteIds(new Set((ids || []).map(String)));
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
    // 정렬
    if (sort === "priceAsc") rows = [...rows].sort((a,b)=> Number(a.min_price||0) - Number(b.min_price||0));
    else if (sort === "priceDesc") rows = [...rows].sort((a,b)=> Number(b.min_price||0) - Number(a.min_price||0));
    else if (sort === "nameAsc") rows = [...rows].sort((a,b)=> (a.name||'').localeCompare(b.name||''));
    return rows;
  }, [items, query, selectedCategories, minPrice, maxPrice, sort, onlyFav, favoriteIds]);

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
                  setOnlyFav(false);
                  setSort("recommended");
                }}
                className="h-10 whitespace-nowrap rounded-2xl px-4 bg-white/10 hover:bg-white/15"
              >초기화</button>
            </form>
            <div>
              <label className="text-sm block mb-1" htmlFor="sort">정렬</label>
              <select id="sort" value={sort} onChange={(e)=> setSort(e.target.value)} className="rounded-2xl bg-slate-900 border border-white/10 px-3 py-2">
                <option value="recommended">추천순</option>
                <option value="priceAsc">가격 낮은순</option>
                <option value="priceDesc">가격 높은순</option>
                <option value="nameAsc">가나다순</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-sm block mb-1">카테고리</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c)=> {
                  const active = selectedCategories.includes(c);
                  return (
                    <button key={c} type="button" onClick={()=> setSelectedCategories((prev)=> active ? prev.filter(x=>x!==c) : [...prev, c])} className={`px-3 py-1 rounded-2xl ring-1 ring-white/10 ${active? 'btn-primary text-slate-50' : 'bg-white/10 text-slate-200 hover:bg-white/15'}`}>
                      #{c}
                      <span className="ml-2 text-xs text-slate-300">{categoryCounts.get(c) || 0}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm inline-flex items-center gap-2 mt-6 md:mt-0">
                <input type="checkbox" className="accent-fuchsia-500" checked={onlyFav} onChange={(e)=> setOnlyFav(e.target.checked)} /> 즐겨찾기만 보기
              </label>
            </div>
            <div>
              <label className="text-sm block mb-1" htmlFor="min">최소 가격</label>
              <input id="min" type="number" inputMode="numeric" className="w-full rounded-2xl bg-slate-900 border border-white/10 px-3 py-2" placeholder="0" value={minPrice} onChange={(e)=> setMinPrice(e.target.value)} />
            </div>
            <div>
              <label className="text-sm block mb-1" htmlFor="max">최대 가격</label>
              <input id="max" type="number" inputMode="numeric" className="w-full rounded-2xl bg-slate-900 border border-white/10 px-3 py-2" placeholder="20000" value={maxPrice} onChange={(e)=> setMaxPrice(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <button type="button" onClick={()=> { setSelectedCategories([]); setMinPrice(""); setMaxPrice(""); setSort("recommended"); setOnlyFav(false); }} className="px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/15">필터 초기화</button>
            </div>
          </div>

          {(selectedCategories.length>0 || minPrice || maxPrice || onlyFav) && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-slate-400 mr-1">적용된 필터:</span>
              {selectedCategories.map((c)=> (<span key={c} className="px-2 py-1 rounded-2xl bg-white/10">#{c}</span>))}
              {minPrice && <span className="px-2 py-1 rounded-2xl bg-white/10">최소 {minPrice}</span>}
              {maxPrice && <span className="px-2 py-1 rounded-2xl bg-white/10">최대 {maxPrice}</span>}
              {onlyFav && <span className="px-2 py-1 rounded-2xl bg-white/10">즐겨찾기만</span>}
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
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                          <div className="text-xl font-bold truncate">{s.name}</div>
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
                              setToastMsg(ok && ok.source === 'local' ? '즐겨찾기를 해제했어요.' : '즐겨찾기를 해제했어요.');
                            } else {
                              const ok = await addFavoriteApi(idStr);
                              setFavoriteIds((prev)=> { const next = new Set(prev); next.add(idStr); return next; });
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
                    {/* 메모 요약 뱃지 */}
                    {getNote(s.id) && (
                      <div className="mt-2 text-xs px-2 py-1 rounded-xl bg-white/10 text-slate-300 truncate" title={getNote(s.id)}>
                        메모: {getNote(s.id)}
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      <Link to={`/services/${s.id}`} onClick={(e)=> e.stopPropagation()} className="text-fuchsia-300 hover:underline text-sm">상세 보기</Link>
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
                >카드 비교하기</button>
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
  );
}


