import { Zone, Service } from '@/lib/types';
import { supabase, isSupabaseConfigured, parseApiError, ServiceResult } from './apiClient';

export const zoneService = {
  /**
   * جلب المناطق المركزية
   */
  async fetchZones(): Promise<Zone[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    try {
      const { data: dbZones, error: zoneError } = await supabase
        .from('zones')
        .select('*')
        .order('id', { ascending: true });

      if (!zoneError && dbZones && dbZones.length > 0) {
        return dbZones.map((z: any) => ({
          id: Number(z.id),
          name: z.name,
          direction: z.direction || '',
          mapX: z.map_x ? Number(z.map_x) : 50,
          mapY: z.map_y ? Number(z.map_y) : 50,
          notes: z.notes || undefined,
        }));
      }
    } catch (err) {
      console.warn('خطأ أثناء جلب المناطق:', err);
    }

    return [];
  },

  /**
   * جلب الخدمات والمرافق
   */
  async fetchServices(): Promise<Service[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    try {
      const { data: dbServices, error: srvError } = await supabase
        .from('services')
        .select('*');

      if (!srvError && dbServices && dbServices.length > 0) {
        return dbServices.map((s: any) => ({
          id: Number(s.id),
          name: s.name,
          category: s.category,
          notes: s.notes || undefined,
        }));
      }
    } catch (err) {
      console.warn('خطأ أثناء جلب الخدمات:', err);
    }

    return [];
  },

  /**
   * إضافة خدمة جديدة
   */
  async createService(sData: Omit<Service, 'id'>): Promise<ServiceResult<Service>> {
    const newId = Date.now();
    const newService: Service = {
      ...sData,
      id: newId,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('services').upsert({
          name: sData.name,
          category: sData.category,
          notes: sData.notes || null,
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
      data: newService,
      message: 'تم إضافة الخدمة بنجاح',
    };
  },
};
