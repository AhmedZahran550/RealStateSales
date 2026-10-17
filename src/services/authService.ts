import { UserProfile, Company } from '@/lib/types';
import { apiClient, ServiceResult } from './apiClient';

export const authService = {
  /**
   * استرجاع المستخدم الحالي بالتحقق من الـ API والـ JWT Cookie
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    const res = await apiClient.get<UserProfile>('/auth/me');
    if (res.success && res.data) {
      return res.data;
    }
    return null;
  },

  /**
   * تسجيل الدخول بواسطة اسم المستخدم أو رقم الهاتف
   */
  async login(
    identifier: string,
    password?: string
  ): Promise<ServiceResult<UserProfile>> {
    const trimmed = identifier.trim();
    if (!trimmed) {
      return { success: false, message: 'يرجى إدخال اسم المستخدم أو رقم الهاتف' };
    }

    const res = await apiClient.post<UserProfile>('/auth/login', {
      identifier: trimmed,
      password: (password || '').trim(),
    });

    if (!res.success || !res.data) {
      return {
        success: false,
        message: res.error || res.message || 'فشل تسجيل الدخول',
      };
    }

    return {
      success: true,
      data: res.data,
      message: res.message || `مرحباً بك ${res.data.fullName}`,
    };
  },

  /**
   * تسجيل الخروج
   */
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },
};
