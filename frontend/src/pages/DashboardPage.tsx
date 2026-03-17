import { useEffect, useState } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts"
import { ShieldCheck, ShieldX, Eye, AlertTriangle } from "lucide-react"
import { fetchStats, fetchTrend, fetchViolations, fetchRecent } from "../lib/api"
import type { DashboardStats, DailyTrend, ViolationDist, RecentTask } from "../types"

const PIE_COLORS = ["#6366F1", "#EF4444", "#F59E0B", "#22C55E", "#3B82F6", "#8B5CF6"]

const statusMap: Record<string, { label: string; color: string }> = {
  pass: { label: "通过", color: "text-emerald-600 bg-emerald-50" },
  block: { label: "拒绝", color: "text-red-600 bg-red-50" },
  review: { label: "待复核", color: "text-amber-600 bg-amber-50" },
  error: { label: "错误", color: "text-slate-500 bg-slate-100" },
  pending: { label: "处理中", color: "text-blue-600 bg-blue-50" },
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [trend, setTrend] = useState<DailyTrend[]>([])
  const [violations, setViolations] = useState<ViolationDist[]>([])
  const [recent, setRecent] = useState<RecentTask[]>([])

  useEffect(() => {
    fetchStats().then(setStats)
    fetchTrend(7).then(setTrend)
    fetchViolations().then(setViolations)
    fetchRecent(8).then(setRecent)
  }, [])

  const cards = stats
    ? [
        { label: "审核总量", value: stats.total, icon: ShieldCheck, gradient: "from-blue-500 to-blue-600", shadow: "shadow-blue-500/25" },
        { label: "通过率", value: `${stats.pass_rate}%`, icon: ShieldCheck, gradient: "from-emerald-500 to-emerald-600", shadow: "shadow-emerald-500/25" },
        { label: "拒绝率", value: `${stats.block_rate}%`, icon: ShieldX, gradient: "from-red-500 to-red-600", shadow: "shadow-red-500/25" },
        { label: "待复核", value: stats.review_count, icon: Eye, gradient: "from-amber-500 to-amber-600", shadow: "shadow-amber-500/25" },
      ]
    : []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">数据看板</h1>
          <p className="text-sm text-slate-500 mt-1">审核任务概览与趋势分析</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${c.gradient} p-5 text-white shadow-lg ${c.shadow} transition-transform hover:scale-[1.02]`}
          >
            <div className="absolute top-3 right-3 opacity-20">
              <c.icon className="w-12 h-12" />
            </div>
            <p className="text-sm font-medium text-white/80">{c.label}</p>
            <p className="text-3xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-5 gap-4">
        {/* Trend Chart */}
        <div className="col-span-3 bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-base font-semibold text-slate-800 mb-4">近7天审核趋势</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" fontSize={12} stroke="#94a3b8" />
              <YAxis fontSize={12} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,.08)" }} />
              <Line type="monotone" dataKey="total" stroke="#6366F1" strokeWidth={2.5} dot={{ r: 4 }} name="总量" />
              <Line type="monotone" dataKey="pass_count" stroke="#22C55E" strokeWidth={2} dot={{ r: 3 }} name="通过" />
              <Line type="monotone" dataKey="block_count" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} name="拒绝" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Violation Pie */}
        <div className="col-span-2 bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-base font-semibold text-slate-800 mb-4">违规类型分布</h3>
          {violations.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={violations} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}>
                  {violations.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-slate-400 text-sm">
              暂无违规数据
            </div>
          )}
        </div>
      </div>

      {/* Recent Table */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <h3 className="text-base font-semibold text-slate-800 mb-4">最近审核记录</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2.5 px-3 text-slate-500 font-medium">ID</th>
                <th className="text-left py-2.5 px-3 text-slate-500 font-medium">内容类型</th>
                <th className="text-left py-2.5 px-3 text-slate-500 font-medium">状态</th>
                <th className="text-left py-2.5 px-3 text-slate-500 font-medium">置信度</th>
                <th className="text-left py-2.5 px-3 text-slate-500 font-medium">违规类型</th>
                <th className="text-left py-2.5 px-3 text-slate-500 font-medium">时间</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((t) => {
                const s = statusMap[t.status] || statusMap.pending
                return (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-600">#{t.id}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-600">
                        {t.content_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.color}`}>{s.label}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{(t.confidence * 100).toFixed(0)}%</td>
                    <td className="py-2.5 px-3 text-slate-600">{t.violation_types || "-"}</td>
                    <td className="py-2.5 px-3 text-slate-400">{new Date(t.created_at).toLocaleString("zh-CN")}</td>
                  </tr>
                )
              })}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    暂无审核记录，请先提交内容
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
