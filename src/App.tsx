import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StudentAttendanceView } from './components/StudentAttendanceView';
import { StudentAssignmentsView } from './components/StudentAssignmentsView';
import { AdminPanel } from './components/AdminPanel';
import { 
  MainTab, 
  AppConfig, 
  AttendanceRecord, 
  Assignment, 
  StudentProfile, 
  GradeEntry 
} from './types';
import { loadLocalState, saveLocalState, FullAppState } from './utils/storage';
import { getTodayShamsi, getCurrentTimeString, toPersianDigits } from './utils/persianDate';
import { APP_VERSION_FA } from './version';

export default function App() {
  const [appState, setAppState] = useState<FullAppState>(() => loadLocalState());
  const [activeTab, setActiveTab] = useState<MainTab>('student-attendance');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('is_admin_logged_in') === 'true';
  });

  const [currentTime, setCurrentTime] = useState<string>(() => getCurrentTimeString());
  const [currentDate, setCurrentDate] = useState<string>(() => getTodayShamsi().dateString);

  // Auto-save whenever state changes
  useEffect(() => {
    saveLocalState(appState);
  }, [appState]);

  // Live Persian clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTimeString());
      setCurrentDate(getTodayShamsi().dateString);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Admin Auth Handlers
  const handleLogin = (pin: string): boolean => {
    if (pin === appState.config.adminPin) {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem('is_admin_logged_in', 'true');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('is_admin_logged_in');
  };

  // Student Attendance Handler
  const handleStudentAttendanceSubmit = (
    studentName: string,
    className: string,
    subject: string
  ) => {
    const today = getTodayShamsi();
    const timeNow = getCurrentTimeString();
    const nowIso = new Date().toISOString();

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      studentName,
      className,
      subject,
      shamsiDate: today.dateString,
      timeString: timeNow,
      timestamp: nowIso,
    };

    setAppState((prev) => {
      // Check if student exists in that class; if not, add them automatically
      const studentExists = prev.students.some(
        (s) => s.name.trim() === studentName.trim() && s.className === className
      );

      const updatedStudents = studentExists
        ? prev.students
        : [
            ...prev.students,
            {
              id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
              name: studentName.trim(),
              className,
              createdAt: nowIso,
            },
          ];

      return {
        ...prev,
        attendance: [newRecord, ...prev.attendance],
        students: updatedStudents,
      };
    });

    return {
      success: true,
      message: 'حضور شما با موفقیت ثبت گردید.',
      date: today.dateString,
      time: timeNow,
    };
  };

  // Assignment Handlers
  const handleCreateAssignment = (
    assData: Omit<Assignment, 'id' | 'createdAt' | 'grades'>
  ) => {
    const newAss: Assignment = {
      ...assData,
      id: `ass-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      grades: {},
    };

    setAppState((prev) => ({
      ...prev,
      assignments: [newAss, ...prev.assignments],
    }));
  };

  const handleUpdateAssignment = (updatedAss: Assignment) => {
    setAppState((prev) => ({
      ...prev,
      assignments: prev.assignments.map((a) => (a.id === updatedAss.id ? updatedAss : a)),
    }));
  };

  const handleDeleteAssignment = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      assignments: prev.assignments.filter((a) => a.id !== id),
    }));
  };

  // Grading Handlers
  const handleSaveGrade = (
    assignmentId: string,
    studentName: string,
    grade: GradeEntry
  ) => {
    setAppState((prev) => ({
      ...prev,
      assignments: prev.assignments.map((a) => {
        if (a.id !== assignmentId) return a;
        return {
          ...a,
          grades: {
            ...a.grades,
            [studentName]: grade,
          },
        };
      }),
    }));
  };

  const handleBatchGrades = (
    assignmentId: string,
    grades: Record<string, GradeEntry>
  ) => {
    setAppState((prev) => ({
      ...prev,
      assignments: prev.assignments.map((a) => {
        if (a.id !== assignmentId) return a;
        return {
          ...a,
          grades: {
            ...a.grades,
            ...grades,
          },
        };
      }),
    }));
  };

  // Student Roster Handlers
  const handleAddStudent = (name: string, className: string, code?: string) => {
    const newSt: StudentProfile = {
      id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      className,
      code: code?.trim(),
      createdAt: new Date().toISOString(),
    };

    setAppState((prev) => ({
      ...prev,
      students: [...prev.students, newSt],
    }));
  };

  const handleDeleteStudent = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      students: prev.students.filter((s) => s.id !== id),
    }));
  };

  // Attendance Records Deletion
  const handleDeleteAttendanceRecord = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      attendance: prev.attendance.filter((r) => r.id !== id),
    }));
  };

  const handleClearAllAttendance = () => {
    setAppState((prev) => ({
      ...prev,
      attendance: [],
    }));
  };

  // Config Update
  const handleUpdateConfig = (newConfig: AppConfig) => {
    setAppState((prev) => ({
      ...prev,
      config: newConfig,
    }));
  };

  // Restore Backup
  const handleRestoreBackup = (parsed: any) => {
    if (parsed && (parsed.config || parsed.students || parsed.attendance)) {
      setAppState({
        config: parsed.config || appState.config,
        students: parsed.students || [],
        attendance: parsed.attendance || [],
        assignments: parsed.assignments || [],
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 font-sans flex flex-col selection:bg-blue-100 selection:text-blue-900">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={appState.config}
        currentTimeString={currentTime}
        currentDateString={currentDate}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'student-attendance' && (
          <StudentAttendanceView
            config={appState.config}
            students={appState.students}
            onSubmitAttendance={handleStudentAttendanceSubmit}
          />
        )}

        {activeTab === 'student-assignments' && (
          <StudentAssignmentsView
            config={appState.config}
            assignments={appState.assignments}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanel
            config={appState.config}
            attendance={appState.attendance}
            assignments={appState.assignments}
            students={appState.students}
            isAdminLoggedIn={isAdminLoggedIn}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onUpdateConfig={handleUpdateConfig}
            onDeleteAttendanceRecord={handleDeleteAttendanceRecord}
            onClearAllAttendance={handleClearAllAttendance}
            onCreateAssignment={handleCreateAssignment}
            onUpdateAssignment={handleUpdateAssignment}
            onDeleteAssignment={handleDeleteAssignment}
            onSaveGrade={handleSaveGrade}
            onBatchGrades={handleBatchGrades}
            onAddStudent={handleAddStudent}
            onDeleteStudent={handleDeleteStudent}
            onRestoreBackup={handleRestoreBackup}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>
              {appState.config.schoolName} • سیستم مدیریت هوشمند کلاس درس
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px] border border-slate-200">
              نسخه {APP_VERSION_FA}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            آماده بارگذاری مستقیم روی GitHub Pages و Netlify • سال تحصیلی {toPersianDigits(appState.config.academicYear)}
          </span>
        </div>
      </footer>
    </div>
  );
}
