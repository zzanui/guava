import React, { useState } from "react";
import { register } from "../services/authService";

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: "",
    name: "",
    display_name: "",
    email: "",
    password: "",
    password2: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.password2) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      await register(form);
      alert("✅ 회원가입이 완료되었습니다. 로그인해 주세요.");
      window.location.href = "/login";
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.detail ||
        Object.values(err?.response?.data || {})?.[0]?.[0] ||
        "회원가입에 실패했습니다.";
      setError(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", padding: "2rem" }}>
      <h2>회원가입</h2>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label>아이디</label>
          <input name="username" value={form.username} onChange={onChange} required style={{ width: "100%", padding: "0.5rem" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label>이름</label>
            <input name="name" value={form.name} onChange={onChange} required style={{ width: "100%", padding: "0.5rem" }} />
          </div>
          <div>
            <label>닉네임</label>
            <input name="display_name" value={form.display_name} onChange={onChange} required style={{ width: "100%", padding: "0.5rem" }} />
          </div>
        </div>
        <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
          <label>이메일 (선택)</label>
          <input type="email" name="email" value={form.email} onChange={onChange} style={{ width: "100%", padding: "0.5rem" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label>비밀번호</label>
            <input type="password" name="password" value={form.password} onChange={onChange} required style={{ width: "100%", padding: "0.5rem" }} />
          </div>
          <div>
            <label>비밀번호 확인</label>
            <input type="password" name="password2" value={form.password2} onChange={onChange} required style={{ width: "100%", padding: "0.5rem" }} />
          </div>
        </div>
        <button type="submit" disabled={loading} style={{ width: "100%", marginTop: "1rem", backgroundColor: "#00c853", color: "white", padding: "0.75rem", border: "none", borderRadius: "5px", fontSize: "1rem" }}>
          {loading ? "처리 중..." : "회원가입"}
        </button>
      </form>
      {error && (
        <p style={{ color: "red", marginTop: "1rem", fontSize: "0.9rem" }}>{error}</p>
      )}
    </div>
  );
}


