import { Building } from '@/lib/types';
import { apiClient, ServiceResult } from './apiClient';

export const buildingService = {
  /**
   * جلب المباني عبر الـ API
   */
  async fetchBuildings(): Promise<Building[]> {
    const res = await apiClient.get<Building[]>('/buildings');
    if (res.success && res.data) {
      return res.data;
    }
    return [];
  },

  /**
   * إضافة أو تحديث مبنى
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
   * تحديث إحداثيات موقع المبنى على الخريطة
   */
  async updateBuildingCoords(id: number, mapX: number, mapY: number): Promise<ServiceResult> {
    const res = await apiClient.patch(`/buildings/${id}/coords`, { mapX, mapY });
    return {
      success: res.success,
      message: res.message || res.error,
    };
  },
};
