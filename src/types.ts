export type Role = 'student' | 'admin';

export type MainTab = 'student-attendance' | 'student-assignments' | 'admin';

export type AdminSubTab = 'attendance' | 'assignments' | 'grades' | 'students' | 'toolkit' | 'settings';

export interface AttendanceRecord {
  id: string;
  studentName: string;
  className: string;
  subject: string;
  shamsiDate: string;
  timeString: string;
  timestamp: string; // ISO string
  notes?: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  className: string;
  code?: string;
  notes?: string;
  createdAt: string;
}

export interface GradeEntry {
  score: string; // "19.5" or "خیلی خوب"
  scoreType: 'numeric' | 'qualitative';
  badge?: '' | 'positive' | 'negative' | 'star';
  note?: string;
  updatedAt?: string;
}

export interface Assignment {
  id: string;
  title: string;
  className: string; // "همه کلاس‌ها" or specific class
  subject: string;
  description: string;
  shamsiDate: string;
  createdAt: string;
  fileName?: string;
  fileSize?: string;
  fileData?: string; // Data URL or storage link
  fileType?: string;
  gradingType: 'numeric' | 'qualitative';
  gradesPublished: boolean;
  grades: Record<string, GradeEntry>; // studentName -> GradeEntry
}

export interface AppConfig {
  adminPin: string; // default "1234"
  schoolName: string;
  teacherName: string;
  academicYear: string;
  classes: string[]; // default: ['هفتم الف', 'هفتم ب', 'هشتم الف', 'هشتم ب', 'نهم الف', 'نهم ب']
  subjects: string[]; // default: ['فرهنگ و هنر', 'ریاضی', 'علوم تجربی', 'ادبیات فارسی', 'زبان انگلیسی', 'پیام‌های آسمان']
  storageMode: 'local' | 'supabase';
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}
