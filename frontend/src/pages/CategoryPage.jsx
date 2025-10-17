import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import SidebarLayout from "../layouts/SidebarLayout.jsx";
import ServiceCard from "../components/ServiceCard.jsx";
import { getServices } from "../services/serviceService";

export default function CategoryPage() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("recommended");
  const [view, setView] = useState("card"); // card | list

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        const rows = await getServices({ q, category: slug });
        if (!cancelled) setItems(rows.map((s)=> ({
          id: s.id,
          name: s.name,
          price: undefined,
          tags: [],
          icon: s.logo_url || undefined,
          nextBilling: undefined,
        })));
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
  }, [slug, q, sort]);

  return (
    <SidebarLayout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">카테고리: {slug}</h1>
          {q && <p className="mt-1 text-slate-400">검색어: "{q}"</p>}
        </div>
        <div className="flex items-center gap-3">
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
          const input = e.currentTarget.querySelector('input[name="q"]');
          setQ(input?.value?.trim() || "");
        }}
        className="mt-6 flex items-center gap-3"
        role="search"
        aria-label="카테고리 내 검색"
      >
        <input
          name="q"
          defaultValue={q}
          placeholder="이 카테고리에서 검색"
          className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400"
          aria-label="검색어 입력"
        />
        <button type="submit" className="rounded-2xl px-5 py-3 bg-cyan-400 text-slate-900 font-semibold hover:opacity-90 transition">검색</button>
      </form>

      <div className="mt-8" aria-live="polite" aria-atomic="true">
        {loading && <div className="text-slate-400">로딩 중…</div>}
        {error && <div className="text-red-400">{error}</div>}
        {!loading && !error && items.length === 0 && (
          <div className="text-slate-400">결과가 없습니다.</div>
        )}

        {view === "card" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((s) => (
              <ServiceCard key={s.id} {...s} />
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-white/10">
            {items.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  {s.icon && <img src={s.icon} alt="로고" className="w-6 h-6 rounded" />}
                  <div className="font-medium">{s.name}</div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-slate-300">{s.price ?? "가격 정보 없음"}</div>
                  {s.nextBilling && (
                    <div className="text-slate-400">다음 결제일: {s.nextBilling}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SidebarLayout>
  );
}


