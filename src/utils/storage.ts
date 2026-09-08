import { AttendanceRecord, Assignment, StudentProfile, AppConfig } from '../types';
import { getInitialConfig, getInitialStudents, getInitialAttendance, getInitialAssignments } from '../data/initialData';

export interface FullAppState {
  config: AppConfig;
  students: StudentProfile[];
  attendance: AttendanceRecord[];
  assignments: Assignment[];
}

const STORAGE_KEY = 'smart_school_manager_v2_9';

export function loadLocalState(): FullAppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        config: getInitialConfig(),
        students: getInitialStudents(),
        attendance: getInitialAttendance(),
        assignments: getInitialAssignments(),
      };
    }
    const parsed = JSON.parse(raw);
    return {
      config: { ...getInitialConfig(), ...(parsed.config || {}) },
      students: parsed.students || getInitialStudents(),
      attendance: parsed.attendance || getInitialAttendance(),
      assignments: parsed.assignments || getInitialAssignments(),
    };
  } catch (err) {
    console.error('Error loading state from localStorage:', err);
    return {
      config: getInitialConfig(),
      students: getInitialStudents(),
      attendance: getInitialAttendance(),
      assignments: getInitialAssignments(),
    };
  }
}

export function saveLocalState(state: FullAppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving state to localStorage:', err);
  }
}

/**
 * خروجی کل اطلاعات سیستم به فرمت JSON جهت پشتیبان‌گیری مطمئن
 */
export function exportBackupJSON(state: FullAppState): void {
  const jsonStr = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const date = new Date().toISOString().split('T')[0];
  a.download = `School_Backup_${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * خروجی اکسل سوابق حضور و غیاب با انکودینگ UTF-8 و کاراکتر BOM برای باز شدن صحیح در اکسل فارسی
 */
export function exportAttendanceToCSV(records: AttendanceRecord[]): void {
  if (records.length === 0) {
    alert('رکوردی برای صدور فایل اکسل موجود نیست.');
    return;
  }

  const headers = ['ردیف', 'نام دانش‌آموز', 'کلاس', 'درس', 'تاریخ شمسی', 'ساعت ثبت', 'یادداشت دبیر'];
  const rows: string[][] = [headers];

  records.forEach((r, idx) => {
    rows.push([
      (idx + 1).toString(),
      r.studentName,
      r.className,
      r.subject,
      r.shamsiDate,
      r.timeString,
      r.notes || '-',
    ]);
  });

  const csvContent =
    '\uFEFF' +
    rows.map((r) => r.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const date = new Date().toISOString().split('T')[0];
  a.download = `حضور_و_غیاب_${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * خروجی اکسل نمرات و تکالیف
 */
export function exportGradesToCSV(assignment: Assignment, students: StudentProfile[]): void {
  const headers = ['ردیف', 'نام دانش‌آموز', 'کلاس', 'عنوان تکلیف', 'نمره', 'نشان', 'نظر دبیر'];
  const rows: string[][] = [headers];

  const targetStudents = students.filter(
    (s) => assignment.className === 'همه کلاس‌ها' || s.className === assignment.className
  );

  targetStudents.forEach((st, idx) => {
    const g = assignment.grades[st.name];
    rows.push([
      (idx + 1).toString(),
      st.name,
      st.className,
      assignment.title,
      g?.score || 'ثبت نشده',
      g?.badge ? (g.badge === 'positive' ? '+ مثبت' : g.badge === 'star' ? 'ستاره' : '- منفی') : '-',
      g?.note || '-',
    ]);
  });

  const csvContent =
    '\uFEFF' +
    rows.map((r) => r.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `نمرات_${assignment.title.replace(/\s+/g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
