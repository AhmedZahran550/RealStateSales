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
          <div className="w-14 h-14 rounded-2xl bg-error-container text-error flex items-center justify-center mb-4 border border-error shadow-sm">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-on-surface mb-1">
            غير مصرح لك بالوصول
          </h2>
          <p className="text-xs text-on-surface-variant max-w-sm">
            حسابك الحالي لا يملك الصلاحيات الكافية لعرض هذه الصفحة أو الإجراء.
          </p>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}
