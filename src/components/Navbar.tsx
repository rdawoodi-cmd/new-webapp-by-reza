import React from 'react';
import { 
  ClipboardCheck, 
  BookOpen, 
  ShieldCheck, 
  Clock, 
  Calendar,
  Database,
  Lock,
  Info
} from 'lucide-react';
import { MainTab, AppConfig } from '../types';
import { toPersianDigits } from '../utils/persianDate';
import { APP_VERSION_FA } from '../version';

interface NavbarProps {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  config: AppConfig;
  currentTimeString: string;
  currentDateString: string;
  isAdminLoggedIn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  config,
  currentTimeString,
  currentDateString,
  isAdminLoggedIn,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Top Info Bar */}
        <div className="py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 border-b border-slate-100">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight">
                    {config.schoolName || 'سامانه هوشمند مدرسه'}
                  </h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    نسخه {APP_VERSION_FA}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {config.teacherName ? `مدرس: ${config.teacherName}` : 'سیستم مدیریت یکپارچه کلاس'} • سال تحصیلی {toPersianDigits(config.academicYear)}
                </p>
              </div>
            </div>

            <div className="sm:hidden flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold text-slate-700">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>{toPersianDigits(currentTimeString)}</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl font-medium">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>{toPersianDigits(currentDateString)}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-800 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl font-mono font-bold">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>{toPersianDigits(currentTimeString)}</span>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Database className="w-3 h-3" />
              <span>{config.storageMode === 'supabase' ? 'سرور ابری فعال' : 'حافظه محلی امن'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="py-2 flex items-center justify-between overflow-x-auto scrollbar-none gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('student-attendance')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'student-attendance'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>فرم ثبت حضور</span>
            </button>

            <button
              onClick={() => setActiveTab('student-assignments')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'student-assignments'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>تکالیف و نمرات دانش‌آموز</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'admin'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-blue-700'
              }`}
            >
              {isAdminLoggedIn ? <ShieldCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>پنل دبیر {isAdminLoggedIn && '(فعال)'}</span>
            </button>

            <button
              onClick={() => setActiveTab('app-info')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'app-info'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Info className="w-4 h-4 text-indigo-600" />
              <span>مشخصات برنامه</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
