import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link, useSearchParams } from "react-router-dom";
import ServiceCard from "../components/ServiceCard.jsx";
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
  const [onlyOtt, setOnlyOtt] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [benefitChips, setBenefitChips] = useState(["FHD", "4K", "광고 제거"]);
  const [selectedBenefits, setSelectedBenefits] = useState([]);
  const [freeTrial, setFreeTrial] = useState(false);
  const [categories, setCategories] = useState([]);
  const [opCategory, setOpCategory] = useState("or");
  const [page, setPage] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    // URL -> 상태 초기화 (첫 마운트 시)
    const sortP = query.get("sort");
    if (sortP) setSort(sortP);
    const onlyOttP = query.get("onlyOtt");
    if (onlyOttP === "1" || onlyOttP === "true") setOnlyOtt(true);
    const minP = query.get("min");
    const maxP = query.get("max");
    if (minP) setMinPrice(minP);
    if (maxP) setMaxPrice(maxP);
    const freeP = query.get("free");
    if (freeP === "1" || freeP === "true") setFreeTrial(true);
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
    if (onlyOtt) params.set("onlyOtt", "1");
    if (minPrice) params.set("min", String(minPrice));
    if (maxPrice) params.set("max", String(maxPrice));
    if (freeTrial) params.set("free", "1");
    if (opCategory && opCategory !== "or") params.set("opCat", opCategory);
    selectedBenefits.forEach((b) => params.append("benefit", b));
    categories.forEach((c) => params.append("cat", c));
    if (page > 1) params.set("page", String(page));
    const prev = searchParams.toString();
    const next = params.toString();
    if (prev !== next) setSearchParams(params, { replace: true });
  }, [q, sort, onlyOtt, minPrice, maxPrice, selectedBenefits, freeTrial, categories, opCategory, page, searchParams, setSearchParams]);

useEffect(() => {
let cancelled = false;
async function run() {
  setLoading(true);
  setError("");
  try {
    const apiParams = {
      q: q,
      min_price: minPrice ? Number(minPrice) : undefined,
      max_price: maxPrice ? Number(maxPrice) : undefined,
      categories: categories
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
  }, [q, onlyOtt, sort, categories, opCategory, minPrice, maxPrice, selectedBenefits, freeTrial]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        {/* 인라인 검색바 + 정렬 */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">서비스 검색</h1>
            {q && <p className="mt-1 text-slate-400">검색어: "{q}"</p>}
          </div>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-cyan-400"
                checked={onlyOtt}
                onChange={(e) => setOnlyOtt(e.target.checked)}
                aria-label="OTT만 보기"
              />
              OTT만 보기
            </label>
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
              const form = e.currentTarget;
              const input = form.querySelector('input[name="q"]');
              const next = input?.value?.trim() || "";
              const params = new URLSearchParams(searchParams);
              if (next) params.set("q", next); else params.delete("q");
              setSearchParams(params, { replace: true });
            }}
            className="flex-1 flex items-center gap-3 flex-nowrap"
            role="search"
            aria-label="서비스 검색"
          >
            <input
              name="q"
              defaultValue={q}
              placeholder="서비스 이름으로 검색 (예: 넷플릭스, 디즈니+)"
              className="w-full h-10 rounded-2xl bg-slate-900 border border-white/10 px-4 outline-none focus:ring-2 focus:ring-cyan-400"
              aria-label="검색어 입력"
            />
            <button
              type="submit"
              className="h-10 whitespace-nowrap rounded-2xl px-4 bg-cyan-400 text-slate-900 font-semibold hover:opacity-90 transition shadow-lg focus-ring"
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
                {["video","AI","delivery", "shopping", "productivity","music","design","cloud_storage"].map((c)=>{
                  const active = categories.includes(c);
                  return (
                    <button key={c} type="button" onClick={()=> setCategories(prev=> active? prev.filter(x=>x!==c): [...prev, c])} className={`px-3 py-1 rounded-2xl ring-1 ring-white/10 ${active? 'bg-cyan-400 text-slate-900' : 'bg-white/10 text-slate-200 hover:bg-white/15'}`}>#{c}</button>
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
            <div className="md:col-span-2">
              <label className="text-sm block mb-1">혜택</label>
              <div className="flex flex-wrap gap-2">
                {benefitChips.map((b)=>{
                  const active = selectedBenefits.includes(b);
                  return (
                    <button key={b} type="button" onClick={()=>setSelectedBenefits(prev=> active? prev.filter(x=>x!==b): [...prev,b])} className={`px-3 py-1 rounded-2xl ring-1 ring-white/10 ${active? 'bg-cyan-400 text-slate-900' : 'bg-white/10 text-slate-200 hover:bg-white/15'}`}>{b}</button>
                  )
                })}
              </div>
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" className="accent-cyan-400" checked={freeTrial} onChange={(e)=>setFreeTrial(e.target.checked)} />
              무료체험
            </label>
            <button type="button" onClick={()=>{setMinPrice("");setMaxPrice("");setSelectedBenefits([]);setFreeTrial(false);setCategories([]);}} className="px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/15">필터 초기화</button>
          </div>
          {(selectedBenefits.length>0 || minPrice || maxPrice || freeTrial || categories.length>0) && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-slate-400 mr-1">적용된 필터:</span>
              {categories.map((c)=> (<span key={c} className="px-2 py-1 rounded-2xl bg-white/10">#{c}</span>))}
              {minPrice && <span className="px-2 py-1 rounded-2xl bg-white/10">최소 {minPrice}</span>}
              {maxPrice && <span className="px-2 py-1 rounded-2xl bg-white/10">최대 {maxPrice}</span>}
              {freeTrial && <span className="px-2 py-1 rounded-2xl bg-white/10">무료체험</span>}
              {selectedBenefits.map((b)=> (
                <span key={b} className="px-2 py-1 rounded-2xl bg-white/10">{b}</span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6">
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
          {items.map((s) => (
    <Link
      key={s.id}
      to={`/services/${s.id}`}
      className="block p-6 bg-slate-800 rounded-lg hover:bg-slate-700 transition"
    >
      <h3 className="text-xl font-bold">{s.name}</h3>
      <p className="mt-2 text-slate-400">{s.category}</p>
      <p className="mt-1 text-sm text-slate-500">{s.description}</p>
      <p className="mt-1 text-sm text-slate-300">(월 가격 기준) 최소 {s.min_price}원 ~ 최대 {s.max_price}원</p>
    </Link>
  ))}
            {items.slice((page-1)*pageSize, page*pageSize).map((s) => (
              <ServiceCard key={s.id} {...s} />
            ))}
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
        </div>
      </div>
    </div>
  );
}


