export interface User {
  id: string
  display_name?: string
  is_admin: boolean
  credits: number
  blocked: boolean
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface Style {
  id: number
  name: string
  description?: string
  created_at: string
}

export interface ProjectImage {
  id: string
  project_id: string
  user_id: string
  before_path?: string
  after_path?: string
  style_id?: number
  created_at: string
  style?: Style
}

export interface UsageLog {
  id: string
  user_id: string
  project_id?: string
  type: string
  amount: number
  detail?: any
  created_at: string
}
