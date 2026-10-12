'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  MapPin,
  Building2,
  Users,
  LayoutDashboard,
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  RotateCcw,
  Sparkles,
  User,
  LogOut,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, resetAllData, myUnits, myCustomers } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [followupsToday, setFollowupsToday] = useState(0);

  useEffect(() => {
    const todayStr = new Date().toDateString();
    setFollowupsToday(
      myCustomers.filter(
        (c) => c.nextFollowupAt && new Date(c.nextFollowupAt).toDateString() === todayStr
      ).length
    );
  }, [myCustomers]);

  // إذا كنا في صفحة تسجيل الدخول أو لا يوجد مستخدم، نخفي شريط التنقل
  if (!currentUser || pathname === '/login') {
    return null;
  }

  const activeUnitsCount = myUnits.filter((u) => u.status === 'available').length;

  const navLinks = [
    {
      href: '/',
      label: 'الرئيسية',
      icon: LayoutDashboard,
      active: pathname === '/' || pathname === '/dashboard',
    },
    {
      href: '/map',
      label: 'الخريطة التفاعلية',
      icon: MapPin,
      active: pathname === '/map',
      badge: '16 منطقة + خريطة GPS',
    },
    {
      href: '/units',
      label: 'عروض الوحدات',
      icon: Building2,
      active: pathname.startsWith('/units'),
      badge: activeUnitsCount.toString(),
    },
    {
      href: '/customers',
      label: 'إدارة العملاء والمتابعات',
      icon: Users,
      active: pathname.startsWith('/customers'),
      badge: followupsToday > 0 ? `${followupsToday} اليوم` : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
  ];

  const adminLinks = [
    { href: '/admin/users', label: 'حسابات المستخدمين والوسطاء' },
    { href: '/admin/services', label: 'كتالوج الخدمات والمعالم' },
    { href: '/admin/zones', label: 'المناطق واستيراد الأراضي' },
  ];

  const isAdmin = currentUser.role === 'admin';

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e7e2d9] dark:border-[#222c3d] bg-[#fbf9f6]/95 dark:bg-[#0b0f17]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* الشعار واسم التطبيق */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-600/30 group-hover:scale-105 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tight text-[#1c1917] dark:text-[#f5f5f4] flex items-center gap-2">
                  منظومة الواحة
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800">
                    العقارية
                  </span>
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400 font-semibold">
                  الحي المتميز – مدينة بدر
                </span>
              </div>
            </Link>

            {/* روابط التصفح للشاشات الكبيرة */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      link.active
                        ? 'bg-amber-100/80 dark:bg-amber-950/70 text-amber-950 dark:text-amber-200 shadow-sm border border-amber-300/80 dark:border-amber-800'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>{link.label}</span>
                    {link.badge && (
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          link.badgeColor || 'bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
                        }`}
                      >
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* قائمة الإدارة للمدير */}
              {isAdmin && (
                <div className="relative group">
                  <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-400 hover:bg-amber-100/60 dark:hover:bg-amber-950/40 transition">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>لوحة الإدارة</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-[#131a26] rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 p-1.5 hidden group-hover:block transition-all z-50">
                    {adminLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-3 py-2 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-amber-50 dark:hover:bg-amber-950/60 hover:text-amber-800 dark:hover:text-amber-300 rounded-xl"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </nav>
          </div>

          {/* الملف الشخصي للمستخدم الحالي + تسجيل الخروج */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 bg-[#fbf9f6] dark:bg-[#131a26] hover:bg-amber-50 dark:hover:bg-[#1a2333] transition"
                title="الملف الشخصي"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-700 to-amber-500 text-white font-black text-xs flex items-center justify-center shadow-sm">
                  {currentUser.fullName.slice(0, 1)}
                </div>
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-black text-[#1c1917] dark:text-[#f5f5f4] line-clamp-1">
                    {currentUser.fullName}
                  </span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                    {currentUser.role === 'admin' ? 'مدير عام للنظام' : 'وسيط عقاري'}
                    {' '}• @{currentUser.username}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-[#131a26] rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 p-2 z-50 animate-in zoom-in-95 duration-150">
                  <div className="p-2.5 border-b border-stone-100 dark:border-stone-800/80 mb-1">
                    <p className="text-xs font-black text-[#1c1917] dark:text-[#f5f5f4]">
                      {currentUser.fullName}
                    </p>
                    <p className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                      @{currentUser.username} ({currentUser.role === 'admin' ? 'مدير نظام' : 'وسيط'})
                    </p>
                    {currentUser.phone && (
                      <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                        {currentUser.phone}
                      </p>
                    )}
                  </div>

                  <div className="p-1 space-y-1">
                    {isAdmin && (
                      <button
                        onClick={() => {
                          if (confirm('هل ترغب في إعادة ضبط البيانات الأولية للنظام؟')) {
                            resetAllData();
                            setUserDropdownOpen(false);
                            router.replace('/login');
                          }
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60 text-right"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                        <span>استعادة البيانات الأولية</span>
                      </button>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-right transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>تسجيل الخروج من النظام</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* القائمة المتنقلة للشاشات الصغيرة */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* درج الجوال */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-[#131a26] p-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                  link.active
                    ? 'bg-amber-100/80 dark:bg-amber-950/70 text-amber-950 dark:text-amber-200'
                    : 'text-stone-700 dark:text-stone-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-amber-600" />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 font-bold text-amber-900 dark:text-amber-300">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
