import { Unit, UnitStatus, UnitHistory } from '@/lib/types';
import { apiClient, ServiceResult } from './apiClient';

export const unitService = {
  /**
   * جلب قائمة الوحدات العقارية عبر الـ API
   */
  async fetchUnits(): Promise<Unit[]> {
    const res = await apiClient.get<Unit[]>('/units');
    if (res.success && res.data) {
      return res.data;
    }
    return [];
  },

  /**
   * إضافة وحدة عقارية جديدة
   */
  async createUnit(
    unitData: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ServiceResult<Unit>> {
    const res = await apiClient.post<Unit>('/units', unitData);
    return {
      success: res.success,
      data: res.data,
      message: res.message || res.error,
    };
  },

  /**
   * تحديث تفاصيل الوحدة العقارية
   */
  async updateUnit(
    id: string,
    updates: Partial<Unit>
  ): Promise<ServiceResult> {
    const res = await apiClient.put(`/units/${id}`, updates);
    return {
      success: res.success,
      message: res.message || res.error,
    };
  },

  /**
   * تحديث حالة الوحدة العقارية
   */
  async updateUnitStatus(
    id: string,
    status: UnitStatus,
    oldStatus?: UnitStatus
  ): Promise<ServiceResult> {
    const res = await apiClient.patch(`/units/${id}/status`, { status, oldStatus });
    return {
      success: res.success,
      message: res.message || res.error,
    };
  },

  /**
   * جلب سجل وتاريخ تعديلات الوحدة العقارية
   */
  async fetchUnitHistory(unitId: string): Promise<UnitHistory[]> {
    const res = await apiClient.get<UnitHistory[]>(`/units/${unitId}/history`);
    if (res.success && res.data) {
      return res.data;
    }
    return [];
  },

  /**
   * حذف وحدة عقارية
   */
  async deleteUnit(id: string): Promise<ServiceResult> {
    const res = await apiClient.delete(`/units/${id}`);
    return {
      success: res.success,
      message: res.message || res.error,
    };
  },
};
