import { UserProfile } from '@/lib/types';
import { apiClient, ServiceResult } from './apiClient';

export const userService = {
  /**
   * جلب قائمة المستخدمين عبر الـ API
   */
  async fetchProfiles(): Promise<UserProfile[]> {
    const res = await apiClient.get<UserProfile[]>('/users');
    if (res.success && res.data) {
      return res.data;
    }
    return [];
  },

  /**
   * إضافة مستخدم جديد للنظام مع تشفير كلمة المرور في الخادم
   */
  async createUser(
    userData: Omit<UserProfile, 'id' | 'createdAt'>
  ): Promise<ServiceResult<UserProfile>> {
    const res = await apiClient.post<UserProfile>('/users', userData);
    return {
      success: res.success,
      data: res.data,
      message: res.message || res.error,
    };
  },

  /**
   * تحديث بيانات المستخدم
   */
  async updateUser(
    id: string,
    updates: Partial<UserProfile>
  ): Promise<ServiceResult> {
    const res = await apiClient.put(`/users/${id}`, updates);
    return {
      success: res.success,
      message: res.message || res.error,
    };
  },

  /**
   * تحديث كلمة مرور المستخدم (يتم تشفيرها في السيرفر)
   */
  async updatePassword(id: string, newPass: string): Promise<ServiceResult> {
    const res = await apiClient.put(`/users/${id}`, { password: newPass });
    return {
      success: res.success,
      message: res.message || res.error,
    };
  },

  /**
   * حذف مستخدم من النظام
   */
  async deleteUser(id: string): Promise<ServiceResult> {
    const res = await apiClient.delete(`/users/${id}`);
    return {
      success: res.success,
      message: res.message || res.error,
    };
  },
};
