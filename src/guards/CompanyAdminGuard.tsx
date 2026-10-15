'use client';

import React from 'react';
import RoleGuard from './RoleGuard';

interface CompanyAdminGuardProps {
  children: React.ReactNode;
  fallbackUrl?: string;
  fallbackComponent?: React.ReactNode;
}

export default function CompanyAdminGuard({
  children,
  fallbackUrl = '/',
  fallbackComponent,
}: CompanyAdminGuardProps) {
  return (
    <RoleGuard
      allowedRoles={['company_admin', 'admin', 'super_admin']}
      fallbackUrl={fallbackUrl}
      fallbackComponent={fallbackComponent}
    >
      {children}
    </RoleGuard>
  );
}
