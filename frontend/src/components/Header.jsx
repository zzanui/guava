import React, { useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import NavBar from "./NavBar.jsx";
import { AuthContext } from "../context/AuthContext.jsx";

export default function Header() {
  const auth = useContext(AuthContext);
  const signedIn = useMemo(() => Boolean(auth?.isAuthenticated || localStorage.getItem("access")), [auth?.isAuthenticated]);
  return (
    <header className="border-b border-white/10 sticky top-0 z-40" style={{ backgroundColor: "var(--nav-header-bg)" }}>
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2" aria-label="Guava 홈으로 이동">
          <img src="/guava-logo.png" alt="Guava" className="h-8 w-auto" />
          <span className="text-xl font-extrabold tracking-tight text-gradient">구아바</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/contact" className="hover:text-fuchsia-300">문의</Link>
          <Link to="/notices" className="hover:text-fuchsia-300">공지사항</Link>
          {signedIn ? (
            <>
              <Link to="/mypage" className="hover:text-fuchsia-300">마이페이지</Link>
              <button onClick={() => auth?.logout?.()} className="rounded-xl px-3 py-1 hover:bg-white/10 transition">로그아웃</button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-xl px-3 py-1 hover:bg-white/10 transition">로그인</Link>
              <Link to="/register" className="rounded-xl px-3 py-1 btn-primary text-slate-50 font-semibold hover:opacity-95 transition">회원가입</Link>
            </>
          )}
        </nav>
      </div>
      <div style={{ backgroundColor: "var(--nav-header-bg)" }}>
        <div className="mx-auto max-w-7xl">
          <NavBar />
        </div>
      </div>
    </header>
  );
}


