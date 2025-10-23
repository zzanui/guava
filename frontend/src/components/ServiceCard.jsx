import { Link } from "react-router-dom";

export default function ServiceCard({ id, name, price, tags = [], benefits, billing_cycle, icon, nextBilling, onAdd }) {
  return (
    <div className="rounded-2xl bg-slate-900/60 p-5 ring-1 ring-white/10 shadow-lg">
      <div className="flex items-start justify-between">

        {/* 왼쪽: 요금제 이름 */}
        <h3 className="font-semibold text-lg">{name}</h3>

        {/* 💡 오른쪽: 가격과 버튼을 감싸는 세로 컨테이너 */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-4">

          {/* 가격/주기 블록 */}
          <div className="text-right">
            {price && billing_cycle && <span className="text-lg font-semibold">{billing_cycle} {price}</span>}
          </div>

          {/* '추가' 버튼 (이제 가격 밑으로 이동) */}
          <button
              onClick={onAdd}
              className="px-4 py-2 bg-cyan-500 text-slate-900 rounded-lg font-semibold hover:bg-cyan-400 transition"
            > 추가 </button>
        </div>
      </div>

      {/* 하단: 혜택 정보 표시 */}
      {benefits && (
        <div className="mt-3 text-sm text-slate-300">{benefits}</div>
      )}

      {/* 💡 버튼이 원래 여기에 있어서
        benefits 밑에 표시되었습니다.
      */}
    </div>
  );
}