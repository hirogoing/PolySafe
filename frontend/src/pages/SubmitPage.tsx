import { useEffect, useRef, useState } from "react"
import { createTask, fetchTask, createBatch, fetchBatch } from "../lib/api"
import type { Task, Batch, MatchedRule } from "../types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Tabs, TabsList, TabsTrigger,
} from "@/components/ui/tabs"
import {
  Upload, Image, Video, FileText, Loader2, CheckCircle2, XCircle, Eye, Sparkles, FolderUp, Trash2, FileIcon,
} from "lucide-react"

type ProcessLog = {
  time: string
  stage: string
  message: string
  payload?: unknown
}

const statusLabel: Record<string, { text: string; style: string; icon: typeof CheckCircle2 }> = {
  pending: { text: "排队处理中", style: "bg-blue-50 border-blue-200 text-blue-700", icon: Loader2 },
  processing: { text: "Agent执行中", style: "bg-indigo-50 border-indigo-200 text-indigo-700", icon: Loader2 },
  pass: { text: "审核通过", style: "bg-emerald-50 border-emerald-200 text-emerald-700", icon: CheckCircle2 },
  block: { text: "审核拒绝", style: "bg-red-50 border-red-200 text-red-700", icon: XCircle },
  review: { text: "待人工复核", style: "bg-amber-50 border-amber-200 text-amber-700", icon: Eye },
  error: { text: "处理失败", style: "bg-slate-100 border-slate-200 text-slate-600", icon: XCircle },
}

const runningStatuses = new Set(["pending", "processing"])

const stageMeta: Record<string, { label: string; dot: string }> = {
  created: { label: "任务创建", dot: "bg-slate-400" },
  start: { label: "开始处理", dot: "bg-indigo-400" },
  model: { label: "模型识别", dot: "bg-blue-500" },
  rule_match: { label: "策略匹配", dot: "bg-violet-500" },
  decision: { label: "最终决策", dot: "bg-emerald-500" },
  error: { label: "处理异常", dot: "bg-red-500" },
}

const typeIcon: Record<string, string> = {
  image: "🖼️",
  video: "🎬",
  text: "📄",
}

const ACCEPTED_EXTS = ".jpg,.jpeg,.png,.gif,.bmp,.webp,.tiff,.svg,.mp4,.avi,.mov,.mkv,.wmv,.flv,.webm,.m4v,.txt,.md,.csv,.json,.pdf,.docx"

function detectFileType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || ""
  const imageExts = new Set(["jpg", "jpeg", "png", "gif", "bmp", "webp", "tiff", "svg"])
  const videoExts = new Set(["mp4", "avi", "mov", "mkv", "wmv", "flv", "webm", "m4v"])
  if (imageExts.has(ext)) return "image"
  if (videoExts.has(ext)) return "video"
  return "text"
}

