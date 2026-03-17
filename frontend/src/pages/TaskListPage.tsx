import { useEffect, useState } from "react"
import { fetchTasks, fetchBatches, reviewTask, fetchTask } from "../lib/api"
import type { Task, Batch, MatchedRule } from "../types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Eye, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronRight, FolderOpen } from "lucide-react"

const statusOpts = [
  { value: "all", label: "全部状态" },
  { value: "pass", label: "通过" },
  { value: "block", label: "拒绝" },
  { value: "pending", label: "排队中" },
  { value: "processing", label: "处理中" },
  { value: "review", label: "待复核" },
  { value: "error", label: "错误" },
]
const typeOpts = [
  { value: "all", label: "全部类型" },
  { value: "image", label: "图片" },
  { value: "video", label: "视频" },
  { value: "text", label: "文本" },
]

const statusStyle: Record<string, string> = {
  pass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  block: "bg-red-50 text-red-700 border-red-200",
  review: "bg-amber-50 text-amber-700 border-amber-200",
  error: "bg-slate-100 text-slate-600 border-slate-200",
  pending: "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-indigo-50 text-indigo-700 border-indigo-200",
}
const statusLabel: Record<string, string> = {
  pass: "通过", block: "拒绝", review: "待复核", error: "错误", pending: "排队中", processing: "处理中",
}

const typeIcon: Record<string, string> = { image: "🖼️", video: "🎬", text: "📄" }

