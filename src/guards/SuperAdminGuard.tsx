'use client';

import React from 'react';
import RoleGuard from './RoleGuard';

interface SuperAdminGuardProps {
  children: React.ReactNode;
  fallbackUrl?: string;
  fallbackComponent?: React.ReactNode;
}

export default function SuperAdminGuard({
  children,
  fallbackUrl = '/',
  fallbackComponent,
}: SuperAdminGuardProps) {
  return (
    <RoleGuard
      allowedRoles={['super_admin']}
      fallbackUrl={fallbackUrl}
      fallbackComponent={fallbackComponent}
    >
      {children}
    </RoleGuard>
  );
}
