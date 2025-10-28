import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/95">
      <div className="mx-auto max-w-7xl px-4 py-4 text-xs sm:text-sm text-slate-400 flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
        <div>© {new Date().getFullYear()} GUAVA. All rights reserved.</div>
        <div className="flex gap-4">
          <Link to="/terms" className="hover:text-slate-200">이용약관</Link>
          <Link to="/privacy" className="hover:text-slate-200">개인정보처리방침</Link>
        </div>
      </div>
    </footer>
  );
}


