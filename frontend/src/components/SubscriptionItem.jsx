// src/components/SubscriptionItem.jsx
export default function SubscriptionItem({ name, price, startDate, nextPaymentDate, memo, billingCycle, onDelete }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border border-white/10 bg-slate-900/60 ring-1 ring-white/10 p-3 rounded-2xl">
      <div className="min-w-0">
        <h3 className="font-bold truncate">{name}</h3>
        <div className="text-slate-300">
          {price}
          {billingCycle !== undefined && billingCycle !== null && (
            <span className="ml-2 align-middle text-xs text-slate-400">
              {String(billingCycle).toLowerCase().startsWith('year') ? '연' : '월'}
            </span>
          )}
        </div>
        <div className="mt-1 text-xs text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
          {startDate && <span className="whitespace-nowrap">시작일: {startDate}</span>}
          {nextPaymentDate && <span className="whitespace-nowrap">다음 결제일: {nextPaymentDate}</span>}
          {memo && <span className="truncate max-w-[40ch]">메모: {memo}</span>}
        </div>
      </div>
      <button onClick={onDelete} className="px-3 py-1 rounded-2xl bg-white/10 hover:bg-white/15 flex-shrink-0">
        삭제
      </button>
    </div>
  );
}


