import {
  CompanyPublicSettings,
  GalleryItem,
  PublicReservation,
} from '@/lib/types';
import { apiClient, ServiceResult } from './apiClient';

export interface PublicPageData {
  company: {
    id: string;
    name: string;
    commercialName?: string;
    logoUrl?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  settings: CompanyPublicSettings;
  units: import('@/lib/types').PublicUnit[];
  gallery: GalleryItem[];
}

export const publicPageService = {
  /**
   * جلب بيانات الصفحة العامة (شركة + إعدادات + وحدات + أعمال سابقة)
   */
  async fetchPublicPage(companyId: string): Promise<ServiceResult<PublicPageData>> {
    return apiClient.get<PublicPageData>(`/public/companies/${companyId}`);
  },

  /**
   * إرسال حجز جديد من الزائر (بدون تسجيل دخول)
   */
  async submitReservation(payload: {
    companyId: string;
    unitId: string;
    customerName: string;
    phone: string;
    preferredDate: string;
    period: string;
    note?: string;
  }): Promise<ServiceResult> {
    return apiClient.post('/public/reservations', payload);
  },

  /**
   * جلب إعدادات الصفحة العامة للشركة الحالية (يتطلب تسجيل دخول)
   */
  async fetchSettings(): Promise<ServiceResult<CompanyPublicSettings>> {
    return apiClient.get<CompanyPublicSettings>('/company-public-settings');
  },

  /**
   * تحديث إعدادات الصفحة العامة للشركة الحالية (مدير الشركة)
   */
  async updateSettings(
    updates: Partial<CompanyPublicSettings>
  ): Promise<ServiceResult<CompanyPublicSettings>> {
    return apiClient.put<CompanyPublicSettings>('/company-public-settings', updates);
  },

  /**
   * جلب معرض أعمال سابقة للشركة الحالية
   */
  async fetchGallery(): Promise<ServiceResult<GalleryItem[]>> {
    return apiClient.get<GalleryItem[]>('/company-gallery');
  },

  /**
   * إضافة عنصر جديد لمعرض أعمال سابقة (مدير الشركة)
   */
  async addGalleryItem(payload: {
    buildingId?: string; // الأعمال السابقة = مبانٍ
    title?: string;
    description?: string;
    price?: number;
    images: string[];
    companyId?: string; // لسوبر أدمن فقط
  }): Promise<ServiceResult<GalleryItem>> {
    return apiClient.post<GalleryItem>('/company-gallery', payload);
  },

  /**
   * حذف عنصر من معرض أعمال سابقة
   */
  async deleteGalleryItem(id: string): Promise<ServiceResult> {
    return apiClient.delete(`/company-gallery/${id}`);
  },

  /**
   * جلب الحجوزات العامة لفريق الشركة
   */
  async fetchReservations(): Promise<ServiceResult<PublicReservation[]>> {
    return apiClient.get<PublicReservation[]>('/public-reservations');
  },

  /**
   * استلام متابعة حجز عام أو إسناده لموظف (إنشاء عميل CRM + قفل الحجز)
   */
  async claimReservation(id: string, targetUserId?: string): Promise<ServiceResult> {
    return apiClient.post(`/public-reservations/${id}/claim`, { targetUserId });
  },

  /**
   * حذف حجز عام (مدير الشركة أو السوبر أدمن)
   */
  async deleteReservation(id: string): Promise<ServiceResult> {
    return apiClient.delete(`/public-reservations/${id}`);
  },
};
