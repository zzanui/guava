import React, { useMemo, useState } from "react";

function formatKRW(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return `₩ ${num.toLocaleString()}`;
}

const PALETTES = {
  vibrant: ["#a78bfa", "#f472b6", "#60a5fa", "#34d399", "#fbbf24", "#f87171", "#22d3ee", "#c084fc"],
  cool: ["#93c5fd", "#67e8f9", "#6ee7b7", "#a7f3d0", "#bfdbfe", "#c7d2fe", "#99f6e4", "#86efac"],
  warm: ["#fdba74", "#fca5a5", "#f9a8d4", "#fcd34d", "#fbbf24", "#fb7185", "#f59e0b", "#f97316"],
};

export default function CategoryCostCharts({ data = [] }) {
  const [period, setPeriod] = useState("month"); // month | year
  const [theme, setTheme] = useState("vibrant"); // vibrant | cool | warm
  const [excluded, setExcluded] = useState(new Set());

  const allCategories = useMemo(() => Array.from(new Set((Array.isArray(data) ? data : []).map((d) => d.category || "기타"))), [data]);
  const multiplier = period === "year" ? 12 : 1;
  const visible = useMemo(() => (Array.isArray(data) ? data : []).filter((d)=> Number(d.amount) > 0 && !excluded.has(d.category || "기타")), [data, excluded]);
  const total = visible.reduce((acc, d) => acc + Number(d.amount || 0) * multiplier, 0);
  const max = visible.reduce((m, d) => Math.max(m, Number(d.amount || 0) * multiplier), 0);

  const segments = useMemo(() => {
    if (total <= 0) return [];
    const colors = PALETTES[theme] || PALETTES.vibrant;
    return visible.map((d, idx) => {
      const v = Number(d.amount || 0) * multiplier;
      return {
        label: d.category || "기타",
        value: v,
        pct: (v / total) * 100,
        color: colors[idx % colors.length],
      };
    });
  }, [visible, total, multiplier, theme]);

  const size = 180;
  const stroke = 18;
  const r = size / 2 - stroke / 2;
  const C = 2 * Math.PI * r;
  let accPct = 0;

  if (Array.isArray(data) && data.filter((d)=> Number(d.amount)>0).length === 0) {
    return (
      <div className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10 text-slate-300">
        카테고리별 지출 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">카테고리별 비용/비율</h2>
          <p className="text-sm text-slate-400">총 {formatKRW(total)} / {period === 'year' ? '년' : '월'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div>
            <label className="text-xs block mb-1" htmlFor="period">기간</label>
            <select id="period" value={period} onChange={(e)=> setPeriod(e.target.value)} className="h-10 rounded-2xl bg-slate-900 border border-white/10 px-3">
              <option value="month">월</option>
              <option value="year">년</option>
            </select>
          </div>
          <div>
            <label className="text-xs block mb-1" htmlFor="theme">테마</label>
            <select id="theme" value={theme} onChange={(e)=> setTheme(e.target.value)} className="h-10 rounded-2xl bg-slate-900 border border-white/10 px-3">
              <option value="vibrant">Vibrant</option>
              <option value="cool">Cool</option>
              <option value="warm">Warm</option>
            </select>
          </div>
          <div>
            <label className="text-xs block mb-1 invisible">내보내기</label>
            <button
              type="button"
              onClick={()=> {
              const headers = ["카테고리", `금액(${period==='year'?'년':'월'})`, "비율(%)"]; 
              const rows = segments.map(s => [s.label, String(Math.round(s.value)), String(Math.round(s.pct))]);
              const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'category-costs.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
            }}
              className="h-10 px-4 rounded-2xl bg-white/10 hover:bg-white/15"
            >CSV 내보내기</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mt-4">
        {/* 도넛 차트 */}
        <div className="flex items-center justify-center">
          <svg width={size} height={size} role="img" aria-label="카테고리별 비율 도넛 차트">
            <circle cx={size/2} cy={size/2} r={r} fill="transparent" stroke="#1f2937" strokeWidth={stroke} />
            {segments.map((s, i) => {
              const frac = s.pct / 100;
              const dash = C * frac;
              const gap = C - dash;
              const el = (
                <circle
                  key={s.label + i}
                  cx={size/2}
                  cy={size/2}
                  r={r}
                  fill="transparent"
                  stroke={s.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={-(C * accPct) / 100}
                  transform={`rotate(-90 ${size/2} ${size/2})`}
                />
              );
              accPct += s.pct;
              return el;
            })}
            <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="fill-slate-200 text-sm">
              {Math.round(segments[0]?.pct || 0)}%
            </text>
          </svg>
        </div>

        {/* 막대 차트 */}
        <div className="pt-2">
          {/* 제외 토글 */}
          <div className="mb-4">
            <div className="text-xs text-slate-400 mb-2">제외할 카테고리 선택</div>
            <div className="flex flex-wrap gap-2">
              {allCategories.map((c) => {
                const isExcluded = excluded.has(c || "기타");
                return (
                  <button
                    key={c || '기타'}
                    type="button"
                    onClick={()=> setExcluded((prev)=> { const next = new Set(prev); if (isExcluded) next.delete(c||'기타'); else next.add(c||'기타'); return next; })}
                    className={`h-8 px-3 rounded-2xl ring-1 ring-white/10 ${isExcluded ? 'bg-white/5 text-slate-400' : 'btn-primary text-slate-50'}`}
                    aria-pressed={isExcluded}
                  >{c || '기타'}</button>
                );
              })}
              {excluded.size > 0 && (
                <button type="button" onClick={()=> setExcluded(new Set())} className="h-8 px-3 rounded-2xl bg-white/10 hover:bg-white/15">초기화</button>
              )}
            </div>
          </div>
          <div className="space-y-3">
            {visible.map((d, idx) => {
              const v = Number(d.amount) * multiplier;
              const w = max > 0 ? (v / max) * 100 : 0;
              const color = (PALETTES[theme] || PALETTES.vibrant)[idx % (PALETTES[theme]||PALETTES.vibrant).length];
              return (
                <div key={String(d.category) + idx}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-300 truncate mr-3">{d.category || "기타"}</span>
                    <span className="text-slate-400 whitespace-nowrap">{formatKRW(v)} ({total>0 ? Math.round((v/total)*100) : 0}%)</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-3" style={{ width: `${w}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm text-slate-300">
        {segments.map((s, i)=> (
          <div key={s.label + i} className="flex items-center gap-2 min-w-0">
            <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: s.color }} />
            <span className="truncate">{s.label}</span>
            <span className="ml-auto text-slate-400 whitespace-nowrap">{Math.round(s.pct)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}


