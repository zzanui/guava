import { Link } from "react-router-dom";

export default function NavBar() {
  return (
    <nav className="bg-gray-800 text-white p-4 flex gap-4">
      <Link to="/">로그인</Link>
      <Link to="/search">서비스 검색</Link>
      <Link to="/subscriptions">내 구독 리스트</Link>
      <Link to="/mypage">마이페이지</Link>
    </nav>
  );
}