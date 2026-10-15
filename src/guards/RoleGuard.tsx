'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { AppRole } from '@/lib/types';
import { ShieldAlert } from 'lucide-react';

export interface RoleGuardProps {
  allowedRoles: AppRole[];
  children: React.ReactNode;
  fallbackUrl?: string;
  fallbackComponent?: React.ReactNode;
}

export default function RoleGuard({
  allowedRoles,
  children,
  fallbackUrl,
  fallbackComponent,
}: RoleGuardProps) {
  const { currentUser, isInitialized } = useApp();
  const router = useRouter();

  const userRole = currentUser?.role;
  const isAllowed = userRole ? allowedRoles.includes(userRole) : false;

  useEffect(() => {
    if (!isInitialized) return;

    if (!currentUser) {
      router.replace('/login');
    } else if (!isAllowed && fallbackUrl) {
      router.replace(fallbackUrl);
    }
  }, [currentUser, isAllowed, isInitialized, fallbackUrl, router]);

  if (!isInitialized) {
    return null;
  }

  if (!currentUser || !isAllowed) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }

    if (!fallbackUrl) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 border border-rose-200 dark:border-rose-900/50 shadow-sm">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-1">
            غير مصرح لك بالوصول
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            حسابك الحالي لا يملك الصلاحيات الكافية لعرض هذه الصفحة أو الإجراء.
          </p>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}
