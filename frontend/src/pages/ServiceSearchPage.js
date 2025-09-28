import ServiceCard from "../components/ServiceCard";

export default function ServiceSearchPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">서비스 검색</h1>
      <div className="grid grid-cols-3 gap-4">
        <ServiceCard name="Netflix" price="13,500원" />
        <ServiceCard name="Disney+" price="9,900원" />
        <ServiceCard name="Tving" price="10,900원" />
      </div>
    </div>
  );
}