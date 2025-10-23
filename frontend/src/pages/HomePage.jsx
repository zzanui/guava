// src/pages/HomePage.jsx
import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

export default function HomePage() {
  const nav = useNavigate();
  const auth = useContext(AuthContext);
  const signedIn = useMemo(() => Boolean(auth?.isAuthenticated || localStorage.getItem("access")), [auth?.isAuthenticated]);
  const [q, setQ] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    // 앞으로 검색 페이지로 라우팅할 때 사용
    nav(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const handleLogout = async () => {
    try {
      await auth?.logout?.();
    } catch (_) {}
    nav("/");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* 기존 헤더 영역 제거: 전역 Header에서 렌더링됨 */}

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 items-center gap-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              구독, 한 곳에서 <span className="text-cyan-400">비교·관리</span>하세요
            </h1>
            <p className="mt-4 text-slate-300">
              OTT부터 클라우드까지 — 가격·혜택을 한눈에 비교하고, 결제일 알림과 소비 리포트로 새는 돈을 막아줘요.
            </p>

            <div className="mt-6 flex items-center gap-3">
              {!signedIn && (
                <>
                  <Link to="/register" className="rounded-2xl px-5 py-3 bg-cyan-400 text-slate-900 font-semibold hover:opacity-90 transition shadow-lg focus-ring" aria-label="무료로 시작하기 CTA">
                    회원가입
                  </Link>
                  <Link to="/compare" className="rounded-2xl px-5 py-3 bg-white/10 hover:bg-white/15 transition shadow-lg focus-ring" aria-label="데모 보기">
                    예시 보기
                  </Link>
                </>
              )}
            </div>

            <form onSubmit={handleSearch} className="mt-8 flex items-center gap-3 flex-nowrap">
              <input
                value={q}
                onChange={(e)=>setQ(e.target.value)}
                placeholder="서비스 이름으로 검색 (예: 넷플릭스, 디즈니+)"
                className="w-full md:w-2/3 h-10 rounded-2xl bg-slate-900 border border-white/10 px-4 outline-none focus:ring-2 focus:ring-cyan-400"
                aria-label="구독 서비스 검색"
              />
              <button
                type="submit"
                className="h-10 whitespace-nowrap rounded-2xl px-4 bg-cyan-400 text-slate-900 font-semibold hover:opacity-90 transition shadow-lg focus-ring"
                aria-label="검색 실행"
              >
                검색
              </button>
            </form>

            {!signedIn && (
              <div className="mt-4 text-sm text-slate-400">
                아직 계정이 없나요?{" "}
                <Link className="text-cyan-300 underline decoration-dotted" to="/register">
                  1분 만에 가입!
                </Link>
              </div>
            )}
          </div>

          {/* 오른쪽 비주얼(임시 카드) */}
          <div className="relative">
            <div className="rounded-2xl bg-gradient-to-br from-cyan-400/20 to-fuchsia-400/10 p-6 ring-1 ring-white/10 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="font-semibold">이번달 예상 구독료</div>
                <div className="text-2xl font-extrabold">₩ 37,800</div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
                {["넷플릭스", "디즈니+", "유튜브프리미엄"].map((s,i)=>(
                  <div key={i} className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-white/10">
                    <div className="font-medium">{s}</div>
                    <div className="text-slate-400 mt-1">₩ {i===0?13500:i===1?9900:14900}/월</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-right">
                <Link to={signedIn?"/mypage":"/login"} className="text-cyan-300 hover:underline">
                  상세 보기 →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-3 gap-6">
          <Feature
            title="가격 한눈에"
            desc="플랜/프로모션/번들까지 비교해 최저 비용을 골라요."
          />
          <Feature
            title="결제일 알림"
            desc="결제일 전에 푸시/이메일로 알려 과금 폭탄을 예방해요."
          />
          <Feature
            title="소비 리포트"
            desc="월·연간 합계와 카테고리별 비율로 지출을 분석해요."
          />
        </div>
      </section>

      {/* Quick Links */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-extrabold leading-tight mb-6">바로가기</h2>
        <div className="flex flex-wrap gap-3">
          {["넷플릭스", "디즈니+", "유튜브프리미엄", "티빙", "웨이브"].map((name) => (
            <Link
              key={name}
              to={`/search?q=${encodeURIComponent(name)}`}
              className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 transition focus-ring"
              aria-label={`${name} 검색 바로가기`}
            >
              #{name}
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-extrabold leading-tight mb-8">어떻게 이용하나요?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: "1", title: "검색", desc: "원하는 서비스를 검색해요." },
            { step: "2", title: "추가", desc: "내 구독에 추가해요." },
            { step: "3", title: "자동 알림", desc: "결제일 전에 미리 알려줘요." },
          ].map((s) => (
            <div key={s.step} className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
              <div className="text-cyan-400 font-extrabold text-xl">{s.step}</div>
              <div className="mt-2 font-semibold text-lg">{s.title}</div>
              <p className="mt-1 text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof Placeholder */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <div className="rounded-2xl bg-slate-900/60 p-8 ring-1 ring-white/10 text-center">
          <div className="text-sm text-slate-400">후기와 지표가 곧 업데이트될 예정입니다.</div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-slate-400 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div>© {new Date().getFullYear()} GUAVA. All rights reserved.</div>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-slate-200">이용약관</Link>
            <Link to="/privacy" className="hover:text-slate-200">개인정보처리방침</Link>
            <Link to="/contact" className="hover:text-slate-200">문의</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ title, desc }) {
  return (
    <div className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
      <div className="mb-2 h-10 w-10 rounded-xl bg-cyan-400/20 ring-1 ring-cyan-400/40" />
      <div className="font-semibold text-lg">{title}</div>
      <p className="mt-1 text-slate-400">{desc}</p>
      <Link to="/compare" className="inline-block mt-3 text-cyan-300 hover:underline">
        자세히 보기 →
      </Link>
    </div>
  );
}