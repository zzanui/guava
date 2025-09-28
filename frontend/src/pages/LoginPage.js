// src/pages/LoginPage.js
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    alert(`로그인 시도: ${email}`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-6">로그인</h1>
      <input
        type="email"
        placeholder="이메일"
        className="border p-2 mb-2 w-72 rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="비밀번호"
        className="border p-2 mb-4 w-72 rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        onClick={handleLogin}
        className="bg-blue-500 text-white px-4 py-2 rounded w-72"
      >
        로그인
      </button>
      <p className="mt-4 text-sm text-gray-600">
        아직 회원이 아니신가요?{" "}
        <span className="text-blue-500 cursor-pointer">회원가입</span>
      </p>
    </div>
  );
}