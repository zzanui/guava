import { Link } from "react-router-dom";

export default function ServiceCard({ id, name, price, tags = [], benefits, billing_cycle, icon, nextBilling }) {
return (
    <div className="rounded-2xl bg-slate-900/60 p-5 ring-1 ring-white/10 shadow-lg">
      {/* 상단: 요금제 이름과 가격/주기 표시 */}
      <div className="flex items-start justify-between">
        {/* 왼쪽: 요금제 이름 (h3 태그 유지) */}
        <h3 className="font-semibold text-lg">{name}</h3>

        {/* 오른쪽: 가격과 결제 주기 (text-right로 정렬) */}
        <div className="text-right flex-shrink-0 ml-4">
          {price && billing_cycle && <span className="text-lg font-semibold">{billing_cycle} {price}</span>}
        </div>
      </div>

      {/* 하단: 혜택 정보 표시 */}
      {benefits && (
        <div className="mt-3 text-sm text-slate-300">{benefits}</div>
      )}
    </div>
  );
}


