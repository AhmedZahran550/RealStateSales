'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import UnitFormModal from '@/components/UnitFormModal';
import CustomerModal from '@/components/CustomerModal';
import { formatArabicFollowupDate } from '@/lib/date-utils';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentUser,
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

  const isLoginPage = pathname === '/login';

  // If login page, render plain without shell
  if (isLoginPage || !currentUser) {
    return <main className="min-h-screen w-full bg-surface">{children}</main>;
  }

  const navLinks = [
    {
      href: '/',
      label: 'لوحة التحكم',
      icon: 'speed',
      active: pathname === '/',
    },
    {
      href: '/units',
      label: 'الوحدات والمخزون',
      icon: 'apartment',
      active: pathname === '/units',
    },
    {
      href: '/map',
      label: 'الخريطة التفاعلية',
      icon: 'map',
      active: pathname === '/map',
    },
    {
      href: '/customers',
      label: 'سجل العملاء والمتابعات',
      icon: 'group',
      active: pathname === '/customers',
    },
    {
      href: '/matching',
      label: 'مطابقة العروض السريعة',
      icon: 'handshake',
      active: pathname === '/matching',
    },
    {
      href: '/customers?view=pipeline',
      label: 'مسار الصفقات',
      icon: 'view_kanban',
      active: pathname.startsWith('/customers') && pathname.includes('view=pipeline'),
    },
  ];

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface flex flex-col antialiased">
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
              href="/"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex items-center gap-space-md group"
            >
              <div className="w-11 h-11 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[24px]">real_estate_agent</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-space-xs">
                  <span className="font-headline-sm text-headline-sm text-primary font-bold tracking-tight">
                    عقار سيلز
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-normal">
                    AqarSales
                  </span>
                </div>
                <span className="inline-flex items-center mt-0.5 px-space-xs py-0.5 rounded-md bg-surface-container-high text-primary font-label-sm text-label-sm w-fit font-bold">
                  {currentUser.role === 'admin' ? 'مدير المنظومة' : 'مستشار مبيعات'}
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
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-space-md px-space-md py-space-sm rounded-xl transition-all group ${
                  item.active
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[22px] transition-colors ${
                    item.active ? 'text-on-primary' : 'text-primary group-hover:text-primary-container'
                  }`}
                >
                  {item.icon}
                </span>
                <span className="font-label-lg text-label-lg">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Sidebar Bottom Widgets */}
        <div className="p-space-md flex flex-col gap-space-md">
          {/* Monthly Sales Target Widget */}
          <div className="bg-surface-container-low rounded-xl p-space-md shadow-sm">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-md text-label-md text-on-surface font-bold text-xs">
                تارجت المبيعات الشهري
              </span>
              <span className="font-label-md text-label-md text-primary font-bold text-xs">78%</span>
            </div>
            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mb-space-sm">
              <div className="bg-primary-container h-full rounded-full transition-all duration-700" style={{ width: '78%' }} />
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md text-[11px]">
              متبقي 22% لإتمام هدف الربع الحالي بنجاح.
            </p>
            <button
              onClick={() => {
                setMobileSidebarOpen(false);
                setIsAddUnitOpen(true);
              }}
              className="w-full py-space-sm px-space-md rounded-xl bg-secondary-container hover:bg-secondary text-on-secondary transition-all flex items-center justify-center gap-space-xs font-label-md text-label-md font-bold shadow-sm active:scale-95 text-xs cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              إضافة وحدة جديدة
            </button>
          </div>

          {/* Quick Logout */}
          <button
            onClick={() => {
              logout();
              router.replace('/login');
            }}
            className="flex items-center justify-center gap-space-xs py-space-xs text-on-surface-variant hover:text-error transition-colors font-label-sm text-label-sm cursor-pointer"
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
              placeholder="بحث بالوحدات أو العملاء..."
              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#151d2a] rounded-xl py-2 sm:py-space-sm pr-9 sm:pr-11 pl-7 sm:pl-space-md font-body-sm text-body-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-semibold focus:outline-none focus:ring-2 focus:ring-primary shadow-xs text-xs truncate"
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

        {/* Left side actions: + New Client, Notifications, User Avatar */}
        <div className="flex items-center gap-space-sm lg:gap-space-md">
          {/* + New Client Button */}
          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="hidden sm:flex items-center gap-space-xs px-space-md py-space-sm rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-bold transition-all shadow-sm active:scale-95 text-xs cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            + عميل جديد
          </button>

          {/* Notifications button */}
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
                <span className="absolute -top-1 -left-1 px-1.5 py-0.5 rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm text-[10px] font-bold">
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
                <span className="font-label-md text-label-md text-on-surface font-bold leading-tight text-xs">
                  {currentUser.fullName}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant leading-tight text-[11px]">
                  {currentUser.role === 'admin' ? 'مدير عام المنظومة' : 'مستشار عقاري معتمد'}
                </span>
              </div>
            </button>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute left-0 mt-2 w-[calc(100vw-24px)] max-w-xs sm:w-64 bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-container-high p-3 z-50 animate-in fade-in zoom-in-95">
                <div className="pb-3 border-b border-surface-container-high mb-2">
                  <p className="text-sm font-bold text-on-surface">{currentUser.fullName}</p>
                  <p className="text-xs text-on-surface-variant">@{currentUser.username}</p>
                </div>

                <div className="space-y-1">
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
        services={services}
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
    </div>
  );
}
