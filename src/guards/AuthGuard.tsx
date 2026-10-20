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
  // الصفحة العامة للشركات متاحة للزوار بدون تسجيل دخول
  const isPublicPage = pathname.startsWith('/p/');

  useEffect(() => {
    if (!isInitialized || isPublicPage) return;

    if (!currentUser && !isLoginPage) {
      router.replace('/login');
    } else if (currentUser && isLoginPage) {
      if (currentUser.role === 'super_admin') {
        router.replace('/super-admin');
      } else {
        router.replace('/');
      }
    } else if (currentUser) {
      const isSuper = currentUser.role === 'super_admin';
      const isCompAdmin = currentUser.role === 'company_admin' || currentUser.role === 'admin';
      const isBrok = currentUser.role === 'user';

      // 1. مدير المنصة Super Admin: ممنوع من قسم العملاء والمطابقة
      if (isSuper && (pathname.startsWith('/customers') || pathname === '/matching')) {
        router.replace('/super-admin');
      }
      // 2. مدير الشركة Company Admin: ممنوع من صفحات السوبر أدمن ومن قسم العملاء الخاص بالوسطاء
      else if (isCompAdmin) {
        if (pathname.startsWith('/super-admin')) {
          router.replace('/');
        } else if (pathname.startsWith('/customers') || pathname === '/matching') {
          router.replace('/');
        }
      }
      // 3. الوسيط العقاري Broker: ممنوع من لوحة السوبر أدمن ومن صفحات الإدارة المركزية
      else if (isBrok) {
        if (pathname.startsWith('/super-admin') || pathname.startsWith('/admin')) {
          router.replace('/');
        }
      }
    }
  }, [currentUser, isInitialized, isLoginPage, isPublicPage, pathname, router]);

  // إذا كان المسار هو صفحة تسجيل الدخول أو الصفحة العامة، اعرضها مباشرة
  if (isLoginPage || isPublicPage) {
    return <>{children}</>;
  }

  // حالة انتظار قراءة الجلسة المخزنة في الصفحات المحمية
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface ">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-strong via-primary to-primary text-white flex items-center justify-center shadow-xl shadow-warning/30">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="text-xs font-black text-warning ">
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
      <div className="min-h-screen flex items-center justify-center bg-surface ">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-strong via-primary to-primary text-white flex items-center justify-center shadow-xl shadow-warning/30">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="text-xs font-black text-warning ">
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
