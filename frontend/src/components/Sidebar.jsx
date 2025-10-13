import { NavLink } from "react-router-dom";

const CATEGORIES = [
  { slug: "ott", name: "OTT" },
  { slug: "music", name: "음악" },
  { slug: "cloud", name: "클라우드" },
  { slug: "productivity", name: "생산성" },
  { slug: "education", name: "교육" },
  { slug: "gaming", name: "게임" },
  { slug: "news", name: "뉴스/매거진" },
  { slug: "devtools", name: "개발툴" },
];

export default function Sidebar() {
  return (
    <aside className="w-full md:w-64 shrink-0 border-r border-white/10 bg-slate-950/80">
      <nav className="p-4 space-y-1">
        {CATEGORIES.map((c) => (
          <NavLink
            key={c.slug}
            to={`/categories/${c.slug}`}
            className={({ isActive }) =>
              `block rounded-xl px-3 py-2 transition focus-ring ${
                isActive ? "bg-white/10 text-slate-100" : "hover:bg-white/5 text-slate-300"
              }`
            }
            aria-label={`${c.name} 카테고리로 이동`}
          >
            {c.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}


