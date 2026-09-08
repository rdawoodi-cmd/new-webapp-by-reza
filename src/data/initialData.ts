import { AttendanceRecord, Assignment, StudentProfile, AppConfig } from '../types';
import { getTodayShamsi } from '../utils/persianDate';

export const DEFAULT_CLASSES = [
  'هفتم الف',
  'هفتم ب',
  'هشتم الف',
  'هشتم ب',
  'نهم الف',
  'نهم ب',
];

export const DEFAULT_SUBJECTS = [
  'فرهنگ و هنر',
  'ریاضی',
  'علوم تجربی',
  'ادبیات فارسی',
  'زبان انگلیسی',
  'کار و فناوری',
];

export function getInitialConfig(): AppConfig {
  return {
    adminPin: '1234',
    schoolName: 'دبیرستان دوره اول نمونه دولتی شهید چمران',
    teacherName: 'استاد داوودی',
    academicYear: '۱۴۰۳ - ۱۴۰۴',
    classes: DEFAULT_CLASSES,
    subjects: DEFAULT_SUBJECTS,
    storageMode: 'local',
    supabaseUrl: 'https://dzbjznvdrrkfgycxqcnf.supabase.co',
    supabaseAnonKey: 'sb_publishable_hLm2YZ48fzg-IC_u3BHVSw_PKPVEz0L',
  };
}

export function getInitialStudents(): StudentProfile[] {
  return [
    { id: 'st-1', name: 'علی رضایی', className: 'هفتم الف', code: '۱۰۱', notes: 'علاقه‌مند به خوشنویسی', createdAt: '2024-09-23' },
    { id: 'st-2', name: 'محمد حسینی', className: 'هفتم الف', code: '۱۰۲', notes: 'عضو تیم آزمایشگاه', createdAt: '2024-09-23' },
    { id: 'st-3', name: 'سارا احمدی', className: 'هفتم الف', code: '۱۰۳', notes: 'سرگروه تیم هنری', createdAt: '2024-09-23' },
    { id: 'st-4', name: 'امیرمهدی کریمی', className: 'هفتم الف', code: '۱۰۴', notes: 'فعال در کارهای عملی', createdAt: '2024-09-23' },
    { id: 'st-5', name: 'فاطمه موسوی', className: 'هفتم ب', code: '۲۰۱', notes: 'انضباط و دقت عالی', createdAt: '2024-09-23' },
    { id: 'st-6', name: 'پارسا صادقی', className: 'هفتم ب', code: '۲۰۲', notes: 'حل‌کننده مسائل چالشی', createdAt: '2024-09-23' },
    { id: 'st-7', name: 'نیلوفر مرادی', className: 'هشتم الف', code: '۳۰۱', notes: 'همکاری عالی در کار گروهی', createdAt: '2024-09-23' },
    { id: 'st-8', name: 'حسین کاظمی', className: 'هشتم الف', code: '۳۰۲', notes: 'تسلط بر مفاهیم ترسیم', createdAt: '2024-09-23' },
  ];
}

export function getInitialAttendance(): AttendanceRecord[] {
  const today = getTodayShamsi();
  return [
    {
      id: 'att-1',
      studentName: 'علی رضایی',
      className: 'هفتم الف',
      subject: 'فرهنگ و هنر',
      shamsiDate: today.dateString,
      timeString: '۰۸:۰۴:۱۵',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'att-2',
      studentName: 'سارا احمدی',
      className: 'هفتم الف',
      subject: 'فرهنگ و هنر',
      shamsiDate: today.dateString,
      timeString: '۰۸:۰۵:۴۰',
      timestamp: new Date(Date.now() - 3500000).toISOString(),
    },
    {
      id: 'att-3',
      studentName: 'محمد حسینی',
      className: 'هفتم الف',
      subject: 'فرهنگ و هنر',
      shamsiDate: today.dateString,
      timeString: '۰۸:۰۸:۱۲',
      timestamp: new Date(Date.now() - 3300000).toISOString(),
    },
    {
      id: 'att-4',
      studentName: 'امیرمهدی کریمی',
      className: 'هفتم الف',
      subject: 'فرهنگ و هنر',
      shamsiDate: today.dateString,
      timeString: '۰۸:۱۵:۰۰',
      timestamp: new Date(Date.now() - 2900000).toISOString(),
      notes: 'با هماهنگی ناظم',
    },
    {
      id: 'att-5',
      studentName: 'فاطمه موسوی',
      className: 'هفتم ب',
      subject: 'ریاضی',
      shamsiDate: today.dateString,
      timeString: '۰۹:۳۲:۱۰',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
    },
  ];
}

export function getInitialAssignments(): Assignment[] {
  const today = getTodayShamsi();
  return [
    {
      id: 'ass-1',
      title: 'طراحی پرسپکتیو یک‌نقطه‌ای از اتاق کار',
      className: 'هفتم الف',
      subject: 'فرهنگ و هنر',
      description: 'دانش‌آموزان گرامی، لطفاً تمرین صفحه ۳۲ کتاب را با رعایت تناسبات و پرسپکتیو در برگه A4 ترسیم کرده و در جلسه آینده به همراه داشته باشید.',
      shamsiDate: today.dateString,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      gradingType: 'numeric',
      gradesPublished: true,
      grades: {
        'علی رضایی': {
          score: '۱۹.۵',
          scoreType: 'numeric',
          badge: 'positive',
          note: 'سایه‌روشن بسیار تمیز و خط‌کشی دقیق',
        },
        'سارا احمدی': {
          score: '۲۰',
          scoreType: 'numeric',
          badge: 'star',
          note: 'شاهکار هنری و خلاقیت تحسین‌برانگیز',
        },
        'محمد حسینی': {
          score: '۱۸',
          scoreType: 'numeric',
          badge: 'positive',
          note: 'خوب بود، خطوط گریز کمی نیاز به تصحیح داشتند',
        },
      },
    },
    {
      id: 'ass-2',
      title: 'فعالیت کلاسی: بررسی نقوش سنتی اسلیمی و ختایی',
      className: 'همه کلاس‌ها',
      subject: 'فرهنگ و هنر',
      description: 'تصویر پیوست را دانلود کرده و ۳ نمونه از نقوش اسلیمی را با راپید یا روان‌نویس بازطراحی نمایید.',
      shamsiDate: today.dateString,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      gradingType: 'qualitative',
      gradesPublished: true,
      grades: {
        'علی رضایی': {
          score: 'خیلی خوب',
          scoreType: 'qualitative',
          badge: 'positive',
          note: 'دقت عالی در انحناهای اسلیمی',
        },
      },
    },
  ];
}
