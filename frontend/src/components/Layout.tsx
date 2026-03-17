import { NavLink, Outlet, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  ListChecks,
  Upload,
  Shield,
  ShieldCheck,
  LogOut,
} from "lucide-react"

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "数据看板" },
  { to: "/tasks", icon: ListChecks, label: "审核任务" },
  { to: "/submit", icon: Upload, label: "内容提交" },
  { to: "/policies", icon: Shield, label: "策略管理" },
]

export default function Layout() {
  const navigate = useNavigate()
  const user = sessionStorage.getItem("user") || "admin"

  const handleLogout = () => {
    sessionStorage.removeItem("auth")
    sessionStorage.removeItem("user")
    navigate("/login", { replace: true })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-[220px] flex-shrink-0 bg-[#1E293B] flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-6">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0f2b46] to-[#1a5276] flex items-center justify-center shadow-lg shadow-blue-900/30">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            智审Agent
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 mt-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/dashboard"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-indigo-500/15 text-indigo-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px] transition-colors" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
              {user[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-300 truncate">
                {user}
              </p>
              <p className="text-[11px] text-slate-500">管理员</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
