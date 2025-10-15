// src/pages/SubscriptionListPage.jsx
import SubscriptionItem from "../components/SubscriptionItem.jsx";
import { listSubscriptions } from "../services/localSubscriptions.js";

export default function SubscriptionListPage() {
  const store = listSubscriptions();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">내 구독 리스트</h1>
      {store.map((sub) => (
        <SubscriptionItem key={sub.__id} name={sub.name} price={`₩ ${Number(sub.priceValue||0).toLocaleString()}`} />
      ))}
      <hr className="my-4" />
      <p className="font-bold">총합: ₩ {store.reduce((a,b)=>a+Number(b.priceValue||0),0).toLocaleString()}</p>
    </div>
  );
}


