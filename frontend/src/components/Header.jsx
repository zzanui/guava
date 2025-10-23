import React, { useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import NavBar from "./NavBar.jsx";
import { AuthContext } from "../context/AuthContext.jsx";

export default function Header() {
  const auth = useContext(AuthContext);
  const signedIn = useMemo(() => Boolean(auth?.isAuthenticated || localStorage.getItem("access")), [auth?.isAuthenticated]);
  return (
    <header className="bg-slate-950/90 border-b border-white/10 sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2" aria-label="Guava 홈으로 이동">
          <img src="/guava-logo.png" alt="Guava" className="h-8 w-auto" />
          <span className="text-xl font-extrabold tracking-tight">구아바</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/support" className="hover:text-cyan-300">고객센터</Link>
          <Link to="/blog" className="hover:text-cyan-300">공지사항</Link>
          {signedIn ? (
            <>
              <Link to="/mypage" className="hover:text-cyan-300">마이페이지</Link>
              <button onClick={() => auth?.logout?.()} className="rounded-xl px-3 py-1 hover:bg-white/10 transition">로그아웃</button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-xl px-3 py-1 hover:bg-white/10 transition">로그인</Link>
              <Link to="/register" className="rounded-xl px-3 py-1 bg-cyan-400 text-slate-900 font-semibold hover:opacity-90 transition">회원가입</Link>
            </>
          )}
        </nav>
      </div>
      <div className="bg-slate-900/60">
        <div className="mx-auto max-w-7xl">
          <NavBar />
        </div>
      </div>
    </header>
  );
}


