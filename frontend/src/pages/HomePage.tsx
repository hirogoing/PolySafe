import { useNavigate } from "react-router-dom"
import {
  ShieldCheck,
  Eye,
  Zap,
  Users,
  BarChart3,
  Image,
  Video,
  FileText,
  ArrowRight,
  Sparkles,
  Lock,
  Globe,
  ChevronRight,
} from "lucide-react"

const features = [
  {
    icon: Eye,
    title: "多模态违规识别",
    desc: "支持图片、视频、文本三种内容类型，通过 VLM 大模型统一理解与风险分析",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: Zap,
    title: "智能 Agent 编排",
    desc: "自主调用模型工具、语义检索知识库、规则引擎决策，全流程自动化处理",
    color: "from-blue-500 to-indigo-500",
  },
  {
    icon: Users,
    title: "人机协同审核",
    desc: "高置信度自动处置，灰度内容推送人工复核，兼顾效率与准确性",
    color: "from-teal-500 to-cyan-500",
  },
  {
    icon: BarChart3,
    title: "数据看板分析",
    desc: "审核趋势、违规分布、通过率等关键指标实时可视化，辅助运营决策",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Lock,
    title: "可配置审核策略",
    desc: "灵活定义审核规则和策略，支持动态调整，策略变更后自动重建向量索引",
    color: "from-sky-500 to-blue-500",
  },
  {
    icon: Globe,
    title: "批量任务处理",
    desc: "支持多文件混合批量提交，自动识别文件类型，批次维度查看汇总结果",
    color: "from-indigo-500 to-cyan-500",
  },
]

const contentTypes = [
  { icon: Image, label: "图片审核", ext: "JPG / PNG / GIF / WebP" },
  { icon: Video, label: "视频审核", ext: "MP4 / AVI / MOV / MKV" },
  { icon: FileText, label: "文本审核", ext: "TXT / MD / PDF / DOCX / CSV" },
]

const stats = [
  { value: "12", label: "审核策略" },
  { value: "30", label: "预设规则" },
  { value: "6", label: "违规类型" },
  { value: "<1s", label: "平均响应" },
]

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {/* Background decoration - global */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Abstract blurred shapes */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-cyan-200/30 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -left-40 w-[400px] h-[400px] bg-blue-200/25 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[350px] h-[350px] bg-teal-100/30 rounded-full blur-[100px]" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,40,80,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,40,80,.15) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Scattered dots */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1.5px 1.5px, rgba(0,80,120,.4) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#f0f4f8]/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a5276] to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/15">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-800 tracking-tight">
              PolySafe
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              登录
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#1a5276] to-cyan-600 rounded-full hover:shadow-lg hover:shadow-cyan-500/15 transition-all duration-300 hover:-translate-y-0.5"
            >
              开始使用
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-cyan-200/60 mb-8 shadow-sm">
              <Sparkles className="w-4 h-4 text-cyan-600" />
              <span className="text-sm font-medium text-slate-700">
                AIGC 全模态内容审核 Agent
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
              智能审核
              <span className="bg-gradient-to-r from-[#1a5276] via-cyan-600 to-teal-500 bg-clip-text text-transparent">
                {" "}多模态内容
              </span>
              <br />
              守护平台安全
            </h1>

            <p className="mt-8 text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              基于视觉语言大模型（VLM）与 FAISS 向量检索技术，
              构建端到端的智能审核 Agent 流水线，自动化识别图像、视频、文本中的违规信息。
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate("/login")}
                className="group flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-[#1a5276] to-cyan-600 rounded-full hover:shadow-xl hover:shadow-cyan-500/15 transition-all duration-300 hover:-translate-y-0.5"
              >
                进入控制台
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 max-w-3xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="text-center p-5 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/80 shadow-sm"
                >
                  <div className="text-3xl font-extrabold bg-gradient-to-r from-[#1a5276] to-cyan-500 bg-clip-text text-transparent">
                    {s.value}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Content Types Section */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              全模态内容支持
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              覆盖图片、视频、文本三大内容类型，一站式审核
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {contentTypes.map((ct) => (
              <div
                key={ct.label}
                className="group relative p-8 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/80 hover:border-cyan-200 shadow-sm hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#e8f4f8] to-[#d0ecf4] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <ct.icon className="w-7 h-7 text-[#1a5276]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{ct.label}</h3>
                <p className="mt-2 text-sm text-slate-400 font-mono">
                  {ct.ext}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              核心能力
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              从内容理解到策略决策，Agent 全自动闭环处理
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative p-7 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/80 hover:border-transparent shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-lg shadow-slate-200/50 group-hover:scale-110 transition-transform duration-300`}
                >
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{f.title}</h3>
                <p className="mt-3 text-sm text-slate-500 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              审核流程
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              三步完成从内容理解到自动处置的完整闭环
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute left-8 top-14 bottom-14 w-px bg-gradient-to-b from-cyan-300 via-teal-300 to-emerald-300 hidden sm:block" />

              {[
                {
                  step: "01",
                  title: "内容理解",
                  desc: "Agent 接收待审内容，自动识别类型并调用多模态大模型（VLM）提取关键信息与潜在风险点",
                  color: "from-[#1a5276] to-cyan-500",
                },
                {
                  step: "02",
                  title: "策略判断",
                  desc: "将模型分析结果输入规则引擎，通过 FAISS 语义向量检索匹配最相关的审核策略，综合判定风险等级",
                  color: "from-cyan-500 to-teal-500",
                },
                {
                  step: "03",
                  title: "处置与上报",
                  desc: "根据置信度和规则匹配结果自动执行拦截、放行或推送人工复核，全程记录 Agent 执行轨迹",
                  color: "from-cyan-500 to-teal-500",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="relative flex items-start gap-6 mb-10 last:mb-0"
                >
                  <div
                    className={`relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 shadow-lg`}
                  >
                    <span className="text-white font-extrabold text-lg">
                      {item.step}
                    </span>
                  </div>
                  <div className="pt-2">
                    <h3 className="text-xl font-bold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-slate-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-[#e8f4f8] to-[#d6eef6] border border-slate-200/60 p-12 sm:p-16">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.04]">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 2px 2px, rgba(0,80,120,.3) 1px, transparent 0)",
                  backgroundSize: "32px 32px",
                }}
              />
            </div>
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-cyan-200/30 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-blue-200/20 rounded-full blur-[60px]" />
            <div className="relative text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-800">
                开始智能审核之旅
              </h2>
              <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
                登录系统，体验 AI 驱动的多模态内容审核 Agent
              </p>
              <button
                onClick={() => navigate("/login")}
                className="group mt-8 inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-[#1a5276] to-cyan-600 rounded-full hover:shadow-xl hover:shadow-cyan-500/15 transition-all duration-300 hover:-translate-y-0.5"
              >
                立即登录
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-10 border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1a5276] to-cyan-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-700">
              PolySafe
            </span>
          </div>
          <p className="text-sm text-slate-400">
            内容安全审核系统
          </p>
        </div>
      </footer>
    </div>
  )
}