export default function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selected, setSelected] = useState<Task | null>(null)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [expandedBatches, setExpandedBatches] = useState<Set<number>>(new Set())

  const load = () => {
    const params: Record<string, string> = {}
    if (statusFilter !== "all") params.status = statusFilter
    if (typeFilter !== "all") params.content_type = typeFilter
    fetchTasks(params).then(setTasks)
    fetchBatches().then(setBatches)
  }

  useEffect(() => { load() }, [statusFilter, typeFilter])

  const handleReview = async (action: string) => {
    if (!selected) return
    setLoading(true)
    await reviewTask(selected.id, action, comment)
    setLoading(false)
    setSelected(null)
    setComment("")
    load()
  }

  const handleViewTask = async (taskId: number) => {
    const full = await fetchTask(taskId)
    setSelected(full)
  }

  const toggleBatch = (batchId: number) => {
    setExpandedBatches((prev) => {
      const next = new Set(prev)
      if (next.has(batchId)) next.delete(batchId)
      else next.add(batchId)
      return next
    })
  }

  const parseJson = (s: string) => {
    if (!s) return null
    try { return JSON.parse(s) } catch { return null }
  }
  const parseLogs = (s: string) => {
    const logs = parseJson(s)
    if (!Array.isArray(logs)) return []
    return logs
  }

  // Separate single tasks (no batch_id) from batch tasks
  const singleTasks = tasks.filter((t) => !t.batch_id)
  const batchTaskIds = new Set(batches.flatMap((b) => b.tasks.map((t) => t.id)))

  // Build unified row list: batches first, then single tasks
  type RowItem =
    | { kind: "batch"; batch: Batch }
    | { kind: "batch-task"; task: Task; batchId: number }
    | { kind: "single"; task: Task }

  const rows: RowItem[] = []

  // Add batches
  for (const b of batches) {
    rows.push({ kind: "batch", batch: b })
    if (expandedBatches.has(b.id)) {
      // find full task objects from tasks array, or use batch.tasks summaries
      for (const bt of b.tasks) {
        const fullTask = tasks.find((t) => t.id === bt.id)
        if (fullTask) {
          // Apply filters
          if (statusFilter !== "all" && fullTask.status !== statusFilter) continue
          if (typeFilter !== "all" && fullTask.content_type !== typeFilter) continue
          rows.push({ kind: "batch-task", task: fullTask, batchId: b.id })
        } else {
          // Use summary info - still apply filters
          if (statusFilter !== "all" && bt.status !== statusFilter) continue
          if (typeFilter !== "all" && bt.content_type !== typeFilter) continue
          rows.push({
            kind: "batch-task",
            batchId: b.id,
            task: {
              id: bt.id,
              batch_id: b.id,
              original_filename: bt.original_filename,
              content_type: bt.content_type,
              content_url: "",
              content_text: "",
              status: bt.status,
              ai_result: "",
              matched_rules: "",
              confidence: bt.confidence,
              violation_types: bt.violation_types,
              risk_description: bt.risk_description,
              review_comment: "",
              process_logs: "",
              created_at: bt.created_at,
              updated_at: bt.created_at,
            },
          })
        }
      }
    }
  }

  // Add single tasks
  for (const t of singleTasks) {
    rows.push({ kind: "single", task: t })
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">审核任务</h1>
        <p className="text-sm text-slate-500 mt-1">查看和管理所有审核任务</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {statusOpts.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {typeOpts.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="text-left py-3 px-4 text-slate-500 font-medium w-[40px]"></th>
              <th className="text-left py-3 px-4 text-slate-500 font-medium">ID / 名称</th>
              <th className="text-left py-3 px-4 text-slate-500 font-medium">类型</th>
              <th className="text-left py-3 px-4 text-slate-500 font-medium">状态</th>
              <th className="text-left py-3 px-4 text-slate-500 font-medium">置信度</th>
              <th className="text-left py-3 px-4 text-slate-500 font-medium">违规类型</th>
              <th className="text-left py-3 px-4 text-slate-500 font-medium">时间</th>
              <th className="text-left py-3 px-4 text-slate-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              if (row.kind === "batch") {
                const b = row.batch
                const expanded = expandedBatches.has(b.id)
                const progress = b.total_count > 0 ? Math.round((b.done_count / b.total_count) * 100) : 0
                return (
                  <tr
                    key={`batch-${b.id}`}
                    className="border-t border-slate-50 bg-indigo-50/30 hover:bg-indigo-50/50 transition-colors cursor-pointer"
                    onClick={() => toggleBatch(b.id)}
                  >
                    <td className="py-3 px-4">
                      {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-indigo-500" />
                        <span className="font-medium text-slate-800">{b.name}</span>
                        <span className="text-xs text-slate-400">({b.total_count} 个文件)</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="bg-indigo-50/50 text-indigo-600 border-indigo-200 text-[10px]">批量</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 bg-slate-200 rounded-full h-1.5">
                          <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4" colSpan={2}>
                      <div className="flex gap-1.5 flex-wrap">
                        {b.pass_count > 0 && <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px]">通过 {b.pass_count}</Badge>}
                        {b.block_count > 0 && <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-[10px]">拦截 {b.block_count}</Badge>}
                        {b.review_count > 0 && <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-[10px]">复核 {b.review_count}</Badge>}
                        {b.error_count > 0 && <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 text-[10px]">失败 {b.error_count}</Badge>}
                        {b.pending_count > 0 && <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-[10px]">处理中 {b.pending_count}</Badge>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs">{new Date(b.created_at).toLocaleString("zh-CN")}</td>
                    <td className="py-3 px-4"></td>
                  </tr>
                )
              }

              const t = row.task
              const isBatchChild = row.kind === "batch-task"

              return (
                <tr
                  key={`task-${t.id}`}
                  className={`border-t border-slate-50 hover:bg-slate-50/50 transition-colors ${isBatchChild ? "bg-white/80" : ""}`}
                >
                  <td className="py-3 px-4">
                    {isBatchChild && <span className="w-4 h-px bg-slate-200 block ml-1.5" />}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-slate-600">#{t.id}</span>
                      {t.original_filename && (
                        <span className="text-slate-400 text-xs truncate max-w-[160px]" title={t.original_filename}>
                          {t.original_filename}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className="bg-indigo-50/50 text-indigo-600 border-indigo-200">
                      {typeIcon[t.content_type] || "📄"} {t.content_type}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className={statusStyle[t.status] || ""}>
                      {statusLabel[t.status] || t.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-mono">{(t.confidence * 100).toFixed(0)}%</td>
                  <td className="py-3 px-4 text-slate-600 max-w-[160px] truncate">{t.violation_types || "-"}</td>
                  <td className="py-3 px-4 text-slate-400">{new Date(t.created_at).toLocaleString("zh-CN")}</td>
                  <td className="py-3 px-4">
                    <Button variant="ghost" size="sm" onClick={() => handleViewTask(t.id)} className="text-indigo-600 hover:text-indigo-800">
                      <Eye className="w-4 h-4 mr-1" /> 查看
                    </Button>
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="text-center py-16 text-slate-400">暂无任务数据</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              任务详情 <span className="text-slate-400 font-mono text-sm">#{selected?.id}</span>
              {selected?.original_filename && (
                <span className="text-slate-400 text-sm font-normal">— {selected.original_filename}</span>
              )}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <span className="text-slate-400 text-xs">内容类型</span>
                  <p className="font-medium mt-0.5">{selected.content_type}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <span className="text-slate-400 text-xs">状态</span>
                  <p className="mt-0.5">
                    <Badge variant="outline" className={statusStyle[selected.status]}>
                      {statusLabel[selected.status]}
                    </Badge>
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <span className="text-slate-400 text-xs">置信度</span>
                  <p className="font-mono font-medium mt-0.5">{(selected.confidence * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <span className="text-slate-400 text-xs">违规类型</span>
                  <p className="font-medium mt-0.5">{selected.violation_types || "无"}</p>
                </div>
              </div>

              {selected.content_url && (
                <div>
                  <span className="text-slate-400 text-xs">内容预览</span>
                  {selected.content_type === "image" ? (
                    <img src={selected.content_url} alt="审核内容" className="mt-1 rounded-lg max-h-48 object-contain border" />
                  ) : selected.content_type === "video" ? (
                    <video src={selected.content_url} controls className="mt-1 rounded-lg max-h-48 border" />
                  ) : null}
                </div>
              )}

              {selected.content_text && (
                <div>
                  <span className="text-slate-400 text-xs">文本内容</span>
                  <p className="mt-1 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap max-h-40 overflow-y-auto">{selected.content_text}</p>
                </div>
              )}

              <div>
                <span className="text-slate-400 text-xs">风险描述</span>
                <p className="mt-1 bg-slate-50 rounded-lg p-3">{selected.risk_description || "无"}</p>
              </div>

              <div>
                <span className="text-slate-400 text-xs">Agent处理过程</span>
                {(() => {
                  const logs = parseLogs(selected.process_logs)
                  if (logs.length === 0) {
                    return <p className="mt-1 bg-slate-50 rounded-lg p-3">暂无过程日志</p>
                  }
                  return (
                    <div className="mt-1 space-y-2">
                      {logs.map((log: any, i: number) => (
                        <div key={i} className="bg-slate-50 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Badge variant="outline" className="text-[10px] uppercase">{log.stage || "stage"}</Badge>
                            <span>{log.time || "--:--:--"}</span>
                          </div>
                          <p className="mt-1">{log.message || ""}</p>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>

              {(() => {
                const rules = parseJson(selected.matched_rules) as MatchedRule[] | null
                if (!rules || rules.length === 0) return null
                return (
                  <div>
                    <span className="text-slate-400 text-xs">命中规则</span>
                    <div className="mt-1 space-y-1.5">
                      {rules.map((r, i) => (
                        <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                          <Badge variant="outline" className={r.action === "block" ? "bg-red-50 text-red-600 border-red-200" : "bg-amber-50 text-amber-600 border-amber-200"}>
                            {r.action === "block" ? "拦截" : "复核"}
                          </Badge>
                          <span className="font-medium">{r.name}</span>
                          <span className="text-slate-400 ml-auto text-xs">相似度 {(r.similarity * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {selected.status === "review" && (
                <div className="border-t pt-4 space-y-3">
                  <p className="font-semibold text-slate-700">人工复核</p>
                  <Textarea placeholder="输入复核意见（可选）" value={comment} onChange={(e) => setComment(e.target.value)} rows={2} />
                  <div className="flex gap-2">
                    <Button onClick={() => handleReview("pass")} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                      {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />} 通过
                    </Button>
                    <Button onClick={() => handleReview("block")} disabled={loading} variant="destructive">
                      {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />} 拒绝
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
