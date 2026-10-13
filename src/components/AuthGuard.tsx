'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Building2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, isInitialized } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!isInitialized) return;

    if (!currentUser && !isLoginPage) {
      router.replace('/login');
    } else if (currentUser && isLoginPage) {
      router.replace('/');
    } else if (currentUser && currentUser.role === 'admin' && (pathname.startsWith('/customers') || pathname === '/matching')) {
      // دور المدير العام مخصص لإدارة المستخدمين واستعراض الوحدات فقط بدون عملاء أو مواعيد
      router.replace('/units');
    }
  }, [currentUser, isInitialized, isLoginPage, pathname, router]);

  // إذا كان المسار هو صفحة تسجيل الدخول، اعرضها مباشرة دون إسقاط أي جزء
  if (isLoginPage) {
    return <>{children}</>;
  }

  // حالة انتظار قراءة الجلسة المخزنة في الصفحات المحمية
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf9f6] dark:bg-[#0b0f17]">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-500 text-white flex items-center justify-center shadow-xl shadow-amber-600/30">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="text-xs font-black text-amber-900 dark:text-amber-400">
            منظومة الواحة العقارية – جاري التحقق من الجلسة...
          </span>
        </div>
        <div className="hidden" aria-hidden="true">
          {children}
        </div>
      </div>
    );
  }

  // إذا كان غير مسجل دخول ومسار غير تسجيل الدخول، نمنع عرض المحتوى حتى يكتمل التوجيه
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbf9f6] dark:bg-[#0b0f17]">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-500 text-white flex items-center justify-center shadow-xl shadow-amber-600/30">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="text-xs font-black text-amber-900 dark:text-amber-400">
            يرجى تسجيل الدخول أولاً...
          </span>
        </div>
        <div className="hidden" aria-hidden="true">
          {children}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
