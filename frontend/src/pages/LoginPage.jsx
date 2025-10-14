import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { useForm } from "react-hook-form";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({ defaultValues: { id: "", password: "" } });

  const onSubmit = async ({ id, password }) => {
    try {
      await login(id, password);
      const to = location.state?.from?.pathname || "/mypage";
      navigate(to, { replace: true });
    } catch (err) {
      const server = err?.response?.data;
      const detail = server?.detail;
      if (typeof detail === "string") {
        setError("root", { type: "server", message: `❌ ${detail}` });
      } else {
        setError("root", { type: "server", message: "❌ 로그인에 실패했습니다." });
      }
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 md:py-24">
      <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">로그인</h1>
      <p className="mt-2 text-slate-400">아이디와 비밀번호로 로그인하세요.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div>
          <label className="text-sm block mb-1" htmlFor="id">아이디</label>
          <input id="id" type="text" aria-invalid={Boolean(errors.id)} {...register("id", { required: "아이디를 입력하세요." })} className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400" />
          {errors.id && <p className="text-red-400 text-sm mt-1">{errors.id.message}</p>}
        </div>
        <div>
          <label className="text-sm block mb-1" htmlFor="password">비밀번호</label>
          <input id="password" type="password" aria-invalid={Boolean(errors.password)} {...register("password", { required: "비밀번호를 입력하세요." })} className="w-full rounded-2xl bg-slate-900 border border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400" />
          {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full rounded-2xl px-5 py-3 bg-cyan-400 text-slate-900 font-semibold hover:opacity-90 transition shadow-lg focus-ring">
          {isSubmitting ? "처리 중..." : "로그인"}
        </button>
      </form>
      <div className="mt-4 text-right text-sm">
        <span className="mr-2 text-slate-400">계정이 없으신가요?</span>
        <Link to="/register" className="text-cyan-300 hover:underline">회원가입</Link>
      </div>
      {errors.root && (
        <p className="text-red-400 text-sm mt-4">{errors.root.message}</p>
      )}
    </div>
  );
}

export default LoginPage;


