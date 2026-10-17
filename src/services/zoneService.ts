import { Zone, Service } from '@/lib/types';
import { apiClient, ServiceResult } from './apiClient';

export const zoneService = {
  /**
   * جلب المناطق المركزية عبر الـ API
   */
  async fetchZones(): Promise<Zone[]> {
    const res = await apiClient.get<Zone[]>('/zones');
    if (res.success && res.data) {
      return res.data;
    }
    return [];
  },

  /**
   * جلب الخدمات والمرافق
   */
  async fetchServices(): Promise<Service[]> {
    // تم إلغاء جدول الخدمات واستبدالها بنظام المميزات
    return [];
  },

  /**
   * إضافة خدمة جديدة
   */
  async createService(sData: Omit<Service, 'id'>): Promise<ServiceResult<Service>> {
    return {
      success: true,
      data: { ...sData, id: Date.now() },
    };
  },
};
