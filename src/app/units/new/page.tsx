'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import UnitForm from '@/components/units/UnitForm';
import { Loader2 } from 'lucide-react';

function NewUnitContent() {
  const searchParams = useSearchParams();
  const zoneId = searchParams.get('zoneId') ? Number(searchParams.get('zoneId')) : undefined;
  const plotNo = searchParams.get('plotNo') ? Number(searchParams.get('plotNo')) : undefined;
  const buildingId = searchParams.get('buildingId') ? Number(searchParams.get('buildingId')) : undefined;

  return (
    <UnitForm
      defaultZoneId={zoneId}
      defaultPlotNo={plotNo}
      defaultBuildingId={buildingId}
    />
  );
}

export default function NewUnitPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <NewUnitContent />
    </Suspense>
  );
}
