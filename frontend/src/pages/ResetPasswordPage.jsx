import React, { useState } from "react";
import SidebarLayout from "../layouts/SidebarLayout.jsx";

export default function ResetPasswordPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <SidebarLayout>
      <div className="container-page section-y">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">비밀번호 찾기</h1>
          <p className="mt-2 text-slate-400">아이디와 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.</p>
          {!submitted ? (
            <form
              onSubmit={(e)=>{e.preventDefault(); setSubmitted(true);}}
              className="mt-8 space-y-4"
            >
              <div>
                <label className="text-sm block mb-1" htmlFor="username">아이디</label>
                <input id="username" type="text" required value={username} onChange={(e)=>setUsername(e.target.value)} className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-fuchsia-400" />
              </div>
              <div>
                <label className="text-sm block mb-1" htmlFor="email">이메일</label>
                <input id="email" type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-fuchsia-400" />
              </div>
              <button type="submit" disabled={!username || !email} className="w-full rounded-2xl px-5 py-3 btn-primary text-slate-50 font-semibold hover:opacity-95 transition shadow-lg focus-ring disabled:opacity-50">재설정 링크 보내기</button>
            </form>
          ) : (
            <div className="mt-8 rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
              <p className="text-slate-300">입력하신 이메일로 비밀번호 재설정 링크를 발송했습니다. 메일함을 확인해 주세요.</p>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}


