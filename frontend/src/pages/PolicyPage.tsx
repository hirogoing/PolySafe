import { useEffect, useState } from "react"
import { fetchPolicies, createPolicy, updatePolicy, deletePolicy } from "../lib/api"
import type { Policy } from "../types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Plus, Pencil, Trash2, Shield, X } from "lucide-react"

interface RuleForm {
  name: string; description: string; violation_type: string; action: string; priority: number; is_active: boolean
}

const emptyRule: RuleForm = { name: "", description: "", violation_type: "其他", action: "block", priority: 0, is_active: true }

const violationTypes = ["色情", "暴力", "仇恨言论", "垃圾广告", "违法违规", "其他"]

export default function PolicyPage() {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [editing, setEditing] = useState<Policy | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", is_active: true })
  const [rules, setRules] = useState<RuleForm[]>([])

  const load = () => fetchPolicies().then(setPolicies)
  useEffect(() => { load() }, [])

  const openNew = () => {
    setIsNew(true)
    setEditing(null)
    setForm({ name: "", description: "", is_active: true })
    setRules([{ ...emptyRule }])
  }

  const openEdit = (p: Policy) => {
    setIsNew(false)
    setEditing(p)
    setForm({ name: p.name, description: p.description, is_active: p.is_active })
    setRules(p.rules.map((r) => ({
      name: r.name, description: r.description, violation_type: r.violation_type,
      action: r.action, priority: r.priority, is_active: r.is_active,
    })))
  }

  const close = () => { setEditing(null); setIsNew(false) }

  const save = async () => {
    if (!form.name.trim()) return
    const body = { ...form, rules }
    if (isNew) {
      await createPolicy(body)
    } else if (editing) {
      await updatePolicy(editing.id, body)
    }
    close()
    load()
  }

  const handleDelete = async (id: number) => {
    await deletePolicy(id)
    load()
  }

  const updateRule = (idx: number, patch: Partial<RuleForm>) => {
    setRules((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">策略管理</h1>
          <p className="text-sm text-slate-500 mt-1">配置审核策略和规则，策略变更后自动更新FAISS语义索引</p>
        </div>
        <Button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-1" /> 新建策略
        </Button>
      </div>

      {/* Policy Cards */}
      <div className="grid grid-cols-2 gap-4">
        {policies.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{p.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{p.rules.length} 条规则</p>
                </div>
              </div>
              <Badge variant={p.is_active ? "default" : "secondary"} className={p.is_active ? "bg-emerald-100 text-emerald-700" : ""}>
                {p.is_active ? "已启用" : "已禁用"}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-3 line-clamp-2">{p.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {p.rules.slice(0, 4).map((r) => (
                <Badge key={r.id} variant="outline" className="text-xs">
                  {r.name}
                </Badge>
              ))}
              {p.rules.length > 4 && <Badge variant="outline" className="text-xs text-slate-400">+{p.rules.length - 4}</Badge>}
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t border-slate-50">
              <Button variant="ghost" size="sm" onClick={() => openEdit(p)} className="text-indigo-600">
                <Pencil className="w-3.5 h-3.5 mr-1" /> 编辑
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700">
                <Trash2 className="w-3.5 h-3.5 mr-1" /> 删除
              </Button>
            </div>
          </div>
        ))}
        {policies.length === 0 && (
          <div className="col-span-2 text-center py-20 text-slate-400">暂无策略，请点击"新建策略"添加</div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isNew || !!editing} onOpenChange={close}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? "新建策略" : "编辑策略"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">策略名称</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：色情内容审核策略" />
              </div>
              <div className="flex items-end gap-3 pb-0.5">
                <label className="text-sm text-slate-600">启用</label>
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">策略描述</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="描述该策略的审核范围和目的" />
            </div>

            {/* Rules */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-700">审核规则</label>
                <Button variant="outline" size="sm" onClick={() => setRules([...rules, { ...emptyRule }])}>
                  <Plus className="w-3 h-3 mr-1" /> 添加规则
                </Button>
              </div>
              <div className="space-y-3">
                {rules.map((r, idx) => (
                  <div key={idx} className="bg-slate-50 rounded-lg p-3 space-y-2 relative">
                    <button onClick={() => setRules(rules.filter((_, i) => i !== idx))} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-3 gap-2">
                      <Input placeholder="规则名称" value={r.name} onChange={(e) => updateRule(idx, { name: e.target.value })} className="text-sm" />
                      <Select value={r.violation_type} onValueChange={(v) => updateRule(idx, { violation_type: v })}>
                        <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {violationTypes.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={r.action} onValueChange={(v) => updateRule(idx, { action: v })}>
                        <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="block">拦截</SelectItem>
                          <SelectItem value="review">人工复核</SelectItem>
                          <SelectItem value="pass">放行</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Input placeholder="规则描述（用于FAISS语义匹配）" value={r.description} onChange={(e) => updateRule(idx, { description: e.target.value })} className="text-sm" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={close}>取消</Button>
              <Button onClick={save} className="bg-indigo-600 hover:bg-indigo-700">保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
