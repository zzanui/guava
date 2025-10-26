// src/pages/HomePage.jsx
import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import "../styles/landing.css";
import { getServices } from "../services/serviceService";

export default function HomePage() {
  const nav = useNavigate();
  const auth = useContext(AuthContext);
  const signedIn = useMemo(() => Boolean(auth?.isAuthenticated || localStorage.getItem("access")), [auth?.isAuthenticated]);
  const [q, setQ] = useState("");
  const [categoryCounts, setCategoryCounts] = useState({});

  const baseCategories = [
    { slug: "video", display: "OTT", icon: "🎬" },
    { slug: "music", display: "음악", icon: "🎵" },
    { slug: "books", display: "도서", icon: "📚" },
    { slug: "shopping", display: "쇼핑", icon: "🛒" },
    { slug: "delivery", display: "배달서비스", icon: "🍱" },
    { slug: "ai", display: "AI", icon: "🤖" },
    { slug: "cloud_storage", display: "클라우드", icon: "☁️" },
    { slug: "productivity", display: "생산성", icon: "🧰" },
    { slug: "design", display: "디자인", icon: "🎨" },
  ];

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

  useEffect(() => {
    const cards = Array.from(document.querySelectorAll(".category-card.reveal"));
    if (!cards.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -100px 0px" }
    );
    cards.forEach((card, index) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(30px)";
      card.style.transition = `all 0.6s ease ${index * 0.1}s`;
      observer.observe(card);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const rows = await getServices();
        const counts = baseCategories.reduce((acc, c) => { acc[c.slug] = 0; return acc; }, {});
        for (const s of (Array.isArray(rows) ? rows : [])) {
          const key = String(s?.category || "").toLowerCase();
          if (key in counts) counts[key] += 1;
        }
        if (!cancelled) setCategoryCounts(counts);
      } catch (_) {
        if (!cancelled) setCategoryCounts({});
      }
    }
    run();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen landing-bg text-slate-100">
      {/* Hero */}
      <section className="relative min-h-[70vh] sm:min-h-[80vh] md:min-h-[90vh] flex items-center justify-center pt-20 sm:pt-24 pb-12 sm:pb-16 px-4">
        {/* 배경 플로팅 */}
        <div className="absolute inset-0 overflow-hidden -z-0">
          <div className="floating shape1 absolute" />
          <div className="floating shape2 absolute" />
          <div className="floating shape3 absolute" />
        </div>

        <div className="relative z-[1] w-full max-w-6xl text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight md:leading-[1.2]">
            모든 구독을
            <br className="hidden md:block" />
            <span className="text-gradient">한눈에, 한 곳에서</span>
          </h1>
          <p className="mt-4 md:mt-6 text-base sm:text-lg md:text-xl text-white/80">
            OTT부터 클라우드까지, 흩어진 구독 서비스를 비교하고
            <br className="hidden md:block" />
            최적의 요금제를 찾아 매달 고정 비용을 절약하세요
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
            {!signedIn ? (
              <>
                <Link to="/register" className="btn-primary rounded-full px-6 py-3 font-bold shadow-lg focus-ring" aria-label="무료로 시작하기">
                  무료로 시작하기
                </Link>
                <a href="#categories" className="btn-secondary rounded-full px-6 py-3 font-bold shadow-lg focus-ring" aria-label="더 알아보기">
                  더 알아보기
                </a>
              </>
            ) : (
              <Link to="/mypage" className="btn-primary rounded-full px-6 py-3 font-bold shadow-lg focus-ring" aria-label="마이페이지로 이동">
                내 구독 보러가기
              </Link>
            )}
          </div>

          {/* 검색 바 */}
          <form onSubmit={handleSearch} className="mt-8 flex items-center gap-3 flex-nowrap justify-center w-full">
            <input
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              placeholder="서비스 이름으로 검색 (예: 넷플릭스, 디즈니+)"
              className="w-full sm:w-4/5 md:w-2/3 h-12 rounded-2xl bg-slate-900/70 border border-white/10 px-4 outline-none focus:ring-2 focus:ring-fuchsia-400"
              aria-label="구독 서비스 검색"
            />
            <button
              type="submit"
              className="h-12 whitespace-nowrap rounded-2xl px-5 btn-primary text-slate-50 font-semibold hover:opacity-95 transition shadow-lg focus-ring"
              aria-label="검색 실행"
            >
              검색
            </button>
          </form>

          {/* 통계 카드 */}
          <div className="mt-12 md:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            {[{n:"500+", l:"구독 서비스"}, {n:"₩45,000", l:"평균 절약 금액"}, {n:"50K+", l:"사용자"}].map((s) => (
              <div key={s.l} className="glass-card rounded-2xl px-8 py-6 text-center hover:border-fuchsia-300/50 transition">
                <div className="stat-number text-3xl md:text-4xl font-black">{s.n}</div>
                <div className="text-sm md:text-base text-white/70 mt-2">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 카테고리 프리뷰 */}
      <section id="categories" className="bg-black/20">
        <div className="container-page section-y">
          <h2 className="text-center text-3xl md:text-5xl font-black mb-10 md:mb-14">인기 카테고리</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {baseCategories.map((c, idx) => (
              <Link
                key={c.slug}
                to={`/categories/${c.slug}`}
                className="category-card reveal glass-card rounded-2xl p-8 text-center cursor-pointer hover:translate-y-[-10px] transition will-change-transform"
                style={{ transitionDelay: `${idx * 0.1}s` }}
                aria-label={`${c.display} 카테고리로 이동`}
              >
                <div className="text-5xl mb-4">{c.icon}</div>
                <div className="text-2xl font-bold">{c.display}</div>
                <div className="text-sm text-white/70 mt-2">{(categoryCounts[c.slug] || 0)} 서비스</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: "1", title: "검색", desc: "원하는 서비스를 검색해요." },
            { step: "2", title: "추가", desc: "내 구독에 추가해요." },
            { step: "3", title: "자동 알림", desc: "결제일 전에 미리 알려줘요." },
          ].map((s) => (
            <div key={s.step} className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
              <div className="text-fuchsia-400 font-extrabold text-xl">{s.step}</div>
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
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ title, desc }) {
  return (
    <div className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
      <div className="mb-2 h-10 w-10 rounded-xl" style={{ backgroundColor: "rgba(240,147,251,0.2)", boxShadow: "inset 0 0 0 1px rgba(240,147,251,0.4)" }} />
      <div className="font-semibold text-lg">{title}</div>
      <p className="mt-1 text-slate-400">{desc}</p>
      <Link to="/compare" className="inline-block mt-3 text-fuchsia-300 hover:underline">
        자세히 보기 →
      </Link>
    </div>
  );
}