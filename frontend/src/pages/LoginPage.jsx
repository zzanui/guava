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
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "2rem" }}>
      <h2>로그인</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: "1rem" }}>
          <label>아이디</label>
          <input type="text" {...register("id", { required: "아이디를 입력하세요." })} style={{ width: "100%", padding: "0.5rem" }} />
          {errors.id && <p style={{ color: "red", marginTop: 4 }}>{errors.id.message}</p>}
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label>비밀번호</label>
          <input type="password" {...register("password", { required: "비밀번호를 입력하세요." })} style={{ width: "100%", padding: "0.5rem" }} />
          {errors.password && <p style={{ color: "red", marginTop: 4 }}>{errors.password.message}</p>}
        </div>
        <button
          type="submit"
          style={{
            width: "100%",
            backgroundColor: "#00c853",
            color: "white",
            padding: "0.75rem",
            border: "none",
            borderRadius: "5px",
            fontSize: "1rem",
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "처리 중..." : "로그인"}
        </button>
      </form>
      <div style={{ marginTop: "1rem", textAlign: "right" }}>
        <span style={{ marginRight: "0.5rem" }}>계정이 없으신가요?</span>
        <Link to="/register">회원가입</Link>
      </div>
      {errors.root && (
        <p style={{ color: "red", marginTop: "1rem", fontSize: "0.9rem" }}>{errors.root.message}</p>
      )}
    </div>
  );
}

export default LoginPage;


