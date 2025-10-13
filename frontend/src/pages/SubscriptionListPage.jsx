// src/pages/SubscriptionListPage.jsx
import SubscriptionItem from "../components/SubscriptionItem.jsx";

export default function SubscriptionListPage() {
  const subscriptions = [
    { id: 1, name: "Netflix Standard", price: "13,500원" },
    { id: 2, name: "Disney+ Basic", price: "9,900원" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">내 구독 리스트</h1>
      {subscriptions.map((sub) => (
        <SubscriptionItem key={sub.id} name={sub.name} price={sub.price} />
      ))}
      <hr className="my-4" />
      <p className="font-bold">총합: 23,400원</p>
    </div>
  );
}


