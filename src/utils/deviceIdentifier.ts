/**
 * ابزار هوشمند تشخیص خودکار حساب کاربری ایتا (Eitaa Mini App SDK)
 * و شناسه دستگاه جهت احراز هویت خودکار و پیشگیری دقیق از تقلب در حضور و آزمون
 */

export interface EitaaUserInfo {
  isEitaaDetected: boolean;
  id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  displayId: string;
}

/**
 * دریافت یا تولید امضای پایدار دستگاه
 */
export function getDeviceId(): string {
  try {
    let id = localStorage.getItem('app_device_signature');
    if (!id) {
      const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
      id = `دستگاه-${rand}`;
      localStorage.setItem('app_device_signature', id);
    }
    return id;
  } catch {
    return 'دستگاه-مرورگر';
  }
}

/**
 * استخراج خودکار و امن مشخصات حساب کاربری ایتا از طریق SDK برنامک ایتا یا پارامترهای لینک
 */
export function detectEitaaUser(): EitaaUserInfo {
  try {
    const w = window as any;
    // بررسی SDK برنامک ایتا یا تلگرام وب‌اپ
    const webApp = w.Eitaa?.WebApp || w.EitaaWebApp || w.Telegram?.WebApp;

    if (webApp) {
      try { webApp.ready?.(); } catch {}
      try { webApp.expand?.(); } catch {}

      const user = webApp.initDataUnsafe?.user;
      if (user && (user.id || user.username)) {
        const id = user.id ? String(user.id) : '';
        const rawUsername = user.username ? String(user.username).replace(/^@/, '') : '';
        const firstName = user.first_name ? String(user.first_name) : '';
        const lastName = user.last_name ? String(user.last_name) : '';
        const fullName = `${firstName} ${lastName}`.trim();

        let displayId = '';
        if (rawUsername && id) {
          displayId = `@${rawUsername} (ID: ${id})`;
        } else if (rawUsername) {
          displayId = `@${rawUsername}`;
        } else if (id) {
          displayId = `ایتا: ${id}`;
        }

        // ذخیره دائمی مشخصات استخراج شده از ایتا در حافظه محلی
        if (displayId) {
          localStorage.setItem('student_eitaa_id', displayId);
          if (id) localStorage.setItem('student_eitaa_raw_id', id);
          if (rawUsername) localStorage.setItem('student_eitaa_username', rawUsername);
          if (fullName) localStorage.setItem('student_eitaa_fullname', fullName);
        }

        return {
          isEitaaDetected: true,
          id,
          username: rawUsername,
          firstName,
          lastName,
          fullName,
          displayId: displayId || `ایتا: ${id}`,
        };
      }

      // در صورت وجود رشته خام initData
      if (webApp.initData) {
        try {
          const params = new URLSearchParams(webApp.initData);
          const userJson = params.get('user');
          if (userJson) {
            const parsed = JSON.parse(userJson);
            const id = parsed.id ? String(parsed.id) : '';
            const rawUsername = parsed.username ? String(parsed.username).replace(/^@/, '') : '';
            const fullName = `${parsed.first_name || ''} ${parsed.last_name || ''}`.trim();
            const displayId = rawUsername ? `@${rawUsername} (ID: ${id})` : `ایتا: ${id}`;

            localStorage.setItem('student_eitaa_id', displayId);
            if (id) localStorage.setItem('student_eitaa_raw_id', id);
            if (rawUsername) localStorage.setItem('student_eitaa_username', rawUsername);
            if (fullName) localStorage.setItem('student_eitaa_fullname', fullName);

            return {
              isEitaaDetected: true,
              id,
              username: rawUsername,
              fullName,
              displayId,
            };
          }
        } catch {}
      }
    }
  } catch {}

  // بررسی پارامترهای آدرس لینک ارسالی در ایتا (query string یا hash)
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

    const rawId = searchParams.get('eitaa_id') || hashParams.get('eitaa_id') || searchParams.get('id');
    const rawUser = searchParams.get('eitaa_username') || hashParams.get('eitaa_username') || searchParams.get('username');

    if (rawId || rawUser) {
      const cleanUser = rawUser ? rawUser.replace(/^@/, '') : '';
      let displayId = '';
      if (cleanUser && rawId) {
        displayId = `@${cleanUser} (ID: ${rawId})`;
      } else if (cleanUser) {
        displayId = `@${cleanUser}`;
      } else if (rawId) {
        displayId = `ایتا: ${rawId}`;
      }

      localStorage.setItem('student_eitaa_id', displayId);
      if (rawId) localStorage.setItem('student_eitaa_raw_id', rawId);
      if (cleanUser) localStorage.setItem('student_eitaa_username', cleanUser);

      return {
        isEitaaDetected: true,
        id: rawId || undefined,
        username: cleanUser || undefined,
        displayId,
      };
    }
  } catch {}

  // بازیابی از کش قبلی برنامک ایتا
  try {
    const cached = localStorage.getItem('student_eitaa_id');
    if (cached) {
      return {
        isEitaaDetected: true,
        displayId: cached,
        id: localStorage.getItem('student_eitaa_raw_id') || undefined,
        username: localStorage.getItem('student_eitaa_username') || undefined,
        fullName: localStorage.getItem('student_eitaa_fullname') || undefined,
      };
    }
  } catch {}

  // در صورتی که خارج از ایتا (مثلاً در تست مرورگر) باز شده باشد
  const devId = getDeviceId();
  return {
    isEitaaDetected: false,
    displayId: devId,
  };
}

/**
 * دریافت شناسه ذخیره شده یا فعال
 */
export function getSavedEitaaId(): string {
  const info = detectEitaaUser();
  return info.displayId || '';
}

/**
 * ذخیره اختیاری شناسه
 */
export function saveEitaaId(eitaaId: string): void {
  try {
    const clean = eitaaId.trim();
    if (clean) {
      localStorage.setItem('student_eitaa_id', clean);
    }
  } catch {}
}

/**
 * فرمت نمایشی شناسه ورود دانش‌آموز (آی‌دی ایتا همراه با امضای دستگاه)
 */
export function getStudentIdentityLabel(eitaaId?: string, deviceId?: string): string {
  const cleanEitaa = eitaaId?.trim();
  const cleanDev = deviceId?.trim();

  if (cleanEitaa && cleanDev && cleanEitaa !== cleanDev) {
    return `${cleanEitaa}`;
  }
  if (cleanEitaa) {
    return cleanEitaa;
  }
  if (cleanDev) {
    return cleanDev;
  }
  return 'نامشخص';
}
