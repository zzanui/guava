import { NavLink } from "react-router-dom";

const CATEGORIES = [
  { slug: "video", name: "OTT" },
  { slug: "music", name: "음악" },
  { slug: "books", name: "도서" },
  { slug: "shopping", name: "쇼핑" },
  { slug: "delivery", name: "배달서비스" },
  { slug: "ai", name: "AI" },
  { slug: "cloud_storage", name: "클라우드" },
  { slug: "productivity", name: "생산성" },
  { slug: "design", name: "디자인" },

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
        <hr className="my-2 border-white/10" />
        <NavLink
          to="/bundles"
          className={({ isActive }) =>
            `block rounded-xl px-3 py-2 transition focus-ring ${
              isActive ? "bg-white/10 text-slate-100" : "hover:bg-white/5 text-slate-300"
            }`
          }
          aria-label="결합상품 보기"
        >
          결합상품
        </NavLink>
        <NavLink
          to="/promotions"
          className={({ isActive }) =>
            `block rounded-xl px-3 py-2 transition focus-ring ${
              isActive ? "bg-white/10 text-slate-100" : "hover:bg-white/5 text-slate-300"
            }`
          }
          aria-label="프로모션 보기"
        >
          프로모션
        </NavLink>
      </nav>
    </aside>
  );
}


