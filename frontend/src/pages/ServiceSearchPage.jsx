import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ServiceCard from "../components/ServiceCard.jsx";
import { searchServices } from "../services/mockApi";

// 목업 데이터는 mockApi에서 제공

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function ServiceSearchPage() {
  const query = useQuery();
  const q = query.get("q")?.trim() || "";
  const nav = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [sort, setSort] = useState("recommended");
  const [onlyOtt, setOnlyOtt] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        const rows = await searchServices({ q, onlyOtt, sort });
        if (!cancelled) setItems(rows);
      } catch (e) {
        if (!cancelled) setError("검색 중 오류가 발생했어요.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [q, onlyOtt, sort]);

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
          </div>
        </div>

        <div className="mt-4 flex flex-col md:flex-row gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const input = form.querySelector('input[name="q"]');
              const next = input?.value?.trim() || "";
              nav(`/search?q=${encodeURIComponent(next)}`);
            }}
            className="flex-1 flex items-center gap-3"
            role="search"
            aria-label="서비스 검색"
          >
            <input
              name="q"
              defaultValue={q}
              placeholder="서비스 이름으로 검색 (예: 넷플릭스, 디즈니+)"
              className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400"
              aria-label="검색어 입력"
            />
            <button
              type="submit"
              className="rounded-2xl px-5 py-3 bg-cyan-400 text-slate-900 font-semibold hover:opacity-90 transition shadow-lg focus-ring"
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

        <div className="mt-6">
          {/* 접근성: 상태 알림 */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {loading ? "로딩 중" : error ? `오류: ${error}` : `${items.length}건의 결과`}
          </div>
          {loading && <div className="text-slate-400" role="status" aria-live="polite">로딩 중…</div>}
          {error && <div className="text-red-400" role="alert">{error}</div>}
          {!loading && !error && items.length === 0 && (
            <div className="text-slate-400">검색 결과가 없습니다.</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((s) => (
              <ServiceCard key={s.id} {...s} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


