'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  UserProfile,
  Zone,
  Building,
  Unit,
  Service,
  Customer,
  CustomerStage,
  CustomerActivity,
  ActivityType,
} from '@/lib/types';
import {
  INITIAL_USERS,
  INITIAL_ZONES,
  INITIAL_BUILDINGS,
  INITIAL_UNITS,
  INITIAL_SERVICES,
  INITIAL_CUSTOMERS,
} from '@/lib/mock-data';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AppContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  isInitialized: boolean;
  users: UserProfile[];
  zones: Zone[];
  buildings: Building[];
  units: Unit[];
  myUnits: Unit[];
  services: Service[];
  customers: Customer[];
  myCustomers: Customer[];
  // Actions
  addUnit: (unit: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateUnit: (id: string, unit: Partial<Unit>) => void;
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
  updateUserPassword: (id: string, newPass: string) => Promise<void>;
  updateUserProfile: (id: string, updates: Partial<UserProfile>) => Promise<{ success: boolean; message?: string }>;
  loginWithUsername: (username: string, password?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  resetAllData: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  refreshFromDatabase: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'elwaha_users_v5',
  CURRENT_USER: 'elwaha_curr_user_v5',
  ZONES: 'elwaha_zones_v5',
  BUILDINGS: 'elwaha_buildings_v5',
  UNITS: 'elwaha_units_v5',
  SERVICES: 'elwaha_services_v5',
  CUSTOMERS: 'elwaha_customers_v5',
};

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
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [zones, setZones] = useState<Zone[]>(INITIAL_ZONES);
  const [buildings, setBuildings] = useState<Building[]>(INITIAL_BUILDINGS);
  const [units, setUnits] = useState<Unit[]>(INITIAL_UNITS);
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // مرجع لتفادي استدعاءات متزامنة متعددة
  const isSyncingRef = useRef(false);

  // دالة مزامنة وجلب البيانات المركزية من قاعدة بيانات Supabase
  const refreshFromDatabase = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      // 1. جلب العملاء والأنشطة المرتبطة
      const { data: dbCustomers, error: custError } = await supabase
        .from('customers')
        .select(`
          *,
          customer_activities (*),
          customer_units (unit_id),
          profiles:owner_id (full_name)
        `)
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
        localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(mappedCustomers));
      }

      // 2. جلب الوحدات العقارية بكامل تفاصيلها والصور والخدمات
      const { data: dbUnits, error: unitError } = await supabase
        .from('units')
        .select(`
          *,
          buildings (zone_id, plot_no),
          profiles:owner_id (full_name),
          unit_media (*)
        `)
        .order('created_at', { ascending: false });

      if (!unitError && dbUnits) {
        const mappedUnits: Unit[] = dbUnits.map((u: any) => ({
          id: u.id,
          ownerId: u.owner_id,
          ownerName: u.profiles?.full_name || 'الوسيط العقاري',
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
          services: u.services || [],
          createdAt: u.created_at,
          updatedAt: u.updated_at,
        }));
        setUnits(mappedUnits);
        localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(mappedUnits));
      }

      // 3. جلب المباني
      const { data: dbBuildings, error: bldError } = await supabase
        .from('buildings')
        .select('*');

      if (!bldError && dbBuildings && dbBuildings.length > 0) {
        const mappedBuildings: Building[] = dbBuildings.map((b: any) => ({
          id: Number(b.id),
          zoneId: Number(b.zone_id),
          plotNo: Number(b.plot_no),
          landArea: b.land_area ? Number(b.land_area) : undefined,
          mapX: b.map_x ? Number(b.map_x) : undefined,
          mapY: b.map_y ? Number(b.map_y) : undefined,
          notes: b.notes || undefined,
        }));
        setBuildings(mappedBuildings);
        localStorage.setItem(STORAGE_KEYS.BUILDINGS, JSON.stringify(mappedBuildings));
      }

      // 4. جلب الخدمات والمولات
      const { data: dbServices, error: srvError } = await supabase
        .from('services')
        .select('*');

      if (!srvError && dbServices && dbServices.length > 0) {
        const mappedServices: Service[] = dbServices.map((s: any) => ({
          id: Number(s.id),
          name: s.name,
          category: s.category,
          notes: s.notes || undefined,
        }));
        setServices(mappedServices);
        localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(mappedServices));
      }

      // 5. جلب المستخدمين المعتمدين (Profiles)
      const { data: dbProfiles, error: profError } = await supabase
        .from('profiles')
        .select('*');

      if (!profError && dbProfiles && dbProfiles.length > 0) {
        const mappedProfiles: UserProfile[] = dbProfiles.map((p: any) => ({
          id: p.id,
          fullName: p.full_name,
          username: (p.username || '').trim().toLowerCase(),
          password: p.password || '',
          phone: p.phone || '',
          role: p.role,
          createdAt: p.created_at,
        }));
        setUsers(mappedProfiles);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mappedProfiles));

        // مزامنة المستخدم الحالي المسجل دخوله في حال تم تحديث هاتفه أو بياناته
        setCurrentUser((prev) => {
          if (!prev) return null;
          const fresh = mappedProfiles.find((u) => u.id === prev.id);
          if (fresh) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(fresh));
            return fresh;
          }
          return prev;
        });
      }

      // 6. جلب المناطق المركزية
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
        localStorage.setItem(STORAGE_KEYS.ZONES, JSON.stringify(mappedZones));
      }
    } catch (err) {
      console.warn('تنبيه أثناء مزامنة البيانات مع سوبابيز:', err);
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  // 1. استرجاع البيانات الفوري من التخزين المحلي لمنع أي وميض
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      const storedCurr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      const storedBuildings = localStorage.getItem(STORAGE_KEYS.BUILDINGS);
      const storedUnits = localStorage.getItem(STORAGE_KEYS.UNITS);
      const storedServices = localStorage.getItem(STORAGE_KEYS.SERVICES);
      const storedCustomers = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);

      if (storedUsers) setUsers(JSON.parse(storedUsers));
      if (storedCurr) {
        try {
          const parsed = JSON.parse(storedCurr);
          if (parsed && parsed.id) setCurrentUser(parsed);
        } catch {}
      }
      if (storedBuildings) setBuildings(JSON.parse(storedBuildings));
      if (storedUnits) setUnits(JSON.parse(storedUnits));
      if (storedServices) setServices(JSON.parse(storedServices));
      if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
    } catch (e) {
      console.warn('تعذر قراءة التخزين المحلي، سيتم استخدام البيانات الافتراضية', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // 2. مزامنة فورية مع قاعدة البيانات عند التحميل وعند الرجوع للشاشة (Focus / Visibility)
  useEffect(() => {
    if (!isInitialized) return;

    // جلب أولي من الداتا بيز
    refreshFromDatabase();

    // الاستماع لعودة المستخدم للنافذة (مثال: عدل من التليفون ثم فتح اللاب توب)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshFromDatabase();
      }
    };
    const handleFocus = () => {
      refreshFromDatabase();
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    // اشتراك Realtime لمزامنة التغييرات الحية لحظياً
    let channel: any = null;
    if (isSupabaseConfigured && supabase) {
      try {
        channel = supabase
          .channel('elwaha-realtime-sync')
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
  }, [isInitialized, refreshFromDatabase]);

  // حفظ التعديلات المؤقتة في التخزين المحلي كـ Cache
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
      localStorage.setItem(STORAGE_KEYS.BUILDINGS, JSON.stringify(buildings));
      localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units));
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    } catch (e) {
      console.error('فشل حفظ الحالة في التخزين المحلي', e);
    }
  }, [users, currentUser, buildings, units, services, customers, isInitialized]);

  // تصفية البيانات بحسب المستخدم النشط (عزل البيانات)
  const myUnits = currentUser
    ? currentUser.role === 'admin'
      ? units
      : units.filter((u) => u.ownerId === currentUser.id)
    : [];

  const myCustomers = currentUser
    ? currentUser.role === 'admin'
      ? [] // المدير العام مخصص لإدارة المستخدمين واستعراض الوحدات فقط بدون عملاء أو مواعيد
      : customers.filter((c) => c.ownerId === currentUser.id)
    : [];

  // ==========================================
  // دوال إدارة الوحدات العقارية مع قاعدة البيانات
  // ==========================================
  const addUnit = async (unitData: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) return;
    const newUnitId = generateUUID();
    const newUnit: Unit = {
      ...unitData,
      id: newUnitId,
      ownerId: currentUser.id,
      ownerName: currentUser.fullName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // تحديث متفائل في الواجهة فوراً
    setUnits((prev) => [newUnit, ...prev]);

    // الحفظ في قاعدة بيانات سوبابيز
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('units').insert({
          id: newUnitId,
          owner_id: currentUser.id,
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
          services: unitData.services || [],
        });

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
      } catch (err) {
        console.error('فشل حفظ الوحدة في قاعدة البيانات:', err);
      }
    }
  };

  const updateUnit = async (id: string, updatedFields: Partial<Unit>) => {
    setUnits((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, ...updatedFields, updatedAt: new Date().toISOString() } : u
      )
    );

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
        if (updatedFields.services !== undefined) dbUpdate.services = updatedFields.services;

        await supabase.from('units').update(dbUpdate).eq('id', id);

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
      } catch (err) {
        console.error('فشل تحديث الوحدة في قاعدة البيانات:', err);
      }
    }
  };

  const deleteUnit = async (id: string) => {
    setUnits((prev) => prev.filter((u) => u.id !== id));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('units').delete().eq('id', id);
      } catch (err) {
        console.error('فشل حذف الوحدة من قاعدة البيانات:', err);
      }
    }
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

    // تحديث متفائل في الواجهة فوراً
    setCustomers((prev) => [newCustomer, ...prev]);

    // الحفظ في قاعدة بيانات سوبابيز
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

        if (!insertCustErr) {
          // تسجيل النشاط الأولي
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
        }
      } catch (err) {
        console.error('فشل حفظ العميل في قاعدة البيانات:', err);
      }
    }
  };

  const updateCustomer = async (id: string, updatedFields: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ...updatedFields, updatedAt: new Date().toISOString() } : c
      )
    );

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
      } catch (err) {
        console.error('فشل تحديث العميل في قاعدة البيانات:', err);
      }
    }
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
  };

  const deleteCustomer = async (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('customers').delete().eq('id', id);
      } catch (err) {
        console.error('فشل حذف العميل من قاعدة البيانات:', err);
      }
    }
  };

  // ==========================================
  // دوال المباني والخدمات والمستخدمين
  // ==========================================
  const addBuilding = (bData: Omit<Building, 'id'>) => {
    const existing = buildings.find(
      (b) => b.zoneId === bData.zoneId && b.plotNo === bData.plotNo
    );
    if (existing) return existing;

    const newId = Date.now();
    const newBuilding: Building = {
      ...bData,
      id: newId,
    };
    setBuildings((prev) => [...prev, newBuilding]);

    if (isSupabaseConfigured && supabase) {
      supabase.from('buildings').upsert({
        id: newId,
        zone_id: bData.zoneId,
        plot_no: bData.plotNo,
        land_area: bData.landArea || null,
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

    // 1. التحقق من فرادة اسم المستخدم محلياً
    const existingUser = users.find((u) => u.username.toLowerCase() === cleanUsername);
    if (existingUser) {
      return { success: false, message: 'اسم المستخدم هذا مسجل مسبقاً، يرجى اختيار اسم مستخدم آخر.' };
    }

    // 2. التحقق من فرادة رقم الهاتف محلياً
    if (cleanPhone) {
      const existingPhone = users.find((u) => u.phone && u.phone.trim() === cleanPhone);
      if (existingPhone) {
        return {
          success: false,
          message: `رقم الهاتف (${cleanPhone}) مسجل مسبقاً للمستخدم "${existingPhone.fullName}"، يجب أن يكون رقم الهاتف فريداً لكل حساب.`,
        };
      }
    }

    // 3. الحفظ في قاعدة بيانات سوبابيز أولاً للتحقق من القيود الصارمة
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('profiles').insert({
          id: newUserId,
          full_name: userData.fullName,
          username: cleanUsername,
          password: userData.password,
          phone: cleanPhone || null,
          role: userData.role,
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
      username: cleanUsername,
      phone: cleanPhone,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    return { success: true, message: 'تم إنشاء الحساب الجديد بنجاح' };
  };

  const deleteUser = async (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').delete().eq('id', id);
      } catch (err) {
        console.error('فشل حذف المستخدم من قاعدة البيانات:', err);
      }
    }
  };

  const updateUserPassword = async (id: string, newPass: string) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, password: newPass } : u)));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').update({ password: newPass }).eq('id', id);
      } catch (err) {
        console.error('فشل تحديث كلمة المرور في قاعدة البيانات:', err);
      }
    }
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

    // 1. التحقق من فرادة اسم المستخدم محلياً
    if (cleanUpdates.username) {
      const dupUser = users.find(
        (u) => u.id !== id && u.username.toLowerCase() === cleanUpdates.username
      );
      if (dupUser) {
        return { success: false, message: 'اسم المستخدم مسجل مسبقاً لحساب آخر، يرجى اختيار اسم مستخدم آخر.' };
      }
    }

    // 2. التحقق من فرادة رقم الهاتف محلياً
    if (cleanUpdates.phone) {
      const dupPhone = users.find(
        (u) => u.id !== id && u.phone && u.phone.trim() === cleanUpdates.phone
      );
      if (dupPhone) {
        return {
          success: false,
          message: `رقم الهاتف (${cleanUpdates.phone}) مسجل مسبقاً لحساب "${dupPhone.fullName}"، يجب أن يكون رقم الهاتف فريداً لكل مستخدم.`,
        };
      }
    }

    // 3. المزامنة مع سوبابيز أولاً للتحقق من قيود قاعدة البيانات
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

    // 4. تحديث قائمة المستخدمين محلياً
    setUsers((prev) => {
      const nextUsers = prev.map((u) => {
        if (u.id === id) {
          return { ...u, ...cleanUpdates };
        }
        return u;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(nextUsers));
      } catch {}
      return nextUsers;
    });

    // 5. تحديث المستخدم الحالي إن كان هو نفسه وتحديث localStorage
    setCurrentUser((prev) => {
      if (prev && prev.id === id) {
        const updated = { ...prev, ...cleanUpdates };
        try {
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
        } catch {}
        return updated;
      }
      return prev;
    });

    return { success: true };
  };

  const loginWithUsername = async (identifier: string, password?: string) => {
    const trimmed = identifier.trim();
    if (!trimmed) {
      return { success: false, message: 'يرجى إدخال اسم المستخدم أو رقم الهاتف' };
    }

    const cleanInputDigits = trimmed.replace(/[^0-9]/g, '');
    const lowerIdentifier = trimmed.toLowerCase();

    const matchUser = (u: UserProfile) => {
      // 1. مطابقة اسم المستخدم بالأحرف الصغيرة دائماً
      if (u.username && u.username.trim().toLowerCase() === lowerIdentifier) return true;

      // 2. مطابقة رقم الهاتف (تطابق تام أو مجرد بالأرقام)
      if (u.phone) {
        const uPhoneDigits = u.phone.replace(/[^0-9]/g, '');
        if (u.phone === trimmed || (cleanInputDigits && uPhoneDigits === cleanInputDigits)) return true;
        // مطابقة بكود الدولة أو بدونه
        if (cleanInputDigits.length >= 8 && uPhoneDigits.length >= 8) {
          if (cleanInputDigits.endsWith(uPhoneDigits) || uPhoneDigits.endsWith(cleanInputDigits)) {
            return true;
          }
        }
      }
      return false;
    };

    let user = users.find(matchUser);

    // إن لم يكن متوفراً بالذاكرة بعد، نبحث مباشرة في قاعدة بيانات سوبابيز
    if (!user && isSupabaseConfigured && supabase) {
      try {
        const { data: dbProfiles, error } = await supabase.from('profiles').select('*');
        if (!error && dbProfiles && dbProfiles.length > 0) {
          const matchedDb = dbProfiles.find((p: any) => {
            const pUsernameLower = (p.username || '').trim().toLowerCase();
            if (pUsernameLower && pUsernameLower === lowerIdentifier) return true;
            if (p.phone) {
              const pPhoneDigits = p.phone.replace(/[^0-9]/g, '');
              if (p.phone === trimmed || (cleanInputDigits && pPhoneDigits === cleanInputDigits)) return true;
              if (cleanInputDigits.length >= 8 && pPhoneDigits.length >= 8) {
                if (cleanInputDigits.endsWith(pPhoneDigits) || pPhoneDigits.endsWith(cleanInputDigits)) {
                  return true;
                }
              }
            }
            return false;
          });

          if (matchedDb) {
            user = {
              id: matchedDb.id,
              fullName: matchedDb.full_name,
              username: (matchedDb.username || '').trim().toLowerCase(),
              password: matchedDb.password || '',
              phone: matchedDb.phone || '',
              role: matchedDb.role,
              createdAt: matchedDb.created_at,
            };
            setUsers((prev) => {
              if (prev.some((x) => x.id === user!.id)) {
                return prev.map((x) => (x.id === user!.id ? user! : x));
              }
              return [...prev, user!];
            });
          }
        }
      } catch (err) {
        console.warn('تعذر البحث عن المستخدم في سوبابيز:', err);
      }
    }

    if (!user) {
      return { success: false, message: 'اسم المستخدم أو رقم الهاتف غير مسجل في النظام' };
    }
    if (password && user.password && user.password !== password) {
      return { success: false, message: 'كلمة المرور غير صحيحة' };
    }

    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } catch {}
    return { success: true, message: `مرحباً بك ${user.fullName}` };
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch {}
  };

  const resetAllData = async () => {
    try {
      localStorage.clear();
    } catch {}
    await refreshFromDatabase();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isInitialized,
        users,
        zones,
        buildings,
        units,
        myUnits,
        services,
        customers,
        myCustomers,
        addUnit,
        updateUnit,
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
