import { useNavigate } from "react-router-dom";

export default function ServiceCard({ id, name, price, tags = [], benefits, billing_cycle, icon, nextBilling, onAdd, priceVariant = "min" }) {
  const navigate = useNavigate();
  const canNavigate = Boolean(id);
  return (
    <div
      className="rounded-2xl bg-slate-900/60 p-5 ring-1 ring-white/10 shadow-lg cursor-pointer hover:bg-slate-900/70 transition"
      role={canNavigate ? "button" : undefined}
      tabIndex={canNavigate ? 0 : undefined}
      onClick={() => {
        if (canNavigate) navigate(`/services/${id}`);
      }}
      onKeyDown={(e) => {
        if (!canNavigate) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/services/${id}`);
        }
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

        {/* 왼쪽: 요금제 이름 */}
        <h3 className="font-semibold text-lg truncate min-w-0">
          <span className="truncate inline-block max-w-full">{name}</span>
        </h3>

        {/* 💡 오른쪽: 가격과 버튼을 감싸는 세로 컨테이너 */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-4">

          {/* 가격/주기 블록 */}
          <div className="text-left sm:text-right">
            {price && (
              <span className="text-base sm:text-lg font-semibold">
                {priceVariant === "detail"
                  ? (billing_cycle ? `${billing_cycle} ${price}` : `${price}`)
                  : `${billing_cycle ? `${billing_cycle} ` : ""} ${price} ~`}
              </span>
            )}
          </div>

          {/* '추가' 버튼 (이제 가격 밑으로 이동) */}
          {onAdd && (
            <button
              onClick={(e) => { e.stopPropagation(); onAdd(); }}
              className="w-full sm:w-auto px-4 py-2 btn-primary text-slate-50 rounded-lg font-semibold hover:opacity-95 transition"
            >
              추가
            </button>
          )}
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