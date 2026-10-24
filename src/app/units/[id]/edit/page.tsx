'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { unitService } from '@/services/unitService';
import { Unit } from '@/lib/types';
import UnitForm from '@/components/units/UnitForm';
import { Loader2, ArrowRight, Info } from 'lucide-react';

export default function EditUnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const unitId = resolvedParams.id;
  const { units, isCompanyAdmin, isSuperAdmin } = useApp();

  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const found = units.find((u) => u.id === unitId);
    if (found) {
      setUnit(found);
      setLoading(false);
    } else {
      unitService.getUnitById(unitId).then((fetched) => {
        setUnit(fetched);
        setLoading(false);
      });
    }
  }, [units, unitId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="mx-auto max-w-2xl text-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-error-container text-error flex items-center justify-center mx-auto">
          <Info className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-on-surface">الوحدة غير موجودة</h2>
        <p className="text-sm text-on-surface-variant">تعذر العثور على الوحدة المطلوبة لتعديلها.</p>
        <Link href="/units" className="btn-primary inline-flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          العودة لقائمة الوحدات
        </Link>
      </div>
    );
  }

  return <UnitForm initialUnit={unit} isEdit />;
}
