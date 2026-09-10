import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  UserCheck, 
  BookOpen, 
  PenTool, 
  Users, 
  Wrench, 
  Settings as SettingsIcon, 
  Download, 
  Printer, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  X, 
  Search, 
  Upload, 
  Sparkles, 
  Star, 
  Eye, 
  EyeOff, 
  FileSpreadsheet, 
  Dices, 
  Timer, 
  Play, 
  Pause, 
  RotateCcw,
  Check,
  Globe,
  HardDrive,
  GitBranch,
  ExternalLink,
  FileQuestion,
  Smartphone,
  ShieldAlert
} from 'lucide-react';
import { 
  AttendanceRecord, 
  Assignment, 
  StudentProfile, 
  AppConfig, 
  AdminSubTab, 
  GradeEntry,
  Exam
} from '../types';
import { toPersianDigits, getTodayShamsi } from '../utils/persianDate';
import { exportAttendanceToCSV, exportGradesToCSV, exportBackupJSON } from '../utils/storage';
import { sounds } from '../utils/sound';
import { APP_VERSION, APP_VERSION_FA, APP_BUILD_DATE_FA, APP_BUILD_NOTES } from '../version';
import confetti from 'canvas-confetti';
import { ExamManager } from './ExamManager';

interface AdminPanelProps {
  config: AppConfig;
  attendance: AttendanceRecord[];
  assignments: Assignment[];
  students: StudentProfile[];
  exams?: Exam[];
  isAdminLoggedIn: boolean;
  activeSubject?: string;
  onSelectActiveSubject?: (subj: string) => void;
  onLogin: (pin: string) => boolean;
  onLogout: () => void;
  onUpdateConfig: (newConfig: AppConfig) => void;
  onDeleteAttendanceRecord: (id: string) => void;
  onClearAllAttendance: () => void;
  onCreateAssignment: (ass: Omit<Assignment, 'id' | 'createdAt' | 'grades'>) => void;
  onUpdateAssignment: (ass: Assignment) => void;
  onDeleteAssignment: (id: string) => void;
  onSaveGrade: (assignmentId: string, studentName: string, grade: GradeEntry) => void;
  onBatchGrades: (assignmentId: string, grades: Record<string, GradeEntry>) => void;
  onAddStudent: (firstName: string, lastName: string, className: string, code?: string) => void;
  onDeleteStudent: (id: string) => void;
  onRestoreBackup: (jsonData: any) => void;
  onCreateExam?: (exam: Omit<Exam, 'id' | 'createdAt' | 'submissions'>) => void;
  onUpdateExam?: (exam: Exam) => void;
  onDeleteExam?: (id: string) => void;
  onGradeSubmission?: (examId: string, studentName: string, teacherScore: string, teacherFeedback: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  config,
  attendance,
  assignments,
  students,
  isAdminLoggedIn,
  activeSubject: propActiveSubject,
  onSelectActiveSubject,
  onLogin,
  onLogout,
  onUpdateConfig,
  onDeleteAttendanceRecord,
  onClearAllAttendance,
  onCreateAssignment,
  onUpdateAssignment,
  onDeleteAssignment,
  onSaveGrade,
  onBatchGrades,
  onAddStudent,
  onDeleteStudent,
  onRestoreBackup,
  exams = [],
  onCreateExam,
  onUpdateExam,
  onDeleteExam,
  onGradeSubmission,
}) => {
  // Login State
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Sub Tab
  const [subTab, setSubTab] = useState<AdminSubTab>('attendance');

  // Active Subject Selection for Teacher Desk (انتخاب درس در حال مدیریت دبیر)
  const [activeSubject, setActiveSubject] = useState<string>(() => {
    if (propActiveSubject) return propActiveSubject;
    const saved = localStorage.getItem('teacher_active_subject');
    if (saved && (saved === 'all' || config.subjects.includes(saved))) return saved;
    return config.subjects[0] || 'فرهنگ و هنر';
  });

  useEffect(() => {
    if (propActiveSubject !== undefined && propActiveSubject !== activeSubject) {
      setActiveSubject(propActiveSubject);
      if (propActiveSubject !== 'all') {
        setAssSubject(propActiveSubject);
      }
    }
  }, [propActiveSubject]);

  const handleSelectActiveSubject = (subj: string) => {
    setActiveSubject(subj);
    localStorage.setItem('teacher_active_subject', subj);
    if (onSelectActiveSubject) {
      onSelectActiveSubject(subj);
    }
    if (subj !== 'all') {
      setAssSubject(subj);
    }
  };

  // Attendance Sub-Tab States
  const [attSearch, setAttSearch] = useState('');
  const [attClassFilter, setAttClassFilter] = useState('all');

  // Assignment Form States
  const [editAssId, setEditAssId] = useState<string | null>(null);
  const [deletingAss, setDeletingAss] = useState<Assignment | null>(null);
  const [showClearAttendanceModal, setShowClearAttendanceModal] = useState(false);
  const [assTitle, setAssTitle] = useState('');
  const [assClass, setAssClass] = useState('همه کلاس‌ها');
  const [assSubject, setAssSubject] = useState(config.subjects[0] || 'فرهنگ و هنر');
  const [assDesc, setAssDesc] = useState('');
  const [assGradingType, setAssGradingType] = useState<'numeric' | 'qualitative'>('numeric');
  const [assFile, setAssFile] = useState<{ name: string; size: string; type: string; data: string } | null>(null);
  const [assignmentNotice, setAssignmentNotice] = useState<{
    type: 'success' | 'info';
    title: string;
    desc: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Grading Tab States
  const [selectedAssId, setSelectedAssId] = useState<string>(assignments[0]?.id || '');
  const [selectedStudentForGrading, setSelectedStudentForGrading] = useState('');
  const [gradeScore, setGradeScore] = useState('');
  const [gradeBadge, setGradeBadge] = useState<'' | 'positive' | 'negative' | 'star'>('');
  const [gradeNote, setGradeNote] = useState('');

  // Students Tab States
  const [stuClassFilter, setStuClassFilter] = useState(config.classes[0] || 'هفتم الف');
  const [newStuFirstName, setNewStuFirstName] = useState('');
  const [newStuLastName, setNewStuLastName] = useState('');
  const [newStuCode, setNewStuCode] = useState('');
  const [bulkStuText, setBulkStuText] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [isExtractingAI, setIsExtractingAI] = useState(false);
  const aiFileInputRef = useRef<HTMLInputElement | null>(null);

  // Toolkit States: Random Picker
  const [pickerClass, setPickerClass] = useState(config.classes[0] || 'هفتم الف');
  const [isPicking, setIsPicking] = useState(false);
  const [pickedStudent, setPickedStudent] = useState<StudentProfile | null>(null);

  // Toolkit States: Timer
  const [timerMinutes, setTimerMinutes] = useState(15);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(15 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Settings Tab States
  const [newPin, setNewPin] = useState(config.adminPin);
  const [newSchoolName, setNewSchoolName] = useState(config.schoolName);
  const [newTeacherName, setNewTeacherName] = useState(config.teacherName);
  const [newAcademicYear, setNewAcademicYear] = useState(config.academicYear);
  const [newClassNameInput, setNewClassNameInput] = useState('');
  const [newSubjectNameInput, setNewSubjectNameInput] = useState('');
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

  // Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (timerSecondsLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      sounds.playTimerAlarm();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSecondsLeft]);

  // Auto-switch selected assignment when activeSubject changes
  useEffect(() => {
    if (activeSubject !== 'all') {
      const match = assignments.find((a) => a.subject === activeSubject);
      if (match) {
        setSelectedAssId(match.id);
      }
    }
  }, [activeSubject, assignments]);

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLogin(pinInput);
    if (success) {
      setLoginError('');
      setPinInput('');
    } else {
      setLoginError('رمز عبور وارد شده نادرست است.');
    }
  };

  // If not logged in, show login card
  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 text-center space-y-5">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-lg font-extrabold text-slate-800">ورود به پنل مدیریت دبیر</h2>
            <p className="text-xs text-slate-500 mt-1">
              لطفاً رمز عبور خود را وارد نمایید. (رمز پیش‌فرض: <span className="font-mono font-bold text-blue-600">1234</span>)
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                required
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="رمز عبور"
                className="w-full text-center text-lg font-mono font-bold tracking-widest px-4 py-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-blue-600"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              تایید و ورود به پنل
            </button>
          </form>

          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            💡 امکان تغییر رمز عبور در تب تنظیمات پنل دبیر وجود دارد.
          </p>
        </div>
      </div>
    );
  }

  // Filter Assignments by Active Subject
  const subjectAssignments = assignments.filter((a) => {
    if (activeSubject !== 'all' && a.subject !== activeSubject) return false;
    return true;
  });

  // Active Assignment for Grading
  const activeAss = subjectAssignments.find((a) => a.id === selectedAssId) || subjectAssignments[0];

  // Filter Attendance by search, class, and activeSubject
  const filteredAttendance = attendance.filter((r) => {
    const matchesSearch = 
      r.studentName.includes(attSearch) || 
      r.subject.includes(attSearch) || 
      (r.eitaaId && r.eitaaId.includes(attSearch));
    const matchesClass = attClassFilter === 'all' || r.className === attClassFilter;
    const matchesSubject = activeSubject === 'all' || r.subject === activeSubject;
    return matchesSearch && matchesClass && matchesSubject;
  });

  // Identify duplicate Eitaa IDs or Device IDs across filtered attendance (especially multiple names per ID)
  const attEitaaCounts = new Map<string, number>();
  const attDeviceCounts = new Map<string, number>();
  const attEitaaToNames = new Map<string, Set<string>>();
  const attDeviceToNames = new Map<string, Set<string>>();

  filteredAttendance.forEach((r) => {
    const studentClean = r.studentName.trim();
    if (r.eitaaId && r.eitaaId.trim()) {
      const key = r.eitaaId.trim().toLowerCase();
      attEitaaCounts.set(key, (attEitaaCounts.get(key) || 0) + 1);
      if (!attEitaaToNames.has(key)) {
        attEitaaToNames.set(key, new Set());
      }
      attEitaaToNames.get(key)!.add(studentClean);
    }
    if (r.deviceId && r.deviceId.trim()) {
      const key = r.deviceId.trim();
      attDeviceCounts.set(key, (attDeviceCounts.get(key) || 0) + 1);
      if (!attDeviceToNames.has(key)) {
        attDeviceToNames.set(key, new Set());
      }
      attDeviceToNames.get(key)!.add(studentClean);
    }
  });

  // Handle File Attachment for Assignment
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 3MB max for fast offline base64
    if (file.size > 3 * 1024 * 1024) {
      alert('حجم فایل نباید بیش از ۳ مگابایت باشد تا سرعت برنامه افت نکند.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAssFile({
        name: file.name,
        size: (file.size / 1024).toFixed(0) + ' KB',
        type: file.type,
        data: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assTitle.trim()) return;

    const today = getTodayShamsi();
    const savedTitle = assTitle.trim();
    const savedClass = assClass;

    if (editAssId) {
      const existing = assignments.find((a) => a.id === editAssId);
      if (existing) {
        onUpdateAssignment({
          ...existing,
          title: savedTitle,
          className: assClass,
          subject: assSubject,
          description: assDesc.trim(),
          gradingType: assGradingType,
          fileName: assFile ? assFile.name : existing.fileName,
          fileSize: assFile ? assFile.size : existing.fileSize,
          fileData: assFile ? assFile.data : existing.fileData,
          fileType: assFile ? assFile.type : existing.fileType,
        });
      }
      setEditAssId(null);
      setAssignmentNotice({
        type: 'success',
        title: 'تغییرات تکلیف با موفقیت ذخیره شد',
        desc: `تکلیف «${savedTitle}» با موفقیت به‌روزرسانی و ذخیره گردید.`
      });
    } else {
      onCreateAssignment({
        title: savedTitle,
        className: assClass,
        subject: assSubject,
        description: assDesc.trim(),
        shamsiDate: today.dateString,
        gradingType: assGradingType,
        gradesPublished: false,
        fileName: assFile?.name,
        fileSize: assFile?.size,
        fileData: assFile?.data,
        fileType: assFile?.type,
      });
      setAssignmentNotice({
        type: 'success',
        title: 'تکلیف با موفقیت ارسال و منتشر شد!',
        desc: `تکلیف «${savedTitle}» برای کلاس (${savedClass}) ثبت گردید و اکنون دانش‌آموزان می‌توانند آن را در تب تکالیف مشاهده کنند.`
      });
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (err) {}
    }

    setAssTitle('');
    setAssDesc('');
    setAssFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Auto-dismiss notice after 8 seconds
    setTimeout(() => {
      setAssignmentNotice((curr) => (curr?.title.includes(savedTitle) ? null : curr));
    }, 8000);
  };

  const startEditAss = (ass: Assignment) => {
    setEditAssId(ass.id);
    setAssTitle(ass.title);
    setAssClass(ass.className);
    setAssSubject(ass.subject);
    setAssDesc(ass.description);
    setAssGradingType(ass.gradingType);
    if (ass.fileName && ass.fileData) {
      setAssFile({
        name: ass.fileName,
        size: ass.fileSize || '',
        type: ass.fileType || '',
        data: ass.fileData,
      });
    } else {
      setAssFile(null);
    }
  };

  // Grading Save Handler
  const handleSaveSingleGrade = () => {
    if (!activeAss || !selectedStudentForGrading) return;
    onSaveGrade(activeAss.id, selectedStudentForGrading, {
      score: gradeScore,
      scoreType: activeAss.gradingType,
      badge: gradeBadge,
      note: gradeNote.trim(),
      updatedAt: new Date().toISOString(),
    });

    sounds.playCheer();
    setSelectedStudentForGrading('');
    setGradeScore('');
    setGradeBadge('');
    setGradeNote('');
  };

  // Quick fill full score
  const handleQuickFillFullScores = () => {
    if (!activeAss) return;
    const targetStudents = students.filter(
      (s) => activeAss.className === 'همه کلاس‌ها' || s.className === activeAss.className
    );
    if (targetStudents.length === 0) return;

    const fullScores: Record<string, GradeEntry> = {};
    targetStudents.forEach((st) => {
      fullScores[st.name] = {
        score: activeAss.gradingType === 'numeric' ? '۲۰' : 'خیلی خوب',
        scoreType: activeAss.gradingType,
        badge: 'positive',
        note: 'عملکرد بسیار خوب و کامل',
        updatedAt: new Date().toISOString(),
      };
    });

    onBatchGrades(activeAss.id, fullScores);
    try {
      confetti({ particleCount: 60, spread: 70 });
    } catch {}
    sounds.playCheer();
  };

  // Random Student Picker
  const handlePickRandomStudent = () => {
    const classPool = students.filter((s) => s.className === pickerClass);
    if (classPool.length === 0) {
      alert('دانش‌آموزی در این کلاس یافت نشد.');
      return;
    }

    setIsPicking(true);
    let counter = 0;
    const interval = setInterval(() => {
      const randIdx = Math.floor(Math.random() * classPool.length);
      setPickedStudent(classPool[randIdx]);
      sounds.playTick();
      counter++;
      if (counter > 15) {
        clearInterval(interval);
        setIsPicking(false);
        sounds.playCheer();
        try {
          confetti({ particleCount: 40, spread: 50 });
        } catch {}
      }
    }, 100);
  };

  // Handle Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig({
      ...config,
      adminPin: newPin.trim() || '1234',
      schoolName: newSchoolName.trim(),
      teacherName: newTeacherName.trim(),
      academicYear: newAcademicYear.trim(),
    });
    setSettingsSavedMsg(true);
    setTimeout(() => setSettingsSavedMsg(false), 3000);
  };

  const handleAddClass = () => {
    const name = newClassNameInput.trim();
    if (!name || config.classes.includes(name)) return;
    onUpdateConfig({
      ...config,
      classes: [...config.classes, name],
    });
    setNewClassNameInput('');
  };

  const handleRemoveClass = (clsName: string) => {
    if (config.classes.length <= 1) {
      alert('حداقل باید یک کلاس تعریف شده باشد.');
      return;
    }
    onUpdateConfig({
      ...config,
      classes: config.classes.filter((c) => c !== clsName),
    });
  };

  const handleAddSubject = () => {
    const name = newSubjectNameInput.trim();
    if (!name || config.subjects.includes(name)) return;
    onUpdateConfig({
      ...config,
      subjects: [...config.subjects, name],
    });
    setNewSubjectNameInput('');
  };

  const handleRemoveSubject = (subName: string) => {
    if (config.subjects.length <= 1) {
      alert('حداقل باید یک درس تعریف شده باشد.');
      return;
    }
    onUpdateConfig({
      ...config,
      subjects: config.subjects.filter((s) => s !== subName),
    });
  };

  const handleAIFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingAI(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const mimeType = file.type;

          const response = await fetch('/api/extract-students', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fileData: base64Data,
              mimeType
            })
          });

          if (!response.ok) {
            throw new Error('خطا در پردازش فایل توسط هوش مصنوعی');
          }

          const data = await response.json();
          if (data.students && Array.isArray(data.students)) {
            // data.students = [{firstName, lastName}, ...]
            const formatted = data.students
              .filter((s: any) => s.firstName || s.lastName)
              .map((s: any) => {
                const f = (s.firstName || '').trim();
                const l = (s.lastName || '').trim();
                return `${f} ${l}`.trim();
              })
              .join('\n');
            
            setBulkStuText(prev => prev ? prev + '\n' + formatted : formatted);
            setShowBulkAdd(true);
          }
        } catch (err) {
          console.error(err);
          alert('هوش مصنوعی نتوانست فایل را پردازش کند. لطفاً فرمت دیگری را امتحان کنید یا متن را کپی کنید.');
        } finally {
          setIsExtractingAI(false);
          if (aiFileInputRef.current) aiFileInputRef.current.value = '';
        }
      };
      reader.onerror = () => {
        alert('خطا در خواندن فایل');
        setIsExtractingAI(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert('خطا در برقراری ارتباط با سرور');
      setIsExtractingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* سربرگ پنل دبیر و سوییچ تب‌ها */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">میز کار و کنترل دبیر</h2>
              <p className="text-xs text-slate-500">
                مدیریت حضور و غیاب، طراحی و نمره‌دهی تکالیف، ابزارهای کلاسی و استقرار
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onLogout}
              className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
            >
              خروج از پنل
            </button>
          </div>
        </div>

        {/* نمایش درس در حال مدیریت دبیر (انتخاب شده از منوی بالای پنل) */}
        <div className="my-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-slate-700">درس در حال مدیریت:</span>
              <span className="font-extrabold text-blue-800 bg-blue-100/90 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                {activeSubject === 'all' ? 'همه درس‌ها' : `درس ${activeSubject}`}
              </span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            (تغییر درس از منوی کشویی کنار دکمه پنل دبیر در بالای صفحه)
          </span>
        </div>

        {/* ساب‌تب‌های پنل مدیریت */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 scrollbar-none">
          {[
            { id: 'attendance', label: 'سوابق حضور', icon: <UserCheck className="w-4 h-4" /> },
            { id: 'assignments', label: 'تکالیف', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'grades', label: 'نمرات و بازخورد تکالیف', icon: <PenTool className="w-4 h-4" /> },
            { id: 'students', label: 'لیست دانش‌آموزان', icon: <Users className="w-4 h-4" /> },
            { id: 'toolkit', label: 'پنل آزمون‌ها', icon: <FileQuestion className="w-4 h-4" /> },
            { id: 'settings', label: 'تنظیمات و استقرار', icon: <SettingsIcon className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as AdminSubTab)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                subTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ۱. تب سوابق حضور و غیاب */}
      {subTab === 'attendance' && (
        <div className="space-y-4">
          {/* کارت‌های آمار سریع */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">
                  {activeSubject === 'all' ? 'کل رکوردهای حضور' : `رکوردهای حضور (${activeSubject})`}
                </span>
                <p className="text-2xl font-black text-blue-600 mt-1">
                  {toPersianDigits(
                    attendance.filter((r) => activeSubject === 'all' || r.subject === activeSubject).length
                  )}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">دانش‌آموزان ثبت‌شده</span>
                <p className="text-2xl font-black text-emerald-600 mt-1">{toPersianDigits(students.length)}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">حاضرین امروز {activeSubject !== 'all' ? `(${activeSubject})` : ''}</span>
                <p className="text-2xl font-black text-amber-600 mt-1">
                  {toPersianDigits(
                    attendance.filter(
                      (r) =>
                        r.shamsiDate === getTodayShamsi().dateString &&
                        (activeSubject === 'all' || r.subject === activeSubject)
                    ).length
                  )}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* فیلترها و دکمه‌های اکشن */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="جستجوی نام یا شناسه ایتا..."
                  value={attSearch}
                  onChange={(e) => setAttSearch(e.target.value)}
                  className="w-full text-xs pr-9 pl-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-blue-600"
                />
              </div>

              <select
                value={attClassFilter}
                onChange={(e) => setAttClassFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 cursor-pointer"
              >
                <option value="all">همه کلاس‌ها</option>
                {config.classes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => exportAttendanceToCSV(attendance.filter((r) => activeSubject === 'all' || r.subject === activeSubject))}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>خروجی اکسل (CSV)</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">چاپ</span>
              </button>

              <button
                onClick={() => setShowClearAttendanceModal(true)}
                className="flex items-center gap-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 px-2.5 py-2 rounded-xl transition-colors cursor-pointer"
                title="پاکسازی تمام سوابق"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* جدول سوابق حضور */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3 px-3 w-12 text-center">ردیف</th>
                    <th className="py-3 px-4">نام دانش‌آموز</th>
                    <th className="py-3 px-4">کلاس</th>
                    <th className="py-3 px-4">درس</th>
                    <th className="py-3 px-4">تاریخ شمسی</th>
                    <th className="py-3 px-4">ساعت ثبت</th>
                    <th className="py-3 px-4">حساب ایتا / شناسه دستگاه</th>
                    <th className="py-3 px-4 w-16 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400">
                        رکوردی برای نمایش وجود ندارد
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((r, idx) => {
                      const eitaaKey = r.eitaaId?.trim().toLowerCase();
                      const eitaaNames = eitaaKey ? attEitaaToNames.get(eitaaKey) : undefined;
                      const isMultiStudentEitaa = !!(eitaaNames && eitaaNames.size > 1);
                      const isEitaaDup = !!(eitaaKey && (attEitaaCounts.get(eitaaKey) || 0) > 1);

                      const devKey = r.deviceId?.trim();
                      const devNames = devKey ? attDeviceToNames.get(devKey) : undefined;
                      const isMultiStudentDev = !!(devNames && devNames.size > 1);
                      const isDeviceDup = !!(devKey && (attDeviceCounts.get(devKey) || 0) > 1);

                      const isDuplicate = isMultiStudentEitaa || isEitaaDup || isMultiStudentDev || isDeviceDup;

                      return (
                        <tr 
                          key={r.id} 
                          className={`transition-colors ${
                            isMultiStudentEitaa || isMultiStudentDev 
                              ? 'bg-rose-100/60 hover:bg-rose-100/90 border-b border-rose-300 font-medium' 
                              : isDuplicate 
                                ? 'bg-rose-50/50 hover:bg-rose-50' 
                                : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-3 px-3 text-center text-slate-400 font-medium">
                            {toPersianDigits(idx + 1)}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <span>{r.studentName}</span>
                              {isMultiStudentEitaa && (
                                <span className="text-[10px] bg-rose-600 text-white font-bold px-1.5 py-0.2 rounded-sm" title="این حساب ایتا برای چند نام ثبت شده">
                                  تکراری
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium text-[11px]">
                              {r.className}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700">{r.subject}</td>
                          <td className="py-3 px-4 text-slate-600 font-mono">{toPersianDigits(r.shamsiDate)}</td>
                          <td className="py-3 px-4 text-slate-600 font-mono">{toPersianDigits(r.timeString)}</td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1 items-start">
                              <div
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-medium transition-colors ${
                                  isMultiStudentEitaa
                                    ? 'bg-rose-200 text-rose-950 border-rose-400 font-black shadow-2xs'
                                    : isDuplicate
                                      ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold'
                                      : 'bg-white text-slate-700 border-slate-200'
                                }`}
                              >
                                <Smartphone className={`w-3.5 h-3.5 ${isDuplicate ? 'text-rose-600' : 'text-slate-500'}`} />
                                <span dir="ltr">
                                  {r.eitaaId ? `${r.eitaaId}` : (r.deviceId ? `دستگاه: ${r.deviceId.substring(0, 8)}` : 'نامشخص')}
                                </span>
                              </div>

                              {/* برچسب هشدار تقلب یا ثبت چندباره */}
                              {isMultiStudentEitaa && eitaaNames && (
                                <span
                                  className="bg-rose-600 text-white font-sans text-[10.5px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs"
                                  title={`این حساب ایتا توسط ${toPersianDigits(eitaaNames.size)} نام مختلف استفاده شده است: ${Array.from(eitaaNames).join(' و ')}`}
                                >
                                  <ShieldAlert className="w-3 h-3 shrink-0" />
                                  <span>
                                    هشدار: ثبت برای {toPersianDigits(eitaaNames.size)} نام با همین اکانت ایتا ({Array.from(eitaaNames).join('، ')})
                                  </span>
                                </span>
                              )}

                              {!isMultiStudentEitaa && isEitaaDup && (
                                <span
                                  className="bg-rose-500 text-white font-sans text-[10.5px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1"
                                  title="ثبت چندباره با همین اکانت"
                                >
                                  <ShieldAlert className="w-3 h-3 shrink-0" />
                                  <span>ثبت مکرر با همین حساب ایتا</span>
                                </span>
                              )}

                              {!isMultiStudentEitaa && !isEitaaDup && isMultiStudentDev && devNames && (
                                <span
                                  className="bg-amber-600 text-white font-sans text-[10.5px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1"
                                >
                                  <ShieldAlert className="w-3 h-3 shrink-0" />
                                  <span>گوشی مشترک ({toPersianDigits(devNames.size)} دانش‌آموز)</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => onDeleteAttendanceRecord(r.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                              title="حذف این رکورد"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ۲. تب تکالیف */}
      {subTab === 'assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* فرم ارسال یا ویرایش تکلیف */}
          <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>{editAssId ? 'ویرایش تکلیف' : 'ارسال تکلیف جدید'}</span>
            </h3>

            {/* پیام موفقیت‌آمیز ارسال تکلیف */}
            {assignmentNotice && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3.5 rounded-xl flex items-start justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-1">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-950 leading-snug">{assignmentNotice.title}</p>
                    <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">{assignmentNotice.desc}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAssignmentNotice(null)}
                  className="text-emerald-700 hover:text-emerald-900 p-1 rounded-md text-xs cursor-pointer shrink-0"
                  title="بستن پیام"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSaveAssignment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان تکلیف / تمرین:</label>
                <input
                  type="text"
                  required
                  value={assTitle}
                  onChange={(e) => setAssTitle(e.target.value)}
                  placeholder="مثال: حل تمرینات صفحه ۲۵ هندسه"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">کلاس هدف:</label>
                  <select
                    value={assClass}
                    onChange={(e) => setAssClass(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white cursor-pointer"
                  >
                    <option value="همه کلاس‌ها">همه کلاس‌ها</option>
                    {config.classes.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">درس:</label>
                  <select
                    value={assSubject}
                    onChange={(e) => setAssSubject(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white cursor-pointer"
                  >
                    {config.subjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع نمره‌دهی:</label>
                <select
                  value={assGradingType}
                  onChange={(e) => setAssGradingType(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white cursor-pointer"
                >
                  <option value="numeric">عددی (۰ تا ۲۰)</option>
                  <option value="qualitative">توصیفی (خیلی خوب، خوب، ...)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">توضیحات و راهنمای حل:</label>
                <textarea
                  rows={3}
                  value={assDesc}
                  onChange={(e) => setAssDesc(e.target.value)}
                  placeholder="نکات آموزشی برای دانش‌آموزان..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">فایل پیوست (اختیاری):</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-xl bg-slate-50 file:mr-0 file:ml-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {assFile && (
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">
                    ✓ فایل پیوست شد: {assFile.name} ({assFile.size})
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  {editAssId ? 'ذخیره تغییرات' : 'انتشار تکلیف'}
                </button>

                {editAssId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditAssId(null);
                      setAssTitle('');
                      setAssDesc('');
                      setAssFile(null);
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl cursor-pointer"
                  >
                    انصراف
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* لیست تکالیف موجود */}
          <div className="lg:col-span-2 space-y-3">
            {(() => {
              const displayedAssignments = assignments.filter((item) => {
                if (activeSubject !== 'all' && item.subject !== activeSubject) return false;
                return true;
              });

              return (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-extrabold text-slate-800">
                      <span>تکالیف منتشر شده {activeSubject !== 'all' ? `(درس ${activeSubject})` : ''} ({toPersianDigits(displayedAssignments.length)})</span>
                    </h3>
                    {activeSubject !== 'all' && (
                      <button
                        type="button"
                        onClick={() => handleSelectActiveSubject('all')}
                        className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                      >
                        نمایش تمام دروس
                      </button>
                    )}
                  </div>

                  {displayedAssignments.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                      {activeSubject !== 'all'
                        ? `تکلیفی برای درس «${activeSubject}» ثبت نشده است. از فرم روبرو برای این درس تکلیف تعریف کنید.`
                        : 'تکلیفی ثبت نشده است. از فرم روبرو تکلیف جدیدی تعریف کنید.'}
                    </div>
                  ) : (
                    displayedAssignments.map((item) => (
                      <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {item.className}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {item.subject}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        تاریخ انتشار: {toPersianDigits(item.shamsiDate)} • نمره‌دهی:{' '}
                        {item.gradingType === 'numeric' ? 'عددی (۰-۲۰)' : 'توصیفی'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEditAss(item)}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer"
                        title="ویرایش"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingAss(item)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {item.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      {item.fileName && item.fileData && (
                        <a
                          href={item.fileData}
                          download={item.fileName}
                          className="inline-flex items-center gap-1 text-blue-700 font-semibold hover:underline"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{item.fileName}</span>
                        </a>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedAssId(item.id);
                        setSubTab('grades');
                      }}
                      className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>ورود به نمره‌دهی ({toPersianDigits(Object.keys(item.grades || {}).length)} نمره ثبت‌شده)</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        );
      })()}
          </div>
        </div>
      )}

      {/* ۳. تب نمرات و بازخورد تفکیکی */}
      {subTab === 'grades' && (
        <div className="space-y-4">
          {subjectAssignments.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
              {activeSubject !== 'all'
                ? `هیچ تکلیفی برای درس «${activeSubject}» تعریف نشده است. لطفاً از تب «تکالیف» ابتدا برای این درس تکلیف ثبت کنید یا فیلتر درس را تغییر دهید.`
                : 'لطفاً ابتدا از تب «تکالیف» حداقل یک تکلیف ایجاد نمایید تا امکان نمره‌دهی به آن فراهم شود.'}
            </div>
          ) : (
            <>
              {/* نوار بالای نمره‌دهی */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-xs font-bold text-slate-700">تکلیف مورد نظر:</label>
                  <select
                    value={selectedAssId}
                    onChange={(e) => setSelectedAssId(e.target.value)}
                    className="text-xs sm:text-sm font-bold border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-blue-600 cursor-pointer min-w-[220px]"
                  >
                    {subjectAssignments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title} ({a.className} - {a.subject})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleQuickFillFullScores}
                    className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>نمره کامل به همه</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!activeAss) return;
                      onUpdateAssignment({
                        ...activeAss,
                        gradesPublished: !activeAss.gradesPublished,
                      });
                    }}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer shadow-xs ${
                      activeAss?.gradesPublished
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {activeAss?.gradesPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{activeAss?.gradesPublished ? 'لغو انتشار نمرات' : 'انتشار نمرات برای دانش‌آموزان'}</span>
                  </button>

                  {activeAss && (
                    <button
                      onClick={() => exportGradesToCSV(activeAss, students)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-slate-500" />
                      <span>خروجی اکسل</span>
                    </button>
                  )}
                </div>
              </div>

              {/* فرم انتخاب دانش‌آموز و ثبت نمره */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>ثبت یا ویرایش نمره برای دانش‌آموز:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">انتخاب دانش‌آموز:</label>
                    <select
                      value={selectedStudentForGrading}
                      onChange={(e) => {
                        const name = e.target.value;
                        setSelectedStudentForGrading(name);
                        if (activeAss && activeAss.grades[name]) {
                          const g = activeAss.grades[name];
                          setGradeScore(g.score);
                          setGradeBadge(g.badge || '');
                          setGradeNote(g.note || '');
                        } else {
                          setGradeScore('');
                          setGradeBadge('');
                          setGradeNote('');
                        }
                      }}
                      className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white cursor-pointer"
                    >
                      <option value="">-- انتخاب از لیست کلاس --</option>
                      {students
                        .filter(
                          (s) => activeAss.className === 'همه کلاس‌ها' || s.className === activeAss.className
                        )
                        .sort((a, b) => {
                          const lastNameComparison = (a.lastName || '').localeCompare(b.lastName || '', 'fa');
                          if (lastNameComparison !== 0) return lastNameComparison;
                          return (a.firstName || a.name).localeCompare(b.firstName || b.name, 'fa');
                        })
                        .map((st) => (
                          <option key={st.id} value={st.name}>
                            {st.name} ({st.className})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      نمره ({activeAss.gradingType === 'numeric' ? 'از ۲۰' : 'توصیفی'}):
                    </label>
                    {activeAss.gradingType === 'numeric' ? (
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        max="20"
                        value={gradeScore}
                        onChange={(e) => setGradeScore(e.target.value)}
                        placeholder="مثلا: ۱۹.۵"
                        className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600"
                      />
                    ) : (
                      <select
                        value={gradeScore}
                        onChange={(e) => setGradeScore(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white cursor-pointer"
                      >
                        <option value="">انتخاب نمره...</option>
                        <option value="خیلی خوب">خیلی خوب</option>
                        <option value="خوب">خوب</option>
                        <option value="قابل قبول">قابل قبول</option>
                        <option value="نیاز به تلاش">نیاز به تلاش</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">نشان تشویقی:</label>
                    <select
                      value={gradeBadge}
                      onChange={(e) => setGradeBadge(e.target.value as any)}
                      className="w-full text-xs font-medium px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white cursor-pointer"
                    >
                      <option value="">بدون نشان</option>
                      <option value="positive">+ مثبت</option>
                      <option value="star">★ ستاره طلایی</option>
                      <option value="negative">- منفی</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">نظر خصوصی دبیر:</label>
                    <input
                      type="text"
                      value={gradeNote}
                      onChange={(e) => setGradeNote(e.target.value)}
                      placeholder="بازخورد آموزشی..."
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleSaveSingleGrade}
                    disabled={!selectedStudentForGrading}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    ثبت نمره دانش‌آموز
                  </button>
                </div>
              </div>

              {/* جدول نمرات تمام دانش‌آموزان برای این تکلیف */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-800">
                    وضعیت نمرات ثبت‌شده برای «{activeAss.title}»
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {toPersianDigits(Object.keys(activeAss.grades || {}).length)} نمره ثبت شده
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="py-3 px-3 w-12 text-center">ردیف</th>
                        <th className="py-3 px-4">نام دانش‌آموز</th>
                        <th className="py-3 px-4">کلاس</th>
                        <th className="py-3 px-4 text-center">نمره</th>
                        <th className="py-3 px-4 text-center">نشان</th>
                        <th className="py-3 px-4">نظر دبیر</th>
                        <th className="py-3 px-4 w-16 text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students
                        .filter(
                          (s) => activeAss.className === 'همه کلاس‌ها' || s.className === activeAss.className
                        )
                        .sort((a, b) => {
                          const lastNameComparison = (a.lastName || '').localeCompare(b.lastName || '', 'fa');
                          if (lastNameComparison !== 0) return lastNameComparison;
                          return (a.firstName || a.name).localeCompare(b.firstName || b.name, 'fa');
                        })
                        .map((st, idx) => {
                          const g = activeAss.grades[st.name];
                          return (
                            <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-3 text-center text-slate-400 font-medium">
                                {toPersianDigits(idx + 1)}
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-900">{st.name}</td>
                              <td className="py-3 px-4 text-slate-500">{st.className}</td>
                              <td className="py-3 px-4 text-center font-mono font-bold">
                                {g ? (
                                  <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    {toPersianDigits(g.score)}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {g?.badge === 'positive' && (
                                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                    + مثبت
                                  </span>
                                )}
                                {g?.badge === 'star' && (
                                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                                    ★ ستاره
                                  </span>
                                )}
                                {g?.badge === 'negative' && (
                                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                                    - منفی
                                  </span>
                                )}
                                {!g?.badge && <span className="text-slate-300">-</span>}
                              </td>
                              <td className="py-3 px-4 text-slate-600">{g?.note || '-'}</td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => {
                                    setSelectedStudentForGrading(st.name);
                                    if (g) {
                                      setGradeScore(g.score);
                                      setGradeBadge(g.badge || '');
                                      setGradeNote(g.note || '');
                                    }
                                  }}
                                  className="text-blue-600 hover:text-blue-800 font-semibold p-1 cursor-pointer"
                                  title="ویرایش سریع نمره"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ۴. تب لیست دانش‌آموزان */}
      {subTab === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* فرم افزودن دانش‌آموز */}
          <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>افزودن دانش‌آموز به کلاس</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">کلاس:</label>
                <select
                  value={stuClassFilter}
                  onChange={(e) => setStuClassFilter(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white cursor-pointer"
                >
                  {config.classes.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {!showBulkAdd ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">نام:</label>
                      <input
                        type="text"
                        value={newStuFirstName}
                        onChange={(e) => setNewStuFirstName(e.target.value)}
                        placeholder="مثال: رضا"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">نام خانوادگی:</label>
                      <input
                        type="text"
                        value={newStuLastName}
                        onChange={(e) => setNewStuLastName(e.target.value)}
                        placeholder="مثال: کریمی"
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">شماره دانش‌آموزی (اختیاری):</label>
                    <input
                      type="text"
                      value={newStuCode}
                      onChange={(e) => setNewStuCode(e.target.value)}
                      placeholder="مثال: ۱۰۸"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (!newStuFirstName.trim() || !newStuLastName.trim()) return;
                      onAddStudent(newStuFirstName.trim(), newStuLastName.trim(), stuClassFilter, newStuCode.trim());
                      setNewStuFirstName('');
                      setNewStuLastName('');
                      setNewStuCode('');
                    }}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    + افزودن به کلاس
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowBulkAdd(true)}
                    className="w-full text-center text-xs text-blue-600 hover:underline pt-2 font-medium cursor-pointer"
                  >
                    افزودن دسته‌ای اسامی (چسباندن لیست)
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      چسباندن اسامی (هر اسم در یک سطر):
                    </label>
                    <textarea
                      rows={6}
                      value={bulkStuText}
                      onChange={(e) => setBulkStuText(e.target.value)}
                      placeholder="علی حسینی&#10;سارا احمدی&#10;محمد رضایی"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600 font-sans leading-relaxed"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5 text-blue-700">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      استخراج هوشمند از عکس یا فایل (توسط هوش مصنوعی)
                    </label>
                    <input
                      type="file"
                      accept="image/*,.txt,.csv"
                      ref={aiFileInputRef}
                      onChange={handleAIFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isExtractingAI}
                      onClick={() => aiFileInputRef.current?.click()}
                      className="w-full py-2 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isExtractingAI ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></span>
                          در حال پردازش و استخراج هوشمند...
                        </span>
                      ) : (
                        'انتخاب فایل یا عکس حاوی لیست اسامی'
                      )}
                    </button>
                    <p className="text-[10px] text-slate-500 mt-1.5 text-justify leading-relaxed">
                      فایل یا عکس حاوی لیست دانش‌آموزان را انتخاب کنید تا هوش مصنوعی به صورت خودکار اسامی و فامیل‌ها را تفکیک کرده و در کادر بالا قرار دهد.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const lines = bulkStuText
                        .split('\n')
                        .map((l) => l.trim())
                        .filter(Boolean);
                      lines.forEach((name) => {
                        const parts = name.split(' ');
                        const lastName = parts.length > 1 ? parts.pop()! : '';
                        const firstName = parts.join(' ') || name;
                        onAddStudent(firstName, lastName, stuClassFilter);
                      });
                      setBulkStuText('');
                      setShowBulkAdd(false);
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer mt-2"
                  >
                    افزودن کل اسامی به این کلاس
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowBulkAdd(false)}
                    className="w-full text-center text-xs text-slate-500 hover:text-slate-700 pt-1 cursor-pointer"
                  >
                    بازگشت به حالت تکی
                  </button>
                </>
              )}
            </div>
          </div>

          {/* لیست دانش‌آموزان کلاس انتخابی */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-800">
                دانش‌آموزان کلاس {stuClassFilter} ({toPersianDigits(students.filter((s) => s.className === stuClassFilter).length)} نفر)
              </h4>
            </div>

            <div className="divide-y divide-slate-100 max-h-[450px] overflow-y-auto">
              {students.filter((s) => s.className === stuClassFilter).length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  هیچ دانش‌آموزی در این کلاس ثبت نشده است.
                </div>
              ) : (
                students
                  .filter((s) => s.className === stuClassFilter)
                  .sort((a, b) => {
                    const lastNameComparison = (a.lastName || '').localeCompare(b.lastName || '', 'fa');
                    if (lastNameComparison !== 0) return lastNameComparison;
                    return (a.firstName || a.name).localeCompare(b.firstName || b.name, 'fa');
                  })
                  .map((st, idx) => (
                    <div key={st.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                          {toPersianDigits(idx + 1)}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900 text-xs sm:text-sm">{st.name}</p>
                          {st.code && <p className="text-[11px] text-slate-400">کد: {toPersianDigits(st.code)}</p>}
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteStudent(st.id)}
                        className="text-slate-300 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                        title="حذف دانش‌آموز"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ۵. تب آزمون‌ساز کلاسی و کوئیز آنلاین */}
      {subTab === 'toolkit' && (
        <ExamManager
          config={config}
          exams={exams}
          students={students}
          activeSubject={activeSubject}
          onCreateExam={onCreateExam || (() => {})}
          onUpdateExam={onUpdateExam || (() => {})}
          onDeleteExam={onDeleteExam || (() => {})}
          onGradeSubmission={onGradeSubmission || (() => {})}
        />
      )}

      {/* ۶. تب تنظیمات و راهنمای استقرار روی GitHub / Netlify */}
      {subTab === 'settings' && (
        <div className="space-y-6">
          {/* راهنمای اختصاصی گیت‌هاب و نتلیفای */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-5 rounded-2xl border border-blue-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-blue-900">
              <Globe className="w-5 h-5 text-blue-700" />
              <h3 className="font-extrabold text-sm sm:text-base">راهنمای انتشار روی GitHub Pages یا Netlify</h3>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              این برنامه طوری طراحی شده است که به عنوان یک وب‌اپلیکیشن استاتیک مدرن (SPA) به طور مستقیم روی{' '}
              <strong className="font-bold text-blue-800">گیت‌هاب پیجز (GitHub Pages)</strong> یا{' '}
              <strong className="font-bold text-blue-800">نتلیفای (Netlify)</strong> بدون نیاز به هیچ سرور بک‌اند اختصاصی
              اجرا شود. تمام اطلاعات به صورت خودکار در حافظه مرورگر دستگاه شما (<code className="font-mono text-xs bg-white px-1 py-0.5 rounded border border-blue-200">LocalStorage</code>) ذخیره می‌گردند.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="bg-white p-3 rounded-xl border border-blue-100">
                <span className="font-bold text-slate-800 block mb-1">روش بارگذاری در Netlify:</span>
                <p className="text-slate-600 leading-relaxed">
                  کافیست پوشه خروجی ساخت (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded">dist</code>) را با قابلیت Drag & Drop درون تب Deploys نتلیفای بکشید و رها کنید تا در ۱۰ ثانیه آنلاین شود!
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-blue-100">
                <span className="font-bold text-slate-800 block mb-1">روش بارگذاری در GitHub Pages:</span>
                <p className="text-slate-600 leading-relaxed">
                  تنظیم مقدار <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">base: './'</code> در فایل <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">vite.config.ts</code> انجام شده است تا مسیر فایل‌های css و js بدون خطا لود شوند.
                </p>
              </div>
            </div>
          </div>

          {/* تنظیمات اطلاعات مدرسه و دبیر */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-blue-600" />
              <span>مشخصات آموزشگاه و رمز عبور دبیر</span>
            </h3>

            {settingsSavedMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>تنظیمات با موفقیت ذخیره شد.</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نام مدرسه / مرکز آموزشی:</label>
                  <input
                    type="text"
                    required
                    value={newSchoolName}
                    onChange={(e) => setNewSchoolName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نام دبیر / مدرس:</label>
                  <input
                    type="text"
                    required
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">سال تحصیلی:</label>
                  <input
                    type="text"
                    required
                    value={newAcademicYear}
                    onChange={(e) => setNewAcademicYear(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رمز عبور ورود به پنل دبیر (PIN):</label>
                  <input
                    type="text"
                    required
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="مثال: 1234"
                    className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-xl focus:outline-blue-600"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  ذخیره مشخصات
                </button>
              </div>
            </form>
          </div>

          {/* مدیریت کلاس‌ها و دروس */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* مدیریت کلاس‌ها */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-extrabold text-slate-800">مدیریت لیست کلاس‌ها</h4>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="کلاس جدید (مثلا: نهم ج)"
                  value={newClassNameInput}
                  onChange={(e) => setNewClassNameInput(e.target.value)}
                  className="flex-1 text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-blue-600"
                />
                <button
                  onClick={handleAddClass}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  افزودن
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2">
                {config.classes.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200"
                  >
                    <span>{c}</span>
                    <button
                      onClick={() => handleRemoveClass(c)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* مدیریت دروس */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-extrabold text-slate-800">مدیریت لیست دروس</h4>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="درس جدید (مثلا: هندسه)"
                  value={newSubjectNameInput}
                  onChange={(e) => setNewSubjectNameInput(e.target.value)}
                  className="flex-1 text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-blue-600"
                />
                <button
                  onClick={handleAddSubject}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  افزودن
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2">
                {config.subjects.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200"
                  >
                    <span>{s}</span>
                    <button
                      onClick={() => handleRemoveSubject(s)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* پشتیبان‌گیری و بازیابی داده‌ها */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-600" />
              <span>پشتیبان‌گیری کامل از اطلاعات سامانه (JSON Backup)</span>
            </h4>
            <p className="text-xs text-slate-500">
              برای جلوگیری از پاک شدن اطلاعات هنگام تغییر مرورگر یا گوشی، می‌توانید فایل پشتیبان کامل سامانه را دانلود کنید و هر زمان نیاز بود دوباره بارگذاری نمایید.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => exportBackupJSON({ config, students, attendance, assignments, exams })}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>دانلود فایل پشتیبان (JSON)</span>
              </button>

              <label className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>بازیابی فایل پشتیبان</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      try {
                        const parsed = JSON.parse(reader.result as string);
                        onRestoreBackup(parsed);
                        alert('اطلاعات با موفقیت بازیابی شد ✅');
                      } catch (err) {
                        alert('فایل انتخاب شده معتبر نیست.');
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>
            </div>
          </div>

          {/* اطلاعات نسخه و راهنمای استقرار در گیت‌هاب */}
          <div className="bg-white p-5 rounded-2xl border border-blue-200 bg-linear-to-br from-blue-50/40 to-white shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-blue-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <GitBranch className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                    <span>شناسنامه و وضعیت نسخه وب‌اپلیکیشن</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[10px]">
                      نسخه {APP_VERSION_FA} ({APP_VERSION})
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    تاریخ آخرین به‌روزرسانی: {APP_BUILD_DATE_FA}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>آماده گیت‌هاب و نتلیفای</span>
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {APP_BUILD_NOTES}
            </p>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-700">
              <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                <span>🚀 ۳ مرحله سریع برای داشتن لینک اختصاصی و بدون فیلترشکن:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-600 pr-1 leading-relaxed">
                <li>
                  <strong className="text-slate-800">اتصال به گیت‌هاب:</strong> در پنجره بالای استودیو روی زبانه <strong>GitHub</strong> کلیک کنید تا این مخزن در اکانت گیت‌هاب شما ذخیره شود.
                </li>
                <li>
                  <strong className="text-slate-800">انتشار در Netlify یا Vercel:</strong> وارد سایت <code className="bg-slate-100 px-1 rounded text-blue-700">netlify.com</code> شوید، دکمه <em>Import from GitHub</em> را بزنید و این مخزن را انتخاب کنید.
                </li>
                <li>
                  <strong className="text-slate-800">لینک اختصاصی:</strong> نتلیفای بلافاصله یک لینک اینترنتی پرسرعت به شما می‌دهد که برای تمامی دانش‌آموزان در ایران با هر اینترنتی و بدون فیلترشکن باز می‌شود.
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Delete Assignment Modal */}
      {deletingAss && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-800">حذف تکلیف</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              آیا از حذف تکلیف <strong className="text-slate-800">«{deletingAss.title}»</strong> اطمینان دارید؟
            </p>
            <p className="text-[11px] text-rose-500 bg-rose-50/70 p-2.5 rounded-xl border border-rose-100">
              ⚠️ تمامی نمرات ثبت‌شده برای این تکلیف نیز حذف خواهند شد.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingAss(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deletingAss) {
                    onDeleteAssignment(deletingAss.id);
                    setDeletingAss(null);
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                بله، تکلیف حذف شود
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Attendance Modal */}
      {showClearAttendanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-slate-800">پاکسازی کل سوابق حضور و غیاب</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              آیا از پاکسازی تمام رکوردهای سوابق حضور و غیاب دانش‌آموزان اطمینان دارید؟
            </p>
            <p className="text-[11px] text-rose-500 bg-rose-50/70 p-2.5 rounded-xl border border-rose-100">
              ⚠️ تمام سوابق ثبت‌شده قبلی حذف می‌شوند و قابل بازیابی نخواهند بود (مگر از فایل پشتیبان).
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearAttendanceModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAllAttendance();
                  setShowClearAttendanceModal(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                بله، پاکسازی شود
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
