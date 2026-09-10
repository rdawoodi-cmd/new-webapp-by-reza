import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  GraduationCap, 
  Book, 
  User, 
  Clock, 
  Calendar, 
  Sparkles,
  Printer,
  Copy,
  Check,
  AlertCircle,
  Smartphone,
  ShieldCheck
} from 'lucide-react';
import { AppConfig, StudentProfile } from '../types';
import { toPersianDigits, getTodayShamsi } from '../utils/persianDate';
import { sounds } from '../utils/sound';
import { getDeviceId, detectEitaaUser, EitaaUserInfo, getSavedEitaaId } from '../utils/deviceIdentifier';
import confetti from 'canvas-confetti';

interface StudentAttendanceViewProps {
  config: AppConfig;
  students: StudentProfile[];
  onSubmitAttendance: (
    name: string,
    className: string,
    subject: string,
    eitaaId?: string,
    deviceId?: string
  ) => { success: boolean; message: string; date: string; time: string };
}

export const StudentAttendanceView: React.FC<StudentAttendanceViewProps> = ({
  config,
  students,
  onSubmitAttendance,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    return localStorage.getItem('last_selected_class') || config.classes[0] || 'هفتم الف';
  });
  const [selectedSubject, setSelectedSubject] = useState<string>(() => {
    return localStorage.getItem('last_selected_subject') || config.subjects[0] || 'فرهنگ و هنر';
  });
  const [studentName, setStudentName] = useState<string>(() => {
    return localStorage.getItem('last_student_name') || '';
  });
  const [eitaaInfo, setEitaaInfo] = useState<EitaaUserInfo>(() => {
    return detectEitaaUser();
  });

  useEffect(() => {
    const info = detectEitaaUser();
    setEitaaInfo(info);
    if (!studentName && info.fullName) {
      setStudentName(info.fullName);
    }
  }, []);

  const [receipt, setReceipt] = useState<{
    studentName: string;
    className: string;
    subject: string;
    date: string;
    time: string;
    eitaaId?: string;
  } | null>(null);

  const [isCopied, setIsCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const today = getTodayShamsi();

  // فیلتر دانش‌آموزان این کلاس برای پیشنهادات خودکار
  const classStudents = students.filter((s) => s.className === selectedClass);

  const handleClassChange = (newCls: string) => {
    setSelectedClass(newCls);
    localStorage.setItem('last_selected_class', newCls);
  };

  const handleSubjectChange = (newSub: string) => {
    setSelectedSubject(newSub);
    localStorage.setItem('last_selected_subject', newSub);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = studentName.trim();
    if (!cleanName) {
      setErrorMsg('لطفاً نام و نام خانوادگی خود را کامل وارد نمایید.');
      return;
    }

    setErrorMsg('');
    localStorage.setItem('last_student_name', cleanName);
    const deviceId = getDeviceId();
    const finalEitaaId = eitaaInfo.displayId || getSavedEitaaId() || deviceId;

    const result = onSubmitAttendance(cleanName, selectedClass, selectedSubject, finalEitaaId, deviceId);

    if (result.success) {
      sounds.playCheer();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // Safe fallback
      }

      setReceipt({
        studentName: cleanName,
        className: selectedClass,
        subject: selectedSubject,
        date: result.date,
        time: result.time,
        eitaaId: finalEitaaId,
      });
    }
  };

  const handleCopyReceipt = () => {
    if (!receipt) return;
    const text = `رسید حضور در کلاس: ${receipt.className} | درس: ${receipt.subject} | دانش‌آموز: ${receipt.studentName} | تاریخ: ${receipt.date} ساعت: ${receipt.time} ✅`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* پیام رسید موفقیت حضور */}
      {receipt && (
        <div className="bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl p-5 shadow-sm text-emerald-950 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-emerald-900 leading-snug">
                  حضور شما با موفقیت ثبت شد!
                </h3>
                <p className="text-xs text-emerald-700 mt-0.5">
                  نام شما در لیست دائمی این کلاس ذخیره گردید و به دبیر گزارش شد.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleCopyReceipt}
                className="p-2 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="کپی متن رسید"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">{isCopied ? 'کپی شد' : 'کپی'}</span>
              </button>
              <button
                onClick={() => window.print()}
                className="p-2 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="چاپ رسید"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">چاپ</span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white/70 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-emerald-700 text-[11px] block">دانش‌آموز:</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">{receipt.studentName}</span>
            </div>
            <div className="bg-white/70 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-emerald-700 text-[11px] block">کلاس:</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">{receipt.className}</span>
            </div>
            <div className="bg-white/70 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-emerald-700 text-[11px] block">درس:</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">{receipt.subject}</span>
            </div>
            <div className="bg-white/70 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-emerald-700 text-[11px] block">زمان ثبت:</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">{toPersianDigits(receipt.time)}</span>
            </div>
          </div>
        </div>
      )}

      {/* کارت فرم ثبت حضور */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">
                فرم الکترونیکی ثبت حضور در کلاس
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                لطفاً مشخصات خود را بررسی و دکمه ثبت حضور را لمس کنید.
              </p>
            </div>
          </div>

          <div className="text-left">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg inline-block">
              {toPersianDigits(today.dateString)}
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* انتخاب کلاس */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>انتخاب کلاس شما:</span>
            </label>
            <select
              value={selectedClass}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full text-xs sm:text-sm font-medium px-3.5 py-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-blue-600 transition-all cursor-pointer"
            >
              {config.classes.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* انتخاب درس */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Book className="w-4 h-4 text-blue-600" />
              <span>درس مربوطه:</span>
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full text-xs sm:text-sm font-medium px-3.5 py-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-blue-600 transition-all cursor-pointer"
            >
              {config.subjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* نام و نام خانوادگی با قابلیت پیشنهاد اسامی موجود در آن کلاس */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" />
                <span>نام و نام خانوادگی دانش‌آموز:</span>
              </label>
              {classStudents.length > 0 && (
                <span className="text-[11px] text-slate-400">
                  {toPersianDigits(classStudents.length)} دانش‌آموز در این کلاس
                </span>
              )}
            </div>

            <input
              type="text"
              list="classStudentsList"
              required
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="مثال: علی رضایی"
              className="w-full text-xs sm:text-sm font-semibold px-3.5 py-2.5 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-blue-600 transition-all"
            />

            <datalist id="classStudentsList">
              {classStudents.map((st) => (
                <option key={st.id} value={st.name} />
              ))}
            </datalist>

            {classStudents.length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400">انتخاب سریع:</span>
                {classStudents.slice(0, 4).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStudentName(st.name)}
                    className="text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 px-2 py-0.5 rounded-md text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                  >
                    {st.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* مشخصات حساب کاربری ایتا به صورت خودکار از SDK برنامک ایتا */}
          <div className="pt-2">
            {eitaaInfo.isEitaaDetected ? (
              <div className="bg-emerald-50/90 border border-emerald-300 rounded-2xl p-4 text-emerald-950 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-900">
                        احراز هویت هوشمند برنامک ایتا (خودکار)
                      </h4>
                      <p className="text-[11px] text-emerald-700">
                        اطلاعات حساب ایتا مستقیماً از اپلیکیشن استخراج شد و نیازی به تایپ دستی نیست.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full shrink-0">
                    ✓ متصل به ایتا
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="bg-white rounded-xl p-2.5 border border-emerald-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">شناسه عددی ایتا:</span>
                    <span className="font-mono font-bold text-slate-900" dir="ltr">
                      {eitaaInfo.id ? toPersianDigits(eitaaInfo.id) : 'تولید خودکار'}
                    </span>
                  </div>

                  <div className="bg-white rounded-xl p-2.5 border border-emerald-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">نام کاربری (یوزرنیم):</span>
                    <span className="font-mono font-bold text-slate-900" dir="ltr">
                      {eitaaInfo.username ? `@${eitaaInfo.username}` : (eitaaInfo.fullName || 'ثبت با شناسه عددی')}
                    </span>
                  </div>
                </div>

                <p className="text-[10.5px] text-emerald-800 flex items-center gap-1.5 pt-0.5">
                  <span>🔒</span>
                  <span>این شناسه یکتا همراه با نام وارد شده ذخیره می‌شود تا در پنل دبیر اصالت حضور ثبت گردد.</span>
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <span>شناسه اختصاصی دستگاه:</span>
                  </span>
                  <span className="text-[11px] font-mono font-bold bg-white border border-slate-200 px-2.5 py-0.5 rounded-md text-slate-800">
                    {eitaaInfo.displayId}
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-500 leading-relaxed">
                  💡 <strong>توجه:</strong> وقتی دانش‌آموزان روی لینک ارسالی در گروه ایتا کلیک کنند، برنامک به طور خودکار آیدی و نام کاربری ایتا را بدون نیاز به ورود دستی شناسایی و ثبت می‌نماید.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full mt-4 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>ثبت نهایی حضور در کلاس</span>
          </button>
        </form>
      </div>
    </div>
  );
};
