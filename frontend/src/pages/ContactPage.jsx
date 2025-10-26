import React from "react";

export default function ContactPage() {
  return (
    <div className="container-page section-y">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">문의</h1>
        <p className="mt-3 text-slate-400">서비스 관련 문의는 아래 이메일로 보내주세요.</p>
        <div className="mt-6 rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
          <p className="text-slate-300">이메일: support@guava.example</p>
        </div>
      </div>
    </div>
  );
}


