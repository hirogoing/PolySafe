import axios from "axios"
import type {
  Task,
  Batch,
  Policy,
  DashboardStats,
  DailyTrend,
  ViolationDist,
  RecentTask,
} from "../types"

const api = axios.create({ baseURL: "/api" })

// ---- Tasks ----
export async function createTask(formData: FormData): Promise<Task> {
  const { data } = await api.post("/tasks/", formData)
  return data
}

export async function fetchTasks(params?: {
  status?: string
  content_type?: string
}): Promise<Task[]> {
  const { data } = await api.get("/tasks/", { params })
  return data
}

export async function fetchTask(id: number): Promise<Task> {
  const { data } = await api.get(`/tasks/${id}`)
  return data
}

export async function reviewTask(
  id: number,
  action: string,
  comment?: string
): Promise<Task> {
  const { data } = await api.post(`/tasks/${id}/review`, { action, comment })
  return data
}

// ---- Batches ----
export async function createBatch(formData: FormData): Promise<Batch> {
  const { data } = await api.post("/batches/", formData)
  return data
}

export async function fetchBatches(): Promise<Batch[]> {
  const { data } = await api.get("/batches/")
  return data
}

export async function fetchBatch(id: number): Promise<Batch> {
  const { data } = await api.get(`/batches/${id}`)
  return data
}

// ---- Policies ----
export async function fetchPolicies(): Promise<Policy[]> {
  const { data } = await api.get("/policies/")
  return data
}

export async function createPolicy(body: {
  name: string
  description: string
  is_active: boolean
  rules: Array<{
    name: string
    description: string
    violation_type: string
    action: string
    priority: number
    is_active: boolean
  }>
}): Promise<Policy> {
  const { data } = await api.post("/policies/", body)
  return data
}

export async function updatePolicy(
  id: number,
  body: {
    name?: string
    description?: string
    is_active?: boolean
    rules?: Array<{
      name: string
      description: string
      violation_type: string
      action: string
      priority: number
      is_active: boolean
    }>
  }
): Promise<Policy> {
  const { data } = await api.put(`/policies/${id}`, body)
  return data
}

export async function deletePolicy(id: number): Promise<void> {
  await api.delete(`/policies/${id}`)
}

// ---- Dashboard ----
export async function fetchStats(): Promise<DashboardStats> {
  const { data } = await api.get("/dashboard/stats")
  return data
}

export async function fetchTrend(days?: number): Promise<DailyTrend[]> {
  const { data } = await api.get("/dashboard/trend", { params: { days } })
  return data
}

export async function fetchViolations(): Promise<ViolationDist[]> {
  const { data } = await api.get("/dashboard/violations")
  return data
}

export async function fetchRecent(limit?: number): Promise<RecentTask[]> {
  const { data } = await api.get("/dashboard/recent", { params: { limit } })
  return data
}
