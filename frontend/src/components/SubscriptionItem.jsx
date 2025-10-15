// src/components/SubscriptionItem.jsx
export default function SubscriptionItem({ name, price }) {
  return (
    <div className="flex justify-between items-center border p-3 rounded mb-2">
      <div>
        <h3 className="font-bold">{name}</h3>
        <p className="text-gray-600">{price}</p>
      </div>
      <button className="bg-red-500 text-white px-3 py-1 rounded">
        삭제
      </button>
    </div>
  );
}


