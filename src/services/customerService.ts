import { Customer, CustomerStage, ActivityType } from '@/lib/types';
import { apiClient, ServiceResult } from './apiClient';

export const customerService = {
  /**
   * جلب عملاء الوسيط العقاري عبر الـ API
   */
  async fetchCustomers(): Promise<Customer[]> {
    const res = await apiClient.get<Customer[]>('/customers');
    if (res.success && res.data) {
      return res.data;
    }
    return [];
  },

  /**
   * إضافة عميل جديد
   */
  async createCustomer(
    customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'activities'>
  ): Promise<ServiceResult<Customer>> {
    const res = await apiClient.post<Customer>('/customers', customerData);
    return {
      success: res.success,
      data: res.data,
      message: res.message || res.error,
    };
  },

  /**
   * تحديث بيانات عميل
   */
  async updateCustomer(
    id: string,
    updates: Partial<Customer>
  ): Promise<ServiceResult> {
    const res = await apiClient.put(`/customers/${id}`, updates);
    return {
      success: res.success,
      message: res.message || res.error,
    };
  },

  /**
   * تحديث مرحلة العميل وتسجيل ملاحظة
   */
  async updateStage(
    id: string,
    stage: CustomerStage,
    note?: string
  ): Promise<ServiceResult> {
    const res = await apiClient.patch(`/customers/${id}/stage`, { stage, note });
    return {
      success: res.success,
      message: res.message || res.error,
    };
  },

  /**
   * إضافة نشاط أو متابعة للعميل
   */
  async addActivity(
    customerId: string,
    type: ActivityType,
    note: string
  ): Promise<ServiceResult> {
    const res = await apiClient.post(`/customers/${customerId}/activities`, { type, note });
    return {
      success: res.success,
      data: res.data,
      message: res.message || res.error,
    };
  },

  /**
   * حذف عميل
   */
  async deleteCustomer(id: string): Promise<ServiceResult> {
    const res = await apiClient.delete(`/customers/${id}`);
    return {
      success: res.success,
      message: res.message || res.error,
    };
  },
};
