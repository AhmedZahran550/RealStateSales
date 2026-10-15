import { Unit, UnitStatus, UserProfile, Company, UnitHistory } from '@/lib/types';
import { supabase, isSupabaseConfigured, parseApiError, generateUUID, ServiceResult } from './apiClient';

export const unitService = {
  /**
   * جلب الوحدات العقارية بحسب صلاحيات ودور المستخدم
   * - لمدير المنصة Super Admin: جلب خفيف للإحصائيات فقط
   * - لمدير الشركة والوسطاء: جلب تفصيلي لوحدات الشركة مع الصور والمميزات
   */
  async fetchUnits(user: UserProfile, companies: Company[] = []): Promise<Unit[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    const isSuper = user.role === 'super_admin';

    try {
      if (isSuper) {
        const { data: dbUnitsSummary, error: unitSummaryError } = await supabase
          .from('units')
          .select('id, company_id, status, price');

        if (!unitSummaryError && dbUnitsSummary) {
          return dbUnitsSummary.map((u: any) => {
            const comp = companies.find((c) => c.id === u.company_id);
            return {
              id: u.id,
              companyId: u.company_id || undefined,
              companyName: comp?.name || undefined,
              buildingId: 1,
              zoneId: 1,
              plotNo: 1,
              unitKind: 'floor_1' as const,
              area: 100,
              price: Number(u.price || 0),
              status: u.status || 'available',
              negotiable: false,
              deliveryNote: '',
              paymentTerms: '',
              media: [],
              features: [],
              createdAt: '',
              updatedAt: '',
            };
          });
        }
        return [];
      }

      // لمدير الشركة والوسطاء التابعين لها (الوحدات ملكية الشركة حصراً)
      let unitQuery = supabase.from('units').select(`
        *,
        buildings (zone_id, plot_no, features),
        unit_media (*)
      `);

      if (user.companyId) {
        unitQuery = unitQuery.eq('company_id', user.companyId);
      }

      const { data: dbUnits, error: unitError } = await unitQuery.order('created_at', {
        ascending: false,
      });

      if (!unitError && dbUnits) {
        return dbUnits.map((u: any) => {
          const comp = companies.find((c) => c.id === u.company_id);
          return {
            id: u.id,
            companyId: u.company_id || undefined,
            companyName: comp?.name || undefined,
            buildingId: Number(u.building_id),
            zoneId: u.buildings?.zone_id || 1,
            plotNo: u.buildings?.plot_no || 1,
            unitKind: u.unit_kind,
            floor: u.floor !== null && u.floor !== undefined ? Number(u.floor) : undefined,
            side: u.side || undefined,
            area: Number(u.area),
            gardenArea: u.garden_area ? Number(u.garden_area) : undefined,
            price: Number(u.price),
            negotiable: Boolean(u.negotiable),
            deliveryNote: u.delivery_note || '',
            paymentTerms: u.payment_terms || '',
            description: u.description || '',
            status: u.status || 'available',
            lat: u.lat ? Number(u.lat) : undefined,
            lng: u.lng ? Number(u.lng) : undefined,
            media: (u.unit_media || []).map((m: any) => ({
              id: m.id,
              unitId: m.unit_id,
              ownerId: m.owner_id,
              kind: m.kind || 'image',
              externalUrl: m.external_url,
              caption: m.caption || '',
              createdAt: m.created_at,
            })),
            features: u.features || [],
            createdAt: u.created_at,
            updatedAt: u.updated_at,
          };
        });
      }
    } catch (err) {
      console.warn('خطأ أثناء جلب الوحدات من قاعدة البيانات:', err);
    }

    return [];
  },

  /**
   * إنشاء وحدة عقارية جديدة (تتبع الشركة مباشرة بدون owner_id)
   */
  async createUnit(
    unitData: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>,
    currentUser: UserProfile,
    companies: Company[] = []
  ): Promise<ServiceResult<Unit>> {
    const isCompanyAdmin = currentUser.role === 'company_admin' || currentUser.role === 'admin';
    const isSuperAdmin = currentUser.role === 'super_admin';

    if (!isCompanyAdmin && !isSuperAdmin) {
      return { success: false, message: 'غير مسموح للوسيط بإضافة وحدات جديدة، هذه صلاحية مدير الشركة.' };
    }

    const newUnitId = generateUUID();
    const targetCompId = unitData.companyId || currentUser.companyId || undefined;
    const targetComp = companies.find((c) => c.id === targetCompId);

    const newUnit: Unit = {
      ...unitData,
      id: newUnitId,
      companyId: targetCompId,
      companyName: targetComp?.name || unitData.companyName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      features: unitData.features || [],
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('units').insert({
          id: newUnitId,
          company_id: targetCompId || null,
          building_id: unitData.buildingId,
          unit_kind: unitData.unitKind,
          floor: unitData.floor !== undefined ? unitData.floor : null,
          side: unitData.side || null,
          area: unitData.area,
          garden_area: unitData.gardenArea || null,
          price: unitData.price,
          negotiable: unitData.negotiable || false,
          delivery_note: unitData.deliveryNote || null,
          payment_terms: unitData.paymentTerms || null,
          description: unitData.description || null,
          status: unitData.status || 'available',
          lat: unitData.lat || null,
          lng: unitData.lng || null,
          features: unitData.features || [],
        });

        if (error) {
          return { success: false, message: parseApiError(error) };
        }

        if (unitData.media && unitData.media.length > 0) {
          const mediaRows = unitData.media.map((m) => ({
            id: generateUUID(),
            unit_id: newUnitId,
            owner_id: currentUser.id,
            kind: m.kind || 'image',
            external_url: m.externalUrl,
            caption: m.caption || '',
          }));
          await supabase.from('unit_media').insert(mediaRows);
        }

        // تسجيل في سجل تاريخ وتغييرات الوحدة (Unit History)
        await this.recordUnitChange({
          unitId: newUnitId,
          changedBy: currentUser.id,
          changeType: 'created',
          newStatus: unitData.status || 'available',
          details: `تمت إضافة الوحدة إلى محفظة الشركة بواسطة ${currentUser.fullName}`,
        });
      } catch (err: any) {
        return { success: false, message: parseApiError(err) };
      }
    }

    return {
      success: true,
      data: newUnit,
      message: 'تم إضافة الوحدة العقارية بنجاح',
    };
  },

  /**
   * تحديث بيانات وحدة عقارية
   */
  async updateUnit(
    id: string,
    updatedFields: Partial<Unit>,
    currentUser: UserProfile,
    currentUnit?: Unit
  ): Promise<ServiceResult> {
    const isCompanyAdmin = currentUser.role === 'company_admin' || currentUser.role === 'admin';
    const isSuperAdmin = currentUser.role === 'super_admin';

    // إذا كان المستخدم وسيطاً، يسمح له بتحديث الحالة فقط
    if (!isCompanyAdmin && !isSuperAdmin) {
      if (updatedFields.status !== undefined) {
        return this.updateUnitStatus(id, updatedFields.status, currentUser, currentUnit?.status);
      }
      return { success: false, message: 'غير مسموح للوسيط بتعديل تفاصيل الوحدة، يمكنه فقط تحديث الحالة.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const dbUpdate: any = { updated_at: new Date().toISOString() };
        if (updatedFields.status !== undefined) dbUpdate.status = updatedFields.status;
        if (updatedFields.price !== undefined) dbUpdate.price = updatedFields.price;
        if (updatedFields.area !== undefined) dbUpdate.area = updatedFields.area;
        if (updatedFields.floor !== undefined) dbUpdate.floor = updatedFields.floor;
        if (updatedFields.side !== undefined) dbUpdate.side = updatedFields.side;
        if (updatedFields.gardenArea !== undefined) dbUpdate.garden_area = updatedFields.gardenArea;
        if (updatedFields.negotiable !== undefined) dbUpdate.negotiable = updatedFields.negotiable;
        if (updatedFields.deliveryNote !== undefined) dbUpdate.delivery_note = updatedFields.deliveryNote;
        if (updatedFields.paymentTerms !== undefined) dbUpdate.payment_terms = updatedFields.paymentTerms;
        if (updatedFields.description !== undefined) dbUpdate.description = updatedFields.description;
        if (updatedFields.lat !== undefined) dbUpdate.lat = updatedFields.lat;
        if (updatedFields.lng !== undefined) dbUpdate.lng = updatedFields.lng;
        if (updatedFields.features !== undefined) dbUpdate.features = updatedFields.features;

        const { error } = await supabase.from('units').update(dbUpdate).eq('id', id);
        if (error) {
          return { success: false, message: parseApiError(error) };
        }

        if (updatedFields.media !== undefined) {
          await supabase.from('unit_media').delete().eq('unit_id', id);
          if (updatedFields.media.length > 0) {
            const mediaRows = updatedFields.media.map((m) => ({
              id: generateUUID(),
              unit_id: id,
              owner_id: currentUser?.id,
              kind: m.kind || 'image',
              external_url: m.externalUrl,
              caption: m.caption || '',
            }));
            await supabase.from('unit_media').insert(mediaRows);
          }
        }

        // توثيق التغييرات في سجل الوحدة
        if (updatedFields.status !== undefined && currentUnit && updatedFields.status !== currentUnit.status) {
          await this.recordUnitChange({
            unitId: id,
            changedBy: currentUser.id,
            changeType: 'status_change',
            oldStatus: currentUnit.status,
            newStatus: updatedFields.status,
            details: `تم تغيير الحالة من ${this.getStatusLabel(currentUnit.status)} إلى ${this.getStatusLabel(updatedFields.status)} بواسطة ${currentUser.fullName}`,
          });
        } else {
          await this.recordUnitChange({
            unitId: id,
            changedBy: currentUser.id,
            changeType: 'details_update',
            details: `تم تحديث مواصفات وبيانات الوحدة بواسطة ${currentUser.fullName}`,
            changes: updatedFields,
          });
        }
      } catch (err: any) {
        return { success: false, message: parseApiError(err) };
      }
    }

    return { success: true, message: 'تم تحديث الوحدة بنجاح' };
  },

  /**
   * تحديث سريع لحالة الوحدة فقط (متاح للوسطاء والمديرين) مع التوثيق في سجل التغييرات
   */
  async updateUnitStatus(
    id: string,
    status: UnitStatus,
    currentUser?: UserProfile,
    oldStatus?: UnitStatus
  ): Promise<ServiceResult> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('units')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) {
          return { success: false, message: parseApiError(error) };
        }

        // توثيق الحدث في unit_history
        await this.recordUnitChange({
          unitId: id,
          changedBy: currentUser?.id,
          changeType: 'status_change',
          oldStatus: oldStatus,
          newStatus: status,
          details: `تم تغيير حالة الوحدة إلى "${this.getStatusLabel(status)}" بواسطة ${currentUser?.fullName || 'المستخدم'}`,
        });
      } catch (err: any) {
        return { success: false, message: parseApiError(err) };
      }
    }

    return { success: true, message: 'تم تحديث حالة الوحدة وتوثيقها في السجل' };
  },

  /**
   * تسجيل حركة في جدول سجل تاريخ الوحدة unit_history
   */
  async recordUnitChange(params: {
    unitId: string;
    changedBy?: string;
    changeType: 'status_change' | 'price_change' | 'details_update' | 'created';
    oldStatus?: UnitStatus;
    newStatus?: UnitStatus;
    details?: string;
    changes?: Record<string, any>;
  }): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      await supabase.from('unit_history').insert({
        id: generateUUID(),
        unit_id: params.unitId,
        changed_by: params.changedBy || null,
        change_type: params.changeType,
        old_status: params.oldStatus || null,
        new_status: params.newStatus || null,
        details: params.details || null,
        changes: params.changes || null,
      });
    } catch (err) {
      console.warn('تعذر تسجيل حركة الوحدة في unit_history:', err);
    }
  },

  /**
   * جلب السجل التاريخي لحركات وتغييرات وحدة معينة
   */
  async fetchUnitHistory(unitId: string): Promise<UnitHistory[]> {
    if (!isSupabaseConfigured || !supabase || !unitId) return [];
    try {
      const { data, error } = await supabase
        .from('unit_history')
        .select(`
          *,
          profiles:changed_by (full_name)
        `)
        .eq('unit_id', unitId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((h: any) => ({
          id: h.id,
          unitId: h.unit_id,
          changedBy: h.changed_by || undefined,
          changedByName: h.profiles?.full_name || 'مستخدم المنصة',
          changeType: h.change_type,
          oldStatus: h.old_status || undefined,
          newStatus: h.new_status || undefined,
          details: h.details || undefined,
          changes: h.changes || undefined,
          createdAt: h.created_at,
        }));
      }
    } catch (err) {
      console.warn('خطأ أثناء جلب سجل الوحدة:', err);
    }
    return [];
  },

  /**
   * حذف وحدة عقارية
   */
  async deleteUnit(id: string, currentUser: UserProfile): Promise<ServiceResult> {
    const isCompanyAdmin = currentUser.role === 'company_admin' || currentUser.role === 'admin';
    const isSuperAdmin = currentUser.role === 'super_admin';

    if (!isCompanyAdmin && !isSuperAdmin) {
      return { success: false, message: 'غير مسموح للوسيط بحذف الوحدات.' };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('units').delete().eq('id', id);
        if (error) {
          return { success: false, message: parseApiError(error) };
        }
      } catch (err: any) {
        return { success: false, message: parseApiError(err) };
      }
    }

    return { success: true, message: 'تم حذف الوحدة بنجاح' };
  },

  getStatusLabel(status?: UnitStatus): string {
    switch (status) {
      case 'available':
        return 'متاح للبيع';
      case 'reserved':
        return 'حجز مؤقت';
      case 'sold':
        return 'تم البيع';
      default:
        return 'غير محدد';
    }
  },
};
