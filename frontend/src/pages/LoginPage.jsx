import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [id, setid] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(id, password);
      const to = location.state?.from?.pathname || "/mypage";
      navigate(to, { replace: true });
    } catch (err) {
      console.error(err);
      setError("❌ 로그인 실패: 아이디 또는 비밀번호를 확인하세요.");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "2rem" }}>
      <h2>로그인</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label>아이디</label>
          <input
            type="text"
            value={id}
            onChange={(e) => setid(e.target.value)}
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
      <div style={{ marginTop: "1rem", textAlign: "right" }}>
        <span style={{ marginRight: "0.5rem" }}>계정이 없으신가요?</span>
        <Link to="/register">회원가입</Link>
      </div>
      {error && (
        <p style={{ color: "red", marginTop: "1rem", fontSize: "0.9rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default LoginPage;


