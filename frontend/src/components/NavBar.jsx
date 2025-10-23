import { Link } from "react-router-dom";
import React, { useState } from "react";
import CategoryMenu from "./CategoryMenu.jsx";

export default function NavBar() {
  const [query, setQuery] = useState("");
  return (
    <nav className="text-slate-100 px-2 py-2 flex items-center gap-3">
      <CategoryMenu />
      <span className="rounded-xl px-3 py-2 text-slate-200">GUAVA</span>
      <form action="/search" className="flex-1 flex items-center gap-2 flex-nowrap" onSubmit={(e)=>{ if(!query.trim()) { e.preventDefault(); } }}>
        <input
          value={query}
          onChange={(e)=> setQuery(e.target.value)}
          name="q"
          placeholder="찾고 싶은 서비스를 검색하세요"
          className="w-full h-10 rounded-2xl bg-slate-950 border border-white/10 px-4 outline-none focus:ring-2 focus:ring-cyan-400"
          aria-label="서비스 검색"
        />
        <button type="submit" className="h-10 whitespace-nowrap rounded-2xl px-4 bg-cyan-400 text-slate-900 font-semibold hover:opacity-90 transition">검색</button>
      </form>
    </nav>
  );
}
