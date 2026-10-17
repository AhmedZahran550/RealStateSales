import { Company } from '@/lib/types';
import { apiClient, ServiceResult } from './apiClient';

export const companyService = {
  /**
   * جلب قائمة الشركات العقارية عبر الـ API
   */
  async fetchCompanies(): Promise<Company[]> {
    const res = await apiClient.get<Company[]>('/companies');
    if (res.success && res.data) {
      return res.data;
    }
    return [];
  },

  /**
   * إضافة شركة عقارية جديدة
   */
  async createCompany(
    data: Omit<Company, 'id' | 'createdAt'>
  ): Promise<ServiceResult<Company>> {
    const res = await apiClient.post<Company>('/companies', data);
    return {
      success: res.success,
      data: res.data,
      message: res.message || res.error,
    };
  },

  /**
   * تحديث بيانات شركة عقارية
   */
  async updateCompany(
    id: string,
    updates: Partial<Company>
  ): Promise<ServiceResult> {
    const res = await apiClient.put(`/companies/${id}`, updates);
    return {
      success: res.success,
      message: res.message || res.error,
    };
  },

  /**
   * حذف شركة عقارية
   */
  async deleteCompany(id: string): Promise<ServiceResult> {
    const res = await apiClient.delete(`/companies/${id}`);
    return {
      success: res.success,
      message: res.message || res.error,
    };
  },
};
