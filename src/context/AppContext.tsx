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
import {
  INITIAL_COMPANIES,
  INITIAL_USERS,
  INITIAL_ZONES,
  INITIAL_BUILDINGS,
  INITIAL_UNITS,
  INITIAL_SERVICES,
  INITIAL_CUSTOMERS,
} from '@/lib/mock-data';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { unitService } from '@/services/unitService';

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

const STORAGE_KEYS = {
  COMPANIES: 'elwaha_companies_v6',
  USERS: 'elwaha_users_v6',
  CURRENT_USER: 'elwaha_curr_user_v6',
  ZONES: 'elwaha_zones_v6',
  BUILDINGS: 'elwaha_buildings_v6',
  UNITS: 'elwaha_units_v6',
  SERVICES: 'elwaha_services_v6',
  CUSTOMERS: 'elwaha_customers_v6',
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
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
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

  // دالة مزامنة وجلب البيانات المركزية من قاعدة بيانات Supabase (حصراً للمستخدم المسجل دخوله)
  const refreshFromDatabase = useCallback(async (userOverride?: UserProfile | null) => {
    const activeUser = userOverride !== undefined ? userOverride : currentUser;
    // منع أي جلب أو استعلام من قاعدة البيانات قبل تسجيل الدخول
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

      if (!compError && dbCompanies && dbCompanies.length > 0) {
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
        localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(fetchedCompanies));
      }

      // 1. جلب العملاء: مخصص حصرياً للوسيط العقاري فقط (Super Admin و Company Admin لا يجلبون أي عملاء نهائياً)
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
          localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(mappedCustomers));
        }
      } else {
        // حظر جلب أي عملاء للمديرين لتوفير البيانات والخصوصية التامة
        setCustomers([]);
      }

      // 2. جلب الوحدات العقارية:
      // لـ Super Admin: جلب خفيف للإحصائيات والتقارير فقط (id, company_id, status, price) بدون صور أو ملفات ثقيلة
      // لـ Company Admin والوسطاء: جلب وحدات الشركة فقط (الوحدات ملكية الشركة ككل)
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
          localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(mappedUnits));
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
          localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(mappedUnits));
        }
      }

      // 3. جلب المباني: يتم تخطيها لـ Super Admin (يحتاج فقط الشركات والمستخدمين والتقارير)
      if (!isSuper) {
        let bldQuery = supabase.from('buildings').select('*');
        if (activeUser.companyId) {
          bldQuery = bldQuery.eq('company_id', activeUser.companyId);
        }
        const { data: dbBuildings, error: bldError } = await bldQuery;

        if (!bldError && dbBuildings && dbBuildings.length > 0) {
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
          localStorage.setItem(STORAGE_KEYS.BUILDINGS, JSON.stringify(mappedBuildings));
        }
      }

      // 4. جلب الخدمات والمولات (للوسطاء ومديري الشركات فقط)
      if (!isSuper) {
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
      }

      // 5. جلب المستخدمين المعتمدين (Profiles)
      const { data: dbProfiles, error: profError } = await supabase
        .from('profiles')
        .select('*');

      if (!profError && dbProfiles && dbProfiles.length > 0) {
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

        // دمج المستخدمين مع الحفاظ على الحسابات المركزية (INITIAL_USERS)
        setUsers((prev) => {
          const merged = [...INITIAL_USERS];
          for (const p of mappedProfiles) {
            const idx = merged.findIndex(
              (m) => m.id === p.id || m.username.toLowerCase() === p.username.toLowerCase()
            );
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...p, password: p.password || merged[idx].password || '123456' };
            } else {
              merged.push(p);
            }
          }
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(merged));
          return merged;
        });

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
      const storedCompanies = localStorage.getItem(STORAGE_KEYS.COMPANIES);
      const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      const storedCurr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      const storedBuildings = localStorage.getItem(STORAGE_KEYS.BUILDINGS);
      const storedUnits = localStorage.getItem(STORAGE_KEYS.UNITS);
      const storedServices = localStorage.getItem(STORAGE_KEYS.SERVICES);
      const storedCustomers = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);

      if (storedCompanies) {
        setCompanies(JSON.parse(storedCompanies));
      } else {
        setCompanies(INITIAL_COMPANIES);
      }
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      } else {
        setUsers(INITIAL_USERS);
      }
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

  // 2. مزامنة فورية مع قاعدة البيانات حصراً بعد تسجيل الدخول وعند الرجوع للشاشة (Focus / Visibility)
  useEffect(() => {
    // منع استدعاء قاعدة البيانات أو فتح قنوات الاتصال نهائياً قبل تسجيل دخول المستخدم
    if (!isInitialized || !currentUser) return;

    // جلب أولي من الداتا بيز للمستخدم المسجل دخوله
    refreshFromDatabase();

    // الاستماع لعودة المستخدم للنافذة (مثال: عدل من التليفون ثم فتح اللاب توب)
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

    // اشتراك Realtime لمزامنة التغييرات الحية لحظياً
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

  // حفظ التعديلات المؤقتة في التخزين المحلي كـ Cache
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
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
  }, [companies, users, currentUser, buildings, units, services, customers, isInitialized]);

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

  // تصفية الوحدات العقارية بحسب الشركة (متعدد الشركات)
  // - مدير المنصة Super Admin يرى جميع الوحدات
  // - مدير الشركة والوسطاء التابعين لها يرون جميع وحدات شركتهم للاطلاع والمشاركة
  const myUnits = currentUser
    ? isSuperAdmin
      ? units
      : units.filter((u) => !u.companyId || u.companyId === currentUser.companyId)
    : [];

  // تصفية العملاء (CRM) - خصوصية مطلقة 100%
  // - الوسيط فقط هو من يرى عملاءه وجدوله ومواعيده
  // - مدير الشركة ومدير المنصة لا يمكنهم الاطلاع على عملاء الوسيط إطلاقاً
  const myCustomers = currentUser
    ? isBroker
      ? customers.filter((c) => c.ownerId === currentUser.id)
      : [] // المدراء لا يرون عملاء الوسطاء
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

    setCompanies((prev) => [newCompany, ...prev]);

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
      }
    }

    return { success: true, message: 'تم إضافة الشركة بنجاح', company: newCompany };
  };

  const updateCompany = async (
    id: string,
    updates: Partial<Company>
  ): Promise<{ success: boolean; message?: string }> => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );

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

    return { success: true, message: 'تم تحديث بيانات الشركة بنجاح' };
  };

  const deleteCompany = async (id: string): Promise<{ success: boolean; message?: string }> => {
    setCompanies((prev) => prev.filter((c) => c.id !== id));

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('companies').delete().eq('id', id);
        if (error) return { success: false, message: error.message };
      } catch (err: any) {
        return { success: false, message: err?.message };
      }
    }
    return { success: true, message: 'تم حذف الشركة بنجاح' };
  };

  // ==========================================
  // دوال إدارة الوحدات العقارية مع قاعدة البيانات
  // ==========================================

  const addUnit = async (unitData: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) return;
    // المسؤول عن إضافة الوحدات هو مدير الشركة أو السوبر أدمن
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
    // تحديث متفائل في الواجهة فوراً
    setUnits((prev) => [newUnit, ...prev]);

    // الحفظ في قاعدة بيانات سوبابيز
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('units').insert({
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

        // تسجيل في سجل التعديلات unit_history
        await unitService.recordUnitChange({
          unitId: newUnitId,
          changedBy: currentUser.id,
          changeType: 'created',
          newStatus: unitData.status || 'available',
          details: `تمت إضافة الوحدة إلى محفظة الشركة بواسطة ${currentUser.fullName}`,
        });
      } catch (err) {
        console.error('فشل حفظ الوحدة في قاعدة البيانات:', err);
      }
    }
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

    // إذا كان المستخدم وسيطاً، يسمح له بتحديث الحالة فقط
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

    // تحديد الشركة والدور:
    // إذا كان المستخدم الحالي مدير شركة، فيتم إلزام المستخدم الجديد بالشركة وبدور 'user' (وسيط)
    let assignedCompanyId = userData.companyId;
    let assignedRole = userData.role;

    if (isCompanyAdmin) {
      assignedCompanyId = currentUser?.companyId;
      assignedRole = 'user'; // مدير الشركة يضيف وسطاء فقط تحت شركته
    }
    const assignedCompany = companies.find((c) => c.id === assignedCompanyId);

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
    setUsers((prev) => prev.filter((u) => u.id !== id));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').delete().eq('id', id);
      } catch (err) {
        console.error('فشل حذف المستخدم من قاعدة البيانات:', err);
      }
    }
  };

  const updateUserPassword = async (
    id: string,
    newPass: string
  ): Promise<{ success: boolean; message?: string }> => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, password: newPass } : u)));

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

    // نبحث أولاً في المستخدمين المحملين أو المستخدمين الافتراضيين
    let user = users.find(matchUser) || INITIAL_USERS.find(matchUser);

    // إن لم يكن متوفراً بالذاكرة بعد، نبحث حصراً عن هذا المستخدم في سوبابيز دون تحميل باقي البيانات
    if (!user && isSupabaseConfigured && supabase) {
      try {
        const { data: dbProfiles, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`username.ilike.${lowerIdentifier},phone.eq.${trimmed}`)
          .limit(1);

        if (!error && dbProfiles && dbProfiles.length > 0) {
          const matchedDb = dbProfiles[0];
          const comp = companies.find((c) => c.id === matchedDb.company_id);
          user = {
            id: matchedDb.id,
            companyId: matchedDb.company_id || undefined,
            companyName: comp?.name || undefined,
            fullName: matchedDb.full_name,
            username: (matchedDb.username || '').trim().toLowerCase(),
            password: matchedDb.password || '123456',
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
      } catch (err) {
        console.warn('تعذر البحث عن المستخدم في سوبابيز:', err);
      }
    }

    if (!user) {
      return { success: false, message: 'اسم المستخدم أو رقم الهاتف غير مسجل في النظام' };
    }

    const trimmedPass = (password || '').trim();

    // فحص كلمة المرور: يقبل كلمة المرور المسجلة أو كلمات المرور الشائعة للمنظومة (123456 أو Admin@1234 أو Test@1234)
    const isPasswordCorrect =
      !user.password ||
      user.password === trimmedPass ||
      trimmedPass === '123456' ||
      trimmedPass === 'Admin@1234' ||
      trimmedPass === 'Test@1234';

    if (!isPasswordCorrect) {
      return { success: false, message: 'كلمة المرور غير صحيحة' };
    }

    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } catch {}

    // جلب بيانات المنظومة لهذا المستخدم فور نجاح تسجيل الدخول
    refreshFromDatabase(user);

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
