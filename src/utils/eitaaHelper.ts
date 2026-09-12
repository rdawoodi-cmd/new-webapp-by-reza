import { AppConfig } from '../types';

/**
 * دریافت لینک گروه چت ایتا برای یک درس و کلاس مشخص
 * اولویت:
 * ۱. لینک اختصاصی آن درس در آن کلاس (classSubjectEitaaLinks)
 * ۲. لینک پیش‌فرض کلاس (classEitaaLinks)
 * ۳. لینک سراسری مدرسه (eitaaGroupLink)
 */
export function getClassSubjectEitaaLink(
  config: AppConfig,
  className: string,
  subject: string
): string {
  if (!config) return '';

  // ۱. لینک اختصاصی درس در کلاس
  const subjectLink = config.classSubjectEitaaLinks?.[className]?.[subject]?.trim();
  if (subjectLink) return subjectLink;

  // ۲. لینک عمومی همان کلاس
  const classLink = config.classEitaaLinks?.[className]?.trim();
  if (classLink) return classLink;

  // ۳. لینک عمومی پشتیبان سامانه
  return config.eitaaGroupLink?.trim() || '';
}

/**
 * دریافت نقشه تمام لینک‌های دروس برای یک کلاس
 */
export function getClassSubjectsEitaaMap(
  config: AppConfig,
  className: string
): Record<string, string> {
  const map: Record<string, string> = {};
  const schoolSubjects = config?.subjects || [];
  const subjectLinks = config?.classSubjectEitaaLinks?.[className] || {};

  schoolSubjects.forEach((sub) => {
    map[sub] = subjectLinks[sub] || '';
  });

  // همچنین اگر درس سفارشی دیگری ذخیره شده باشد اضافه می‌کنیم
  Object.keys(subjectLinks).forEach((sub) => {
    if (!map[sub]) {
      map[sub] = subjectLinks[sub] || '';
    }
  });

  return map;
}

/**
 * تعداد دروس متصل به گروه ایتا در یک کلاس
 */
export function countClassSubjectEitaaLinks(
  config: AppConfig,
  className: string
): number {
  const map = config?.classSubjectEitaaLinks?.[className] || {};
  return Object.values(map).filter(
    (link) => typeof link === 'string' && link.trim().length > 0
  ).length;
}
