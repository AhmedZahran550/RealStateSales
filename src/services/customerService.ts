import { Customer, CustomerStage, CustomerActivity, ActivityType, UserProfile } from '@/lib/types';
import { supabase, isSupabaseConfigured, parseApiError, generateUUID, ServiceResult } from './apiClient';

export const customerService = {
  /**
   * جلب عملاء الوسيط العقاري حصراً (عزل تام وخصوصية 100%)
   */
  async fetchBrokerCustomers(brokerId: string): Promise<Customer[]> {
    if (!isSupabaseConfigured || !supabase || !brokerId) return [];

    try {
      const { data: dbCustomers, error: custError } = await supabase
        .from('customers')
        .select(`
          *,
          customer_activities (*),
          customer_units (unit_id),
          profiles:owner_id (full_name)
        `)
        .eq('owner_id', brokerId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (!custError && dbCustomers) {
        return dbCustomers.map((c: any) => ({
          id: c.id,
          ownerId: c.owner_id,
          ownerName: c.profiles?.full_name || 'البروكر',
          name: c.name,
          phone: c.phone,
          whatsapp: c.whatsapp || undefined,
          budget: c.budget ? Number(c.budget) : undefined,
          source: c.source || undefined,
          stage: c.stage,
          nextFollowupAt: c.next_followup_at || undefined,
          notes: c.notes || undefined,
          interestedUnitIds: (c.customer_units || []).map((cu: any) => cu.unit_id),
          activities: (c.customer_activities || [])
            .map((act: any) => ({
              id: act.id,
              customerId: act.customer_id,
              type: act.type,
              note: act.note,
              createdAt: act.created_at,
              authorName: c.profiles?.full_name || 'البروكر',
            }))
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }));
      }
    } catch (err) {
      console.warn('خطأ أثناء جلب العملاء من قاعدة البيانات:', err);
    }

    return [];
  },

  /**
   * إضافة عميل جديد لمحفظة الوسيط
   */
  async createCustomer(
    customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'activities'>,
    currentUser: UserProfile
  ): Promise<ServiceResult<Customer>> {
    const newCustomerId = generateUUID();
    const initialActId = generateUUID();

    const initialAct: CustomerActivity = {
      id: initialActId,
      customerId: newCustomerId,
      type: 'note',
      note: `تم تسجيل العميل الجديد بواسطة ${currentUser.fullName}`,
      createdAt: new Date().toISOString(),
      authorName: currentUser.fullName,
    };

    const newCustomer: Customer = {
      ...customerData,
      id: newCustomerId,
      ownerId: currentUser.id,
      ownerName: currentUser.fullName,
      activities: [initialAct],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error: insertCustErr } = await supabase.from('customers').insert({
          id: newCustomerId,
          owner_id: currentUser.id,
          name: customerData.name,
          phone: customerData.phone,
          whatsapp: customerData.whatsapp || null,
          budget: customerData.budget || null,
          source: customerData.source || null,
          stage: customerData.stage || 'lead',
          next_followup_at: customerData.nextFollowupAt || null,
          notes: customerData.notes || null,
        });

        if (insertCustErr) {
          return { success: false, message: parseApiError(insertCustErr) };
        }

        // إضافة النشاط الترحيبي الأول
        await supabase.from('customer_activities').insert({
          id: initialActId,
          customer_id: newCustomerId,
          type: 'note',
          note: initialAct.note,
        });

        // ربط الوحدات المهتم بها إن وجدت
        if (customerData.interestedUnitIds && customerData.interestedUnitIds.length > 0) {
          const unitRows = customerData.interestedUnitIds.map((uId) => ({
            customer_id: newCustomerId,
            unit_id: uId,
          }));
          await supabase.from('customer_units').insert(unitRows);
        }
      } catch (err: any) {
        return { success: false, message: parseApiError(err) };
      }
    }

    return {
      success: true,
      data: newCustomer,
      message: 'تم إضافة العميل بنجاح',
    };
  },

  /**
   * تحديث بيانات عميل
   */
  async updateCustomer(
    id: string,
    updatedFields: Partial<Customer>
  ): Promise<ServiceResult> {
    if (isSupabaseConfigured && supabase) {
      try {
        const dbUpdate: any = { updated_at: new Date().toISOString() };
        if (updatedFields.name !== undefined) dbUpdate.name = updatedFields.name;
        if (updatedFields.phone !== undefined) dbUpdate.phone = updatedFields.phone;
        if (updatedFields.whatsapp !== undefined) dbUpdate.whatsapp = updatedFields.whatsapp || null;
        if (updatedFields.budget !== undefined) dbUpdate.budget = updatedFields.budget || null;
        if (updatedFields.source !== undefined) dbUpdate.source = updatedFields.source || null;
        if (updatedFields.stage !== undefined) dbUpdate.stage = updatedFields.stage;
        if (updatedFields.nextFollowupAt !== undefined) {
          dbUpdate.next_followup_at = updatedFields.nextFollowupAt || null;
        }
        if (updatedFields.notes !== undefined) dbUpdate.notes = updatedFields.notes || null;

        const { error } = await supabase.from('customers').update(dbUpdate).eq('id', id);
        if (error) {
          return { success: false, message: parseApiError(error) };
        }

        // تحديث الوحدات المهتم بها إن وردت
        if (updatedFields.interestedUnitIds !== undefined) {
          await supabase.from('customer_units').delete().eq('customer_id', id);
          if (updatedFields.interestedUnitIds.length > 0) {
            const unitRows = updatedFields.interestedUnitIds.map((uId) => ({
              customer_id: id,
              unit_id: uId,
            }));
            await supabase.from('customer_units').insert(unitRows);
          }
        }
      } catch (err: any) {
        return { success: false, message: parseApiError(err) };
      }
    }

    return { success: true, message: 'تم تحديث بيانات العميل بنجاح' };
  },

  /**
   * تحديث مرحلة العميل في الـ CRM وتسجيل نشاط التغيير
   */
  async updateCustomerStage(
    id: string,
    stage: CustomerStage,
    currentUser: UserProfile,
    note?: string
  ): Promise<ServiceResult<CustomerActivity>> {
    const actId = generateUUID();
    const newAct: CustomerActivity = {
      id: actId,
      customerId: id,
      type: 'stage_change',
      note: note || `تم تحديث المرحلة إلى [${stage}]`,
      createdAt: new Date().toISOString(),
      authorName: currentUser.fullName,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error: updErr } = await supabase
          .from('customers')
          .update({ stage, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (updErr) {
          return { success: false, message: parseApiError(updErr) };
        }

        await supabase.from('customer_activities').insert({
          id: actId,
          customer_id: id,
          type: 'stage_change',
          note: newAct.note,
        });
      } catch (err: any) {
        return { success: false, message: parseApiError(err) };
      }
    }

    return {
      success: true,
      data: newAct,
      message: 'تم تحديث مرحلة العميل بنجاح',
    };
  },

  /**
   * إضافة نشاط أو ملاحظة أو مكالمة جديدة للعميل
   */
  async addCustomerActivity(
    customerId: string,
    type: ActivityType,
    note: string,
    currentUser: UserProfile
  ): Promise<ServiceResult<CustomerActivity>> {
    const actId = generateUUID();
    const newAct: CustomerActivity = {
      id: actId,
      customerId,
      type,
      note,
      createdAt: new Date().toISOString(),
      authorName: currentUser.fullName,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('customer_activities').insert({
          id: actId,
          customer_id: customerId,
          type,
          note,
        });

        if (error) {
          return { success: false, message: parseApiError(error) };
        }

        await supabase
          .from('customers')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', customerId);
      } catch (err: any) {
        return { success: false, message: parseApiError(err) };
      }
    }

    return {
      success: true,
      data: newAct,
      message: 'تم إضافة النشاط بنجاح',
    };
  },

  /**
   * حذف عميل
   */
  async deleteCustomer(id: string): Promise<ServiceResult> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('customers').delete().eq('id', id);
        if (error) {
          return { success: false, message: parseApiError(error) };
        }
      } catch (err: any) {
        return { success: false, message: parseApiError(err) };
      }
    }

    return { success: true, message: 'تم حذف العميل بنجاح' };
  },
};
