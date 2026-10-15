import { UserProfile, Company } from '@/lib/types';
import { supabase, isSupabaseConfigured, parseApiError, generateUUID, ServiceResult } from './apiClient';

export const userService = {
  /**
   * جلب قائمة المستخدمين والملفات الشخصية من قاعدة البيانات
   */
  async fetchProfiles(companies: Company[] = []): Promise<UserProfile[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    try {
      const { data: dbProfiles, error } = await supabase.from('profiles').select('*');

      if (error) {
        console.error('فشل جلب المستخدمين من قاعدة البيانات:', error);
        return [];
      }

      if (dbProfiles && dbProfiles.length > 0) {
        return dbProfiles.map((p: any) => {
          const comp = companies.find((c) => c.id === p.company_id);
          return {
            id: p.id,
            companyId: p.company_id || undefined,
            companyName: comp?.name || undefined,
            fullName: p.full_name,
            username: (p.username || '').trim().toLowerCase(),
            password: p.password || '',
            phone: p.phone || '',
            role: p.role,
            createdAt: p.created_at,
          };
        });
      }
    } catch (err) {
      console.warn('خطأ أثناء جلب المستخدمين:', err);
    }

    return [];
  },

  /**
   * إضافة مستخدم جديد للنظام مع التحقق من تكرار اسم المستخدم ورقم الهاتف
   */
  async createUser(
    userData: Omit<UserProfile, 'id' | 'createdAt'>,
    currentUser: UserProfile | null,
    existingUsers: UserProfile[] = [],
    companies: Company[] = []
  ): Promise<ServiceResult<UserProfile>> {
    const newUserId = generateUUID();
    const cleanUsername = userData.username.trim().toLowerCase();
    const cleanPhone = (userData.phone || '').trim();

    // تحديد الشركة والدور:
    // إذا كان المستخدم الحالي مدير شركة، فيتم إلزام المستخدم الجديد بالشركة وبدور 'user' (وسيط)
    let assignedCompanyId = userData.companyId;
    let assignedRole = userData.role;

    if (currentUser?.role === 'company_admin' || currentUser?.role === 'admin') {
      assignedCompanyId = currentUser.companyId;
      assignedRole = 'user'; // مدير الشركة يضيف وسطاء فقط لشركته
    }

    const assignedCompany = companies.find((c) => c.id === assignedCompanyId);

    // 1. التحقق من فرادة اسم المستخدم محلياً
    const existingUsername = existingUsers.find((u) => u.username.toLowerCase() === cleanUsername);
    if (existingUsername) {
      return { success: false, message: 'اسم المستخدم هذا مسجل مسبقاً، يرجى اختيار اسم مستخدم آخر.' };
    }

    // 2. التحقق من فرادة رقم الهاتف محلياً
    if (cleanPhone) {
      const existingPhone = existingUsers.find((u) => u.phone && u.phone.trim() === cleanPhone);
      if (existingPhone) {
        return {
          success: false,
          message: `رقم الهاتف (${cleanPhone}) مسجل مسبقاً للمستخدم "${existingPhone.fullName}"، يجب أن يكون رقم الهاتف فريداً لكل حساب.`,
        };
      }
    }

    // 3. الحفظ في قاعدة بيانات سوبابيز
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('profiles').insert({
          id: newUserId,
          company_id: assignedCompanyId || null,
          full_name: userData.fullName,
          username: cleanUsername,
          password: userData.password,
          phone: cleanPhone || null,
          role: assignedRole,
        });

        if (error) {
          return { success: false, message: parseApiError(error) };
        }
      } catch (err: any) {
        return { success: false, message: parseApiError(err) };
      }
    }

    const newUser: UserProfile = {
      ...userData,
      id: newUserId,
      companyId: assignedCompanyId,
      companyName: assignedCompany?.name,
      role: assignedRole,
      username: cleanUsername,
      phone: cleanPhone,
      createdAt: new Date().toISOString(),
    };

    return {
      success: true,
      data: newUser,
      message: 'تم إنشاء الحساب الجديد بنجاح',
    };
  },

  /**
   * تحديث بيانات الملف الشخصي لمستخدم
   */
  async updateUserProfile(
    id: string,
    updates: Partial<UserProfile>,
    existingUsers: UserProfile[] = []
  ): Promise<ServiceResult> {
    const cleanUpdates = { ...updates };
    if (cleanUpdates.username) {
      cleanUpdates.username = cleanUpdates.username.trim().toLowerCase();
    }
    if (cleanUpdates.phone !== undefined) {
      cleanUpdates.phone = cleanUpdates.phone.trim();
    }

    // 1. التحقق من فرادة اسم المستخدم محلياً
    if (cleanUpdates.username) {
      const dupUser = existingUsers.find(
        (u) => u.id !== id && u.username.toLowerCase() === cleanUpdates.username
      );
      if (dupUser) {
        return { success: false, message: 'اسم المستخدم مسجل مسبقاً لحساب آخر، يرجى اختيار اسم آخر.' };
      }
    }

    // 2. التحقق من فرادة رقم الهاتف محلياً
    if (cleanUpdates.phone) {
      const dupPhone = existingUsers.find(
        (u) => u.id !== id && u.phone && u.phone.trim() === cleanUpdates.phone
      );
      if (dupPhone) {
        return {
          success: false,
          message: `رقم الهاتف (${cleanUpdates.phone}) مسجل مسبقاً لحساب "${dupPhone.fullName}"، يجب أن يكون فريداً.`,
        };
      }
    }

    // 3. التحديث في قاعدة البيانات
    if (isSupabaseConfigured && supabase) {
      try {
        const dbUpdates: any = {};
        if (cleanUpdates.fullName !== undefined) dbUpdates.full_name = cleanUpdates.fullName;
        if (cleanUpdates.username !== undefined) dbUpdates.username = cleanUpdates.username;
        if (cleanUpdates.phone !== undefined) dbUpdates.phone = cleanUpdates.phone || null;
        if (cleanUpdates.password !== undefined) dbUpdates.password = cleanUpdates.password;
        if (cleanUpdates.role !== undefined) dbUpdates.role = cleanUpdates.role;

        const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', id);
        if (error) {
          return { success: false, message: parseApiError(error) };
        }
      } catch (err: any) {
        return { success: false, message: parseApiError(err) };
      }
    }

    return { success: true, message: 'تم تحديث الملف الشخصي بنجاح' };
  },

  /**
   * تغيير أو إعادة تعيين كلمة المرور
   */
  async updateUserPassword(id: string, newPass: string): Promise<ServiceResult> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('profiles').update({ password: newPass }).eq('id', id);
        if (error) {
          return { success: false, message: parseApiError(error) };
        }
      } catch (err: any) {
        return { success: false, message: parseApiError(err) };
      }
    }

    return { success: true, message: 'تم تحديث كلمة المرور بنجاح' };
  },

  /**
   * حذف مستخدم
   */
  async deleteUser(id: string): Promise<ServiceResult> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) {
          return { success: false, message: parseApiError(error) };
        }
      } catch (err: any) {
        return { success: false, message: parseApiError(err) };
      }
    }

    return { success: true, message: 'تم حذف المستخدم بنجاح' };
  },
};
