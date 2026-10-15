'use client';

import React from 'react';
import RoleGuard from './RoleGuard';

interface BrokerGuardProps {
  children: React.ReactNode;
  fallbackUrl?: string;
  fallbackComponent?: React.ReactNode;
}

export default function BrokerGuard({
  children,
  fallbackUrl = '/',
  fallbackComponent,
}: BrokerGuardProps) {
  return (
    <RoleGuard
      allowedRoles={['user']}
      fallbackUrl={fallbackUrl}
      fallbackComponent={fallbackComponent}
    >
      {children}
    </RoleGuard>
  );
}
