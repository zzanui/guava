export default function ServiceCard({ name, price }) {
    return (
      <div className="border p-4 rounded shadow-md">
        <h3 className="font-bold">{name}</h3>
        <p>{price}</p>
        <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded">
          상세보기
        </button>
      </div>
    );
  }