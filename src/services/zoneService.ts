import { Zone, Service } from '@/lib/types';
import { apiClient, ServiceResult } from './apiClient';

export const zoneService = {
  /**
   * جلب مناطق الشركة الحالية عبر الـ API (كل شركة ترى مناطقها فقط)
   */
  async fetchZones(companyId?: string): Promise<Zone[]> {
    const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
    const res = await apiClient.get<Zone[]>(`/zones${query}`);
    if (res.success && res.data) {
      return res.data;
    }
    return [];
  },

  /**
   * إضافة منطقة (رئيسية) أو منطقة فرعية تحت منطقة رئيسية
   */
  async createZone(payload: {
    name: string;
    direction?: string;
    mapX?: number;
    mapY?: number;
    notes?: string;
    /** معرف المنطقة الرئيسية عند إضافة منطقة فرعية */
    parentId?: number | null;
    companyId?: string; // لسوبر أدمن فقط
  }): Promise<ServiceResult<Zone>> {
    return apiClient.post<Zone>('/zones', payload);
  },

  /**
   * تعديل منطقة (اسم/اتجاه/ملاحظات)
   */
  async updateZone(
    id: number,
    payload: { name?: string; direction?: string; notes?: string }
  ): Promise<ServiceResult> {
    return apiClient.patch(`/zones/${id}`, payload);
  },

  /**
   * حذف منطقة — الخادم يمنع الحذف إن وُجدت مبانٍ/وحدات تابعة
   */
  async deleteZone(id: number): Promise<ServiceResult> {
    return apiClient.delete(`/zones/${id}`);
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
