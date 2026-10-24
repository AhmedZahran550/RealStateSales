'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { buildingService } from '@/services/buildingService';
import { Building } from '@/lib/types';
import BuildingForm from '@/components/buildings/BuildingForm';
import { Loader2, ArrowRight, Info, AlertCircle } from 'lucide-react';

export default function EditBuildingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const buildingId = Number(resolvedParams.id);
  const { buildings, currentUser, isCompanyAdmin, isSuperAdmin } = useApp();

  const [building, setBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const found = buildings.find((b) => b.id === buildingId);
    if (found) {
      setBuilding(found);
      setLoading(false);
    } else {
      buildingService.getBuildingById(buildingId).then((fetched) => {
        setBuilding(fetched);
        setLoading(false);
      });
    }
  }, [buildings, buildingId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Role Guard: Only Company Admin or Super Admin can edit buildings
  if (currentUser && !isCompanyAdmin && !isSuperAdmin) {
    return (
      <div className="mx-auto max-w-xl text-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-error-container text-error flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-on-surface">غير مصرح لك بتعديل هذا المبنى</h2>
        <p className="text-sm text-on-surface-variant">تعديل بيانات المبنى متاح فقط لمدير الشركة ومسؤولي النظام.</p>
        <Link href="/units" className="btn-primary inline-flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          العودة للوحدات
        </Link>
      </div>
    );
  }

  if (!building) {
    return (
      <div className="mx-auto max-w-2xl text-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-error-container text-error flex items-center justify-center mx-auto">
          <Info className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-on-surface">المبنى غير موجود</h2>
        <p className="text-sm text-on-surface-variant">تعذر العثور على المبنى المطلوب لتعديله.</p>
        <Link href="/admin/buildings" className="btn-primary inline-flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          العودة لقائمة المباني
        </Link>
      </div>
    );
  }

  // Company Guard: Company admin can only edit their company's buildings (or unassigned buildings)
  if (
    !isSuperAdmin &&
    building.companyId &&
    currentUser?.companyId &&
    building.companyId !== currentUser.companyId
  ) {
    return (
      <div className="mx-auto max-w-xl text-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-error-container text-error flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-on-surface">ليس لديك صلاحية على هذا المبنى</h2>
        <p className="text-sm text-on-surface-variant">هذا المبنى مسجل لشركة أخرى ولا يمكنك تعديله.</p>
        <Link href="/admin/buildings" className="btn-primary inline-flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          العودة لقائمة المباني
        </Link>
      </div>
    );
  }

  return <BuildingForm initialBuilding={building} isEdit />;
}
