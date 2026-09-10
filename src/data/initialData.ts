import { AttendanceRecord, Assignment, StudentProfile, AppConfig, Exam } from '../types';
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

export function getInitialExams(): Exam[] {
  const today = getTodayShamsi();
  return [
    {
      id: 'exam-1',
      title: 'آزمون تشریحی میان‌ترم درس فرهنگ و هنر (طراحی و ترکیب‌بندی)',
      type: 'descriptive',
      className: 'همه کلاس‌ها',
      subject: 'فرهنگ و هنر',
      description: 'دانش‌آموزان عزیز، برگه سوالات زیر را مشاهده نمایید. پاسخ سوالات را روی یک برگ کاغذ با خط خوانا و طراحی دقیق انجام داده، سپس از برگه خود با دوربین گوشی یا تبلت عکس باکیفیت گرفته و همین‌جا آپلود و ارسال کنید.',
      durationMinutes: 25,
      isActive: true,
      shamsiDate: today.dateString,
      createdAt: new Date().toISOString(),
      fileName: 'برگه_سوالات_امتحان_هنر_فصل۳.png',
      fileSize: '145 KB',
      // SVG data URL as question paper preview
      fileData: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%23f8fafc"/><rect x="20" y="20" width="560" height="360" rx="12" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/><text x="300" y="65" font-family="sans-serif" font-size="18" font-weight="bold" fill="%231e293b" text-anchor="middle">برگه آزمون کلاسی - درس فرهنگ و هنر</text><text x="300" y="95" font-family="sans-serif" font-size="13" fill="%2364748b" text-anchor="middle">مدت زمان پاسخگویی: ۲۵ دقیقه • نمره کل: ۲۰</text><line x1="50" y1="120" x2="550" y2="120" stroke="%23e2e8f0" stroke-width="1.5"/><text x="540" y="160" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23334155" text-anchor="end">سوال ۱: سه قانون اصلی در ترکیب‌بندی نقطه طلایی را شرح دهید. (۶ نمره)</text><text x="540" y="220" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23334155" text-anchor="end">سوال ۲: تفاوت رنگ‌های مکمل و همجوار در چرخه رنگ ایتن چیست؟ (۷ نمره)</text><text x="540" y="280" font-family="sans-serif" font-size="14" font-weight="bold" fill="%23334155" text-anchor="end">سوال ۳: یک طرح ساده از کوزه سفالی با سایه‌روشن هاشور رسم نمایید. (۷ نمره)</text><text x="300" y="345" font-family="sans-serif" font-size="12" fill="%2394a3b8" text-anchor="middle">پاسخ‌ها را روی برگه نوشته و عکس آن را در سامانه ارسال کنید.</text></svg>',
      fileType: 'image/svg+xml',
      submissions: {},
    },
    {
      id: 'exam-2',
      title: 'آزمون تستی چند گزینه‌ای مفاهیم و عناصر بصری',
      type: 'multiple-choice',
      className: 'همه کلاس‌ها',
      subject: 'فرهنگ و هنر',
      description: 'به ۴ سوال تستی زیر در مدت زمان مشخص پاسخ دهید. به محض پایان آزمون، نمره و درصد شما به صورت خودکار محاسبه و نمایش داده می‌شود.',
      durationMinutes: 15,
      isActive: true,
      shamsiDate: today.dateString,
      createdAt: new Date().toISOString(),
      questions: [
        {
          id: 'q-1',
          questionText: 'کدام گزینه از رنگ‌های اصلی (درجه اول) در دایره رنگ سنتی است؟',
          options: ['سبز', 'نارنجی', 'زرد', 'بنفش'],
          correctOptionIndex: 2, // زرد
          explanation: 'رنگ‌های اصلی شامل قرمز، آبی و زرد هستند.'
        },
        {
          id: 'q-2',
          questionText: 'ایجاد احساس عمق و فاصله در نقاشی با کدام عنصر بصری به دست می‌آید؟',
          options: ['پرسپکتیو (دیدگاه)', 'فونت کتیبه', 'ضخامت کاغذ', 'قاب عکس'],
          correctOptionIndex: 0, // پرسپکتیو
          explanation: 'پرسپکتیو علم نمایش عمق و سه بعدی نشان دادن حجم روی سطح دو بعدی است.'
        },
        {
          id: 'q-3',
          questionText: 'رنگ مکمل رنگ آبی کدام است؟',
          options: ['سبز', 'نارنجی', 'زرد', 'قرمز'],
          correctOptionIndex: 1, // نارنجی
          explanation: 'در چرخه رنگ ایتن، نارنجی روبروی آبی و مکمل آن است.'
        },
        {
          id: 'q-4',
          questionText: 'کدام خط، احساس آرامش و سکون را در یک اثر هنری به بیننده القا می‌کند؟',
          options: ['خط شکسته و زاویه‌دار', 'خط افقی', 'خط منحنی تند', 'خط مورب متمایل'],
          correctOptionIndex: 1, // خط افقی
          explanation: 'خطوط افقی یادآور خط افق طبیعت بوده و حس سکون و آرامش ایجاد می‌کنند.'
        }
      ],
      submissions: {},
    }
  ];
}

