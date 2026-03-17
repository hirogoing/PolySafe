export interface Task {
  id: number
  batch_id?: number | null
  original_filename: string
  content_type: string
  content_url: string
  content_text: string
  status: string
  ai_result: string
  matched_rules: string
  confidence: number
  violation_types: string
  risk_description: string
  review_comment: string
  process_logs: string
  created_at: string
  updated_at: string
}

export interface BatchTask {
  id: number
  original_filename: string
  content_type: string
  status: string
  confidence: number
  violation_types: string
  risk_description: string
  created_at: string
}

export interface Batch {
  id: number
  name: string
  total_count: number
  created_at: string
  updated_at: string
  tasks: BatchTask[]
  pass_count: number
  block_count: number
  review_count: number
  error_count: number
  pending_count: number
  done_count: number
}

export interface Rule {
  id: number
  policy_id: number
  name: string
  description: string
  violation_type: string
  action: string
  priority: number
  is_active: boolean
}

export interface Policy {
  id: number
  name: string
  description: string
  is_active: boolean
  created_at: string
  rules: Rule[]
}

export interface DashboardStats {
  total: number
  pass_count: number
  block_count: number
  review_count: number
  error_count: number
  pass_rate: number
  block_rate: number
}

export interface DailyTrend {
  date: string
  total: number
  pass_count: number
  block_count: number
  review_count: number
}

export interface ViolationDist {
  type: string
  count: number
}

export interface RecentTask {
  id: number
  content_type: string
  status: string
  confidence: number
  violation_types: string
  created_at: string
}

export interface MatchedRule {
  id: number
  name: string
  action: string
  similarity: number
}
