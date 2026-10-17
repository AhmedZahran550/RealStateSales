import { UserProfile, Company } from '@/lib/types';
import { supabase, isSupabaseConfigured, parseApiError, ServiceResult } from './apiClient';

const SESSION_KEY = 'elwaha_session_user';

export const authService = {
  /**
   * استرجاع المستخدم الحالي من جلسة المتصفح
   */
  getStoredUser(): UserProfile | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) return parsed;
      }
    } catch (e) {
      console.warn('تعذر قراءة جلسة المستخدم:', e);
    }
    return null;
  },

  /**
   * تخزين أو مسح جلسة المستخدم الحالي
   */
  setStoredUser(user: UserProfile | null): void {
    if (typeof window === 'undefined') return;
    try {
      if (user) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      } else {
        sessionStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_KEY);
      }
    } catch (e) {
      console.error('فشل حفظ جلسة المستخدم:', e);
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
          password: matchedDb.password || '',
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
   * تسجيل الدخول بواسطة اسم المستخدم أو رقم الهاتف مع فحص كلمة المرور من قاعدة البيانات مباشرة
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

    // جلب المستخدم حصراً ومباشرة من قاعدة البيانات
    const user = await this.findUserByIdentifier(trimmed, companies);

    if (!user) {
      return { success: false, message: 'اسم المستخدم أو رقم الهاتف غير مسجل في النظام' };
    }

    const trimmedPass = (password || '').trim();

    // فحص كلمة المرور الحقيقية من قاعدة البيانات مباشرة
    const isPasswordCorrect = user.password === trimmedPass;

    if (!isPasswordCorrect) {
      return { success: false, message: 'كلمة المرور غير صحيحة' };
    }

    // حفظ المستخدم في جلسة المتصفح
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
