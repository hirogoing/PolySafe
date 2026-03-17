import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ShieldCheck, Eye, EyeOff, ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!username || !password) {
      setError("请输入用户名和密码")
      return
    }

    setLoading(true)

    // simulate short delay
    setTimeout(() => {
      if (username === "admin" && password === "123456") {
        sessionStorage.setItem("auth", "1")
        sessionStorage.setItem("user", username)
        navigate("/dashboard", { replace: true })
      } else {
        setError("用户名或密码错误")
      }
      setLoading(false)
    }, 400)
  }

  return (
    <div className="min-h-screen flex bg-[#f0f4f8]">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-gradient-to-br from-[#e8f4f8] via-[#dceef6] to-[#d0e8f2] overflow-hidden">
        {/* Background pattern - grid */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,80,120,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(0,80,120,.12) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Scattered dots */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1.5px 1.5px, rgba(0,120,160,.25) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Glow effects */}
        <div className="absolute top-1/4 right-0 w-[300px] h-[300px] bg-cyan-200/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-0 w-[250px] h-[250px] bg-blue-200/30 rounded-full blur-[80px]" />
        <div className="absolute top-0 left-1/3 w-[200px] h-[200px] bg-teal-100/40 rounded-full blur-[60px]" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Top */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/70 backdrop-blur-sm flex items-center justify-center border border-white/80 shadow-sm">
              <ShieldCheck className="w-6 h-6 text-[#1a5276]" />
            </div>
            <span className="text-slate-800 font-bold text-xl">PolySafe</span>
          </div>

          {/* Center */}
          <div className="max-w-lg">
            <h2 className="text-4xl font-extrabold text-slate-800 leading-tight">
              多模态内容
              <br />
              <span className="bg-gradient-to-r from-[#1a5276] to-cyan-600 bg-clip-text text-transparent">
                智能审核系统
              </span>
            </h2>
            <p className="mt-6 text-lg text-slate-500 leading-relaxed">
              基于视觉语言大模型与 FAISS 向量检索技术，
              构建端到端的智能审核 Agent，
              自动化识别违规信息，守护平台内容安全。
            </p>

            {/* Feature pills */}
            <div className="mt-8 flex flex-wrap gap-3">
              {["图片审核", "视频审核", "文本审核", "策略管理", "人机协同", "批量处理"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-sm text-sm text-[#1a5276] border border-cyan-200/50 shadow-sm"
                  >
                    {tag}
                  </span>
                )
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Back to home */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-10"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>

          {/* Logo for mobile */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0f2b46] to-[#1a5276] flex items-center justify-center shadow-lg shadow-blue-900/20">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
            </div>
            <span className="font-bold text-xl text-slate-800">PolySafe</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">欢迎回来</h1>
          <p className="mt-2 text-slate-500">登录以进入审核控制台</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPwd ? (
                    <EyeOff className="w-4.5 h-4.5" />
                  ) : (
                    <Eye className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#0f2b46] to-[#1a5276] rounded-xl hover:shadow-lg hover:shadow-blue-900/20 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "登录中..." : "登录"}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-xl bg-white/60 border border-slate-200/60">
            <p className="text-xs text-slate-500 text-center">
              演示账号：
              <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                admin
              </code>
              /
              <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                123456
              </code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
