import React from "react";
import { register as registerRequest } from "../services/authService";
import { useForm } from "react-hook-form";

export default function RegisterPage() {
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
      alert("✅ 회원가입이 완료되었습니다. 로그인해 주세요.");
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
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "2rem" }}>
      <h2>회원가입</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: "1rem" }}>
          <label>아이디</label>
          <input {...register("username", { required: "아이디를 입력하세요." })} style={{ width: "100%", padding: "0.5rem" }} />
          {errors.username && <p style={{ color: "red", marginTop: 4 }}>{errors.username.message}</p>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label>이름</label>
            <input {...register("name", { required: "이름을 입력하세요." })} style={{ width: "100%", padding: "0.5rem" }} />
            {errors.name && <p style={{ color: "red", marginTop: 4 }}>{errors.name.message}</p>}
          </div>
          <div>
            <label>닉네임</label>
            <input {...register("display_name", { required: "닉네임을 입력하세요." })} style={{ width: "100%", padding: "0.5rem" }} />
            {errors.display_name && <p style={{ color: "red", marginTop: 4 }}>{errors.display_name.message}</p>}
          </div>
        </div>
        <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
          <label>이메일 (선택)</label>
          <input type="email" {...register("email", { pattern: { value: /.+@.+\..+/, message: "이메일 형식이 올바르지 않습니다." } })} style={{ width: "100%", padding: "0.5rem" }} />
          {errors.email && <p style={{ color: "red", marginTop: 4 }}>{errors.email.message}</p>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label>비밀번호</label>
            <input type="password" {...register("password", { required: "비밀번호를 입력하세요.", minLength: { value: 8, message: "8자 이상 입력하세요." } })} style={{ width: "100%", padding: "0.5rem" }} />
            {errors.password && <p style={{ color: "red", marginTop: 4 }}>{errors.password.message}</p>}
          </div>
          <div>
            <label>비밀번호 확인</label>
            <input type="password" {...register("password2", { required: "비밀번호 확인을 입력하세요." })} style={{ width: "100%", padding: "0.5rem" }} />
            {errors.password2 && <p style={{ color: "red", marginTop: 4 }}>{errors.password2.message}</p>}
          </div>
        </div>
        <button type="submit" disabled={isSubmitting} style={{ width: "100%", marginTop: "1rem", backgroundColor: "#00c853", color: "white", padding: "0.75rem", border: "none", borderRadius: "5px", fontSize: "1rem" }}>
          {isSubmitting ? "처리 중..." : "회원가입"}
        </button>
      </form>
      {errors.root && (
        <p style={{ color: "red", marginTop: "1rem", fontSize: "0.9rem" }}>{errors.root.message}</p>
      )}
    </div>
  );
}


