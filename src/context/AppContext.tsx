'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  UserProfile,
  Zone,
  Building,
  Unit,
  UnitStatus,
  Service,
  Customer,
  CustomerStage,
  CustomerActivity,
  ActivityType,
  Company,
  isSuperAdmin as checkIsSuperAdmin,
  isCompanyAdmin as checkIsCompanyAdmin,
  isBroker as checkIsBroker,
} from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { unitService } from '@/services/unitService';
import { authService } from '@/services/authService';

interface AppContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  isInitialized: boolean;
  companies: Company[];
  currentCompany: Company | null;
  users: UserProfile[];
  companyUsers: UserProfile[];
  zones: Zone[];
  buildings: Building[];
  units: Unit[];
  myUnits: Unit[];
  services: Service[];
  customers: Customer[];
  myCustomers: Customer[];
  isSuperAdmin: boolean;
  isCompanyAdmin: boolean;
  isBroker: boolean;
  // Actions
  addCompany: (company: Omit<Company, 'id' | 'createdAt'>) => Promise<{ success: boolean; message?: string; company?: Company }>;
  updateCompany: (id: string, updates: Partial<Company>) => Promise<{ success: boolean; message?: string }>;
  deleteCompany: (id: string) => Promise<{ success: boolean; message?: string }>;
  addUnit: (unit: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateUnit: (id: string, unit: Partial<Unit>) => void;
  updateUnitStatus: (id: string, status: UnitStatus) => Promise<void>;
  fetchUnitHistory: (unitId: string) => Promise<import('@/lib/types').UnitHistory[]>;
  deleteUnit: (id: string) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'activities'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  updateCustomerStage: (id: string, stage: CustomerStage, note?: string) => void;
  addCustomerActivity: (customerId: string, type: ActivityType, note: string) => void;
  deleteCustomer: (id: string) => void;
  addBuilding: (building: Omit<Building, 'id'>) => Building;
  updateBuildingCoords: (id: number, mapX: number, mapY: number) => void;
  addService: (service: Omit<Service, 'id'>) => void;
  addUser: (user: Omit<UserProfile, 'id' | 'createdAt'>) => Promise<{ success: boolean; message?: string }>;
  deleteUser: (id: string) => void;
  updateUserPassword: (id: string, newPass: string) => Promise<{ success: boolean; message?: string }>;
  updateUserProfile: (id: string, updates: Partial<UserProfile>) => Promise<{ success: boolean; message?: string }>;
  loginWithUsername: (username: string, password?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  resetAllData: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  refreshFromDatabase: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // مرجع لتفادي استدعاءات متزامنة متعددة
  const isSyncingRef = useRef(false);

  // دالة مزامنة وجلب البيانات المركزية من قاعدة بيانات Supabase (حصراً للمستخدم المسجل دخوله)
  const refreshFromDatabase = useCallback(async (userOverride?: UserProfile | null) => {
    const activeUser = userOverride !== undefined ? userOverride : currentUser;
    if (!activeUser || !isSupabaseConfigured || !supabase || isSyncingRef.current) return;
    isSyncingRef.current = true;

    const isSuper = activeUser.role === 'super_admin';
    const isCompany = activeUser.role === 'company_admin' || activeUser.role === 'admin';
    const isBrokerUser = activeUser.role === 'user';

    try {
      // 0. جلب الشركات العقارية
      let fetchedCompanies: Company[] = [];
      const { data: dbCompanies, error: compError } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (!compError && dbCompanies) {
        fetchedCompanies = dbCompanies.map((c: any) => ({
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
        setCompanies(fetchedCompanies);
      }

      // 1. جلب العملاء: مخصص حصرياً للوسيط العقاري فقط
      if (isBrokerUser) {
        const { data: dbCustomers, error: custError } = await supabase
          .from('customers')
          .select(`
            *,
            customer_activities (*),
            customer_units (unit_id),
            profiles:owner_id (full_name)
          `)
          .eq('owner_id', activeUser.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (!custError && dbCustomers) {
          const mappedCustomers: Customer[] = dbCustomers.map((c: any) => ({
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
          setCustomers(mappedCustomers);
        } else {
          setCustomers([]);
        }
      } else {
        setCustomers([]);
      }

      // 2. جلب الوحدات العقارية
      if (isSuper) {
        const { data: dbUnitsSummary, error: unitSummaryError } = await supabase
          .from('units')
          .select('id, company_id, status, price');

        if (!unitSummaryError && dbUnitsSummary) {
          const mappedUnits: Unit[] = dbUnitsSummary.map((u: any) => {
            const comp = fetchedCompanies.find((c) => c.id === u.company_id);
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
          setUnits(mappedUnits);
        } else {
          setUnits([]);
        }
      } else {
        let unitQuery = supabase
          .from('units')
          .select(`
            *,
            buildings (zone_id, plot_no, features),
            unit_media (*)
          `);

        if (activeUser.companyId) {
          unitQuery = unitQuery.eq('company_id', activeUser.companyId);
        }

        const { data: dbUnits, error: unitError } = await unitQuery.order('created_at', { ascending: false });

        if (!unitError && dbUnits) {
          const mappedUnits: Unit[] = dbUnits.map((u: any) => {
            const comp = fetchedCompanies.find((c) => c.id === u.company_id);
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
          setUnits(mappedUnits);
        } else {
          setUnits([]);
        }
      }

      // 3. جلب المباني
      if (!isSuper) {
        let bldQuery = supabase.from('buildings').select('*');
        if (activeUser.companyId) {
          bldQuery = bldQuery.eq('company_id', activeUser.companyId);
        }
        const { data: dbBuildings, error: bldError } = await bldQuery;

        if (!bldError && dbBuildings) {
          const mappedBuildings: Building[] = dbBuildings.map((b: any) => {
            const comp = fetchedCompanies.find((c) => c.id === b.company_id);
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
          setBuildings(mappedBuildings);
        } else {
          setBuildings([]);
        }
      }

      // 4. جلب المستخدمين المعتمدين (Profiles)
      const { data: dbProfiles, error: profError } = await supabase
        .from('profiles')
        .select('*');

      if (!profError && dbProfiles) {
        const mappedProfiles: UserProfile[] = dbProfiles.map((p: any) => {
          const comp = fetchedCompanies.find((c) => c.id === p.company_id);
          return {
            id: p.id,
            companyId: p.company_id || undefined,
            companyName: comp?.name || undefined,
            fullName: p.full_name,
            username: (p.username || '').trim().toLowerCase(),
            password: p.password || '',
            phone: p.phone || '',
            role: p.role,
            createdAt: p.created_at,
          };
        });

        setUsers(mappedProfiles);

        // مزامنة المستخدم الحالي المسجل دخوله في حال تم تحديث هاتفه أو بياناته
        setCurrentUser((prev) => {
          if (!prev) return null;
          const fresh = mappedProfiles.find((u) => u.id === prev.id);
          if (fresh) {
            authService.setStoredUser(fresh);
            return fresh;
          }
          return prev;
        });
      }

      // 5. جلب المناطق المركزية
      const { data: dbZones, error: zoneError } = await supabase
        .from('zones')
        .select('*')
        .order('id', { ascending: true });

      if (!zoneError && dbZones && dbZones.length > 0) {
        const mappedZones: Zone[] = dbZones.map((z: any) => ({
          id: Number(z.id),
          name: z.name,
          direction: z.direction || '',
          mapX: z.map_x ? Number(z.map_x) : 50,
          mapY: z.map_y ? Number(z.map_y) : 50,
          notes: z.notes || undefined,
        }));
        setZones(mappedZones);
      }
    } catch (err) {
      console.warn('تنبيه أثناء مزامنة البيانات مع سوبابيز:', err);
    } finally {
      isSyncingRef.current = false;
    }
  }, [currentUser]);

  // استرجاع جلسة المستخدم حصراً من التخزين الخفيف والتحقق من صلاحيتها في قاعدة البيانات
  useEffect(() => {
    let isMounted = true;
    const initSession = async () => {
      try {
        const storedUser = authService.getStoredUser();
        if (storedUser && storedUser.id && isSupabaseConfigured && supabase) {
          const { data: dbProfiles, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', storedUser.id)
            .limit(1);

          if (!error && dbProfiles && dbProfiles.length > 0 && isMounted) {
            const p = dbProfiles[0];
            const freshUser: UserProfile = {
              id: p.id,
              companyId: p.company_id || undefined,
              fullName: p.full_name,
              username: (p.username || '').trim().toLowerCase(),
              password: p.password || '',
              phone: p.phone || '',
              role: p.role,
              createdAt: p.created_at,
            };
            setCurrentUser(freshUser);
            authService.setStoredUser(freshUser);
            await refreshFromDatabase(freshUser);
          } else if (isMounted) {
            authService.logout();
            setCurrentUser(null);
          }
        }
      } catch (err) {
        console.warn('تعذر استعادة جلسة المستخدم من قاعدة البيانات:', err);
      } finally {
        if (isMounted) setIsInitialized(true);
      }
    };

    initSession();
    return () => {
      isMounted = false;
    };
  }, [refreshFromDatabase]);

  // مزامنة فورية مع قاعدة البيانات عند الرجوع للشاشة (Focus / Visibility) واشتراك Realtime
  useEffect(() => {
    if (!isInitialized || !currentUser) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && currentUser) {
        refreshFromDatabase();
      }
    };
    const handleFocus = () => {
      if (currentUser) {
        refreshFromDatabase();
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    let channel: any = null;
    if (isSupabaseConfigured && supabase) {
      try {
        channel = supabase
          .channel('elwaha-realtime-sync')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, () => {
            refreshFromDatabase();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
            refreshFromDatabase();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_activities' }, () => {
            refreshFromDatabase();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'units' }, () => {
            refreshFromDatabase();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'buildings' }, () => {
            refreshFromDatabase();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
            refreshFromDatabase();
          })
          .subscribe();
      } catch (err) {
        console.warn('Realtime channel error:', err);
      }
    }

    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [isInitialized, currentUser?.id, refreshFromDatabase]);

  // أعلام الأدوار والصلاحيات
  const isSuperAdmin = checkIsSuperAdmin(currentUser);
  const isCompanyAdmin = checkIsCompanyAdmin(currentUser);
  const isBroker = checkIsBroker(currentUser);

  // الشركة الحالية للمستخدم
  const currentCompany = currentUser?.companyId
    ? companies.find((c) => c.id === currentUser.companyId) || null
    : null;

  // مستخدمو نفس الشركة
  const companyUsers = currentUser
    ? isSuperAdmin
      ? users
      : users.filter((u) => u.companyId === currentUser.companyId)
    : [];

  // تصفية الوحدات العقارية بحسب الشركة
  const myUnits = currentUser
    ? isSuperAdmin
      ? units
      : units.filter((u) => !u.companyId || u.companyId === currentUser.companyId)
    : [];

  // تصفية العملاء (CRM) - خصوصية مطلقة 100%
  const myCustomers = currentUser
    ? isBroker
      ? customers.filter((c) => c.ownerId === currentUser.id)
      : []
    : [];

  // ==========================================
  // دوال إدارة الشركات العقارية (Super Admin)
  // ==========================================
  const addCompany = async (
    companyData: Omit<Company, 'id' | 'createdAt'>
  ): Promise<{ success: boolean; message?: string; company?: Company }> => {
    const newCompanyId = generateUUID();
    const newCompany: Company = {
      ...companyData,
      id: newCompanyId,
      isActive: companyData.isActive ?? true,
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('companies').insert({
          id: newCompanyId,
          name: companyData.name,
          commercial_name: companyData.commercialName || null,
          logo_url: companyData.logoUrl || null,
          phone: companyData.phone || null,
          email: companyData.email || null,
          address: companyData.address || null,
          is_active: companyData.isActive ?? true,
        });
        if (error) {
          console.error('فشل حفظ الشركة في قاعدة البيانات:', error);
          return { success: false, message: error.message };
        }
      } catch (err: any) {
        console.error('خطأ أثناء حفظ الشركة في قاعدة البيانات:', err);
        return { success: false, message: err?.message };
      }
    }

    setCompanies((prev) => [newCompany, ...prev]);
    return { success: true, message: 'تم إضافة الشركة بنجاح', company: newCompany };
  };

  const updateCompany = async (
    id: string,
    updates: Partial<Company>
  ): Promise<{ success: boolean; message?: string }> => {
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
          return { success: false, message: error.message };
        }
      } catch (err: any) {
        return { success: false, message: err?.message || 'فشل التحديث' };
      }
    }

    setCompanies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    return { success: true, message: 'تم تحديث بيانات الشركة بنجاح' };
  };

  const deleteCompany = async (id: string): Promise<{ success: boolean; message?: string }> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('companies').delete().eq('id', id);
        if (error) return { success: false, message: error.message };
      } catch (err: any) {
        return { success: false, message: err?.message };
      }
    }

    setCompanies((prev) => prev.filter((c) => c.id !== id));
    return { success: true, message: 'تم حذف الشركة بنجاح' };
  };

  // ==========================================
  // دوال إدارة الوحدات العقارية مع قاعدة البيانات
  // ==========================================

  const addUnit = async (unitData: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) return;
    if (!isCompanyAdmin && !isSuperAdmin) {
      console.warn('غير مسموح للوسيط بإضافة وحدات جديدة، هذه صلاحية مدير الشركة');
      return;
    }

    const newUnitId = generateUUID();
    const targetCompId = unitData.companyId || currentUser.companyId || undefined;
    const targetComp = companies.find((c) => c.id === targetCompId) || currentCompany;

    const newUnit: Unit = {
      ...unitData,
      id: newUnitId,
      companyId: targetCompId,
      companyName: targetComp?.name || unitData.companyName,
      features: unitData.features || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { error: insertErr } = await supabase.from('units').insert({
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

        if (insertErr) {
          console.error('فشل حفظ الوحدة في قاعدة البيانات:', insertErr);
          return;
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

        await unitService.recordUnitChange({
          unitId: newUnitId,
          changedBy: currentUser.id,
          changeType: 'created',
          newStatus: unitData.status || 'available',
          details: `تمت إضافة الوحدة إلى محفظة الشركة بواسطة ${currentUser.fullName}`,
        });
      } catch (err) {
        console.error('فشل حفظ الوحدة في قاعدة البيانات:', err);
        return;
      }
    }

    setUnits((prev) => [newUnit, ...prev]);
  };

  const updateUnitStatus = async (id: string, status: UnitStatus) => {
    const currentUnit = units.find((u) => u.id === id);
    const oldStatus = currentUnit?.status;

    setUnits((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status, updatedAt: new Date().toISOString() } : u
      )
    );

    await unitService.updateUnitStatus(id, status, currentUser || undefined, oldStatus);
  };

  const updateUnit = async (id: string, updatedFields: Partial<Unit>) => {
    const currentUnit = units.find((u) => u.id === id);

    if (!isCompanyAdmin && !isSuperAdmin) {
      if (updatedFields.status !== undefined) {
        return updateUnitStatus(id, updatedFields.status);
      }
      console.warn('غير مسموح للوسيط بتعديل تفاصيل الوحدة، يمكنه فقط تحديث الحالة');
      return;
    }

    setUnits((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, ...updatedFields, updatedAt: new Date().toISOString() } : u
      )
    );

    if (currentUser) {
      await unitService.updateUnit(id, updatedFields, currentUser, currentUnit);
    }
  };

  const deleteUnit = async (id: string) => {
    if (!isCompanyAdmin && !isSuperAdmin) {
      console.warn('غير مسموح للوسيط بحذف الوحدة');
      return;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('units').delete().eq('id', id);
        if (error) {
          console.error('فشل حذف الوحدة من قاعدة البيانات:', error);
          return;
        }
      } catch (err) {
        console.error('فشل حذف الوحدة من قاعدة البيانات:', err);
        return;
      }
    }

    setUnits((prev) => prev.filter((u) => u.id !== id));
  };

  // ==========================================
  // دوال إدارة العملاء (CRM) مع قاعدة البيانات
  // ==========================================
  const addCustomer = async (
    customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'activities'>
  ) => {
    if (!currentUser) return;
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
          console.error('فشل حفظ العميل في قاعدة البيانات:', insertCustErr);
          return;
        }

        await supabase.from('customer_activities').insert({
          id: initialActId,
          customer_id: newCustomerId,
          type: 'note',
          note: initialAct.note,
        });

        if (customerData.interestedUnitIds && customerData.interestedUnitIds.length > 0) {
          const unitRows = customerData.interestedUnitIds.map((uId) => ({
            customer_id: newCustomerId,
            unit_id: uId,
          }));
          await supabase.from('customer_units').insert(unitRows);
        }
      } catch (err) {
        console.error('فشل حفظ العميل في قاعدة البيانات:', err);
        return;
      }
    }

    setCustomers((prev) => [newCustomer, ...prev]);
  };

  const updateCustomer = async (id: string, updatedFields: Partial<Customer>) => {
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

        await supabase.from('customers').update(dbUpdate).eq('id', id);

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
      } catch (err) {
        console.error('فشل تحديث العميل في قاعدة البيانات:', err);
      }
    }

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ...updatedFields, updatedAt: new Date().toISOString() } : c
      )
    );
  };

  const updateCustomerStage = async (id: string, stage: CustomerStage, note?: string) => {
    const actId = generateUUID();
    const newAct: CustomerActivity = {
      id: actId,
      customerId: id,
      type: 'stage_change',
      note: note || `تم تحديث المرحلة إلى [${stage}]`,
      createdAt: new Date().toISOString(),
      authorName: currentUser ? currentUser.fullName : 'البروكر',
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('customers')
          .update({ stage, updated_at: new Date().toISOString() })
          .eq('id', id);

        await supabase.from('customer_activities').insert({
          id: actId,
          customer_id: id,
          type: 'stage_change',
          note: newAct.note,
        });
      } catch (err) {
        console.error('فشل تحديث مرحلة العميل في قاعدة البيانات:', err);
      }
    }

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        return {
          ...c,
          stage,
          activities: [newAct, ...c.activities],
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const addCustomerActivity = async (customerId: string, type: ActivityType, note: string) => {
    const actId = generateUUID();
    const newAct: CustomerActivity = {
      id: actId,
      customerId,
      type,
      note,
      createdAt: new Date().toISOString(),
      authorName: currentUser ? currentUser.fullName : 'البروكر',
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('customer_activities').insert({
          id: actId,
          customer_id: customerId,
          type,
          note,
        });

        await supabase
          .from('customers')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', customerId);
      } catch (err) {
        console.error('فشل إضافة نشاط العميل في قاعدة البيانات:', err);
      }
    }

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;
        return {
          ...c,
          activities: [newAct, ...c.activities],
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const deleteCustomer = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('customers').delete().eq('id', id);
      } catch (err) {
        console.error('فشل حذف العميل من قاعدة البيانات:', err);
      }
    }

    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // ==========================================
  // دوال المباني والخدمات والمستخدمين
  // ==========================================
  const addBuilding = (bData: Omit<Building, 'id'>) => {
    const compId = bData.companyId || currentUser?.companyId || undefined;
    const comp = companies.find((c) => c.id === compId) || currentCompany;

    const existing = buildings.find(
      (b) => b.zoneId === bData.zoneId && b.plotNo === bData.plotNo && (!compId || b.companyId === compId)
    );
    if (existing) return existing;

    const newId = Date.now();
    const newBuilding: Building = {
      ...bData,
      id: newId,
      companyId: compId,
      companyName: comp?.name || bData.companyName,
      features: bData.features || [],
    };
    setBuildings((prev) => [...prev, newBuilding]);

    if (isSupabaseConfigured && supabase) {
      supabase.from('buildings').upsert({
        id: newId,
        company_id: compId || null,
        zone_id: bData.zoneId,
        plot_no: bData.plotNo,
        land_area: bData.landArea || null,
        features: bData.features || [],
        map_x: bData.mapX || null,
        map_y: bData.mapY || null,
        notes: bData.notes || null,
      }).then();
    }
    return newBuilding;
  };

  const updateBuildingCoords = (id: number, mapX: number, mapY: number) => {
    setBuildings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, mapX, mapY } : b))
    );

    if (isSupabaseConfigured && supabase) {
      supabase.from('buildings').update({ map_x: mapX, map_y: mapY }).eq('id', id).then();
    }
  };

  const addService = (sData: Omit<Service, 'id'>) => {
    const newId = Date.now();
    const newService: Service = {
      ...sData,
      id: newId,
    };
    setServices((prev) => [...prev, newService]);

    if (isSupabaseConfigured && supabase) {
      supabase.from('services').upsert({
        name: sData.name,
        category: sData.category,
        notes: sData.notes || null,
      }).then();
    }
  };

  const addUser = async (userData: Omit<UserProfile, 'id' | 'createdAt'>): Promise<{ success: boolean; message?: string }> => {
    const newUserId = generateUUID();
    const cleanUsername = userData.username.trim().toLowerCase();
    const cleanPhone = (userData.phone || '').trim();

    let assignedCompanyId = userData.companyId;
    let assignedRole = userData.role;

    if (isCompanyAdmin) {
      assignedCompanyId = currentUser?.companyId;
      assignedRole = 'user';
    }
    const assignedCompany = companies.find((c) => c.id === assignedCompanyId);

    // التحقق المباشر من قاعدة البيانات
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('profiles').insert({
          id: newUserId,
          company_id: assignedCompanyId || null,
          full_name: userData.fullName,
          username: cleanUsername,
          password: userData.password,
          phone: cleanPhone || null,
          role: assignedRole,
        });

        if (error) {
          console.error('فشل حفظ المستخدم في قاعدة البيانات:', error);
          if (error.code === '23505') {
            if (error.message?.includes('phone') || error.details?.includes('phone')) {
              return { success: false, message: 'رقم الهاتف مسجل مسبقاً في قاعدة البيانات، يجب أن يكون فريداً.' };
            }
            return { success: false, message: 'اسم المستخدم مسجل مسبقاً في قاعدة البيانات.' };
          }
          return { success: false, message: error.message || 'فشل حفظ المستخدم في قاعدة البيانات' };
        }
      } catch (err: any) {
        console.error('فشل حفظ المستخدم في قاعدة البيانات:', err);
        return { success: false, message: err?.message || 'حدث خطأ أثناء الاتصال بقاعدة البيانات' };
      }
    }

    const newUser: UserProfile = {
      ...userData,
      id: newUserId,
      companyId: assignedCompanyId,
      companyName: assignedCompany?.name,
      role: assignedRole,
      username: cleanUsername,
      phone: cleanPhone,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    return { success: true, message: 'تم إنشاء الحساب الجديد بنجاح' };
  };

  const deleteUser = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').delete().eq('id', id);
      } catch (err) {
        console.error('فشل حذف المستخدم من قاعدة البيانات:', err);
      }
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const updateUserPassword = async (
    id: string,
    newPass: string
  ): Promise<{ success: boolean; message?: string }> => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('profiles').update({ password: newPass }).eq('id', id);
        if (error) {
          return { success: false, message: error.message };
        }
      } catch (err: any) {
        console.error('فشل تحديث كلمة المرور في قاعدة البيانات:', err);
        return { success: false, message: err?.message || 'فشل تحديث كلمة المرور' };
      }
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, password: newPass } : u)));
    return { success: true };
  };

  const updateUserProfile = async (
    id: string,
    updates: Partial<UserProfile>
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanUpdates = { ...updates };
    if (cleanUpdates.username) {
      cleanUpdates.username = cleanUpdates.username.trim().toLowerCase();
    }
    if (cleanUpdates.phone !== undefined) {
      cleanUpdates.phone = cleanUpdates.phone.trim();
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const dbUpdates: any = {};
        if (cleanUpdates.fullName !== undefined) dbUpdates.full_name = cleanUpdates.fullName;
        if (cleanUpdates.username !== undefined) dbUpdates.username = cleanUpdates.username;
        if (cleanUpdates.phone !== undefined) dbUpdates.phone = cleanUpdates.phone || null;
        if (cleanUpdates.password !== undefined) dbUpdates.password = cleanUpdates.password;
        if (cleanUpdates.role !== undefined) dbUpdates.role = cleanUpdates.role;

        const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', id);
        if (error) {
          console.error('فشل تحديث الملف الشخصي في قاعدة البيانات:', error);
          if (error.code === '23505') {
            if (error.message?.includes('phone') || error.details?.includes('phone')) {
              return { success: false, message: 'رقم الهاتف مسجل مسبقاً في قاعدة البيانات، يجب أن يكون فريداً.' };
            }
            return { success: false, message: 'اسم المستخدم مسجل مسبقاً في قاعدة البيانات.' };
          }
          return { success: false, message: error.message || 'فشل التحديث في قاعدة البيانات' };
        }
      } catch (err: any) {
        console.error('خطأ أثناء حفظ الملف الشخصي:', err);
        return { success: false, message: err?.message || 'خطأ في الاتصال بقاعدة البيانات' };
      }
    }

    setUsers((prev) => {
      return prev.map((u) => {
        if (u.id === id) {
          return { ...u, ...cleanUpdates };
        }
        return u;
      });
    });

    setCurrentUser((prev) => {
      if (prev && prev.id === id) {
        const updated = { ...prev, ...cleanUpdates };
        authService.setStoredUser(updated);
        return updated;
      }
      return prev;
    });

    return { success: true };
  };

  const loginWithUsername = async (identifier: string, password?: string) => {
    const res = await authService.login(identifier, password, users, companies);
    if (!res.success || !res.data) {
      return { success: false, message: res.message || 'فشل تسجيل الدخول' };
    }

    const user = res.data;
    setCurrentUser(user);
    await refreshFromDatabase(user);

    return { success: true, message: `مرحباً بك ${user.fullName}` };
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
    setCompanies([]);
    setUsers([]);
    setZones([]);
    setBuildings([]);
    setUnits([]);
    setServices([]);
    setCustomers([]);
  };

  const resetAllData = async () => {
    authService.logout();
    setCurrentUser(null);
    setCompanies([]);
    setUsers([]);
    setZones([]);
    setBuildings([]);
    setUnits([]);
    setServices([]);
    setCustomers([]);
    await refreshFromDatabase();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isInitialized,
        companies,
        currentCompany,
        users,
        companyUsers,
        zones,
        buildings,
        units,
        myUnits,
        services,
        customers,
        myCustomers,
        isSuperAdmin,
        isCompanyAdmin,
        isBroker,
        addCompany,
        updateCompany,
        deleteCompany,
        addUnit,
        updateUnit,
        updateUnitStatus,
        fetchUnitHistory: unitService.fetchUnitHistory,
        deleteUnit,
        addCustomer,
        updateCustomer,
        updateCustomerStage,
        addCustomerActivity,
        deleteCustomer,
        addBuilding,
        updateBuildingCoords,
        addService,
        addUser,
        deleteUser,
        updateUserPassword,
        updateUserProfile,
        loginWithUsername,
        logout,
        resetAllData,
        searchTerm,
        setSearchTerm,
        refreshFromDatabase,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
