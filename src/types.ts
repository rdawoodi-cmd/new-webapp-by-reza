export type Role = 'student' | 'admin';

export type MainTab = 'student-attendance' | 'student-assignments' | 'admin' | 'app-info';

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
  eitaaId?: string; // حساب یا شناسه ایتا / شماره همراه
  deviceId?: string; // شناسه منحصر‌به‌فرد دستگاه/گوشی
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

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: [string, string, string, string]; // ۴ گزینه تستی
  correctOptionIndex: number; // ۰، ۱، ۲ یا ۳
  explanation?: string;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  studentName: string;
  className: string;
  submittedAt: string;
  timeSpentSeconds?: number;
  eitaaId?: string; // حساب یا شناسه ایتا / شماره همراه
  deviceId?: string; // شناسه منحصر‌به‌فرد دستگاه/گوشی
  // برای آزمون تشریحی:
  photoAnswer?: string; // تصویر برگه دست‌نویس دانش‌آموز (Data URL)
  photoAnswerName?: string;
  teacherScore?: string;
  teacherFeedback?: string;
  // برای آزمون تستی چند گزینه‌ای:
  selectedOptions?: Record<string, number>; // questionId -> selectedIndex
  scorePercent?: number; // درصد نمره (۰ تا ۱۰۰)
  correctCount?: number;
  wrongCount?: number;
  unansweredCount?: number;
}

export interface Exam {
  id: string;
  title: string;
  type: 'descriptive' | 'multiple-choice'; // تشریحی با ارسال عکس یا تستی چند گزینه‌ای
  className: string; // 'همه کلاس‌ها' یا کلاس مشخص
  subject: string;
  description: string;
  durationMinutes: number; // تایمر زمان آزمون به دقیقه
  isActive: boolean; // فعال بودن برای دانش‌آموزان
  shamsiDate: string;
  createdAt: string;
  // فایل سوالات تشریحی (آپلود شده توسط دبیر):
  fileName?: string;
  fileSize?: string;
  fileData?: string; // عکس برگه امتحانی یا PDF
  fileType?: string;
  // سوالات تستی:
  questions?: QuizQuestion[];
  // پاسخ‌های ثبت شده دانش‌آموزان:
  submissions: Record<string, ExamSubmission>; // studentName -> ExamSubmission
}

