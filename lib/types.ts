export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'creative_director' | 'editor' | 'qa';
  created_at: string;
}

export interface Clip {
  id: string;
  name: string;
  example_reel_url: string;
  additional_notes: string | null;
  due_date: string;
  assigned_editor_id: string | null;
  status: 'assigned' | 'in_progress' | 'submitted' | 'in_qa' | 'needs_revision' | 'approved' | 'finished';
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  assigned_editor?: Profile;
  creator?: Profile;
}

export interface Submission {
  id: string;
  clip_id: string;
  editor_id: string;
  round: number;
  drive_file_id: string | null;
  drive_view_link: string | null;
  drive_used_content_link: string | null;
  status: 'pending_qa' | 'approved' | 'needs_revision';
  submitted_at: string;
  // Joined
  clip?: Clip;
  editor?: Profile;
}

export interface QAReview {
  id: string;
  submission_id: string;
  reviewer_id: string;
  is_4k_60fps: boolean;
  is_appropriate_length: boolean;
  is_subtitle_style_correct: boolean;
  is_overall_quality_good: boolean;
  qa_notes: string | null;
  decision: 'approved' | 'needs_revision';
  reviewed_at: string;
  // Joined
  reviewer?: Profile;
  submission?: Submission;
}

export interface FinishedClip {
  id: string;
  clip_id: string;
  submission_id: string;
  final_review_id: string;
  editor_id: string;
  drive_view_link: string;
  used_on: string | null;
  finished_at: string;
  // Joined
  clip?: Clip;
  editor?: Profile;
}

export interface EmployeePortalAccess {
  id: string;
  user_id: string;
  portal_id: string;
  granted_at: string;
  granted_by: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  read: boolean;
  created_at: string;
  link?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

// Scheduling types
export interface Schedule {
  id: string;
  user_id: string;
  day_of_week: number;
  week_start: string;
  created_by: string;
  created_at: string;
}

export interface ScheduleBlock {
  id: string;
  schedule_id: string;
  start_time: string;
  end_time: string;
  label: string;
  is_break: boolean;
}

export interface DailyTask {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null; // null = everyone
  created_by: string;
  created_at: string;
  is_active: boolean;
}

export interface DailyTaskCompletion {
  id: string;
  task_id: string;
  user_id: string;
  completed_date: string;
  completed_at: string;
}

export interface OneTimeTask {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
  created_by: string;
  created_at: string;
}

// Payroll types
export interface PayPeriod {
  id: string;
  start_date: string;
  end_date: string;
  status: 'open' | 'closed';
  created_at: string;
}

export interface EditorCommission {
  id: string;
  pay_period_id: string;
  editor_id: string;
  amount: number;
  note: string | null;
}

export interface PayrollSnapshot {
  id: string;
  pay_period_id: string;
  editor_id: string;
  clip_count: number;
  base_pay: number;
  commission: number;
  total_pay: number;
  created_at: string;
}

export type UserRole = Profile['role'];
export type ClipStatus = Clip['status'];
export type SubmissionStatus = Submission['status'];
export type QADecision = QAReview['decision'];