// ─────────────────────────────────────────────
// Single Submit (original logic)
// ─────────────────────────────────────────────
function SingleSubmit() {
  const [contentType, setContentType] = useState("image")
  const [text, setText] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<Task | null>(null)
  const [polling, setPolling] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const pollTimerRef = useRef<number | null>(null)

  const stopPolling = () => {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
    setPolling(false)
  }

  useEffect(() => () => stopPolling(), [])

  const startPolling = (taskId: number) => {
    stopPolling()
    setPolling(true)
    pollTimerRef.current = window.setInterval(async () => {
      try {
        const latest = await fetchTask(taskId)
        setResult(latest)
        if (!runningStatuses.has(latest.status)) stopPolling()
      } catch { stopPolling() }
    }, 1200)
  }

  const handleSubmit = async () => {
    if (contentType === "text" && !text.trim()) return
    if (contentType !== "text" && !file) return
    setSubmitting(true)
    stopPolling()
    setResult(null)
    const fd = new FormData()
    fd.append("content_type", contentType)
    if (contentType === "text") {
      fd.append("content_text", text)
    } else if (file) {
      fd.append("file", file)
    }
    try {
      const task = await createTask(fd)
      setResult(task)
      if (runningStatuses.has(task.status)) startPolling(task.id)
    } finally { setSubmitting(false) }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const parseRules = (s: string): MatchedRule[] => {
    if (!s) return []
    try { return JSON.parse(s) } catch { return [] }
  }
  const parseLogs = (s: string): ProcessLog[] => {
    if (!s) return []
    try { return JSON.parse(s) } catch { return [] }
  }

  const st = result ? statusLabel[result.status] : null
  const logs = result ? parseLogs(result.process_logs) : []

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">内容类型</label>
        <Select value={contentType} onValueChange={(v) => { setContentType(v); setFile(null); setText(""); setResult(null); stopPolling() }}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="image"><span className="flex items-center gap-2"><Image className="w-4 h-4" /> 图片</span></SelectItem>
            <SelectItem value="video"><span className="flex items-center gap-2"><Video className="w-4 h-4" /> 视频</span></SelectItem>
            <SelectItem value="text"><span className="flex items-center gap-2"><FileText className="w-4 h-4" /> 文本</span></SelectItem>
          </SelectContent>
        </Select>
      </div>

      {contentType !== "text" ? (
        <div
          className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors cursor-pointer"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <input ref={inputRef} type="file" accept={contentType === "image" ? "image/*" : "video/*"} className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          {file ? (
            <div className="space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-indigo-100 flex items-center justify-center">
                {contentType === "image" ? <Image className="w-6 h-6 text-indigo-600" /> : <Video className="w-6 h-6 text-indigo-600" />}
              </div>
              <p className="font-medium text-slate-700">{file.name}</p>
              <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-slate-500">点击或拖拽{contentType === "image" ? "图片" : "视频"}到此处上传</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">待审核文本</label>
          <Textarea placeholder="请输入需要审核的文本内容..." value={text} onChange={(e) => setText(e.target.value)} rows={6} className="resize-none" />
        </div>
      )}

      <Button onClick={handleSubmit} disabled={submitting || (contentType === "text" ? !text.trim() : !file)} className="bg-indigo-600 hover:bg-indigo-700 px-8">
        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 提交中...</> : "提交审核"}
      </Button>

      {result && st && (
        <div className={`rounded-xl border p-5 space-y-4 ${st.style}`}>
          <div className="flex items-center gap-2">
            <st.icon className={`w-5 h-5 ${runningStatuses.has(result.status) ? "animate-spin" : ""}`} />
            <span className="font-bold text-base">{st.text}</span>
            {polling && <Badge variant="outline" className="bg-white/70">实时更新中</Badge>}
            <span className="text-xs ml-auto opacity-70">任务 #{result.id}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white/60 rounded-lg p-3">
              <span className="text-xs opacity-60">置信度</span>
              <p className="font-mono font-bold text-lg">{(result.confidence * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <span className="text-xs opacity-60">违规类型</span>
              <p className="font-medium">{result.violation_types || "无"}</p>
            </div>
          </div>
          <div className="bg-white/60 rounded-lg p-3 text-sm">
            <div className="flex items-center gap-2 text-xs opacity-70 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Agent执行时间线
            </div>
            {logs.length === 0 ? (
              <p className="text-slate-500">暂无过程日志</p>
            ) : (
              <div className="space-y-0.5">
                {logs.map((log, i) => {
                  const meta = stageMeta[log.stage] || { label: log.stage || "未知阶段", dot: "bg-slate-400" }
                  const isLast = i === logs.length - 1
                  return (
                    <div key={i} className="relative pl-8 pb-4">
                      {!isLast && <span className="absolute left-[10px] top-5 h-full w-px bg-slate-200" />}
                      <span className={`absolute left-0 top-1.5 h-5 w-5 rounded-full border-2 border-white shadow-sm ${meta.dot}`} />
                      <div className="rounded-md border border-white/70 bg-white/75 p-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-700">{meta.label}</span>
                          <span className="text-xs text-slate-500">{log.time}</span>
                          {isLast && runningStatuses.has(result.status) && (
                            <Badge variant="outline" className="ml-auto text-[10px]">进行中</Badge>
                          )}
                        </div>
                        <p className="mt-1 text-slate-700">{log.message}</p>
                        {log.payload ? (
                          <pre className="mt-2 text-xs bg-slate-900 text-slate-100 rounded p-2 overflow-x-auto">{JSON.stringify(log.payload, null, 2)}</pre>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          {result.risk_description && (
            <div className="bg-white/60 rounded-lg p-3 text-sm">
              <span className="text-xs opacity-60">风险描述</span>
              <p className="mt-1">{result.risk_description}</p>
            </div>
          )}
          {(() => {
            const rules = parseRules(result.matched_rules)
            if (rules.length === 0) return null
            return (
              <div className="bg-white/60 rounded-lg p-3 text-sm">
                <span className="text-xs opacity-60">命中策略规则</span>
                <div className="mt-1 space-y-1">
                  {rules.map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{r.action === "block" ? "拦截" : "复核"}</Badge>
                      <span>{r.name}</span>
                      <span className="ml-auto text-xs opacity-60">相似度 {(r.similarity * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Batch Submit
// ─────────────────────────────────────────────
function BatchSubmit() {
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [batchResult, setBatchResult] = useState<Batch | null>(null)
  const [polling, setPolling] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const pollTimerRef = useRef<number | null>(null)

  const stopPolling = () => {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
    setPolling(false)
  }
  useEffect(() => () => stopPolling(), [])

  const startPolling = (batchId: number) => {
    stopPolling()
    setPolling(true)
    pollTimerRef.current = window.setInterval(async () => {
      try {
        const latest = await fetchBatch(batchId)
        setBatchResult(latest)
        if (latest.pending_count === 0) stopPolling()
      } catch { stopPolling() }
    }, 1500)
  }

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return
    const arr = Array.from(fileList)
    setFiles((prev) => [...prev, ...arr])
  }

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  const handleSubmit = async () => {
    if (files.length === 0) return
    setSubmitting(true)
    stopPolling()
    setBatchResult(null)
    const fd = new FormData()
    files.forEach((f) => fd.append("files", f))
    try {
      const batch = await createBatch(fd)
      setBatchResult(batch)
      if (batch.pending_count > 0) startPolling(batch.id)
    } finally {
      setSubmitting(false)
    }
  }

  const batchStatusStyle = (status: string) =>
    statusLabel[status]?.style || "bg-slate-50 border-slate-200 text-slate-600"
  const batchStatusText = (status: string) =>
    statusLabel[status]?.text || status

  const progress = batchResult
    ? batchResult.total_count > 0
      ? Math.round((batchResult.done_count / batchResult.total_count) * 100)
      : 0
    : 0

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <div
        className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors cursor-pointer"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTS}
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = "" }}
        />
        <FolderUp className="w-10 h-10 mx-auto text-slate-300" />
        <p className="text-slate-500 mt-2">点击或拖拽文件到此处，支持多选</p>
        <p className="text-xs text-slate-400 mt-1">支持图片、视频、文本文件（txt/md/csv/json/pdf/docx）</p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">已选择 {files.length} 个文件</span>
            <Button variant="ghost" size="sm" onClick={() => setFiles([])} className="text-slate-400 hover:text-red-500">
              <Trash2 className="w-3.5 h-3.5 mr-1" /> 清空
            </Button>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50 max-h-[240px] overflow-y-auto">
            {files.map((f, i) => {
              const ft = detectFileType(f.name)
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="text-base">{typeIcon[ft] || "📄"}</span>
                  <span className="flex-1 truncate text-slate-700">{f.name}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">{ft}</Badge>
                  <span className="text-xs text-slate-400 shrink-0">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                  <button onClick={() => removeFile(i)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Button onClick={handleSubmit} disabled={submitting || files.length === 0} className="bg-indigo-600 hover:bg-indigo-700 px-8">
        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 批量提交中...</> : `批量提交审核 (${files.length} 个文件)`}
      </Button>

      {/* Batch result */}
      {batchResult && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center gap-3">
            <FolderUp className="w-5 h-5 text-indigo-500" />
            <span className="font-bold text-slate-800">{batchResult.name}</span>
            {polling && <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200">处理中</Badge>}
            <span className="text-xs text-slate-400 ml-auto">批次 #{batchResult.id}</span>
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span>处理进度</span>
              <span>{batchResult.done_count} / {batchResult.total_count} ({progress}%)</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Summary pills */}
          <div className="flex flex-wrap gap-2">
            {batchResult.pass_count > 0 && (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                <CheckCircle2 className="w-3 h-3 mr-1" /> 通过 {batchResult.pass_count}
              </Badge>
            )}
            {batchResult.block_count > 0 && (
              <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">
                <XCircle className="w-3 h-3 mr-1" /> 拦截 {batchResult.block_count}
              </Badge>
            )}
            {batchResult.review_count > 0 && (
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">
                <Eye className="w-3 h-3 mr-1" /> 待复核 {batchResult.review_count}
              </Badge>
            )}
            {batchResult.error_count > 0 && (
              <Badge className="bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100">
                <XCircle className="w-3 h-3 mr-1" /> 失败 {batchResult.error_count}
              </Badge>
            )}
            {batchResult.pending_count > 0 && (
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" /> 处理中 {batchResult.pending_count}
              </Badge>
            )}
          </div>

          {/* Task list */}
          <div className="bg-slate-50/50 rounded-lg border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium text-xs">文件名</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium text-xs">类型</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium text-xs">状态</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium text-xs">置信度</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium text-xs">违规类型</th>
                </tr>
              </thead>
              <tbody>
                {batchResult.tasks.map((t) => (
                  <tr key={t.id} className="border-t border-slate-100 hover:bg-white/80">
                    <td className="py-2 px-3 text-slate-700 max-w-[200px] truncate" title={t.original_filename}>
                      <span className="mr-1.5">{typeIcon[t.content_type] || "📄"}</span>
                      {t.original_filename || `任务 #${t.id}`}
                    </td>
                    <td className="py-2 px-3">
                      <Badge variant="outline" className="text-[10px]">{t.content_type}</Badge>
                    </td>
                    <td className="py-2 px-3">
                      <Badge variant="outline" className={`text-[10px] ${batchStatusStyle(t.status)}`}>
                        {batchStatusText(t.status)}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 font-mono text-xs">{(t.confidence * 100).toFixed(0)}%</td>
                    <td className="py-2 px-3 text-slate-500 text-xs truncate max-w-[140px]">{t.violation_types || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function SubmitPage() {
  const [mode, setMode] = useState<"single" | "batch">("single")

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">内容提交</h1>
        <p className="text-sm text-slate-500 mt-1">上传图片、视频或输入文本，查看 Agent 的实时审核过程</p>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as "single" | "batch")}>
        <TabsList>
          <TabsTrigger value="single" className="gap-1.5">
            <FileIcon className="w-3.5 h-3.5" /> 单个提交
          </TabsTrigger>
          <TabsTrigger value="batch" className="gap-1.5">
            <FolderUp className="w-3.5 h-3.5" /> 批量提交
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {mode === "single" ? <SingleSubmit /> : <BatchSubmit />}
    </div>
  )
}
