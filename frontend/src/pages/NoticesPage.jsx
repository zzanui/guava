import React, { useMemo, useState } from "react";

const TABS = [
  { key: "all", label: "전체" },
  { key: "notice", label: "공지" },
  { key: "event", label: "이벤트" },
];

const MOCK = [
  { id: 1, type: "notice", title: "[공지] 약관 개정 안내", date: "2025.06.20", body: "서비스 이용약관이 변경됩니다. 주요 변경 사항을 꼭 확인해주세요." },
  { id: 2, type: "notice", title: "[공지] 보안 알림 – 피싱 문자 주의", date: "2025.05.15", body: "의심스러운 링크는 클릭하지 마시고 공식 앱/웹에서만 로그인하세요." },
  { id: 3, type: "event", title: "[이벤트] 여름 맞이 구독 캐시백", date: "2025.05.01", body: "특정 카드 결제 시 최대 10% 캐시백 이벤트가 진행됩니다." },
  { id: 4, type: "notice", title: "[공지] 개인정보처리방침 개정", date: "2025.04.10", body: "수집 항목 및 보유 기간 항목 일부가 개정되었습니다." },
];

export default function NoticesPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [openIds, setOpenIds] = useState(() => new Set());

  const rows = useMemo(() => {
    const base = MOCK.filter((n) => n.type !== "overseas");
    if (activeTab === "all") return base;
    return base.filter((n) => n.type === activeTab);
  }, [activeTab]);

  const toggle = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="container-page section-y">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">공지사항</h1>

        {/* 탭 */}
        <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl ring-1 ring-white/10 overflow-hidden">
          {TABS.map((t) => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`py-3 text-center ${active ? "bg-white/10 font-semibold" : "bg-slate-900/40 hover:bg-white/10"}`}
                aria-current={active ? "page" : undefined}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* 목록 */}
        <ul className="mt-4 divide-y divide-white/10 rounded-2xl bg-slate-900/60 ring-1 ring-white/10">
          {rows.map((n) => {
            const open = openIds.has(n.id);
            return (
              <li key={n.id}>
                <button
                  className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left hover:bg-white/5"
                  onClick={() => toggle(n.id)}
                  aria-expanded={open}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 whitespace-nowrap">
                        {n.type === "notice" ? "공지" : "이벤트"}
                      </span>
                      <span className="font-medium truncate">{n.title}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 whitespace-nowrap text-slate-400">
                    <span>{n.date}</span>
                    <svg
                      className={`h-5 w-5 transition-transform ${open ? "rotate-180" : "rotate-0"}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                    </svg>
                  </div>
                </button>
                {open && (
                  <div className="px-4 pb-5 text-slate-300 bg-black/20">
                    {n.body}
                  </div>
                )}
              </li>
            );
          })}
          {rows.length === 0 && (
            <li className="px-4 py-6 text-slate-400">표시할 공지가 없습니다.</li>
          )}
        </ul>
      </div>
    </div>
  );
}


