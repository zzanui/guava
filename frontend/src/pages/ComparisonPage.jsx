import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getComparison } from "../services/mockApi";

function formatCurrency(krw) {
  return `₩ ${krw.toLocaleString()}`;
}

export default function ComparisonPage() {
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("recommended");
  const [selected, setSelected] = useState({});
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        const data = await getComparison({ sort });
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) setError("비교 데이터를 불러오는 중 오류가 발생했어요.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [sort]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">가격 비교</h1>
        <p className="mt-2 text-slate-400">정가·할인·번들을 한 눈에 비교해 보세요.</p>

        <div className="mt-4 flex items-end gap-3">
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
          <div className="flex items-center gap-3">
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
              {!loading && !error && rows.filter((r)=> showSelectedOnly ? Boolean(selected[r.name]) : true).map((r) => (
                <tr key={r.name} className="border-t border-white/10">
                  <td className="px-4 py-3"><input type="checkbox" className="accent-cyan-400" checked={Boolean(selected[r.name])} onChange={(e)=> setSelected(prev=> ({...prev, [r.name]: e.target.checked}))} /></td>
                  <th scope="row" className="px-4 py-3 font-medium">{r.name}</th>
                  <td className="px-4 py-3">{formatCurrency(r.regular)}</td>
                  <td className="px-4 py-3 text-cyan-300">
                    {r.discount ? formatCurrency(r.discount) : "-"}
                  </td>
                  <td className="px-4 py-3">
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
        <div className="mt-3 text-sm text-slate-400">선택 {Object.values(selected).filter(Boolean).length}개 · 표시 {rows.filter((r)=> showSelectedOnly ? Boolean(selected[r.name]) : true).length}개</div>

        <div className="mt-6">
          <Link to="/" className="text-cyan-300 hover:underline">홈으로 돌아가기 →</Link>
        </div>
      </div>
    </div>
  );
}


