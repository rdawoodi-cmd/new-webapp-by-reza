import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StudentPortal } from './components/StudentPortal';
import { AdminPanel } from './components/AdminPanel';
import { ManagerPanel } from './components/ManagerPanel';
import { AppInfoView } from './components/AppInfoView';
import { 
  MainTab, 
  AppConfig, 
  AttendanceRecord, 
  Assignment, 
  StudentProfile, 
  GradeEntry,
  Exam,
  ExamSubmission,
  TeacherAccount
} from './types';
import { loadLocalState, saveLocalState, FullAppState } from './utils/storage';
import { getTodayShamsi, getCurrentTimeString, toPersianDigits } from './utils/persianDate';
import { APP_VERSION_FA } from './version';

export default function App() {
  const [appState, setAppState] = useState<FullAppState>(() => loadLocalState());
  const [activeTab, setActiveTab] = useState<MainTab>('student');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('is_admin_logged_in') === 'true';
  });
  const [isManagerLoggedIn, setIsManagerLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('is_manager_logged_in') === 'true';
  });

  // Logged-in Teacher Account (if logged in as a specific teacher)
  const [currentTeacher, setCurrentTeacher] = useState<TeacherAccount | null>(() => {
    const raw = sessionStorage.getItem('current_teacher_account');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    return null;
  });

  // Active Subject for Teacher Workspace (درس در حال مدیریت دبیر)
  const [activeSubject, setActiveSubject] = useState<string>(() => {
    const saved = localStorage.getItem('teacher_active_subject');
    if (saved && (saved === 'all' || appState.config.subjects.includes(saved))) return saved;
    return appState.config.subjects[0] || 'فرهنگ و هنر';
  });

  const handleSelectActiveSubject = (subj: string) => {
    // If a specific teacher is logged in, restrict changing to other subjects
    if (currentTeacher && subj !== currentTeacher.subject) {
      alert(`دسترسی محدود است: شما به عنوان دبیر درس «${currentTeacher.subject}» وارد شده‌اید و فقط مجاز به مشاهده همین درس هستید.`);
      return;
    }
    setActiveSubject(subj);
    localStorage.setItem('teacher_active_subject', subj);
  };

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

  // Admin / Teacher Auth Handlers
  const handleLogin = (pin: string): boolean => {
    // Check if entered pin belongs to a configured teacher
    const matchingTeacher = appState.config.teachers?.find((t) => t.pin === pin.trim());
    if (matchingTeacher) {
      setIsAdminLoggedIn(true);
      setCurrentTeacher(matchingTeacher);
      sessionStorage.setItem('is_admin_logged_in', 'true');
      sessionStorage.setItem('current_teacher_account', JSON.stringify(matchingTeacher));
      // Restrict activeSubject to this teacher's subject
      setActiveSubject(matchingTeacher.subject);
      localStorage.setItem('teacher_active_subject', matchingTeacher.subject);
      return true;
    }

    // Default admin PIN (gives access to all)
    if (pin === appState.config.adminPin) {
      setIsAdminLoggedIn(true);
      setCurrentTeacher(null);
      sessionStorage.setItem('is_admin_logged_in', 'true');
      sessionStorage.removeItem('current_teacher_account');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setCurrentTeacher(null);
    sessionStorage.removeItem('is_admin_logged_in');
    sessionStorage.removeItem('current_teacher_account');
  };

  // Manager Auth Handlers
  const handleManagerLogin = (pin: string): boolean => {
    const validPin = appState.config.managerPin || '9876';
    if (pin.trim() === validPin.trim()) {
      setIsManagerLoggedIn(true);
      sessionStorage.setItem('is_manager_logged_in', 'true');
      return true;
    }
    return false;
  };

  const handleManagerLogout = () => {
    setIsManagerLoggedIn(false);
    sessionStorage.removeItem('is_manager_logged_in');
  };

  // Student Attendance Handler
  const handleStudentAttendanceSubmit = (
    studentName: string,
    className: string,
    subject: string,
    eitaaId?: string,
    deviceId?: string
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
      eitaaId: eitaaId?.trim() || undefined,
      deviceId: deviceId || undefined,
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
  const handleAddStudent = (
    firstName: string,
    lastName: string,
    className: string,
    code?: string,
    fatherName?: string,
    mobile?: string
  ) => {
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const newSt: StudentProfile = {
      id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: fullName || firstName.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      className,
      code: code?.trim(),
      fatherName: fatherName?.trim(),
      mobile: mobile?.trim(),
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

  // Exam Handlers
  const handleCreateExam = (
    examData: Omit<Exam, 'id' | 'createdAt' | 'submissions'>
  ) => {
    const newExam: Exam = {
      ...examData,
      id: `ex-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      submissions: {},
    };

    setAppState((prev) => ({
      ...prev,
      exams: [newExam, ...(prev.exams || [])],
    }));
  };

  const handleUpdateExam = (updatedExam: Exam) => {
    setAppState((prev) => ({
      ...prev,
      exams: (prev.exams || []).map((e) => (e.id === updatedExam.id ? updatedExam : e)),
    }));
  };

  const handleDeleteExam = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      exams: (prev.exams || []).filter((e) => e.id !== id),
    }));
  };

  const handleGradeSubmission = (
    examId: string,
    studentName: string,
    teacherScore: string,
    teacherFeedback: string
  ) => {
    setAppState((prev) => ({
      ...prev,
      exams: (prev.exams || []).map((ex) => {
        if (ex.id !== examId) return ex;
        const currentSub = ex.submissions[studentName];
        if (!currentSub) return ex;
        return {
          ...ex,
          submissions: {
            ...ex.submissions,
            [studentName]: {
              ...currentSub,
              teacherScore,
              teacherFeedback,
            },
          },
        };
      }),
    }));
  };

  const handleSubmitExam = (examId: string, submission: ExamSubmission) => {
    setAppState((prev) => ({
      ...prev,
      exams: (prev.exams || []).map((ex) => {
        if (ex.id !== examId) return ex;
        return {
          ...ex,
          submissions: {
            ...ex.submissions,
            [submission.studentName]: submission,
          },
        };
      }),
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
        exams: parsed.exams || [],
      });
    }
  };

  const handleUpdateStudents = (updatedStudents: StudentProfile[]) => {
    setAppState((prev) => ({
      ...prev,
      students: updatedStudents,
    }));
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
        isManagerLoggedIn={isManagerLoggedIn}
        activeSubject={activeSubject}
        onSelectActiveSubject={handleSelectActiveSubject}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {(activeTab as any) === 'student' && (
          <StudentPortal
            config={appState.config}
            students={appState.students}
            assignments={appState.assignments}
            exams={appState.exams || []}
            onSubmitAttendance={handleStudentAttendanceSubmit}
            onSubmitExam={handleSubmitExam}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanel
            config={appState.config}
            attendance={appState.attendance}
            assignments={appState.assignments}
            students={appState.students}
            exams={appState.exams || []}
            isAdminLoggedIn={isAdminLoggedIn}
            activeSubject={activeSubject}
            onSelectActiveSubject={handleSelectActiveSubject}
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
            onCreateExam={handleCreateExam}
            onUpdateExam={handleUpdateExam}
            onDeleteExam={handleDeleteExam}
            onGradeSubmission={handleGradeSubmission}
          />
        )}

        {activeTab === 'manager' && (
          <ManagerPanel
            config={appState.config}
            students={appState.students}
            attendance={appState.attendance}
            assignments={appState.assignments}
            exams={appState.exams || []}
            isManagerLoggedIn={isManagerLoggedIn}
            onManagerLogin={handleManagerLogin}
            onManagerLogout={handleManagerLogout}
            onUpdateConfig={handleUpdateConfig}
            onUpdateStudents={handleUpdateStudents}
            onRestoreBackup={handleRestoreBackup}
          />
        )}

        {activeTab === 'app-info' && (
          <AppInfoView
            config={appState.config}
            onNavigateTab={setActiveTab}
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
