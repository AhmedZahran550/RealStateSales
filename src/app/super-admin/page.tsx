'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Company, UserProfile, AppRole } from '@/lib/types';
import {
  Building2,
  Users,
  ShieldCheck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  UserPlus,
  KeyRound,
  ExternalLink,
  Store,
  Layers,
  Home,
  Check,
  X,
  Sparkles,
  BarChart3,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  UserCheck,
  Filter,
} from 'lucide-react';
import LogoUploader from '@/components/common/LogoUploader';

export default function SuperAdminDashboardPage() {
  const {
    currentUser,
    companies,
    users,
    units,
    addCompany,
    updateCompany,
    deleteCompany,
    addUser,
    deleteUser,
    updateUserProfile,
    updateUserPassword,
  } = useApp();

  // Tab State: 'companies' | 'users' | 'reports'
  const [activeTab, setActiveTab] = useState<'companies' | 'users' | 'reports'>('companies');

  // مزامنة التبويب النشط مع عنوان الرابط URL query param
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const syncTabFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        if (tabParam === 'companies' || tabParam === 'users' || tabParam === 'reports') {
          setActiveTab(tabParam);
        }
      };
      syncTabFromUrl();
      window.addEventListener('popstate', syncTabFromUrl);
      return () => window.removeEventListener('popstate', syncTabFromUrl);
    }
  }, []);

  const handleTabChange = (tab: 'companies' | 'users' | 'reports') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Companies Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Users Tab Search & Filter State
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userCompanyFilter, setUserCompanyFilter] = useState<string>('all');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'company_admin' | 'user'>('all');

  // Company Modal States
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [isEditCompanyOpen, setIsEditCompanyOpen] = useState(false);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // User Management Modal States
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('123456');

  // New User Form State
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('123456');
  const [newUserRole, setNewUserRole] = useState<AppRole>('company_admin');
  const [newUserCompanyId, setNewUserCompanyId] = useState('');

  // New Company Form State
  const [companyName, setCompanyName] = useState('');
  const [commercialName, setCommercialName] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyLogoNew, setCompanyLogoNew] = useState<string | undefined>(undefined);
  const [createAdminNow, setCreateAdminNow] = useState(true);
  const [adminFullName, setAdminFullName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('123456');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // KPIs
  const totalCompanies = companies.length;
  const activeCompanies = companies.filter((c) => c.isActive).length;
  const companyAdmins = users.filter((u) => u.role === 'company_admin' || u.role === 'admin');
  const brokers = users.filter((u) => u.role === 'user');
  const totalUnits = units.length;

  // Filtered Companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((comp) => {
      if (filterStatus === 'active' && !comp.isActive) return false;
      if (filterStatus === 'inactive' && comp.isActive) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchName = comp.name.toLowerCase().includes(q);
        const matchComm = comp.commercialName?.toLowerCase().includes(q);
        const matchPhone = comp.phone?.includes(q);
        if (!matchName && !matchComm && !matchPhone) return false;
      }
      return true;
    });
  }, [companies, filterStatus, searchTerm]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Don't show super_admin in company users list to keep clean
      if (u.role === 'super_admin') return false;

      if (userCompanyFilter !== 'all' && u.companyId !== userCompanyFilter) return false;
      if (userRoleFilter === 'company_admin' && u.role !== 'company_admin' && u.role !== 'admin') return false;
      if (userRoleFilter === 'user' && u.role !== 'user') return false;

      if (userSearchTerm) {
        const q = userSearchTerm.toLowerCase();
        const matchName = u.fullName.toLowerCase().includes(q);
        const matchUser = u.username.toLowerCase().includes(q);
        const matchPhone = u.phone ? u.phone.includes(q) : false;
        const matchCompany = u.companyName ? u.companyName.toLowerCase().includes(q) : false;
        if (!matchName && !matchUser && !matchPhone && !matchCompany) return false;
      }
      return true;
    });
  }, [users, userCompanyFilter, userRoleFilter, userSearchTerm]);

  // Platform Reports Data Calculations
  const reportsByCompany = useMemo(() => {
    return companies.map((comp) => {
      const compUsers = users.filter((u) => u.companyId === comp.id);
      const compAdmin = compUsers.find((u) => u.role === 'company_admin' || u.role === 'admin');
      const compBrokers = compUsers.filter((u) => u.role === 'user');
      const compUnits = units.filter((u) => u.companyId === comp.id);
      const availableUnits = compUnits.filter((u) => u.status === 'available');
      const reservedUnits = compUnits.filter((u) => u.status === 'reserved');
      const soldUnits = compUnits.filter((u) => u.status === 'sold');
      const totalInventoryVal = compUnits.reduce((acc, u) => acc + (u.price || 0), 0);

      return {
        company: comp,
        admin: compAdmin,
        brokersCount: compBrokers.length,
        totalUnitsCount: compUnits.length,
        availableCount: availableUnits.length,
        reservedCount: reservedUnits.length,
        soldCount: soldUnits.length,
        inventoryValue: totalInventoryVal,
      };
    });
  }, [companies, users, units]);

  // Handle Add Company
  const handleAddCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    if (!companyName.trim()) {
      setFormError('يرجى كتابة اسم الشركة العقارية');
      setIsSubmitting(false);
      return;
    }

    if (createAdminNow) {
      if (!adminFullName.trim() || !adminUsername.trim() || !adminPassword.trim()) {
        setFormError('يرجى ملء كافة بيانات حساب مدير الشركة');
        setIsSubmitting(false);
        return;
      }
    }

    const res = await addCompany({
      name: companyName.trim(),
      commercialName: commercialName.trim() || undefined,
      phone: companyPhone.trim() || undefined,
      email: companyEmail.trim() || undefined,
      address: companyAddress.trim() || undefined,
      logoUrl: companyLogoNew,
      isActive: true,
    });

    if (res.success && res.company) {
      if (createAdminNow) {
        const adminRes = await addUser({
          fullName: adminFullName.trim(),
          username: adminUsername.trim().toLowerCase(),
          password: adminPassword.trim(),
          phone: adminPhone.trim() || undefined,
          role: 'company_admin',
          companyId: res.company.id,
          companyName: res.company.name,
        });

        if (!adminRes.success) {
          showToast(`تم إنشاء الشركة ولكن تعذر إنشاء حساب المدير: ${adminRes.message}`);
        } else {
          showToast(`تم إنشاء الشركة "${res.company.name}" وتعيين مديرها بنجاح!`);
        }
      } else {
        showToast(`تم إنشاء الشركة "${res.company.name}" بنجاح!`);
      }

      setCompanyName('');
      setCommercialName('');
      setCompanyPhone('');
      setCompanyEmail('');
      setCompanyAddress('');
      setCompanyLogoNew(undefined);
      setAdminFullName('');
      setAdminUsername('');
      setAdminPhone('');
      setAdminPassword('123456');
      setIsAddCompanyOpen(false);
    } else {
      setFormError(res.message || 'حدث خطأ أثناء إضافة الشركة');
    }
    setIsSubmitting(false);
  };

  // Handle Edit Company
  const handleEditCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    setIsSubmitting(true);

    const res = await updateCompany(selectedCompany.id, {
      name: selectedCompany.name,
      commercialName: selectedCompany.commercialName,
      phone: selectedCompany.phone,
      email: selectedCompany.email,
      address: selectedCompany.address,
      logoUrl: selectedCompany.logoUrl,
      isActive: selectedCompany.isActive,
    });

    if (res.success) {
      showToast('تم تحديث بيانات الشركة بنجاح');
      setIsEditCompanyOpen(false);
    } else {
      showToast(res.message || 'فشل التحديث');
    }
    setIsSubmitting(false);
  };

  // Handle Add Admin to Existing Company
  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    setFormError('');
    setIsSubmitting(true);

    if (!adminFullName.trim() || !adminUsername.trim() || !adminPassword.trim()) {
      setFormError('يرجى ملء اسم المدير واسم المستخدم وكلمة المرور');
      setIsSubmitting(false);
      return;
    }

    const res = await addUser({
      fullName: adminFullName.trim(),
      username: adminUsername.trim().toLowerCase(),
      password: adminPassword.trim(),
      phone: adminPhone.trim() || undefined,
      role: 'company_admin',
      companyId: selectedCompany.id,
      companyName: selectedCompany.name,
    });

    if (res.success) {
      showToast(`تم إضافة مدير جديد لشركة "${selectedCompany.name}" بنجاح`);
      setIsAddAdminOpen(false);
      setAdminFullName('');
      setAdminUsername('');
      setAdminPhone('');
      setAdminPassword('123456');
    } else {
      setFormError(res.message || 'حدث خطأ أثناء إضافة المدير');
    }
    setIsSubmitting(false);
  };

  // Handle Create User directly from Users Tab
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    if (!newUserFullName.trim() || !newUserUsername.trim() || !newUserPassword.trim()) {
      setFormError('يرجى ملء الاسم الكامل واسم المستخدم وكلمة المرور');
      setIsSubmitting(false);
      return;
    }

    if (!newUserCompanyId) {
      setFormError('يرجى اختيار الشركة التابع لها المستخدم');
      setIsSubmitting(false);
      return;
    }

    const targetCompany = companies.find((c) => c.id === newUserCompanyId);

    const res = await addUser({
      fullName: newUserFullName.trim(),
      username: newUserUsername.trim().toLowerCase(),
      password: newUserPassword.trim(),
      phone: newUserPhone.trim() || undefined,
      role: newUserRole,
      companyId: newUserCompanyId,
      companyName: targetCompany?.name,
    });

    if (res.success) {
      showToast(`تم إنشاء حساب ${newUserRole === 'company_admin' ? 'مدير الشركة' : 'الوسيط'} بنجاح`);
      setIsAddUserModalOpen(false);
      setNewUserFullName('');
      setNewUserUsername('');
      setNewUserPhone('');
      setNewUserPassword('123456');
      setNewUserCompanyId('');
    } else {
      setFormError(res.message || 'فشل إنشاء المستخدم');
    }
    setIsSubmitting(false);
  };

  // Handle Password Reset
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);

    const res = await updateUserPassword(selectedUser.id, newPasswordValue.trim());
    if (res.success) {
      showToast(`تم تغيير كلمة مرور المستخدم "${selectedUser.fullName}" بنجاح`);
      setIsResetPasswordOpen(false);
      setSelectedUser(null);
    } else {
      showToast(res.message || 'فشل تغيير كلمة المرور');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2.5 bg-surface-container-low text-white rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in border border-outline">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-surface-container-low p-6 lg:p-8 shadow-sm border border-surface-container-high/40">
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-warning-container blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                لوحة السوبر أدمن المركزية (Super Admin)
              </span>
              <span className="text-xs text-on-surface-variant font-mono">
                Multi-Tenant Management
              </span>
            </div>
            <h1 className="text-on-surface font-extrabold tracking-tight text-xl sm:text-2xl lg:text-3xl">
              إدارة الشركات والمستخدمين والتقارير
            </h1>
            <p className="text-on-surface-variant text-xs sm:text-sm">
              التحكم المركزي في الشركات العقارية، إدارة حسابات المديرين والوسطاء، والاطلاع على التقارير الإحصائية.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeTab === 'companies' && (
              <button
                onClick={() => {
                  setFormError('');
                  setIsAddCompanyOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-strong text-white font-bold transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-xs min-h-[42px]"
                type="button"
              >
                <Plus className="w-4 h-4" />
                <span>+ إضافة شركة جديدة</span>
              </button>
            )}

            {activeTab === 'users' && (
              <button
                onClick={() => {
                  setFormError('');
                  setIsAddUserModalOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-warning hover:bg-warning text-white font-bold transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-xs min-h-[42px]"
                type="button"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ إضافة مدير / مستخدم</span>
              </button>
            )}

            {activeTab === 'reports' && (
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold transition-all shadow-sm cursor-pointer text-xs min-h-[42px]"
                type="button"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة التقرير</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-surface-container-high/40 flex items-center justify-between">
          <div>
            <span className="text-xs text-on-surface-variant font-bold block">إجمالي الشركات</span>
            <span className="text-2xl font-extrabold text-primary mt-1 block">{totalCompanies} شركة</span>
            <span className="text-[11px] text-success font-semibold">{activeCompanies} شركة نشطة</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Store className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-surface-container-high/40 flex items-center justify-between">
          <div>
            <span className="text-xs text-on-surface-variant font-bold block">مديرو الشركات</span>
            <span className="text-2xl font-extrabold text-warning mt-1 block">
              {companyAdmins.length} مدير
            </span>
            <span className="text-[11px] text-on-surface-variant">مسؤولو الشركات</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-warning-container text-warning flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-surface-container-high/40 flex items-center justify-between">
          <div>
            <span className="text-xs text-on-surface-variant font-bold block">وسطاء المبيعات</span>
            <span className="text-2xl font-extrabold text-accent-indigo mt-1 block">
              {brokers.length} وسيط
            </span>
            <span className="text-[11px] text-on-surface-variant">موزعون على الشركات</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-accent-indigo/10 text-accent-indigo flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-surface-container-high/40 flex items-center justify-between">
          <div>
            <span className="text-xs text-on-surface-variant font-bold block">حجم المخزون بالمنصة</span>
            <span className="text-2xl font-extrabold text-info mt-1 block">
              {totalUnits} وحدة
            </span>
            <span className="text-[11px] text-on-surface-variant">إجمالي وحدات الشركات</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-info-container text-info flex items-center justify-center">
            <Home className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Section Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-surface-container-low rounded-2xl border border-surface-container-high/40">
        <button
          onClick={() => handleTabChange('companies')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'companies'
              ? 'bg-primary text-white shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>إدارة الشركات العقارية ({companies.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('users')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'users'
              ? 'bg-primary text-white shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>إدارة المستخدمين والمديرين ({users.filter((u) => u.role !== 'super_admin').length})</span>
        </button>

        <button
          onClick={() => handleTabChange('reports')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-primary text-white shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>تقارير المنصة الإحصائية</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: إدارة الشركات (Companies Management) */}
      {/* ======================================================== */}
      {activeTab === 'companies' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Companies Filter & Search Bar */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-surface-container-high/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-on-surface-variant absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث باسم الشركة أو هاتفها أو السجل التجاري..."
                className="w-full pl-3 pr-10 py-2 rounded-xl bg-surface-container-low text-on-surface placeholder:text-on-surface-variant text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-xl">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filterStatus === 'all'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                الكل ({companies.length})
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filterStatus === 'active'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                النشطة ({activeCompanies})
              </button>
              <button
                onClick={() => setFilterStatus('inactive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filterStatus === 'inactive'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                المعطلة ({companies.length - activeCompanies})
              </button>
            </div>
          </div>

          {/* Companies Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map((comp) => {
              const compUsers = users.filter((u) => u.companyId === comp.id);
              const compAdmins = compUsers.filter((u) => u.role === 'company_admin' || u.role === 'admin');
              const compBrokers = compUsers.filter((u) => u.role === 'user');
              const compUnits = units.filter((u) => u.companyId === comp.id);

              return (
                <div
                  key={comp.id}
                  className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high/40 hover:shadow-md transition-shadow flex flex-col justify-between gap-4"
                >
                  <div>
                    {/* Top Company Info */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {comp.logoUrl ? (
                          <img
                            src={comp.logoUrl}
                            alt={comp.name}
                            className="w-12 h-12 rounded-xl object-cover border border-surface-container-high"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary font-black text-lg flex items-center justify-center">
                            {comp.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-base text-on-surface">{comp.name}</h3>
                          {comp.commercialName && (
                            <p className="text-xs text-on-surface-variant font-mono">{comp.commercialName}</p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          comp.isActive
                            ? 'bg-success-container text-success  '
                            : 'bg-error-container text-on-error-container  '
                        }`}
                      >
                        {comp.isActive ? 'نشطة' : 'معطلة'}
                      </span>
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-1.5 mt-3 pt-3 border-t border-surface-container-high/40 text-xs text-on-surface-variant">
                      {comp.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-primary" />
                          <span dir="ltr" className="font-mono">{comp.phone}</span>
                        </div>
                      )}
                      {comp.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-primary" />
                          <span>{comp.email}</span>
                        </div>
                      )}
                      {comp.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          <span className="truncate">{comp.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    {/* Quick Counts */}
                    <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-surface-container-low text-center">
                      <div>
                        <span className="text-[10px] text-on-surface-variant block">الوحدات بالمنظومة</span>
                        <span className="font-bold text-xs text-primary">{compUnits.length} وحدة</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-on-surface-variant block">فريق الوسطاء</span>
                        <span className="font-bold text-xs text-accent-indigo">{compBrokers.length} وسيط</span>
                      </div>
                    </div>

                    {/* Admin Assignment Block */}
                    <div className="mt-3 p-2.5 rounded-xl bg-warning-container/70 border border-warning/25 ">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-warning flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-warning" />
                          مدير الشركة المسؤول:
                        </span>
                        <button
                          onClick={() => {
                            setSelectedCompany(comp);
                            setFormError('');
                            setIsAddAdminOpen(true);
                          }}
                          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <UserPlus className="w-3 h-3" />
                          تعيين/إضافة مدير
                        </button>
                      </div>
                      {compAdmins.length > 0 ? (
                        <div className="space-y-1">
                          {compAdmins.map((adm) => (
                            <div key={adm.id} className="flex items-center justify-between text-xs">
                              <span className="font-bold text-on-surface">{adm.fullName}</span>
                              <span className="font-mono text-warning text-[11px]">
                                @{adm.username}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-warning font-medium">
                          لا يوجد مدير مخصص بعد، اضغط "تعيين/إضافة مدير"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-surface-container-high/40 gap-2">
                    <button
                      onClick={() => {
                        setSelectedCompany({ ...comp });
                        setIsEditCompanyOpen(true);
                      }}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-on-surface-variant" />
                      <span>تعديل</span>
                    </button>
                    <button
                      onClick={async () => {
                        await updateCompany(comp.id, { isActive: !comp.isActive });
                        showToast(comp.isActive ? 'تم تعطيل الشركة' : 'تم تفعيل الشركة');
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        comp.isActive
                          ? 'bg-warning-container text-warning hover:bg-warning-container  '
                          : 'bg-success-container text-success hover:bg-success-container  '
                      }`}
                    >
                      {comp.isActive ? 'تعطيل' : 'تفعيل'}
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`هل أنت متأكد من حذف شركة "${comp.name}"؟`)) {
                          await deleteCompany(comp.id);
                          showToast('تم حذف الشركة بنجاح');
                        }
                      }}
                      className="p-1.5 rounded-lg text-error hover:bg-error-container transition cursor-pointer"
                      title="حذف الشركة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCompanies.length === 0 && (
            <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-surface-container-high/40">
              <Store className="w-12 h-12 text-on-surface-variant mx-auto mb-3 opacity-40" />
              <h3 className="font-bold text-base text-on-surface">لا توجد شركات مطابقة للبحث</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                يمكنك إضافة شركة عقارية جديدة باستخدام زر "إضافة شركة جديدة" أعلاه.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: إدارة المستخدمين والمديرين (Users & Admins Management) */}
      {/* ======================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-in fade-in">
          {/* User Filters Row */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-surface-container-high/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-on-surface-variant absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="البحث باسم المستخدم، الاسم بالكامل، الهاتف أو الشركة..."
                className="w-full pl-3 pr-10 py-2 rounded-xl bg-surface-container-low text-on-surface placeholder:text-on-surface-variant text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Company Filter Dropdown */}
              <select
                value={userCompanyFilter}
                onChange={(e) => setUserCompanyFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container-high font-bold cursor-pointer"
              >
                <option value="all">كافة الشركات ({companies.length})</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Role Filter Buttons */}
              <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-xl">
                <button
                  onClick={() => setUserRoleFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    userRoleFilter === 'all'
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setUserRoleFilter('company_admin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    userRoleFilter === 'company_admin'
                      ? 'bg-warning text-white shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  مديرو الشركات
                </button>
                <button
                  onClick={() => setUserRoleFilter('user')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    userRoleFilter === 'user'
                      ? 'bg-accent-indigo text-white shadow-xs'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  الوسطاء
                </button>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-surface-container-high/40">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-right text-xs">
                <thead className="bg-surface-container-low text-on-surface-variant font-bold border-b border-surface-container-high">
                  <tr>
                    <th className="p-3.5">الاسم بالكامل</th>
                    <th className="p-3.5">اسم الدخول</th>
                    <th className="p-3.5">الشركة التابع لها</th>
                    <th className="p-3.5">الدور والصلاحية</th>
                    <th className="p-3.5">رقم الهاتف</th>
                    <th className="p-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {filteredUsers.map((u) => {
                    const comp = companies.find((c) => c.id === u.companyId);
                    const isAdmin = u.role === 'company_admin' || u.role === 'admin';

                    return (
                      <tr key={u.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-strong to-primary text-white font-black text-xs flex items-center justify-center shrink-0">
                              {u.fullName.slice(0, 1)}
                            </div>
                            <span className="font-bold text-on-surface">{u.fullName}</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-primary font-bold">@{u.username}</td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface font-semibold text-[11px]">
                            <Store className="w-3 h-3 text-primary" />
                            {comp?.name || u.companyName || 'غير محدد'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                              isAdmin
                                ? 'bg-warning-container text-warning   border border-warning '
                                : 'bg-accent-indigo-container text-on-accent-indigo-container  '
                            }`}
                          >
                            {isAdmin ? 'مدير شركة' : 'وسيط عقاري'}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-on-surface-variant" dir="ltr">
                          {u.phone || '—'}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedUser(u);
                                setNewPasswordValue('123456');
                                setIsResetPasswordOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="إعادة تعيين كلمة المرور"
                            >
                              <KeyRound className="w-3 h-3 text-warning" />
                              <span>تغيير كلمة المرور</span>
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`هل أنت متأكد من حذف حساب "${u.fullName}"؟`)) {
                                  await deleteUser(u.id);
                                  showToast('تم حذف الحساب بنجاح');
                                }
                              }}
                              className="p-1 rounded-lg text-error hover:bg-error-container transition cursor-pointer"
                              title="حذف المستخدم"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {filteredUsers.length === 0 && (
            <div className="p-12 text-center bg-surface-container-lowest rounded-2xl border border-surface-container-high/40">
              <Users className="w-12 h-12 text-on-surface-variant mx-auto mb-3 opacity-40" />
              <h3 className="font-bold text-base text-on-surface">لا يوجد مستخدمون مطابقون</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                جرّب تغيير فلاتر البحث أو اختيار شركة أخرى.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: تقارير المنصة الإحصائية (Platform Reports) */}
      {/* ======================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Reports Header & Print Bar */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-on-surface flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                التقرير التنفيذي الشامل للشركات والمخزون
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                إحصائيات دقيقة عن حجم المعروض العقاري، والوسطاء والمديرين الموزعين على الشركات.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-strong transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة التقرير</span>
              </button>
            </div>
          </div>

          {/* Detailed Companies Performance Table */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-surface-container-high/40">
            <div className="p-4 bg-surface-container-low border-b border-surface-container-high flex items-center justify-between">
              <span className="font-bold text-xs text-on-surface flex items-center gap-1.5">
                <Store className="w-4 h-4 text-primary" />
                جدول توزيع الوحدات والوسطاء بحسب الشركة
              </span>
              <span className="text-[11px] text-on-surface-variant font-mono">
                {reportsByCompany.length} شركات مسجلة
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-right text-xs">
                <thead className="bg-surface-container-lowest text-on-surface-variant font-bold border-b border-surface-container-high">
                  <tr>
                    <th className="p-3.5">اسم الشركة</th>
                    <th className="p-3.5">مدير الشركة المسؤول</th>
                    <th className="p-3.5 text-center">عدد الوسطاء</th>
                    <th className="p-3.5 text-center">إجمالي الوحدات</th>
                    <th className="p-3.5 text-center">متاح للبيع</th>
                    <th className="p-3.5 text-center">محجوز</th>
                    <th className="p-3.5 text-center">مباع</th>
                    <th className="p-3.5 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {reportsByCompany.map((rep) => (
                    <tr key={rep.company.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="p-3.5 font-bold text-on-surface">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          <span>{rep.company.name}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        {rep.admin ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-on-surface">{rep.admin.fullName}</span>
                            <span className="text-[10px] text-warning font-mono">
                              @{rep.admin.username}
                            </span>
                          </div>
                        ) : (
                          <span className="text-error font-bold text-[11px]">لم يتم التعيين</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center font-bold text-accent-indigo">
                        {rep.brokersCount} وسيط
                      </td>
                      <td className="p-3.5 text-center font-black text-primary text-sm">
                        {rep.totalUnitsCount} وحدة
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-success-container text-success font-bold text-[11px]">
                          {rep.availableCount}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-warning-container text-warning font-bold text-[11px]">
                          {rep.reservedCount}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-bold text-[11px]">
                          {rep.soldCount}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rep.company.isActive
                              ? 'bg-success-container text-success  '
                              : 'bg-error-container text-on-error-container  '
                          }`}
                        >
                          {rep.company.isActive ? 'نشطة' : 'معطلة'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. Modal: إضافة شركة عقارية جديدة */}
      {/* ======================================================== */}
      {isAddCompanyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high/60 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-surface-container-high/40 bg-surface-container-low">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-on-surface">إضافة شركة عقارية جديدة</h3>
                  <p className="text-xs text-on-surface-variant">
                    تسجيل شركة وتعيين المدير المسؤول عنها في خطوة واحدة
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddCompanyOpen(false)}
                className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCompanySubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-bold border border-error">
                  {formError}
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-xs font-black text-primary uppercase flex items-center gap-1.5">
                  <Store className="w-4 h-4" />
                  بيانات الشركة العقارية
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-on-surface block mb-1">
                      اسم الشركة <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="مثال: شركة دار المعمار للاستثمار"
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-on-surface block mb-1">
                      الاسم التجاري أو الكود
                    </label>
                    <input
                      type="text"
                      value={commercialName}
                      onChange={(e) => setCommercialName(e.target.value)}
                      placeholder="مثال: Dar Al Meamar Co."
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-on-surface block mb-1">هاتف التواصل</label>
                    <input
                      type="text"
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                      placeholder="مثال: 01012345678"
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-on-surface block mb-1">البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      placeholder="info@company.com"
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-on-surface block mb-1">العنوان أو المقر</label>
                    <input
                      type="text"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder="مثال: الحي المتميز - مول العين"
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>

                <div className="pt-1 border-t border-surface-container-high/40">
                  <label className="text-xs font-bold text-on-surface block mb-2">شعار الشركة (Logo)</label>
                  <LogoUploader
                    logoUrl={companyLogoNew}
                    onChange={setCompanyLogoNew}
                    fallbackInitial={companyName.trim() || commercialName.trim()}
                  />
                </div>
              </div>

              {/* Admin Provisioning Section */}
              <div className="pt-4 border-t border-surface-container-high/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-warning uppercase flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-warning" />
                    حساب مدير الشركة (Company Admin)
                  </h4>
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createAdminNow}
                      onChange={(e) => setCreateAdminNow(e.target.checked)}
                      className="w-4 h-4 text-primary rounded"
                    />
                    <span>إنشاء حساب المدير الآن</span>
                  </label>
                </div>

                {createAdminNow && (
                  <div className="p-3.5 rounded-xl bg-warning-container/60 border border-warning/25 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-on-surface block mb-1">
                          اسم المدير بالكامل <span className="text-error">*</span>
                        </label>
                        <input
                          type="text"
                          required={createAdminNow}
                          value={adminFullName}
                          onChange={(e) => setAdminFullName(e.target.value)}
                          placeholder="مثال: م. أحمد عبد الرحمن"
                          className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest text-on-surface text-xs border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-warning/40"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-on-surface block mb-1">
                          اسم المستخدم (Login Username) <span className="text-error">*</span>
                        </label>
                        <input
                          type="text"
                          required={createAdminNow}
                          value={adminUsername}
                          onChange={(e) => setAdminUsername(e.target.value)}
                          placeholder="مثال: ahmed_admin"
                          className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest text-on-surface text-xs border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-warning/40"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-on-surface block mb-1">
                          كلمة المرور <span className="text-error">*</span>
                        </label>
                        <input
                          type="text"
                          required={createAdminNow}
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="123456"
                          className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest text-on-surface text-xs border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-warning/40 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-on-surface block mb-1">رقم الهاتف</label>
                        <input
                          type="text"
                          value={adminPhone}
                          onChange={(e) => setAdminPhone(e.target.value)}
                          placeholder="010XXXXXXXX"
                          className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest text-on-surface text-xs border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-warning/40"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-surface-container-high/60">
                <button
                  type="button"
                  onClick={() => setIsAddCompanyOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-strong text-white text-xs font-bold transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ وإنشاء الشركة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. Modal: تعديل بيانات الشركة */}
      {/* ======================================================== */}
      {isEditCompanyOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high/60 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-surface-container-high/40 bg-surface-container-low">
              <h3 className="font-bold text-base text-on-surface">تعديل بيانات الشركة</h3>
              <button
                onClick={() => setIsEditCompanyOpen(false)}
                className="p-1.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditCompanySubmit} className="p-5 space-y-3">
              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">اسم الشركة</label>
                <input
                  type="text"
                  required
                  value={selectedCompany.name}
                  onChange={(e) => setSelectedCompany({ ...selectedCompany, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">الاسم التجاري</label>
                <input
                  type="text"
                  value={selectedCompany.commercialName || ''}
                  onChange={(e) => setSelectedCompany({ ...selectedCompany, commercialName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-on-surface block mb-1">الهاتف</label>
                  <input
                    type="text"
                    value={selectedCompany.phone || ''}
                    onChange={(e) => setSelectedCompany({ ...selectedCompany, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface block mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={selectedCompany.email || ''}
                    onChange={(e) => setSelectedCompany({ ...selectedCompany, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">العنوان أو المقر</label>
                <input
                  type="text"
                  value={selectedCompany.address || ''}
                  onChange={(e) => setSelectedCompany({ ...selectedCompany, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="pt-3 border-t border-surface-container-high/40">
                <label className="text-xs font-bold text-on-surface block mb-2">شعار الشركة (Logo)</label>
                <LogoUploader
                  companyId={selectedCompany.id}
                  logoUrl={selectedCompany.logoUrl ?? undefined}
                  onChange={(url) =>
                    setSelectedCompany({
                      ...selectedCompany,
                      logoUrl: url || null,
                    })
                  }
                  fallbackInitial={selectedCompany.name || selectedCompany.commercialName || ''}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={selectedCompany.isActive}
                  onChange={(e) => setSelectedCompany({ ...selectedCompany, isActive: e.target.checked })}
                  className="w-4 h-4 text-primary rounded cursor-pointer"
                />
                <label htmlFor="editIsActive" className="text-xs font-bold text-on-surface cursor-pointer">
                  الشركة نشطة ومفعلة في المنظومة
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-surface-container-high/60">
                <button
                  type="button"
                  onClick={() => setIsEditCompanyOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-strong text-white text-xs font-bold transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. Modal: تعيين مدير لشركة موجودة */}
      {/* ======================================================== */}
      {isAddAdminOpen && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high/60 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-surface-container-high/40 bg-surface-container-low">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-warning" />
                <div>
                  <h3 className="font-bold text-sm text-on-surface">تعيين مدير جديد</h3>
                  <p className="text-[11px] text-on-surface-variant">لشركة "{selectedCompany.name}"</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddAdminOpen(false)}
                className="p-1.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAdminSubmit} className="p-5 space-y-3">
              {formError && (
                <div className="p-2.5 rounded-xl bg-error-container text-on-error-container text-xs font-bold">
                  {formError}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">اسم المدير بالكامل *</label>
                <input
                  type="text"
                  required
                  value={adminFullName}
                  onChange={(e) => setAdminFullName(e.target.value)}
                  placeholder="م. حسام الدين"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-warning/40"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">اسم المستخدم *</label>
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="hosam_admin"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-warning/40"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">كلمة المرور *</label>
                <input
                  type="text"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="123456"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-warning/40 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-warning/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-surface-container-high/60">
                <button
                  type="button"
                  onClick={() => setIsAddAdminOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-warning hover:bg-warning text-white text-xs font-bold transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء حساب المدير'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. Modal: إنشاء مستخدم / مدير جديد من تبويب المستخدمين */}
      {/* ======================================================== */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high/60 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-surface-container-high/40 bg-surface-container-low">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-sm text-on-surface">إضافة حساب مستخدم / مدير جديد</h3>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="p-5 space-y-3">
              {formError && (
                <div className="p-2.5 rounded-xl bg-error-container text-on-error-container text-xs font-bold">
                  {formError}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">الشركة التابع لها *</label>
                <select
                  required
                  value={newUserCompanyId}
                  onChange={(e) => setNewUserCompanyId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container-high font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">اختر الشركة العقارية...</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">نوع الدور والصلاحية *</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as AppRole)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container-high font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="company_admin">مدير شركة (Company Admin)</option>
                  <option value="user">وسيط عقاري (Broker)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">الاسم بالكامل *</label>
                <input
                  type="text"
                  required
                  value={newUserFullName}
                  onChange={(e) => setNewUserFullName(e.target.value)}
                  placeholder="محمد أحمد"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">اسم المستخدم *</label>
                <input
                  type="text"
                  required
                  value={newUserUsername}
                  onChange={(e) => setNewUserUsername(e.target.value)}
                  placeholder="mohamed_sales"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">كلمة المرور *</label>
                <input
                  type="text"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="123456"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-surface-container-high/60">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-strong text-white text-xs font-bold transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. Modal: إعادة تعيين كلمة المرور لأي مستخدم */}
      {/* ======================================================== */}
      {isResetPasswordOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-sm bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high/60 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-surface-container-high/40 bg-surface-container-low">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-warning" />
                <h3 className="font-bold text-sm text-on-surface">إعادة تعيين كلمة المرور</h3>
              </div>
              <button
                onClick={() => setIsResetPasswordOpen(false)}
                className="p-1.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-5 space-y-3">
              <div>
                <span className="text-xs text-on-surface-variant block mb-1">المستخدم:</span>
                <p className="font-bold text-xs text-on-surface">{selectedUser.fullName} (@{selectedUser.username})</p>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface block mb-1">كلمة المرور الجديدة *</label>
                <input
                  type="text"
                  required
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  placeholder="123456"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-warning/40 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-container-high/60">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-warning hover:bg-warning text-white text-xs font-bold transition shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'تغيير كلمة المرور'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
