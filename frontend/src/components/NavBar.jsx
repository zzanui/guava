import { Link, useLocation } from "react-router-dom";
import React, { useContext, useEffect, useState } from "react";
import CategoryMenu from "./CategoryMenu.jsx";
import { AuthContext } from "../context/AuthContext.jsx";

export default function NavBar() {
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const auth = useContext(AuthContext);
  const signedIn = Boolean(auth?.isAuthenticated || localStorage.getItem("access"));

  // 라우트 이동 시(특히 카테고리/뒤로가기 등) 헤더 검색 입력 초기화
  useEffect(() => {
    if (location.pathname !== "/search") {
      setQuery("");
    }
  }, [location.pathname]);

  // 검색 페이지에서 결과 조회(쿼리 존재) 직후에도 입력칸 초기화
  useEffect(() => {
    if (location.pathname === "/search") {
      const sp = new URLSearchParams(location.search || "");
      if ((sp.get("q") || "").trim()) {
        setQuery("");
      }
    }
  }, [location.pathname, location.search]);
  return (
    <nav className="text-slate-100 px-2 py-2 flex items-center gap-2 sm:gap-3 flex-wrap md:flex-nowrap" style={{ backgroundColor: "var(--nav-header-bg)" }}>
      <button
        className="md:hidden rounded-xl px-3 py-2 hover:bg-white/10 transition"
        aria-label="메뉴 열기"
        onClick={() => setMobileOpen(true)}
      >
        ☰
      </button>
      <div className="hidden md:block"><CategoryMenu /></div>
      <Link to="/services" className="hidden md:inline-block rounded-xl px-3 py-2 hover:bg-white/10 transition">전체 서비스</Link>
      <Link to="/" className="rounded-xl px-3 py-2 hover:bg-white/10 transition" aria-label="GUAVA 홈">
        <img src="/guava-logo.png" alt="GUAVA" className="h-6 w-auto" />
      </Link>
      <form action="/search" className="flex-1 w-full flex items-center gap-2 flex-wrap md:flex-nowrap" onSubmit={(e)=>{ if(!query.trim()) { e.preventDefault(); } }}>
        <input
          value={query}
          onChange={(e)=> setQuery(e.target.value)}
          name="q"
          placeholder="찾고 싶은 서비스를 검색하세요"
          className="w-full h-10 rounded-2xl bg-slate-950 border border-white/10 px-4 outline-none focus:ring-2 focus:ring-fuchsia-400"
          aria-label="서비스 검색"
        />
        <button type="submit" className="h-10 w-full md:w-auto whitespace-nowrap rounded-2xl px-4 btn-primary text-slate-50 font-semibold hover:opacity-95 transition">검색</button>
      </form>
      {mobileOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[80vw]" style={{ backgroundColor: "var(--nav-header-bg)" }}>
            <div className="p-3 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <img src="/guava-logo.png" alt="Guava" className="h-6 w-auto" />
                <span className="font-bold">메뉴</span>
              </div>
              <button className="rounded-xl px-3 py-2 hover:bg-white/10" aria-label="메뉴 닫기" onClick={() => setMobileOpen(false)}>✕</button>
            </div>
            <nav className="p-3 space-y-2">
              <Link to="/services" onClick={()=> setMobileOpen(false)} className="block rounded-xl px-3 py-2 hover:bg-white/10">전체 서비스</Link>
              <div className="mt-2 rounded-xl ring-1 ring-white/10">
                <CategoryMenu inlineList />
              </div>
              <hr className="my-3 border-white/10" />
              <Link to="/contact" onClick={()=> setMobileOpen(false)} className="block rounded-xl px-3 py-2 hover:bg-white/10">문의</Link>
              <Link to="/notices" onClick={()=> setMobileOpen(false)} className="block rounded-xl px-3 py-2 hover:bg-white/10">공지사항</Link>
              {signedIn ? (
                <>
                  <Link to="/mypage" onClick={()=> setMobileOpen(false)} className="block rounded-xl px-3 py-2 hover:bg-white/10">마이페이지</Link>
                  <button
                    onClick={() => { auth?.logout?.(); setMobileOpen(false); }}
                    className="w-full text-left block rounded-xl px-3 py-2 hover:bg-white/10"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={()=> setMobileOpen(false)} className="block rounded-xl px-3 py-2 hover:bg-white/10">로그인</Link>
                  <Link to="/register" onClick={()=> setMobileOpen(false)} className="block rounded-xl px-3 py-2 btn-primary text-center text-slate-50 font-semibold hover:opacity-95 transition">회원가입</Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </nav>
  );
}
