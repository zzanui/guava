// src/pages/MyPage.jsx
export default function MyPage() {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">마이페이지</h1>
        
        <section className="mb-6">
          <h2 className="font-bold mb-2">총 구독료</h2>
          <p className="text-xl font-semibold">23,400원 / 월</p>
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
            <li>Netflix Standard</li>
            <li>Disney+ Basic</li>
          </ul>
        </section>
      </div>
    );
  }


