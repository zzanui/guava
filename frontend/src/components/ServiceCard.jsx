import { Link } from "react-router-dom";

export default function ServiceCard({ id, name, price, tags = [], icon, nextBilling }) {
  return (
    <div className="rounded-2xl bg-slate-900/60 p-5 ring-1 ring-white/10 shadow-lg hover:bg-white/10 transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <img src={icon} alt="서비스 로고" className="w-7 h-7 rounded" />
          )}
          <h3 className="font-semibold text-lg">{name}</h3>
        </div>
        {price && <span className="text-sm text-slate-300">{price}</span>}
      </div>
      {nextBilling && (
        <div className="mt-2 text-xs text-slate-400">다음 결제일: {nextBilling}</div>
      )}
      {tags?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((t) => (
            <span key={t} className="text-xs px-2 py-1 rounded-full bg-white/10 text-slate-300">
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="mt-4">
        <Link
          to={`/services/${id}`}
          className="inline-block rounded-2xl px-4 py-2 bg-cyan-400 text-slate-900 font-semibold hover:opacity-90 transition focus-ring"
          aria-label={`${name} 상세 보기로 이동`}
        >
          자세히 보기
        </Link>
      </div>
    </div>
  );
}


