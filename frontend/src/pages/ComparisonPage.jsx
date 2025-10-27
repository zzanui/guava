import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getComparison as getComparisonApi } from "../services/serviceService";
import { getComparison as getComparisonMock } from "../services/mockApi";

function formatCurrency(krw) {
  return `₩ ${krw.toLocaleString()}`;
}

export default function ComparisonPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("recommended");
  const [selected, setSelected] = useState({});
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const ids = useMemo(() => (searchParams.get('ids') || searchParams.get('plan_id') || '').split(',').map((v)=> v.trim()).filter(Boolean), [searchParams]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        if (ids.length > 0) {
          const data = await getComparisonApi(ids);
          // 가격 파싱 보강: 숫자/통화 문자열/대체 필드 지원
          const mapped = (data || []).map((s) => {
            const prices = Array.isArray(s.plans)
              ? s.plans
                  .map((p) => {
                    const raw = p.price ?? p.price_value ?? p.regular ?? null;
                    const num = Number(String(raw).toString().replace(/[^0-9.]/g, ""));
                    return Number.isFinite(num) && num > 0 ? num : null;
                  })
                  .filter((v) => v !== null)
              : [];
            const minPrice = prices.length ? Math.min(...prices) : 0;
            const benefits = Array.from(
              new Set(
                (s.plans || [])
                  .flatMap((p) => String(p.benefits || "").split(',').map((v) => v.trim()).filter(Boolean))
              )
            );
            return {
              name: s.name,
              regular: minPrice,
              discount: null,
              bundle: null,
              benefits,
            };
          });
          // API가 빈 배열을 반환해도 폴백 실행
          if (!cancelled) {
            if (mapped.length === 0) {
              const fallback = await getComparisonMock({ sort });
              setRows(fallback);
            } else {
              setRows(mapped);
            }
          }
        } else {
          const data = await getComparisonMock({ sort });
          if (!cancelled) setRows(data);
        }
      } catch (e) {
        // 서버 비교/상세 API가 실패할 경우 목업 데이터로 폴백
        try {
          const data = await getComparisonMock({ sort });
          if (!cancelled) {
            setRows(data);
            setError("");
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container-page section-y">
        <div className="mx-auto w-full max-w-6xl">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">가격 비교</h1>
        <p className="mt-2 text-slate-400">정가·할인·번들을 한 눈에 비교해 보세요.</p>

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

        <div className="mt-6">
          <Link to="/" className="text-fuchsia-300 hover:underline">홈으로 돌아가기 →</Link>
      </div>
        </div>
      </div>
    </div>
  );
}


