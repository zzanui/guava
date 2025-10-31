import React from "react";
import { useGuavaDialog } from "../context/GuavaDialogContext.jsx";
import { register as registerRequest } from "../services/authService";
import { useForm } from "react-hook-form";

export default function RegisterPage() {
  const { alert: guavaAlert } = useGuavaDialog();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    defaultValues: {
      username: "",
      name: "",
      display_name: "",
      email: "",
      password: "",
      password2: "",
    },
  });

  const onSubmit = async (form) => {
    if (form.password !== form.password2) {
      setError("password2", { type: "validate", message: "비밀번호가 일치하지 않습니다." });
      return;
    }
    try {
      await registerRequest(form);
      await guavaAlert("✅ 회원가입이 완료되었습니다. 로그인해 주세요.");
      window.location.href = "/login";
    } catch (err) {
      const data = err?.response?.data || {};
      // 서버 에러를 필드/루트로 매핑
      const fieldKeys = ["username", "name", "display_name", "email", "password", "password2"]; 
      let mapped = false;
      for (const key of fieldKeys) {
        const msgs = data?.[key];
        if (Array.isArray(msgs) && msgs.length > 0) {
          setError(key, { type: "server", message: msgs[0] });
          mapped = true;
        }
      }
      const detail = data?.detail || data?.non_field_errors?.[0];
      if (!mapped || detail) {
        setError("root", { type: "server", message: `❌ ${detail || "회원가입에 실패했습니다."}` });
      }
    }
  };

  return (
    <div className="container-page section-y">
      <div className="mx-auto w-full max-w-lg">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">회원가입</h1>
      <p className="mt-2 text-slate-400">추후에 소셜 계정 연동 예정입니다.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div>
          <label className="text-sm block mb-1" htmlFor="username">아이디</label>
          <input id="username" aria-invalid={Boolean(errors.username)} {...register("username", { required: "아이디를 입력하세요." })} className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-fuchsia-400" />
          {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm block mb-1" htmlFor="name">이름</label>
            <input id="name" aria-invalid={Boolean(errors.name)} {...register("name", { required: "이름을 입력하세요." })} className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-fuchsia-400" />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="text-sm block mb-1" htmlFor="display_name">닉네임</label>
            <input id="display_name" aria-invalid={Boolean(errors.display_name)} {...register("display_name", { required: "닉네임을 입력하세요." })} className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-fuchsia-400" />
            {errors.display_name && <p className="text-red-400 text-sm mt-1">{errors.display_name.message}</p>}
          </div>
        </div>

        <div>
          <label className="text-sm block mb-1" htmlFor="email">이메일 (선택)</label>
          <input id="email" type="email" aria-invalid={Boolean(errors.email)} {...register("email", { pattern: { value: /.+@.+\..+/, message: "이메일 형식이 올바르지 않습니다." } })} className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-fuchsia-400" />
          {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm block mb-1" htmlFor="password">비밀번호</label>
            <input id="password" type="password" aria-invalid={Boolean(errors.password)} {...register("password", { required: "비밀번호를 입력하세요.", minLength: { value: 8, message: "8자 이상 입력하세요." } })} className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-fuchsia-400" />
            {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="text-sm block mb-1" htmlFor="password2">비밀번호 확인</label>
            <input id="password2" type="password" aria-invalid={Boolean(errors.password2)} {...register("password2", { required: "비밀번호 확인을 입력하세요." })} className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-fuchsia-400" />
            {errors.password2 && <p className="text-red-400 text-sm mt-1">{errors.password2.message}</p>}
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl px-5 py-3 btn-primary text-slate-50 font-semibold hover:opacity-95 transition shadow-lg focus-ring">
          {isSubmitting ? "처리 중..." : "회원가입"}
        </button>
      </form>
      {errors.root && (
        <p className="text-red-400 text-sm mt-4">{errors.root.message}</p>
      )}
      </div>
    </div>
  );
}


