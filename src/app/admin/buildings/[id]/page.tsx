'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building, Unit } from '@/lib/types';
import { useApp } from '@/context/AppContext';
import { buildingService } from '@/services/buildingService';
import { zoneDisplayName } from '@/lib/zone-utils';
import UnitCard from '@/components/units/UnitCard';
import {
  Building2,
  MapPin,
  Sparkles,
  Edit,
  Trash2,
  Plus,
  ArrowRight,
  Loader2,
  Info,
  Layers,
  FileText,
} from 'lucide-react';

export default function BuildingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const buildingId = Number(resolvedParams.id);

  const {
    buildings,
    units,
    zones,
    currentUser,
    isCompanyAdmin,
    isSuperAdmin,
    updateUnitStatus,
    refreshFromDatabase,
  } = useApp();

  const [building, setBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

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

  if (!building) {
    return (
      <div className="mx-auto max-w-2xl text-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-error-container text-error flex items-center justify-center mx-auto">
          <Info className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-on-surface">المبنى غير موجود</h2>
        <p className="text-sm text-on-surface-variant">قد يكون المبنى قد حُذف أو لا تملك صلاحية الوصول إليه.</p>
        <Link href="/admin/buildings" className="btn-primary inline-flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          العودة لقائمة المباني
        </Link>
      </div>
    );
  }

  const buildingUnits = units.filter(
    (u) => u.buildingId === building.id || (u.zoneId === building.zoneId && u.plotNo === building.plotNo)
  );

  const availableCount = buildingUnits.filter((u) => u.status === 'available').length;
  const reservedCount = buildingUnits.filter((u) => u.status === 'reserved').length;
  const soldCount = buildingUnits.filter((u) => u.status === 'sold').length;

  const handleDelete = async () => {
    if (buildingUnits.length > 0) {
      alert(`لا يمكن حذف المبنى لاحتوائه على ${buildingUnits.length} وحدة مسجلة. يرجى حذف أو نقل الوحدات أولاً.`);
      return;
    }
    if (!confirm(`هل أنت متأكد من حذف المبنى قطعة ${building.plotNo} نهائياً؟`)) return;

    setIsDeleting(true);
    try {
      const res = await buildingService.deleteBuilding(building.id);
      if (res.success) {
        await refreshFromDatabase();
        router.push('/admin/buildings');
      } else {
        alert(res.message || 'فشل حذف المبنى');
        setIsDeleting(false);
      }
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/buildings"
            className="p-2.5 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container text-on-surface-variant transition"
            title="العودة لقائمة المباني"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-black text-xl shadow-md">
            {building.plotNo}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-on-surface">
                {zoneDisplayName(building.zoneId, zones)} • قطعة {building.plotNo}
              </h1>
              {building.landArea && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-mono font-bold border border-outline-variant">
                  {building.landArea} م² أرض
                </span>
              )}
              {building.mapX !== undefined && building.mapY !== undefined && (
                <Link
                  href={`/map?zoneId=${building.zoneId}`}
                  className="text-xs px-2.5 py-0.5 rounded-full bg-surface-container hover:bg-surface-container-high text-primary font-mono font-bold border border-outline-variant transition flex items-center gap-1"
                  title="عرض الموضع على الخريطة"
                >
                  <span>📍 خريطة: {building.mapX}% / {building.mapY}%</span>
                </Link>
              )}
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              إجمالي {buildingUnits.length} وحدة مسجلة بالعمارة ({availableCount} متاح، {reservedCount} حجز، {soldCount} مباع)
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/units/new?buildingId=${building.id}&zoneId=${building.zoneId}&plotNo=${building.plotNo}`}
            className="btn-primary px-4 py-2 text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ إضافة وحدة بالمبنى</span>
          </Link>

          {(isCompanyAdmin || isSuperAdmin) && (
            <>
              <Link
                href={`/admin/buildings/${building.id}/edit`}
                className="btn-tonal px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Edit className="w-4 h-4 text-primary" />
                <span>تعديل بيانات المبنى</span>
              </Link>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3.5 py-2 rounded-xl bg-error-container hover:bg-error-container/80 text-error font-bold text-xs border border-error/20 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>حذف</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Building Features & Specs Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: Available */}
        <div className="card p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-on-surface-variant">الوحدات المتاحة للبيع</span>
            <p className="text-2xl font-black text-success mt-1">{availableCount} وحدة</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-success-container text-success flex items-center justify-center font-bold">
            متاح
          </div>
        </div>

        {/* KPI 2: Reserved */}
        <div className="card p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-on-surface-variant">حجز مؤقت / مفاوضات</span>
            <p className="text-2xl font-black text-warning mt-1">{reservedCount} وحدة</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-warning-container text-warning flex items-center justify-center font-bold">
            حجز
          </div>
        </div>

        {/* KPI 3: Sold */}
        <div className="card p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-on-surface-variant">تم التعاقد والبيع</span>
            <p className="text-2xl font-black text-on-surface mt-1">{soldCount} وحدة</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface-container text-on-surface flex items-center justify-center font-bold">
            مباع
          </div>
        </div>
      </div>

      {/* Features & Notes */}
      {((building.features && building.features.length > 0) || building.notes) && (
        <div className="card p-5 space-y-4">
          {building.features && building.features.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-on-surface flex items-center gap-1.5 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                المميزات العامة للعمارة (تُورث لجميع الشقق)
              </h2>
              <div className="flex flex-wrap gap-2">
                {building.features.map((feat, idx) => (
                  <span
                    key={idx}
                    className="chip px-3 py-1 text-xs font-semibold bg-surface-container text-on-surface border border-outline-variant"
                  >
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {building.notes && (
            <div className="pt-3 border-t border-outline-variant">
              <span className="text-xs font-bold text-on-surface block mb-1">ملاحظات المبنى:</span>
              <p className="text-xs text-on-surface-variant leading-relaxed">{building.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Building Units Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            وحدات وشقق العمارة ({buildingUnits.length})
          </h2>
          <Link
            href={`/units/new?buildingId=${building.id}&zoneId=${building.zoneId}&plotNo=${building.plotNo}`}
            className="text-xs font-bold text-primary hover:underline"
          >
            + إضافة وحدة جديدة لهذه العمارة
          </Link>
        </div>

        {buildingUnits.length === 0 ? (
          <div className="card p-12 text-center space-y-3">
            <Building2 className="w-12 h-12 text-on-surface-variant/40 mx-auto" />
            <h3 className="font-bold text-on-surface text-base">لا توجد وحدات مضافة لهذه العمارة حتى الآن</h3>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              يمكنك البدء بإضافة شقق سكنية أو أدوار أرضية أو رووف ضمن هذا المبنى.
            </p>
            <Link
              href={`/units/new?buildingId=${building.id}&zoneId=${building.zoneId}&plotNo=${building.plotNo}`}
              className="btn-primary inline-flex items-center gap-2 text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              إضافة أول وحدة الآن
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {buildingUnits.map((u) => (
              <UnitCard
                key={u.id}
                unit={u}
                zones={zones}
                currentUser={currentUser}
                onStatusChange={(unitId, newStatus) => updateUnitStatus(unitId, newStatus)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
