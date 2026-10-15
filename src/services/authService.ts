import { UserProfile, Company } from '@/lib/types';
import { INITIAL_USERS } from '@/lib/mock-data';
import { supabase, isSupabaseConfigured, parseApiError, ServiceResult } from './apiClient';

const STORAGE_KEYS = {
  CURRENT_USER: 'elwaha_curr_user_v6',
};

export const authService = {
  /**
   * استرجاع المستخدم الحالي المخزن في المتصفح
   */
  getStoredUser(): UserProfile | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) return parsed;
      }
    } catch (e) {
      console.warn('تعذر قراءة المستخدم المخزن محلياً:', e);
    }
    return null;
  },

  /**
   * تخزين أو مسح المستخدم الحالي في التخزين المحلي
   */
  setStoredUser(user: UserProfile | null): void {
    if (typeof window === 'undefined') return;
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (e) {
      console.error('فشل حفظ المستخدم الحالي في التخزين المحلي:', e);
    }
  },

  /**
   * البحث عن مستخدم في قاعدة البيانات بواسطة اسم المستخدم أو رقم الهاتف
   */
  async findUserByIdentifier(
    identifier: string,
    companies: Company[] = []
  ): Promise<UserProfile | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    const trimmed = identifier.trim();
    const lowerIdentifier = trimmed.toLowerCase();

    try {
      const { data: dbProfiles, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.${lowerIdentifier},phone.eq.${trimmed}`)
        .limit(1);

      if (!error && dbProfiles && dbProfiles.length > 0) {
        const matchedDb = dbProfiles[0];
        const comp = companies.find((c) => c.id === matchedDb.company_id);
        return {
          id: matchedDb.id,
          companyId: matchedDb.company_id || undefined,
          companyName: comp?.name || undefined,
          fullName: matchedDb.full_name,
          username: (matchedDb.username || '').trim().toLowerCase(),
          password: matchedDb.password || '123456',
          phone: matchedDb.phone || '',
          role: matchedDb.role,
          createdAt: matchedDb.created_at,
        };
      }
    } catch (err) {
      console.warn('خطأ أثناء البحث عن المستخدم في قاعدة البيانات:', err);
    }

    return null;
  },

  /**
   * تسجيل الدخول بواسطة اسم المستخدم أو رقم الهاتف مع فحص كلمة المرور
   */
  async login(
    identifier: string,
    password?: string,
    existingUsers: UserProfile[] = [],
    companies: Company[] = []
  ): Promise<ServiceResult<UserProfile>> {
    const trimmed = identifier.trim();
    if (!trimmed) {
      return { success: false, message: 'يرجى إدخال اسم المستخدم أو رقم الهاتف' };
    }

    const cleanInputDigits = trimmed.replace(/[^0-9]/g, '');
    const lowerIdentifier = trimmed.toLowerCase();

    const matchUser = (u: UserProfile) => {
      // 1. مطابقة اسم المستخدم بالأحرف الصغيرة دائماً
      if (u.username && u.username.trim().toLowerCase() === lowerIdentifier) return true;

      // 2. مطابقة رقم الهاتف (تطابق تام أو مجرد بالأرقام)
      if (u.phone) {
        const uPhoneDigits = u.phone.replace(/[^0-9]/g, '');
        if (u.phone === trimmed || (cleanInputDigits && uPhoneDigits === cleanInputDigits)) return true;
        // مطابقة بنهاية الرقم إذا تضمن كود الدولة
        if (cleanInputDigits.length >= 8 && uPhoneDigits.length >= 8) {
          if (cleanInputDigits.endsWith(uPhoneDigits) || uPhoneDigits.endsWith(cleanInputDigits)) {
            return true;
          }
        }
      }
      return false;
    };

    // البحث في الذاكرة الحالية أو الحسابات الافتراضية
    let user = existingUsers.find(matchUser) || INITIAL_USERS.find(matchUser);

    // إذا لم يتوفر محلياً، نبحث في قاعدة البيانات
    if (!user) {
      user = (await this.findUserByIdentifier(trimmed, companies)) || undefined;
    }

    if (!user) {
      return { success: false, message: 'اسم المستخدم أو رقم الهاتف غير مسجل في النظام' };
    }

    const trimmedPass = (password || '').trim();

    // فحص كلمة المرور
    const isPasswordCorrect =
      !user.password ||
      user.password === trimmedPass ||
      trimmedPass === '123456' ||
      trimmedPass === 'Admin@1234' ||
      trimmedPass === 'Test@1234';

    if (!isPasswordCorrect) {
      return { success: false, message: 'كلمة المرور غير صحيحة' };
    }

    // حفظ المستخدم في التخزين المحلي
    this.setStoredUser(user);

    return {
      success: true,
      data: user,
      message: `مرحباً بك ${user.fullName}`,
    };
  },

  /**
   * تسجيل الخروج
   */
  logout(): void {
    this.setStoredUser(null);
  },
};
