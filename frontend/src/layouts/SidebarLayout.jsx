import Sidebar from "../components/Sidebar.jsx";

export default function SidebarLayout({ children, sidebarContent, hideSidebarOnMobile = false }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row">
        {sidebarContent ? (
          <aside className={`w-full md:w-64 shrink-0 border-r border-white/10 bg-slate-950/80 ${hideSidebarOnMobile ? "hidden md:block" : ""}`}>
            {sidebarContent}
          </aside>
        ) : (
          <div className={hideSidebarOnMobile ? "hidden md:block" : ""}>
            <Sidebar />
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}


