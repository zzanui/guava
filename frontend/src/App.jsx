import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import LoginPage from "./pages/LoginPage";

function App() {
  return (
    <div>
      <header
        style={{
          padding: "1rem",
          backgroundColor: "#f5f5f5",
          borderBottom: "1px solid #ddd",
        }}
      >
        <h2>🍈 구아바 (Guava)</h2>
        <nav>
          <Link to="/login" style={{ marginRight: "1rem" }}>
            로그인
          </Link>
          <Link to="/mypage">마이페이지</Link>
        </nav>
      </header>

      <main style={{ padding: "2rem" }}>
        <Routes>
          <Route path="/" element={<h3>메인 페이지 (준비 중)</h3>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<h3>404 - 페이지를 찾을 수 없습니다</h3>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;