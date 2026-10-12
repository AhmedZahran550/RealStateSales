'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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
  addUser: (user: Omit<UserProfile, 'id' | 'createdAt'>) => void;
  deleteUser: (id: string) => void;
  loginWithUsername: (username: string, password?: string) => { success: boolean; message: string };
  logout: () => void;
  resetAllData: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'elwaha_users_v4',
  CURRENT_USER: 'elwaha_curr_user_v4',
  ZONES: 'elwaha_zones_v4',
  BUILDINGS: 'elwaha_buildings_v4',
  UNITS: 'elwaha_units_v4',
  SERVICES: 'elwaha_services_v4',
  CUSTOMERS: 'elwaha_customers_v4',
};

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

  // استرجاع البيانات من التخزين المحلي
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

  // حفظ التعديلات في التخزين المحلي
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

  // تصفية البيانات بحسب المستخدم النشط (عزل البيانات الصارم)
  const myUnits = currentUser
    ? currentUser.role === 'admin'
      ? units
      : units.filter((u) => u.ownerId === currentUser.id)
    : [];

  const myCustomers = currentUser
    ? currentUser.role === 'admin'
      ? customers
      : customers.filter((c) => c.ownerId === currentUser.id)
    : [];

  // إدارة الوحدات
  const addUnit = (unitData: Omit<Unit, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) return;
    const newUnit: Unit = {
      ...unitData,
      id: `unit-${Date.now()}`,
      ownerId: currentUser.id,
      ownerName: currentUser.fullName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setUnits((prev) => [newUnit, ...prev]);
  };

  const updateUnit = (id: string, updatedFields: Partial<Unit>) => {
    setUnits((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, ...updatedFields, updatedAt: new Date().toISOString() } : u
      )
    );
  };

  const deleteUnit = (id: string) => {
    setUnits((prev) => prev.filter((u) => u.id !== id));
  };

  // إدارة العملاء
  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'activities'>) => {
    if (!currentUser) return;
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      ownerId: currentUser.id,
      ownerName: currentUser.fullName,
      activities: [
        {
          id: `act-${Date.now()}`,
          customerId: `cust-${Date.now()}`,
          type: 'note',
          note: `تم تسجيل العميل الجديد بواسطة ${currentUser.fullName}`,
          createdAt: new Date().toISOString(),
          authorName: currentUser.fullName,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCustomer, ...prev]);
  };

  const updateCustomer = (id: string, updatedFields: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, ...updatedFields, updatedAt: new Date().toISOString() } : c
      )
    );
  };

  const updateCustomerStage = (id: string, stage: CustomerStage, note?: string) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const newAct: CustomerActivity = {
          id: `act-${Date.now()}`,
          customerId: id,
          type: 'stage_change',
          note: note || `تم تحديث المرحلة إلى [${stage}]`,
          createdAt: new Date().toISOString(),
          authorName: currentUser ? currentUser.fullName : 'البروكر',
        };
        return {
          ...c,
          stage,
          activities: [newAct, ...c.activities],
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const addCustomerActivity = (customerId: string, type: ActivityType, note: string) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;
        const newAct: CustomerActivity = {
          id: `act-${Date.now()}`,
          customerId,
          type,
          note,
          createdAt: new Date().toISOString(),
          authorName: currentUser ? currentUser.fullName : 'البروكر',
        };
        return {
          ...c,
          activities: [newAct, ...c.activities],
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // إدارة المباني والقطع
  const addBuilding = (bData: Omit<Building, 'id'>): Building => {
    const existing = buildings.find(
      (b) => b.zoneId === bData.zoneId && b.plotNo === bData.plotNo
    );
    if (existing) return existing;

    const newBuilding: Building = {
      ...bData,
      id: Date.now(),
    };
    setBuildings((prev) => [...prev, newBuilding]);
    return newBuilding;
  };

  const updateBuildingCoords = (id: number, mapX: number, mapY: number) => {
    setBuildings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, mapX, mapY } : b))
    );
  };

  const addService = (sData: Omit<Service, 'id'>) => {
    const newService: Service = {
      ...sData,
      id: Date.now(),
    };
    setServices((prev) => [...prev, newService]);
  };

  // إدارة المستخدمين (اسم المستخدم وكلمة المرور والاسم بالكامل)
  const addUser = (userData: Omit<UserProfile, 'id' | 'createdAt'>) => {
    const newUser: UserProfile = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const loginWithUsername = (username: string, password?: string) => {
    const user = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (!user) {
      return { success: false, message: 'اسم المستخدم غير موجود في النظام' };
    }
    if (password && user.password && user.password !== password) {
      return { success: false, message: 'كلمة المرور غير صحيحة' };
    }
    setCurrentUser(user);
    return { success: true, message: `مرحباً بك ${user.fullName}` };
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch {}
  };

  const resetAllData = () => {
    try {
      localStorage.clear();
    } catch {}
    setUsers(INITIAL_USERS);
    setCurrentUser(null);
    setZones(INITIAL_ZONES);
    setBuildings(INITIAL_BUILDINGS);
    setUnits(INITIAL_UNITS);
    setServices(INITIAL_SERVICES);
    setCustomers(INITIAL_CUSTOMERS);
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
        loginWithUsername,
        logout,
        resetAllData,
        searchTerm,
        setSearchTerm,
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
