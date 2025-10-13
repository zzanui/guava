// src/pages/MyPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getSubscriptions } from "../services/subscriptionService";

export default function MyPage() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    getSubscriptions()
      .then((data) => {
        if (!mounted) return;
        setSubs(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error(err);
        setError("구독 정보를 불러오지 못했습니다.");
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const total = useMemo(() => {
    const prices = subs
      .map((s) => s?.plan?.price || s?.custom_price)
      .filter((v) => typeof v === "number");
    return prices.reduce((acc, v) => acc + v, 0);
  }, [subs]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">마이페이지</h1>

      {loading && <p>불러오는 중...</p>}
      {error && (
        <p style={{ color: "red" }} className="mb-4">
          {error}
        </p>
      )}

      {!loading && !error && subs.length === 0 && (
        <div className="mb-6">
          <p>아직 등록된 구독이 없습니다.</p>
        </div>
      )}

      {!loading && !error && subs.length > 0 && (
        <section className="mb-6">
          <h2 className="font-bold mb-2">내 구독 리스트</h2>
          <ul className="list-disc pl-6">
            {subs.map((s) => (
              <li key={s.id} className="mb-1">
                {s?.plan?.plan_name || s?.plan?.name || `플랜 #${s?.plan}`} -
                {" "}
                {typeof s?.custom_price === "number"
                  ? `${s.custom_price.toLocaleString()}원`
                  : typeof s?.plan?.price === "number"
                  ? `${s.plan.price.toLocaleString()}원`
                  : "가격 정보 없음"}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-6">
        <h2 className="font-bold mb-2">총 구독료</h2>
        <p className="text-xl font-semibold">{total.toLocaleString()}원 / 월</p>
      </section>

      <section className="mb-6">
        <h2 className="font-bold mb-2">알림 설정</h2>
        <label className="block">
          <input type="checkbox" /> 이메일 알림
        </label>
        <label className="block">
          <input type="checkbox" /> 푸시 알림
        </label>
        <label className="block">
          <input type="checkbox" /> 문자 알림
        </label>
      </section>

      <section>
        <h2 className="font-bold mb-2">즐겨찾기</h2>
        <ul className="list-disc pl-6">
          <li>예시 항목</li>
        </ul>
      </section>
    </div>
  );
}