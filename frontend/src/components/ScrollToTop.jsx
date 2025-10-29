import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // 해시가 있는 경우 브라우저 기본 스크롤 이동을 존중하되, 없으면 최상단으로 이동
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  }, [pathname, search, hash]);

  return null;
}


