// src/pages/SubscriptionListPage.jsx
import { useEffect, useState } from "react";
import SubscriptionItem from "../components/SubscriptionItem.jsx";
import { getSubscriptions, deleteSubscription } from "../services/subscriptionService";

export default function SubscriptionListPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        const data = await getSubscriptions();
        const results = Array.isArray(data?.results) ? data.results : [];
        const sum = Number(data?.total_price || 0);
        if (!cancelled) {
          setRows(results);
          setTotal(sum);
        }
      } catch (e) {
        if (!cancelled) setError("구독 목록을 불러오는 중 오류가 발생했어요.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">내 구독 리스트</h1>
      {loading && <div className="text-slate-400">로딩 중…</div>}
      {error && <div className="text-red-400">{error}</div>}
      {!loading && !error && rows.map((sub) => (
        <SubscriptionItem
          key={sub.id}
          name={`${sub.plan_service_name || ""} ${sub.plan_name || ""}`.trim()}
          price={`₩ ${Number(sub.price_override ?? sub.plan_price ?? 0).toLocaleString()}`}
          onDelete={async () => {
            try {
              await deleteSubscription(sub.id);
              setRows((prev)=> {
                const next = prev.filter((x)=> x.id !== sub.id);
                const nextTotal = next.reduce((acc, s) => acc + Number(s.price_override ?? s.plan_price ?? 0), 0);
                setTotal(nextTotal);
                return next;
              });
            } catch (_) {}
          }}
        />
      ))}
      <hr className="my-4" />
      <p className="font-bold">총합: ₩ {Number(total||0).toLocaleString()}</p>
    </div>
  );
}


