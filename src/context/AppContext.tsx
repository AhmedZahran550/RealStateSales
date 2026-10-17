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
import { authService } from '@/services/authService';
import { companyService } from '@/services/companyService';
import { unitService } from '@/services/unitService';
import { customerService } from '@/services/customerService';
import { userService } from '@/services/userService';
import { buildingService } from '@/services/buildingService';
import { zoneService } from '@/services/zoneService';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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
  addUnit: (unit: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; message?: string }>;
  updateUnit: (id: string, unit: Partial<Unit>) => Promise<{ success: boolean; message?: string }>;
  updateUnitStatus: (id: string, status: UnitStatus) => Promise<void>;
  fetchUnitHistory: (unitId: string) => Promise<import('@/lib/types').UnitHistory[]>;
  deleteUnit: (id: string) => Promise<{ success: boolean; message?: string }>;
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'activities'>) => Promise<{ success: boolean; message?: string }>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<{ success: boolean; message?: string }>;
  updateCustomerStage: (id: string, stage: CustomerStage, note?: string) => Promise<{ success: boolean; message?: string }>;
  addCustomerActivity: (customerId: string, type: ActivityType, note: string) => Promise<{ success: boolean; message?: string }>;
  deleteCustomer: (id: string) => Promise<{ success: boolean; message?: string }>;
  addBuilding: (building: Omit<Building, 'id'>) => Building;
  updateBuildingCoords: (id: number, mapX: number, mapY: number) => void;
  addService: (service: Omit<Service, 'id'>) => void;
  addUser: (user: Omit<UserProfile, 'id' | 'createdAt'>) => Promise<{ success: boolean; message?: string }>;
  deleteUser: (id: string) => Promise<{ success: boolean; message?: string }>;
  updateUserPassword: (id: string, newPass: string) => Promise<{ success: boolean; message?: string }>;
  updateUserProfile: (id: string, updates: Partial<UserProfile>) => Promise<{ success: boolean; message?: string }>;
  loginWithUsername: (username: string, password?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  resetAllData: () => Promise<void>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  refreshFromDatabase: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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

  const isSyncingRef = useRef(false);

  // دالة مزامنة وجلب البيانات عبر الـ REST API المنفصل
  const refreshFromDatabase = useCallback(async (userOverride?: UserProfile | null) => {
    const activeUser = userOverride !== undefined ? userOverride : currentUser;
    if (!activeUser || isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      // 1. جلب الشركات
      const fetchedCompanies = await companyService.fetchCompanies();
      setCompanies(fetchedCompanies);

      // 2. جلب المناطق
      const fetchedZones = await zoneService.fetchZones();
      setZones(fetchedZones);

      // 3. جلب المباني
      const fetchedBuildings = await buildingService.fetchBuildings();
      setBuildings(fetchedBuildings);

      // 4. جلب الوحدات
      const fetchedUnits = await unitService.fetchUnits();
      setUnits(fetchedUnits);

      // 5. جلب العملاء (للوسطاء فقط)
      if (activeUser.role === 'user') {
        const fetchedCustomers = await customerService.fetchCustomers();
        setCustomers(fetchedCustomers);
      } else {
        setCustomers([]);
      }

      // 6. جلب المستخدمين (للمدراء فقط)
      if (activeUser.role === 'super_admin' || activeUser.role === 'company_admin' || activeUser.role === 'admin') {
        const fetchedUsers = await userService.fetchProfiles();
        setUsers(fetchedUsers);
      } else {
        setUsers([activeUser]);
      }
    } catch (err) {
      console.warn('تنبيه أثناء جلب البيانات من الـ API:', err);
    } finally {
      isSyncingRef.current = false;
    }
  }, [currentUser]);

  // استرجاع جلسة المستخدم بالتحقق من الـ API والـ JWT Cookie عند تحميل الصفحة
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user && isMounted) {
          setCurrentUser(user);
          await refreshFromDatabase(user);
        } else if (isMounted) {
          setCurrentUser(null);
        }
      } catch (err) {
        console.warn('Session verification error:', err);
      } finally {
        if (isMounted) setIsInitialized(true);
      }
    };

    initAuth();
    return () => {
      isMounted = false;
    };
  }, [refreshFromDatabase]);

  // مزامنة فورية عند الرجوع للنافذة واشتراك Realtime
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
          .channel('elwaha-realtime-api-sync')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, () => refreshFromDatabase())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => refreshFromDatabase())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_activities' }, () => refreshFromDatabase())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'units' }, () => refreshFromDatabase())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'buildings' }, () => refreshFromDatabase())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => refreshFromDatabase())
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

  // أعلام الصلاحيات
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

  // الوحدات المتاحة للمستخدم
  const myUnits = currentUser
    ? isSuperAdmin
      ? units
      : units.filter((u) => !u.companyId || u.companyId === currentUser.companyId)
    : [];

  // عملاء الوسيط (CRM)
  const myCustomers = currentUser
    ? isBroker
      ? customers.filter((c) => c.ownerId === currentUser.id)
      : []
    : [];

  // ==========================================
  // العمليات (Actions) عبر خدمات الـ API
  // ==========================================

  const addCompany = async (
    companyData: Omit<Company, 'id' | 'createdAt'>
  ): Promise<{ success: boolean; message?: string; company?: Company }> => {
    const res = await companyService.createCompany(companyData);
    if (res.success && res.data) {
      setCompanies((prev) => [res.data!, ...prev]);
      return { success: true, message: res.message, company: res.data };
    }
    return { success: false, message: res.message || 'فشل إضافة الشركة' };
  };

  const updateCompany = async (
    id: string,
    updates: Partial<Company>
  ): Promise<{ success: boolean; message?: string }> => {
    const res = await companyService.updateCompany(id, updates);
    if (res.success) {
      setCompanies((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message || 'فشل تحديث بيانات الشركة' };
  };

  const deleteCompany = async (id: string): Promise<{ success: boolean; message?: string }> => {
    const res = await companyService.deleteCompany(id);
    if (res.success) {
      setCompanies((prev) => prev.filter((c) => c.id !== id));
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message || 'فشل حذف الشركة' };
  };

  const addUnit = async (
    unitData: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; message?: string }> => {
    const res = await unitService.createUnit(unitData);
    if (res.success && res.data) {
      await refreshFromDatabase();
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message || 'فشل إضافة الوحدة العقارية' };
  };

  const updateUnit = async (
    id: string,
    updatedFields: Partial<Unit>
  ): Promise<{ success: boolean; message?: string }> => {
    const res = await unitService.updateUnit(id, updatedFields);
    if (res.success) {
      setUnits((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...updatedFields } : u))
      );
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message || 'فشل تحديث الوحدة' };
  };

  const updateUnitStatus = async (id: string, status: UnitStatus) => {
    const currentUnit = units.find((u) => u.id === id);
    const oldStatus = currentUnit?.status;

    setUnits((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status } : u))
    );

    await unitService.updateUnitStatus(id, status, oldStatus);
  };

  const deleteUnit = async (id: string): Promise<{ success: boolean; message?: string }> => {
    const res = await unitService.deleteUnit(id);
    if (res.success) {
      setUnits((prev) => prev.filter((u) => u.id !== id));
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message || 'فشل حذف الوحدة' };
  };

  const addCustomer = async (
    customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'activities'>
  ): Promise<{ success: boolean; message?: string }> => {
    const res = await customerService.createCustomer(customerData);
    if (res.success && res.data) {
      await refreshFromDatabase();
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message || 'فشل إضافة العميل' };
  };

  const updateCustomer = async (
    id: string,
    updatedFields: Partial<Customer>
  ): Promise<{ success: boolean; message?: string }> => {
    const res = await customerService.updateCustomer(id, updatedFields);
    if (res.success) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updatedFields } : c))
      );
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message || 'فشل تحديث بيانات العميل' };
  };

  const updateCustomerStage = async (
    id: string,
    stage: CustomerStage,
    note?: string
  ): Promise<{ success: boolean; message?: string }> => {
    const res = await customerService.updateStage(id, stage, note);
    if (res.success) {
      await refreshFromDatabase();
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message || 'فشل تغيير مرحلة العميل' };
  };

  const addCustomerActivity = async (
    customerId: string,
    type: ActivityType,
    note: string
  ): Promise<{ success: boolean; message?: string }> => {
    const res = await customerService.addActivity(customerId, type, note);
    if (res.success && res.data) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id !== customerId) return c;
          return {
            ...c,
            activities: [res.data!, ...c.activities],
          };
        })
      );
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message || 'فشل إضافة النشاط' };
  };

  const deleteCustomer = async (id: string): Promise<{ success: boolean; message?: string }> => {
    const res = await customerService.deleteCustomer(id);
    if (res.success) {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message || 'فشل حذف العميل' };
  };

  const addBuilding = (bData: Omit<Building, 'id'>): Building => {
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

    // حفظ في قاعدة البيانات عبر الـ API بالخلفية
    buildingService.createBuilding(bData).then();

    return newBuilding;
  };

  const updateBuildingCoords = (id: number, mapX: number, mapY: number) => {
    setBuildings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, mapX, mapY } : b))
    );
    buildingService.updateBuildingCoords(id, mapX, mapY).then();
  };

  const addService = (sData: Omit<Service, 'id'>) => {
    setServices((prev) => [...prev, { ...sData, id: Date.now() }]);
  };

  const addUser = async (
    userData: Omit<UserProfile, 'id' | 'createdAt'>
  ): Promise<{ success: boolean; message?: string }> => {
    const res = await userService.createUser(userData);
    if (res.success && res.data) {
      setUsers((prev) => [...prev, res.data!]);
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message || 'فشل إنشاء الحساب' };
  };

  const deleteUser = async (id: string): Promise<{ success: boolean; message?: string }> => {
    const res = await userService.deleteUser(id);
    if (res.success) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      return { success: true, message: res.message };
    }
    return { success: false, message: res.message || 'فشل حذف المستخدم' };
  };

  const updateUserPassword = async (
    id: string,
    newPass: string
  ): Promise<{ success: boolean; message?: string }> => {
    const res = await userService.updatePassword(id, newPass);
    return { success: res.success, message: res.message };
  };

  const updateUserProfile = async (
    id: string,
    updates: Partial<UserProfile>
  ): Promise<{ success: boolean; message?: string }> => {
    const res = await userService.updateUser(id, updates);
    if (res.success) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
      if (currentUser?.id === id) {
        setCurrentUser((prev) => (prev ? { ...prev, ...updates } : null));
      }
      return { success: true };
    }
    return { success: false, message: res.message || 'فشل التحديث' };
  };

  const loginWithUsername = async (identifier: string, password?: string) => {
    const res = await authService.login(identifier, password);
    if (!res.success || !res.data) {
      return { success: false, message: res.message || 'فشل تسجيل الدخول' };
    }

    const user = res.data;
    setCurrentUser(user);
    await refreshFromDatabase(user);

    return { success: true, message: res.message || `مرحباً بك ${user.fullName}` };
  };

  const logout = async () => {
    await authService.logout();
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
    await authService.logout();
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
