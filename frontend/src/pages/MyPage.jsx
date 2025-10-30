// src/pages/MyPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getSubscriptions, deleteSubscription } from "../services/subscriptionService";
import { getPrefs, setNotification, setTelecom, toggleCard } from "../services/localPrefs.js";
import { getServices } from "../services/serviceService";
import api from "../services/api";
import { listBookmarks, removeBookmark, listBookmarkEntries, clearBookmarkMemo } from "../services/bookmarksService.js";
import SidebarLayout from "../layouts/SidebarLayout.jsx";
import CategoryCostCharts from "../components/CategoryCostCharts.jsx";

export default function MyPage() {
  const [subs, setSubs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [prefs, setPrefs] = useState(getPrefs());
  const [telecoms, setTelecoms] = useState([]);
  const [cards, setCards] = useState([]);
  const [prefsState, setPrefsState] = useState(getPrefs());
  const [serviceNameById, setServiceNameById] = useState({});
  const [serviceIdByName, setServiceIdByName] = useState({});
  const [categoryAgg, setCategoryAgg] = useState([]);
  const [bookmarkIds, setBookmarkIds] = useState(new Set());
  const [memoEntries, setMemoEntries] = useState([]);
  const [activeSection, setActiveSection] = useState("subs");
  const SHOW_TELECOM = false;
  const SHOW_CARDS = false;
  const SHOW_NOTIFICATIONS = false;
  const SHOW_REPORT_PDF = false; // 일시 숨김 처리 플래그

  // 섹션 스크롤을 위한 ref
  const subsRef = useRef(null);
  const totalRef = useRef(null);
  const chartsRef = useRef(null);
  const bookmarksRef = useRef(null);
  const memoRef = useRef(null);
  const reportRef = useRef(null);

  const SCROLL_OFFSET_PX = 136;
  const scrollToRef = (ref) => {
    if (ref && ref.current) {
      const el = ref.current;
      const top = el.getBoundingClientRect().top + window.pageYOffset - SCROLL_OFFSET_PX;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  // 현재 스크롤 위치에 따라 활성 섹션 업데이트
  useEffect(() => {
    const list = [
      { key: "subs", ref: subsRef },
      { key: "total", ref: totalRef },
      { key: "charts", ref: chartsRef },
      { key: "bookmarks", ref: bookmarksRef },
      { key: "memo", ref: memoRef },
      { key: "report", ref: reportRef },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          const target = visible[0].target;
          const matched = list.find((s) => s.ref.current === target);
          if (matched) setActiveSection(matched.key);
        }
      },
      {
        root: null,
        threshold: [0.25, 0.5, 0.75],
        rootMargin: "0px 0px -50% 0px",
      }
    );

    for (const s of list) {
      if (s.ref.current) observer.observe(s.ref.current);
    }
    return () => observer.disconnect();
  }, [subs, categoryAgg, bookmarkIds, memoEntries]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        const data = await getSubscriptions();
        const results = Array.isArray(data?.results) ? data.results : [];
        const sum = Number(data?.total_price || 0);
        const [telResp, cardResp, servicesList, bookmarkList, bookmarkEntryList] = await Promise.all([
          api.get("/api/telecoms/"),
          api.get("/api/cards/"),
          // 전체 서비스 이름 맵 구성
          getServices(),
          listBookmarks().catch(() => []),
          listBookmarkEntries().catch(() => []),
        ]);
        const telList = Array.isArray(telResp?.data) ? telResp.data : [];
        const cardList = Array.isArray(cardResp?.data) ? cardResp.data : [];
        const list = Array.isArray(servicesList) ? servicesList : [];
        const nameMap = Object.fromEntries(list.map((s) => [String(s.id), s.name]));
        const idMap = Object.fromEntries(list.map((s) => [s.name, String(s.id)]));
          if (!cancelled) {
          setSubs(results);
          setTotal(sum);
          setTelecoms(telList);
          setCards(cardList);
          setServiceNameById(nameMap);
          setServiceIdByName(idMap);
          setBookmarkIds(new Set((bookmarkList || []).map(String)));
          setMemoEntries((Array.isArray(bookmarkEntryList) ? bookmarkEntryList : [])
            .filter(e => String(e?.memo || "").trim() !== "")
            .map(e => ({ service: String(e.service), memo: String(e.memo || "") }))
          );
          // 카테고리별 집계 (월 환산 기준): price_override > plan_price, 연간 요금은 12로 나눔
          const byCat = new Map();

          for (const it of results) {
            const cat = String(it.plan_service_category || it.category || it.plan_category || "기타");
            const rawAmount = Number(it.price_override ?? it.plan_price ?? 0);
            const cycleRaw = String(it.plan_billing_cycle ?? it.billing_cycle ?? "").toLowerCase();
            const isYearly = cycleRaw.startsWith("year");
            const amountMonthly = isYearly ? rawAmount / 12 : rawAmount;
            byCat.set(cat, (byCat.get(cat) || 0) + amountMonthly);
          }
          setCategoryAgg(Array.from(byCat, ([category, amount]) => ({ category, amount })));
          console.log('=== categoryAgg 데이터 ===');
console.log(Array.from(byCat, ([category, amount]) => ({ category, amount })));
console.log('=== 원본 results ===');
console.log(results.map(r => ({
  id: r.id,
  category: r.plan_service_category,
  name: r.plan_service_name
})));

        }
      } catch (_) {
        if (!cancelled) setError("구독 정보를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, []);

  const handleDownload = async (format) => {
    const endpoint = `/api/my/subscriptions/export_${format}/`;
    const filename = `report.${format}`;
    try {
      const response = await api.get(endpoint, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("파일 다운로드 오류:", error);
      alert("리포트 파일을 다운로드하는 중 오류가 발생했습니다.");
    }
  };

  // 마이페이지 전용 사이드바 메뉴
  const navClass = (key) =>
    `block w-full text-left rounded-xl px-3 py-2 transition focus-ring ${
      activeSection === key ? "bg-white/10 text-slate-100" : "hover:bg-white/5 text-slate-300"
    }`;

  const mySidebar = (
    <nav className="p-4 space-y-1">
      <button className={navClass("subs")} onClick={() => scrollToRef(subsRef)}>내 구독 리스트</button>
      <button className={navClass("total")} onClick={() => scrollToRef(totalRef)}>구독료 합계</button>
      <button className={navClass("bookmarks")} onClick={() => scrollToRef(bookmarksRef)}>즐겨찾기</button>
      <button className={navClass("memo")} onClick={() => scrollToRef(memoRef)}>내 메모</button>
      <hr className="my-2 border-white/10" />
      <button className={navClass("charts")} onClick={() => scrollToRef(chartsRef)}>카테고리별 통계</button>
      <button className={navClass("report")} onClick={() => scrollToRef(reportRef)}>구독 서비스 리포트</button>
    </nav>
  );

  return (
    <SidebarLayout sidebarContent={mySidebar}>
      <div className="container-page section-y">
        <div className="mx-auto w-full max-w-3xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">마이페이지</h1>
        <a href="/" className="self-start sm:self-auto rounded-2xl px-4 py-2 bg-white/10 hover:bg-white/15 transition">홈으로</a>
      </div>

      {loading && <p className="text-slate-400 mt-6">불러오는 중...</p>}
      {error && <p className="mb-4 text-red-400">{error}</p>}

      {/* 앵커: 내 구독 리스트 */}
      <div ref={subsRef} className="h-px scroll-mt-24" aria-hidden="true" />
      {!loading && !error && subs.length === 0 && (
        <div className="mb-6 rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
          <p className="text-slate-300">아직 등록된 구독이 없습니다.</p>
          <a href="/search" className="inline-block mt-3 text-fuchsia-300 hover:underline">서비스 찾아보기 →</a>
        </div>
      )}

      {!loading && !error && subs.length > 0 && (
        <section className="mb-6 mt-6">
          <h2 className="text-2xl font-bold mb-3">내 구독 리스트</h2>
          <ul className="divide-y divide-white/10 rounded-2xl bg-slate-900/60 ring-1 ring-white/10">
            {subs.map((s) => (
              <li key={s.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-3 px-4">
                <div className="min-w-0">
                  <div className="font-medium truncate">{`${s.plan_service_name || ""} ${s.plan_name || ""}`.trim()}</div>
                  <div className="mt-1 text-xs text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                    {s.start_date && (
                      <span className="whitespace-nowrap">시작일: {s.start_date}</span>
                    )}
                    {s.next_payment_date && (
                      <span className="whitespace-nowrap">다음 결제일: {s.next_payment_date}</span>
                    )}
                    {Boolean((s.custom_memo || "").trim()) && (
                      <span className="truncate max-w-[40ch]">메모: {s.custom_memo}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-slate-300 whitespace-nowrap flex items-center gap-2">
                    {((s.plan_billing_cycle ?? s.billing_cycle) !== undefined && (s.plan_billing_cycle ?? s.billing_cycle) !== null) && (
                      <span className="inline-flex items-center justify-center rounded-md border border-white/20 px-2 py-0.5 text-current leading-tight">
                        {String(s.plan_billing_cycle ?? s.billing_cycle).toLowerCase().startsWith('year') ? '연' : '월'}
                      </span>
                    )}
                    <span>₩ {Number(s.price_override ?? s.plan_price ?? 0).toLocaleString()}</span>
                  </div>
                  <button
                    onClick={async () => {
                      const ok = window.confirm("정말 삭제하시겠습니까?");
                      if (!ok) return;
                      try {
                        await deleteSubscription(s.id);
                        setSubs((prev) => {
                          const next = prev.filter((x) => x.id !== s.id);
                          const nextTotal = next.reduce((acc, it) => acc + Number(it.price_override ?? it.plan_price ?? 0), 0);
                          setTotal(nextTotal);
                          return next;
                        });
                      } catch (_) {}
                    }}
                    className="px-3 py-1 rounded-2xl bg-white/10 hover:bg-white/15"
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 앵커: 구독료 합계 */}
      <section ref={totalRef} className="mb-6 rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10 scroll-mt-24">
        <h2 className="text-2xl font-bold mb-3">구독료 합계</h2>
        <p className="text-2xl font-extrabold">₩ {Number(total || 0).toLocaleString()} / 월</p>
      </section>

      

      {SHOW_NOTIFICATIONS && (
        <section className="mb-6 rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
          <h2 className="text-2xl font-bold mb-2">알림 설정</h2>
          <div className="space-y-2">
            <label className="block">
              <input type="checkbox" checked={prefs.notifications.email} onChange={(e)=> setPrefs((p)=> ({...p, notifications: setNotification('email', e.target.checked)}))} /> 이메일 알림
            </label>
            <label className="block">
              <input type="checkbox" checked={prefs.notifications.push} onChange={(e)=> setPrefs((p)=> ({...p, notifications: setNotification('push', e.target.checked)}))} /> 푸시 알림
            </label>
            <label className="block">
              <input type="checkbox" checked={prefs.notifications.sms} onChange={(e)=> setPrefs((p)=> ({...p, notifications: setNotification('sms', e.target.checked)}))} /> 문자 알림
            </label>
          </div>
        </section>
      )}

      {SHOW_TELECOM && (
        <section className="mb-6 rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
          <h2 className="text-2xl font-bold mb-2">통신사</h2>
          <select
            className="mt-1 w-full rounded-2xl bg-slate-900 border border-white/10 px-3 py-2"
            value={prefs.telecomId || ""}
            onChange={(e)=> setPrefs((p)=> ({...p, telecomId: setTelecom(e.target.value || null)}))}
          >
            <option value="">선택 안 함</option>
            {telecoms.map((t)=> (
              <option key={t.id || t.telecom_id} value={(t.id ?? t.telecom_id) ?? ""}>{t.name}</option>
            ))}
          </select>
        </section>
      )}

      {/* 앵커: 즐겨찾기 */}
      <section ref={bookmarksRef} className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10 scroll-mt-24">
        <h2 className="text-2xl font-bold mb-3">즐겨찾기</h2>
        {bookmarkIds.size === 0 ? (
          <div className="text-slate-300">즐겨찾기한 서비스가 없습니다.</div>
        ) : (
          <ul className="text-slate-300">
            {Array.from(bookmarkIds).map((idRaw)=> {
              const idStr = String(idRaw);
              const nameById = serviceNameById[idStr];
              const resolvedName = nameById || idStr; // id가 없고 이름이 저장된 경우 이름 그대로 표시
              const resolvedId = nameById ? idStr : (serviceIdByName[idStr] || null);
              return (
                <li key={idStr} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="text-lg sm:text-xl font-semibold truncate">{resolvedName}</div>
                    {/* 메모 요약 */}
                    <div className="text-xs text-slate-400 truncate max-w-[40ch]">{(memoEntries.find(e => String(e.service) === idStr)?.memo) || ""}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {resolvedId && (
                      <Link to={`/services/${resolvedId}`} className="px-3 py-1 rounded-2xl bg-white/10 hover:bg-white/15">상세</Link>
                    )}
                    <button
                      className="px-3 py-1 rounded-2xl bg-white/10 hover:bg-white/15"
                      onClick={() => {
                        const ok = window.confirm("정말 해제하시겠습니까?");
                        if (!ok) return;
                        removeBookmark(idStr)
                          .catch(() => {})
                          .finally(() => {
                            setBookmarkIds((prev) => {
                              const next = new Set(prev);
                              next.delete(idStr);
                              return next;
                            });
                          });
                      }}
                    >해제</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 앵커: 메모 */}
      {/* 메모 목록 */}
      <section ref={memoRef} className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10 mt-6 scroll-mt-24">
        <h2 className="text-2xl font-bold mb-3">내 메모</h2>
        {memoEntries.length === 0 ? (
          <div className="text-slate-300">저장된 메모가 없습니다.</div>
        ) : (
          <ul className="divide-y divide-white/10">
            {memoEntries.map(({ service: idStr, memo }) => {
              const nameById = serviceNameById[idStr];
              const resolvedName = nameById || idStr;
              const resolvedId = nameById ? idStr : (serviceIdByName[idStr] || null);
              return (
              <li key={idStr} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-lg sm:text-xl font-semibold truncate">{resolvedName}</div>
                  <div className="whitespace-pre-wrap break-words text-slate-200">{memo}</div>
                </div>
                <div className="flex items-center gap-2">
                  {resolvedId && (<Link to={`/services/${resolvedId}`} className="px-3 py-1 rounded-2xl bg-white/10 hover:bg-white/15">상세</Link>)}
                  <button className="px-3 py-1 rounded-2xl bg-white/10 hover:bg-white/15" onClick={async ()=> {
                    try { await clearBookmarkMemo(idStr); } catch (_) {}
                    setMemoEntries((prev)=> prev.filter((e)=> String(e.service) !== String(idStr)));
                  }}>삭제</button>
                </div>
              </li>
            );})}
          </ul>
        )}
      </section>

      {/* 앵커: 카테고리별 통계 */}
      <div ref={chartsRef} className="h-px scroll-mt-24" aria-hidden="true" />
      {categoryAgg.length > 0 && (
        <section className="mb-6 mt-8">
          <h2 className="text-2xl font-bold mb-3">카테고리별 통계</h2>
          <CategoryCostCharts data={categoryAgg} />
        </section>
      )}

      {SHOW_CARDS && (
        <section className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10 mt-6">
          <h2 className="text-2xl font-bold mb-2">카드</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {cards.map((c)=> {
              const id = String(c.id || c.card_id);
              const checked = (prefs.cardIds || []).includes(id);
              return (
                <label key={id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={()=> setPrefs((p)=> ({...p, cardIds: toggleCard(id)}))}
                  />
                  <span className="truncate">{c.issuer ? `${c.issuer} ${c.name}` : c.name}</span>
                </label>
              );
            })}
          </div>
        </section>
      )}

      <div ref={reportRef} className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10 mt-6 scroll-mt-24">
        <h2 className="text-2xl font-bold mb-3">구독 서비스 리포트</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={() => handleDownload('csv')} className="flex-1 px-4 py-3 bg-white/10 text-slate-100 rounded-lg font-semibold hover:bg-white/20 transition duration-200">CSV로 내보내기</button>
          {SHOW_REPORT_PDF && (
            <button onClick={() => handleDownload('pdf')} className="flex-1 px-4 py-3 btn-primary text-slate-50 rounded-lg font-semibold hover:opacity-95 transition duration-200">PDF로 내보내기</button>
          )}
        </div>
      </div>
        </div>
      </div>
    </SidebarLayout>
  );
}