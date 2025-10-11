import React, { useState } from "react";
import { login } from "../services/authService";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      alert("✅ 로그인 성공!");
      window.location.href = "/mypage"; // 로그인 후 이동
    } catch (err) {
      console.error(err);
      setError("❌ 로그인 실패: 이메일 또는 비밀번호를 확인하세요.");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "2rem" }}>
      <h2>로그인</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label>이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "0.5rem" }}
          />
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
        >
          로그인
        </button>
      </form>
      {error && (
        <p style={{ color: "red", marginTop: "1rem", fontSize: "0.9rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default LoginPage;