import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getServices } from "../services/serviceService";

export default function CategoryMenu({ inlineList = false }) {
  const [open, setOpen] = useState(false);
  const [closeTimer, setCloseTimer] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const rows = await getServices();
        if (!cancelled) setItems(Array.isArray(rows) ? rows : []);
      } catch (_) {}
    }
    run();
    return () => { cancelled = true; };
  }, []);

  const categories = useMemo(() => {
    const baseList = [
      { slug: "video", group: "entertainment", display: "OTT" },
      { slug: "music", group: "entertainment", display: "음악" },
      { slug: "books", group: "lifestyle", display: "도서" },
      { slug: "shopping", group: "lifestyle", display: "쇼핑" },
      { slug: "delivery", group: "lifestyle", display: "배달서비스" },
      { slug: "ai", group: "productivity", display: "AI" },
      { slug: "cloud_storage", group: "productivity", display: "클라우드" },
      { slug: "productivity", group: "productivity", display: "생산성" },
      { slug: "design", group: "productivity", display: "디자인" },
    ];
    const countBySlug = baseList.reduce((acc, b) => { acc[b.slug] = 0; return acc; }, {});
    for (const s of items) {
      const key = String(s.category || "").toLowerCase();
      if (key in countBySlug) countBySlug[key] += 1;
    }
    const groups = { entertainment: [], lifestyle: [], productivity: [], etc: [] };
    for (const b of baseList) {
      groups[b.group].push({ slug: b.slug, display: b.display, count: countBySlug[b.slug] || 0 });
    }
    return groups; // {group: [{slug, display, count}]}
  }, [items]);

  if (inlineList) {
    return (
      <nav aria-label="카테고리 목록" className="p-3 space-y-3">
        {['entertainment','lifestyle','productivity','etc']
          .filter((group) => (categories[group] || []).length > 0)
          .map((group) => (
            <div key={group}>
              <div className="px-1 py-1 text-xs tracking-wide text-slate-400">
                {{ entertainment: "엔터테인먼트", lifestyle: "라이프스타일", productivity: "생산성", etc: "기타" }[group] || group}
              </div>
              <ul className="mt-1 space-y-1">
                {(categories[group] || []).map((c) => (
                  <li key={c.slug}>
                    <a
                      className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-white/10"
                      href={`/categories/${encodeURIComponent(c.slug)}`}
                    >
                      <span className="capitalize">{c.display}</span>
                      <span className="text-slate-400 text-xs">{c.count}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </nav>
    );
  }

  function openMenu() {
    if (closeTimer) {
      clearTimeout(closeTimer);
      setCloseTimer(null);
    }
    setOpen(true);
  }

  function scheduleClose() {
    if (closeTimer) clearTimeout(closeTimer);
    const t = setTimeout(() => setOpen(false), 150); // 살짝 지연 닫기
    setCloseTimer(t);
  }

  function onKeyDown(e) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openMenu();
      setActiveIndex(0);
      return;
    }
    if (!open) return;
    const flat = Object.values(categories).flat();
    const total = flat.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % Math.max(total, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + Math.max(total, 1)) % Math.max(total, 1));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = flat[activeIndex];
      if (current) {
        window.location.href = `/categories/${encodeURIComponent(current.slug)}`;
      }
    }
  }

  return (
    <div className="relative" onMouseEnter={openMenu} onMouseLeave={scheduleClose}>
      <button
        className="rounded-xl px-3 py-2 hover:bg-white/10 transition"
        aria-haspopup="true"
        aria-expanded={open}
        onKeyDown={onKeyDown}
      >
        카테고리
      </button>
      {open && (
        <div
          className="absolute left-0 mt-2 w-64 rounded-xl bg-slate-900 ring-1 ring-white/10 shadow-lg z-50 transition transform origin-top-left animate-in"
          onMouseEnter={openMenu}
          onMouseLeave={scheduleClose}
          role="menu" aria-label="카테고리 목록"
        >
          <ul ref={listRef} className="py-2 max-h-[60vh] overflow-auto" onKeyDown={onKeyDown} tabIndex={-1}>
            {Object.keys(categories).length === 0 && (
              <li className="px-3 py-2 text-slate-400 text-sm">불러오는 중…</li>
            )}
            {['entertainment','lifestyle','productivity','etc']
              .filter((group) => (categories[group] || []).length > 0)
              .map((group) => {
                const rows = categories[group] || [];
                return (
                  <li key={group}>
                    <div className="px-3 py-1 text-xs tracking-wide text-slate-400">
                      {{ entertainment: "엔터테인먼트", lifestyle: "라이프스타일", productivity: "생산성", etc: "기타" }[group] || group}
                    </div>
                    <ul>
                      {rows.map((c) => {
                        const idx = Object.values(categories).flat().findIndex((x) => x.slug === c.slug);
                        return (
                          <li key={c.slug}>
                            <a
                              className={`flex items-center justify-between px-3 py-2 hover:bg-white/10 ${idx===activeIndex ? 'bg-white/10' : ''}`}
                              href={`/categories/${encodeURIComponent(c.slug)}`}
                              onMouseEnter={() => setActiveIndex(idx)}
                            >
                              <span className="capitalize">{c.display}</span>
                              <span className="text-slate-400 text-xs">{c.count}</span>
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
          </ul>
        </div>
      )}
    </div>
  );
}


