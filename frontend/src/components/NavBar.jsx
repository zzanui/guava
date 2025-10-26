import { Link, useLocation } from "react-router-dom";
import React, { useEffect, useState } from "react";
import CategoryMenu from "./CategoryMenu.jsx";

export default function NavBar() {
  const [query, setQuery] = useState("");
  const location = useLocation();

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
    <nav className="text-slate-100 px-2 py-2 flex items-center gap-3" style={{ backgroundColor: "var(--nav-header-bg)" }}>
      <CategoryMenu />
      <Link to="/services" className="rounded-xl px-3 py-2 hover:bg-white/10 transition">전체 서비스</Link>
      <Link to="/" className="rounded-xl px-3 py-2 hover:bg-white/10 transition" aria-label="GUAVA 홈">
        <img src="/guava-logo.png" alt="GUAVA" className="h-6 w-auto" />
      </Link>
      <form action="/search" className="flex-1 flex items-center gap-2 flex-nowrap" onSubmit={(e)=>{ if(!query.trim()) { e.preventDefault(); } }}>
        <input
          value={query}
          onChange={(e)=> setQuery(e.target.value)}
          name="q"
          placeholder="찾고 싶은 서비스를 검색하세요"
          className="w-full h-10 rounded-2xl bg-slate-950 border border-white/10 px-4 outline-none focus:ring-2 focus:ring-fuchsia-400"
          aria-label="서비스 검색"
        />
        <button type="submit" className="h-10 whitespace-nowrap rounded-2xl px-4 btn-primary text-slate-50 font-semibold hover:opacity-95 transition">검색</button>
      </form>
    </nav>
  );
}
