import { Building } from '@/lib/types';
import { apiClient, ServiceResult } from './apiClient';

export const buildingService = {
  /**
   * جلب مباني الشركة عبر الـ API
   */
  async fetchBuildings(): Promise<Building[]> {
    const res = await apiClient.get<Building[]>('/buildings');
    if (res.success && res.data) {
      return res.data;
    }
    return [];
  },

  /**
   * إضافة مبنى جديد
   */
  async createBuilding(
    bData: Omit<Building, 'id'>
  ): Promise<ServiceResult<Building>> {
    const res = await apiClient.post<Building>('/buildings', bData);
    return {
      success: res.success,
      data: res.data,
      message: res.message || res.error,
    };
  },

  /**
   * تعديل مبنى (نقله لمنطقة أخرى / رقم القطعة / مساحة الأرض / المميزات / الملاحظات)
   */
  async updateBuilding(
    id: number,
    payload: {
      zoneId?: number;
      plotNo?: number;
      landArea?: number;
      features?: string[];
      notes?: string;
    }
  ): Promise<ServiceResult> {
    return apiClient.patch(`/buildings/${id}`, payload);
  },

  /**
   * حذف مبنى — الخادم يمنع الحذف إن وُجدت وحدات تابعة
   */
  async deleteBuilding(id: number): Promise<ServiceResult> {
    return apiClient.delete(`/buildings/${id}`);
  },

  /**
   * تحديث إحداثيات المبنى على الخريطة
   */
  async updateBuildingCoords(id: number, mapX: number, mapY: number): Promise<ServiceResult> {
    const res = await apiClient.patch(`/buildings/${id}/coords`, { mapX, mapY });
    return {
      success: res.success,
      message: res.message || res.error,
    };
  },
};
