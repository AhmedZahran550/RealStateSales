'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import UnitFormModal from '@/components/UnitFormModal';
import CustomerModal from '@/components/CustomerModal';
import ProfileModal from '@/components/ProfileModal';
import { formatArabicFollowupDate } from '@/lib/date-utils';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentUser,
    currentCompany,
    companies,
    users,
    companyUsers,
    isSuperAdmin,
    isCompanyAdmin,
    isBroker,
    logout,
    resetAllData,
    searchTerm,
    setSearchTerm,
    addUnit,
    addCustomer,
    zones,
    buildings,
    services,
    myUnits,
    myCustomers,
    addBuilding,
  } = useApp();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Global Quick Action Modals
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Tab synchronization for Super Admin
  const [currentSuperAdminTab, setCurrentSuperAdminTab] = useState<'companies' | 'users' | 'reports'>('companies');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const syncTab = () => {
        const tab = new URLSearchParams(window.location.search).get('tab');
        if (tab === 'companies' || tab === 'users' || tab === 'reports') {
          setCurrentSuperAdminTab(tab);
        } else if (pathname === '/super-admin') {
          setCurrentSuperAdminTab('companies');
        }
      };
      syncTab();
      window.addEventListener('popstate', syncTab);
      return () => window.removeEventListener('popstate', syncTab);
    }
  }, [pathname]);

  const isLoginPage = pathname === '/login';
  // الصفحة العامة تُعرض بدون الهيكل الداخلي (بدون قائمة جانبية أو بحث)
  const isPublicPage = pathname.startsWith('/p/');

  // If login page, render plain without shell
  if (isLoginPage || isPublicPage || !currentUser) {
    return <main className="min-h-screen w-full bg-surface">{children}</main>;
  }

  // Build role-tailored navigation items
  type NavItem = {
    href: string;
    label: string;
    icon: string;
    active: boolean;
    tab?: 'companies' | 'users' | 'reports';
    badge?: string;
  };

  let navLinks: NavItem[] = [];

  if (isSuperAdmin) {
    // 1. Super Admin Nav Links: Only manages companies, users, and platform reports
    navLinks = [
      {
        href: '/super-admin?tab=companies',
        label: 'إدارة الشركات العقارية',
        icon: 'corporate_fare',
        tab: 'companies',
        active: pathname.startsWith('/super-admin') && (currentSuperAdminTab === 'companies' || !currentSuperAdminTab),
        badge: `${companies.length}`,
      },
      {
        href: '/super-admin?tab=users',
        label: 'إدارة المستخدمين والمديرين',
        icon: 'manage_accounts',
        tab: 'users',
        active: pathname.startsWith('/super-admin') && currentSuperAdminTab === 'users',
        badge: `${users.filter((u) => u.role !== 'super_admin').length}`,
      },
      {
        href: '/super-admin?tab=reports',
        label: 'تقارير المنصة الإحصائية',
        icon: 'analytics',
        tab: 'reports',
        active: pathname.startsWith('/super-admin') && currentSuperAdminTab === 'reports',
      },
    ];
  } else if (isCompanyAdmin) {
    // 2. Company Admin Nav Links: Manages company units & buildings, and manages company brokers
    navLinks = [
      {
        href: '/',
        label: 'لوحة إدارة الشركة',
        icon: 'speed',
        active: pathname === '/',
      },
      {
        href: '/units',
        label: 'محفظة وحدات الشركة',
        icon: 'apartment',
        active: pathname.startsWith('/units'),
        badge: `${myUnits.length}`,
      },
      {
        href: '/admin/users',
        label: 'وسطاء وفريق العمل',
        icon: 'group',
        active: pathname.startsWith('/admin/users'),
        badge: `${companyUsers.filter((u) => u.role === 'user').length}`,
      },
      {
        href: '/public-reservations',
        label: 'حجوزات الصفحة العامة',
        icon: 'how_to_reg',
        active: pathname.startsWith('/public-reservations'),
      },
      {
        href: '/admin/public-page',
        label: 'الصفحة العامة وأعمال السابقة',
        icon: 'public',
        active: pathname.startsWith('/admin/public-page'),
      },
      {
        href: '/map',
        label: 'الخريطة التفاعلية',
        icon: 'map',
        active: pathname === '/map',
      },
    ];
  } else {
    // 3. Broker Nav Links: Views units, shares via WhatsApp, updates status only, manages private CRM
    const pendingFollowupsCount = myCustomers.filter((c) => c.nextFollowupAt).length;
    navLinks = [
      {
        href: '/',
        label: 'لوحة التحكم',
        icon: 'speed',
        active: pathname === '/',
      },
      {
        href: '/units',
        label: 'عروض وحدات الشركة',
        icon: 'apartment',
        active: pathname.startsWith('/units'),
        badge: `${myUnits.filter((u) => u.status === 'available').length} متاح`,
      },
      {
        href: '/customers',
        label: 'عملائي ومواعيدي الخاصة',
        icon: 'group',
        active: pathname.startsWith('/customers') && !pathname.includes('view=pipeline'),
        badge: pendingFollowupsCount > 0 ? `${pendingFollowupsCount}` : undefined,
      },
      {
        href: '/customers?view=pipeline',
        label: 'مسار الصفقات',
        icon: 'view_kanban',
        active: pathname.startsWith('/customers') && pathname.includes('view=pipeline'),
      },
      {
        href: '/matching',
        label: 'مطابقة العروض السريعة',
        icon: 'handshake',
        active: pathname === '/matching',
      },
      {
        href: '/public-reservations',
        label: 'حجوزات الصفحة العامة',
        icon: 'how_to_reg',
        active: pathname.startsWith('/public-reservations'),
      },
      {
        href: '/map',
        label: 'الخريطة التفاعلية',
        icon: 'map',
        active: pathname === '/map',
      },
    ];
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col antialiased">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* FIXED RIGHT SIDEBAR (w-72) */}
      <aside
        className={`fixed right-0 top-0 h-full w-[82vw] max-w-72 lg:w-72 bg-surface-container-lowest shadow-[0_1px_12px_rgba(27,122,88,0.06)] z-50 flex flex-col justify-between overflow-y-auto transition-transform duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col">
          {/* Logo & Brand Header */}
          <div className="p-space-lg flex items-center justify-between">
            <Link
              href={isSuperAdmin ? '/super-admin' : '/'}
              onClick={() => setMobileSidebarOpen(false)}
              className="flex items-center gap-space-md group"
            >
              <div className="w-11 h-11 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-md group-hover:scale-105 transition-transform shrink-0">
                <span className="material-symbols-outlined text-[24px]">
                  {isSuperAdmin ? 'shield_person' : isCompanyAdmin ? 'domain' : 'real_estate_agent'}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-space-xs">
                  <span className="text-primary font-bold tracking-tight">
                    عقار سيلز
                  </span>
                  <span className="text-on-surface-variant font-normal">
                    {isSuperAdmin ? 'Super' : 'AqarSales'}
                  </span>
                </div>
                <span className="inline-flex items-center mt-0.5 px-space-xs py-0.5 rounded-md bg-surface-container-high text-primary w-fit font-bold truncate max-w-[170px]">
                  {isSuperAdmin
                    ? 'مدير المنصة العام'
                    : isCompanyAdmin
                    ? `مدير: ${currentCompany?.name || currentUser.companyName || 'الشركة'}`
                    : `وسيط: ${currentCompany?.name || currentUser.companyName || 'الشركة'}`}
                </span>
              </div>
            </Link>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>

          <div className="px-space-md mb-space-sm">
            <div className="h-px bg-surface-variant w-full" />
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-space-xs px-space-md">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setMobileSidebarOpen(false);
                  if (item.tab) {
                    setCurrentSuperAdminTab(item.tab);
                    if (typeof window !== 'undefined') {
                      const url = new URL(window.location.href);
                      url.pathname = '/super-admin';
                      url.searchParams.set('tab', item.tab);
                      window.history.pushState({}, '', url.toString());
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }
                  }
                }}
                className={`flex items-center justify-between gap-space-md px-space-md py-space-sm rounded-xl transition-all group ${
                  item.active
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-space-md min-w-0">
                  <span
                    className={`material-symbols-outlined text-[22px] transition-colors ${
                      item.active ? 'text-on-primary' : 'text-primary group-hover:text-primary-container'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      item.active
                        ? 'bg-white/20 text-white'
                        : 'bg-surface-container-high text-primary'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Sidebar Bottom Widgets */}
        <div className="p-space-md flex flex-col gap-space-md">
          {isSuperAdmin ? (
            /* Super Admin Platform Status Widget */
            <div className="bg-surface-container-low rounded-xl p-space-md shadow-sm border border-primary/20">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="text-on-surface font-bold text-xs">
                  نطاق إدارة المنصة
                </span>
                <span className="text-success font-bold text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  نشط
                </span>
              </div>
              <p className="text-on-surface-variant mb-space-sm text-[11px] leading-relaxed">
                {companies.length} شركات عقارية • {users.filter((u) => u.role !== 'super_admin').length} مستخدمين ومديرين
              </p>
              <Link
                href="/super-admin?tab=companies"
                onClick={() => {
                  setMobileSidebarOpen(false);
                  setCurrentSuperAdminTab('companies');
                }}
                className="w-full py-space-sm px-space-md rounded-xl bg-primary hover:bg-primary-strong text-on-primary transition-all flex items-center justify-center gap-space-xs font-bold shadow-sm active:scale-95 text-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">corporate_fare</span>
                لوحة إدارة الشركات
              </Link>
            </div>
          ) : isCompanyAdmin ? (
            /* Company Admin Management Widget */
            <div className="bg-surface-container-low rounded-xl p-space-md shadow-sm border border-primary/20">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="text-on-surface font-bold text-xs truncate max-w-[140px]">
                  {currentCompany?.name || currentUser.companyName || 'إدارة الشركة'}
                </span>
                <span className="text-primary font-bold text-xs">
                  {myUnits.length} وحدة
                </span>
              </div>
              <p className="text-on-surface-variant mb-space-sm text-[11px]">
                فريق الوسطاء: {companyUsers.filter((u) => u.role === 'user').length} وسيط معتمد
              </p>
              <button
                onClick={() => {
                  setMobileSidebarOpen(false);
                  setIsAddUnitOpen(true);
                }}
                className="w-full py-space-sm px-space-md rounded-xl bg-primary hover:bg-primary-strong text-on-primary transition-all flex items-center justify-center gap-space-xs font-bold shadow-sm active:scale-95 text-xs cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                إضافة وحدة جديدة للشركة
              </button>
            </div>
          ) : (
            /* Broker Follow-ups Widget */
            <div className="bg-surface-container-low rounded-xl p-space-md shadow-sm">
              <div className="flex items-center justify-between mb-space-xs">
                <span className="text-on-surface font-bold text-xs">
                  متابعات عملائي الخاصة
                </span>
                <span className="text-primary font-bold text-xs">
                  {myCustomers.length} عميل
                </span>
              </div>
              <p className="text-on-surface-variant mb-space-md text-[11px]">
                {myCustomers.filter((c) => c.nextFollowupAt).length > 0
                  ? `لديك ${myCustomers.filter((c) => c.nextFollowupAt).length} مواعيد متابعة مستحقة اليوم`
                  : 'لا توجد مواعيد متابعة متأخرة اليوم'}
              </p>
              <button
                onClick={() => {
                  setMobileSidebarOpen(false);
                  setIsAddCustomerOpen(true);
                }}
                className="w-full py-space-sm px-space-md rounded-xl bg-primary hover:bg-primary-strong text-on-primary transition-all flex items-center justify-center gap-space-xs font-bold shadow-sm active:scale-95 text-xs cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                + إضافة عميل جديد
              </button>
            </div>
          )}

          {/* Quick Logout */}
          <button
            onClick={() => {
              logout();
              router.replace('/login');
            }}
            className="flex items-center justify-center gap-space-xs py-space-xs text-on-surface-variant hover:text-error transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* TOP HEADER (h-16 on mobile, h-20 on desktop) */}
      <header className="fixed top-0 right-0 lg:right-72 left-0 h-16 lg:h-20 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)] z-40 px-3 sm:px-space-md lg:px-space-lg flex items-center justify-between gap-2 sm:gap-space-md border-b border-surface-container-high/40">
        {/* Right side: Mobile Menu Toggle & Fast Search */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden p-1.5 sm:p-2 rounded-xl bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-container-low cursor-pointer shrink-0"
            aria-label="القائمة"
          >
            <span className="material-symbols-outlined text-[22px] sm:text-[24px]">menu</span>
          </button>

          <div className="relative flex items-center w-full min-w-0">
            <span className="material-symbols-outlined absolute right-2.5 sm:right-space-md text-on-surface-variant text-[18px] sm:text-[20px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                isSuperAdmin
                  ? 'بحث في الشركات أو المستخدمين...'
                  : isCompanyAdmin
                  ? 'بحث في وحدات الشركة أو كود الوحدة...'
                  : 'بحث بالوحدات أو العملاء...'
              }
              className="w-full border border-outline-variant bg-white rounded-xl py-2 sm:py-space-sm pr-9 sm:pr-11 pl-7 sm:pl-space-md text-on-surface placeholder:text-outline font-semibold focus:outline-none focus:ring-2 focus:ring-primary shadow-xs text-xs truncate"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-2.5 text-outline hover:text-on-surface text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Left side actions: Buttons, Notifications, User Avatar */}
        <div className="flex items-center gap-space-sm lg:gap-space-md">
          {/* Action button in header for Company Admin */}
          {isCompanyAdmin && (
            <button
              onClick={() => setIsAddUnitOpen(true)}
              className="hidden sm:flex items-center gap-space-xs px-space-md py-space-sm rounded-xl bg-primary hover:bg-primary-strong text-on-primary font-bold transition-all shadow-sm active:scale-95 text-xs cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              + إضافة وحدة للشركة
            </button>
          )}

          {/* Action button in header for Broker */}
          {isBroker && (
            <button
              onClick={() => setIsAddCustomerOpen(true)}
              className="hidden sm:flex items-center gap-space-xs px-space-md py-space-sm rounded-xl bg-primary hover:bg-primary-strong text-on-primary font-bold transition-all shadow-sm active:scale-95 text-xs cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              + عميل جديد
            </button>
          )}

          {/* Notifications button (ONLY for Brokers follow-ups) */}
          {isBroker && (
            <div className="relative">
              <button
                onClick={() => {
                  setNotifDropdownOpen(!notifDropdownOpen);
                  setProfileDropdownOpen(false);
                }}
                className="relative p-space-sm rounded-xl bg-surface-container-lowest hover:bg-surface-container-low text-on-surface transition-colors shadow-sm flex items-center justify-center cursor-pointer"
                type="button"
                aria-label="التنبيهات"
              >
                <span className="material-symbols-outlined text-[22px] text-on-surface-variant">
                  notifications
                </span>
                {myCustomers.filter((c) => c.nextFollowupAt).length > 0 && (
                  <span className="absolute -top-1 -left-1 px-1.5 py-0.5 rounded-full bg-secondary text-on-secondary text-[10px] font-bold">
                    {myCustomers.filter((c) => c.nextFollowupAt).length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notifDropdownOpen && (
                <div className="absolute left-0 mt-2 w-[calc(100vw-24px)] max-w-xs sm:w-80 bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-container-high p-3 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-surface-container-high mb-2">
                    <span className="font-bold text-sm text-on-surface">إشعارات المتابعات</span>
                    <span className="text-xs text-primary font-bold">
                      {myCustomers.filter((c) => c.nextFollowupAt).length} مستحقة
                    </span>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {myCustomers.filter((c) => c.nextFollowupAt).length > 0 ? (
                      myCustomers
                        .filter((c) => c.nextFollowupAt)
                        .map((lead) => {
                          const f = formatArabicFollowupDate(lead.nextFollowupAt);
                          return (
                            <Link
                              key={lead.id}
                              href={`/customers?q=${encodeURIComponent(lead.name)}`}
                              onClick={() => setNotifDropdownOpen(false)}
                              className="block p-2 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors text-right"
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-on-surface">{lead.name}</p>
                                <span className="text-[10px] text-primary font-semibold">
                                  {f.dayName} • {f.formattedTime}
                                </span>
                              </div>
                              <p className="text-[11px] text-on-surface-variant truncate">
                                {lead.notes || (lead.budget ? `${(lead.budget / 1000000).toFixed(1)} مليون ج.م` : 'متابعة دورية')}
                              </p>
                            </Link>
                          );
                        })
                    ) : (
                      <p className="text-xs text-on-surface-variant text-center py-4">
                        لا توجد مواعيد متابعة مستحقة لليوم
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileDropdownOpen(!profileDropdownOpen);
                setNotifDropdownOpen(false);
              }}
              className="flex items-center gap-space-sm pl-space-xs cursor-pointer p-1 rounded-xl hover:bg-surface-container-low transition-colors"
              type="button"
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-sm ring-2 ring-primary/20">
                  {currentUser.fullName.charAt(0)}
                </div>
                <span className="absolute bottom-0 left-0 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-surface-container-lowest" />
              </div>
              <div className="hidden md:flex flex-col text-right">
                <span className="text-on-surface font-bold leading-tight text-xs">
                  {currentUser.fullName}
                </span>
                <span className="text-on-surface-variant leading-tight text-[11px]">
                  {isSuperAdmin
                    ? 'مدير المنصة العام (Super Admin)'
                    : isCompanyAdmin
                    ? `مدير شركة ${currentCompany?.name || currentUser.companyName || ''}`
                    : `وسيط عقاري • ${currentCompany?.name || currentUser.companyName || ''}`}
                </span>
              </div>
            </button>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute left-0 mt-2 w-[calc(100vw-24px)] max-w-xs sm:w-72 bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-container-high p-3 z-50 animate-in fade-in zoom-in-95">
                <div className="pb-3 border-b border-surface-container-high mb-2">
                  <p className="text-sm font-bold text-on-surface">{currentUser.fullName}</p>
                  <p className="text-xs text-on-surface-variant">@{currentUser.username}</p>
                  {currentUser.phone ? (
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                      <span className="material-symbols-outlined text-[16px]">call</span>
                      <span dir="ltr">{currentUser.phone}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-bold text-warning bg-warning-container px-2 py-1 rounded-lg">
                      <span className="material-symbols-outlined text-[15px]">add_call</span>
                      <span>لم يُسجل رقم هاتف بعد</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-right text-xs font-bold text-primary hover:bg-primary-fixed/20 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
                    تعديل الملف الشخصي ورقم الهاتف
                  </button>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      resetAllData();
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-right text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-tertiary">restart_alt</span>
                    إعادة ضبط البيانات الافتراضية
                  </button>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout();
                      router.replace('/login');
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-right text-xs font-bold text-error hover:bg-error/10 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    تسجيل الخروج
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="pr-0 lg:pr-72 pt-16 lg:pt-20 flex-1 flex flex-col">
        <main className="flex-1 w-full p-3 sm:p-5 lg:p-space-lg max-w-full overflow-x-hidden">{children}</main>
      </div>

      {/* Global Quick Action Modals */}
      <UnitFormModal
        isOpen={isAddUnitOpen}
        zones={zones}
        buildings={buildings}
        onAddBuilding={addBuilding}
        onClose={() => setIsAddUnitOpen(false)}
        onSubmit={(unitData) => {
          addUnit(unitData);
          setIsAddUnitOpen(false);
        }}
      />

      <CustomerModal
        isOpen={isAddCustomerOpen}
        units={myUnits}
        onClose={() => setIsAddCustomerOpen(false)}
        onSubmit={(customerData) => {
          addCustomer(customerData);
          setIsAddCustomerOpen(false);
        }}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}
