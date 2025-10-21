// src/pages/MyPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { listSubscriptions, removeSubscription, monthlyTotal } from "../services/localSubscriptions.js";
import api from "../services/api";

export default function MyPage() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    try {
      setSubs(listSubscriptions());
    } catch (e) {
      setError("구독 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  const total = useMemo(() => monthlyTotal(), [subs]);
const handleDownload = async (format) => {
  // format은 'csv' 또는 'pdf'
  const endpoint = `api/my/subscriptions/export_${format}/`;
  const filename = `report.${format}`; // 기본 파일명

  try {
    // 3. axios로 API 호출 (인증 토큰이 자동으로 포함됨)
    const response = await api.get(endpoint, {
      responseType: 'blob', // 💡 4. 응답 타입을 'blob' (파일)으로 지정
    });

    // 5. 다운로드 로직 (브라우저에서 실행)
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename); // 다운로드될 파일명 설정
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link); // 임시 링크 제거
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error("파일 다운로드 오류:", error);
    alert("리포트 파일을 다운로드하는 중 오류가 발생했습니다.");
  }
};

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">마이페이지</h1>
        <a href="/" className="rounded-2xl px-4 py-2 bg-white/10 hover:bg-white/15 transition">홈으로</a>
      </div>

      {loading && <p className="text-slate-400 mt-6">불러오는 중...</p>}
      {error && (
        <p className="mb-4 text-red-400">
          {error}
        </p>
      )}

      {!loading && !error && subs.length === 0 && (
        <div className="mb-6 rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
          <p className="text-slate-300">아직 등록된 구독이 없습니다.</p>
          <a href="/search" className="inline-block mt-3 text-cyan-300 hover:underline">서비스 찾아보기 →</a>
        </div>
      )}

      {!loading && !error && subs.length > 0 && (
        <section className="mb-6">
          <h2 className="text-2xl font-bold mb-3">내 구독 리스트</h2>
          <ul className="divide-y divide-white/10 rounded-2xl bg-slate-900/60 ring-1 ring-white/10">
            {subs.map((s) => (
              <li key={s.__id} className="flex items-center justify-between py-3 px-4">
                <div className="font-medium truncate">{s.name}</div>
                <div className="flex items-center gap-3">
                  <div className="text-slate-300">₩ {Number(s.priceValue||0).toLocaleString()}</div>
                  <button
                    onClick={() => { removeSubscription(s.__id); setSubs(listSubscriptions()); }}
                    className="px-3 py-1 rounded-2xl bg-white/10 hover:bg-white/15"
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-6 rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
        <h2 className="text-2xl font-bold mb-2">총 구독료</h2>
        <p className="text-2xl font-extrabold">₩ {total.toLocaleString()} / 월</p>
      </section>

      <section className="mb-6 rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
        <h2 className="text-2xl font-bold mb-2">알림 설정</h2>
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

      <section className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
        <h2 className="text-2xl font-bold mb-2">즐겨찾기</h2>
        <ul className="list-disc pl-6 text-slate-300">
          <li>예시 항목</li>
        </ul>
      </section>

        <div className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10"> {/* 기존 카드 스타일 가정 */}
    <h2 className="text-xl font-bold mb-4">구독 서비스 리포트</h2>

    {/* 💡 6. 버튼 2개를 배치할 컨테이너 */}
    <div className="flex flex-col sm:flex-row gap-4">
      {/* CSV 다운로드 버튼 */}
      <button
        onClick={() => handleDownload('csv')}
        className="flex-1 px-4 py-3 bg-white/10 text-slate-100 rounded-lg font-semibold hover:bg-white/20 transition duration-200"
      >
        CSV로 내보내기
      </button>

      {/* PDF 다운로드 버튼 */}
      <button
        onClick={() => handleDownload('pdf')}
        className="flex-1 px-4 py-3 bg-cyan-400 text-slate-900 rounded-lg font-semibold hover:bg-cyan-300 transition duration-200"
      >
        PDF로 내보내기
      </button>
    </div>
  </div>

    </div>
  );
}