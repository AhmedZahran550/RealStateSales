import { Building, Company, UserProfile } from '@/lib/types';
import { supabase, isSupabaseConfigured, parseApiError, ServiceResult } from './apiClient';

export const buildingService = {
  /**
   * جلب المباني مع تصفيتها بالشركة إن وجدت
   */
  async fetchBuildings(companyId?: string, companies: Company[] = []): Promise<Building[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    try {
      let bldQuery = supabase.from('buildings').select('*');
      if (companyId) {
        bldQuery = bldQuery.eq('company_id', companyId);
      }
      const { data: dbBuildings, error: bldError } = await bldQuery;

      if (!bldError && dbBuildings && dbBuildings.length > 0) {
        return dbBuildings.map((b: any) => {
          const comp = companies.find((c) => c.id === b.company_id);
          return {
            id: Number(b.id),
            companyId: b.company_id || undefined,
            companyName: comp?.name || undefined,
            zoneId: Number(b.zone_id),
            plotNo: Number(b.plot_no),
            landArea: b.land_area ? Number(b.land_area) : undefined,
            features: b.features || [],
            mapX: b.map_x ? Number(b.map_x) : undefined,
            mapY: b.map_y ? Number(b.map_y) : undefined,
            notes: b.notes || undefined,
          };
        });
      }
    } catch (err) {
      console.warn('خطأ أثناء جلب المباني:', err);
    }

    return [];
  },

  /**
   * إضافة أو تحديث مبنى
   */
  async createBuilding(
    bData: Omit<Building, 'id'>,
    currentUser: UserProfile | null,
    companies: Company[] = []
  ): Promise<ServiceResult<Building>> {
    const compId = bData.companyId || currentUser?.companyId || undefined;
    const comp = companies.find((c) => c.id === compId);
    const newId = Date.now();

    const newBuilding: Building = {
      ...bData,
      id: newId,
      companyId: compId,
      companyName: comp?.name || bData.companyName,
      features: bData.features || [],
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('buildings').upsert({
          id: newId,
          company_id: compId || null,
          zone_id: bData.zoneId,
          plot_no: bData.plotNo,
          land_area: bData.landArea || null,
          features: bData.features || [],
          map_x: bData.mapX || null,
          map_y: bData.mapY || null,
          notes: bData.notes || null,
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
      data: newBuilding,
      message: 'تم حفظ بيانات المبنى بنجاح',
    };
  },

  /**
   * تحديث إحداثيات موقع المبنى على الخريطة
   */
  async updateBuildingCoords(id: number, mapX: number, mapY: number): Promise<ServiceResult> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('buildings')
          .update({ map_x: mapX, map_y: mapY })
          .eq('id', id);

        if (error) {
          return { success: false, message: parseApiError(error) };
        }
      } catch (err: any) {
        return { success: false, message: parseApiError(err) };
      }
    }

    return { success: true, message: 'تم تحديث موقع المبنى على الخريطة' };
  },
};
