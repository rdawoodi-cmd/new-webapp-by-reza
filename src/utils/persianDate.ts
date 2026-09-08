/**
 * تبدیل تاریخ میلادی به هجری شمسی بر اساس الگوریتم استاندارد
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    g_d_m[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return [jy, jm, jd];
}

const persianMonths = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

const persianDays = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
  'شنبه',
];

export function getTodayShamsi(): {
  dateString: string;
  formattedText: string;
  year: number;
  month: number;
  day: number;
  dayName: string;
  monthName: string;
} {
  const now = new Date();
  const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const dayName = persianDays[now.getDay()];
  const monthName = persianMonths[jm - 1];
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const dateString = `${jy}/${pad(jm)}/${pad(jd)}`;
  const formattedText = `${dayName}، ${jd} ${monthName} ${jy}`;

  return {
    dateString,
    formattedText,
    year: jy,
    month: jm,
    day: jd,
    dayName,
    monthName,
  };
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

export function toPersianDigits(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '';
  const str = String(num);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
}
