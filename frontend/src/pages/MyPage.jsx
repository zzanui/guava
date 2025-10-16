// src/pages/MyPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { listSubscriptions, removeSubscription, monthlyTotal } from "../services/localSubscriptions.js";
import { getPrefs, setNotification, removeFavorite } from "../services/localPrefs.js";

export default function MyPage() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [prefs, setPrefs] = useState(getPrefs());

  useEffect(() => {
    setLoading(true);
    setError("");
    try {
      setSubs(listSubscriptions());
    } catch (e) {
      setError("구독 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  const total = useMemo(() => monthlyTotal(), [subs]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">마이페이지</h1>
        <a href="/" className="rounded-2xl px-4 py-2 bg-white/10 hover:bg-white/15 transition">홈으로</a>
      </div>

      {loading && <p className="text-slate-400 mt-6">불러오는 중...</p>}
      {error && (
        <p className="mb-4 text-red-400">
          {error}
        </p>
      )}

      {!loading && !error && subs.length === 0 && (
        <div className="mb-6 rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
          <p className="text-slate-300">아직 등록된 구독이 없습니다.</p>
          <a href="/search" className="inline-block mt-3 text-cyan-300 hover:underline">서비스 찾아보기 →</a>
        </div>
      )}

      {!loading && !error && subs.length > 0 && (
        <section className="mb-6">
          <h2 className="text-2xl font-bold mb-3">내 구독 리스트</h2>
          <ul className="divide-y divide-white/10 rounded-2xl bg-slate-900/60 ring-1 ring-white/10">
            {subs.map((s) => (
              <li key={s.__id} className="flex items-center justify-between py-3 px-4">
                <div className="font-medium truncate">{s.name}</div>
                <div className="flex items-center gap-3">
                  <div className="text-slate-300">₩ {Number(s.priceValue||0).toLocaleString()}</div>
                  <button
                    onClick={() => { removeSubscription(s.__id); setSubs(listSubscriptions()); }}
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

      <section className="mb-6 rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
        <h2 className="text-2xl font-bold mb-2">총 구독료</h2>
        <p className="text-2xl font-extrabold">₩ {total.toLocaleString()} / 월</p>
      </section>

      <section className="mb-6 rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
        <h2 className="text-2xl font-bold mb-2">알림 설정</h2>
        <label className="block">
          <input type="checkbox" checked={prefs.notifications.email} onChange={(e)=> setPrefs((p)=> ({...p, notifications: setNotification('email', e.target.checked)}))} /> 이메일 알림
        </label>
        <label className="block">
          <input type="checkbox" checked={prefs.notifications.push} onChange={(e)=> setPrefs((p)=> ({...p, notifications: setNotification('push', e.target.checked)}))} /> 푸시 알림
        </label>
        <label className="block">
          <input type="checkbox" checked={prefs.notifications.sms} onChange={(e)=> setPrefs((p)=> ({...p, notifications: setNotification('sms', e.target.checked)}))} /> 문자 알림
        </label>
      </section>

      <section className="rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
        <h2 className="text-2xl font-bold mb-2">즐겨찾기</h2>
        {prefs.favorites.length === 0 ? (
          <div className="text-slate-300">즐겨찾기한 서비스가 없습니다.</div>
        ) : (
          <ul className="list-disc pl-6 text-slate-300">
            {prefs.favorites.map((name)=> (
              <li key={name} className="flex items-center justify-between">
                <span>{name}</span>
                <button className="px-3 py-1 rounded-2xl bg-white/10 hover:bg-white/15" onClick={()=> setPrefs((p)=> ({...p, favorites: removeFavorite(name)}))}>삭제</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}