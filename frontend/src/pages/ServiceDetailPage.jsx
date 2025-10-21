import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
// 💡 1. Mock API 대신 실제 API 서비스 함수를 import 합니다.
import { getServiceDetail } from "../services/serviceService";
import DetailServiceCard from "../components/ServiceCard"; // 요금제 표시에 필요하다면 사용
import { addSubscription } from "../services/subscriptionService";

export default function ServiceDetailPage() {
  // 💡 2. URL의 동적인 ID 값을 가져옵니다.
  const { id } = useParams();

  const [service, setService] = useState(null); // 상세 정보 (요금제 포함)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // URL의 id가 바뀔 때마다 실행됩니다.
    if (!id) return; // id가 없으면 실행하지 않음

    async function run() {
      setLoading(true);
      setError("");
      try {
        // 💡 3. URL에서 가져온 id로 실제 API를 호출합니다.
        const data = await getServiceDetail(id);
        setService(data);
      } catch (e) {
        console.error("상세 정보 로딩 실패:", e);
        setError("서비스 정보를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [id]); // 💡 4. 의존성 배열에 id를 꼭 넣어줍니다.

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;
  if (!service) return <div>서비스 정보가 없습니다.</div>;
  const handleAddSubscription = async (planId) => {
    try {
      // API 호출 (인증 토큰은 api.js가 자동으로 처리)
      await addSubscription(planId);

      // 3. 성공 피드백
      alert("구독이 성공적으로 추가되었습니다! '마이페이지'에서 확인하세요.");

    } catch (error) {
      console.error("구독 추가 실패:", error);
      // 401 오류(로그인 안 됨) 등 다양한 에러 처리
      alert("구독 추가에 실패했습니다. 로그인 상태를 확인해주세요.");
    }
  };
  return (
    <div>
      <h1>{service.name}</h1>
      <p>{service.description}</p>

    <div>
    {service.plans && service.plans.map((plan) => {
        const cycleText = plan.billing_cycle === 'month' ? '월' : '연';
        const formattedPrice = `₩ ${parseInt(plan.price).toLocaleString('ko-KR')}`;

        return (
          <DetailServiceCard
            key={plan.id}
            name={plan.plan_name}
            price={formattedPrice} // 가공된 가격 문자열
            benefits={plan.benefits}
            billing_cycle={cycleText} // '월' 또는 '연'
            onAdd={() => handleAddSubscription(plan.id)}
          />
        );
    })}
    </div>
  </div>
  );
}