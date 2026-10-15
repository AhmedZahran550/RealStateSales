import { Company } from '@/lib/types';
import { supabase, isSupabaseConfigured, parseApiError, generateUUID, ServiceResult } from './apiClient';

export const companyService = {
  /**
   * جلب قائمة الشركات العقارية من قاعدة البيانات
   */
  async fetchCompanies(): Promise<Company[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('فشل جلب الشركات من قاعدة البيانات:', error);
        return [];
      }

      if (data && data.length > 0) {
        return data.map((c: any) => ({
          id: c.id,
          name: c.name,
          commercialName: c.commercial_name || undefined,
          logoUrl: c.logo_url || undefined,
          phone: c.phone || undefined,
          email: c.email || undefined,
          address: c.address || undefined,
          isActive: c.is_active ?? true,
          createdAt: c.created_at,
        }));
      }
    } catch (err) {
      console.warn('خطأ أثناء جلب الشركات:', err);
    }
    return [];
  },

  /**
   * إضافة شركة عقارية جديدة
   */
  async createCompany(
    data: Omit<Company, 'id' | 'createdAt'>
  ): Promise<ServiceResult<Company>> {
    const newId = generateUUID();
    const newCompany: Company = {
      ...data,
      id: newId,
      isActive: data.isActive ?? true,
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('companies').insert({
          id: newId,
          name: data.name,
          commercial_name: data.commercialName || null,
          logo_url: data.logoUrl || null,
          phone: data.phone || null,
          email: data.email || null,
          address: data.address || null,
          is_active: data.isActive ?? true,
        });

        if (error) {
          return { success: false, message: parseApiError(error) };
        }
      } catch (err: any) {
        return { success: false, message: parseApiError(err) };
      }
    }

    return {
      success: true,
      data: newCompany,
      message: 'تم إضافة الشركة بنجاح',
    };
  },

  /**
   * تحديث بيانات شركة عقارية
   */
  async updateCompany(
    id: string,
    updates: Partial<Company>
  ): Promise<ServiceResult> {
    if (isSupabaseConfigured && supabase) {
      try {
        const dbUpdates: any = { updated_at: new Date().toISOString() };
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.commercialName !== undefined) dbUpdates.commercial_name = updates.commercialName;
        if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.address !== undefined) dbUpdates.address = updates.address;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

        const { error } = await supabase.from('companies').update(dbUpdates).eq('id', id);
        if (error) {
          return { success: false, message: parseApiError(error) };
        }
      } catch (err: any) {
        return { success: false, message: parseApiError(err) };
      }
    }

    return { success: true, message: 'تم تحديث بيانات الشركة بنجاح' };
  },

  /**
   * حذف شركة عقارية
   */
  async deleteCompany(id: string): Promise<ServiceResult> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('companies').delete().eq('id', id);
        if (error) {
          return { success: false, message: parseApiError(error) };
        }
      } catch (err: any) {
        return { success: false, message: parseApiError(err) };
      }
    }

    return { success: true, message: 'تم حذف الشركة بنجاح' };
  },
};
