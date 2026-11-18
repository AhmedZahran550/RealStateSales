'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  UNIT_KIND_LABELS,
  STAGE_CONFIG,
  CustomerStage,
  UnitKind,
} from '@/lib/types';
import { zoneDisplayName } from '@/lib/zone-utils';
import { exportUnitsToExcel } from '@/lib/excel';
import {
  Building2,
  Download,
  ArrowRight,
  Layers,
  UserCheck,
  Compass,
  TrendingUp,
} from 'lucide-react';

export default function ReportsPage() {
  const {
    currentUser,
    currentCompany,
    companyUsers,
    myUnits,
    myCustomers,
    zones,
    isCompanyAdmin,
    isSuperAdmin,
  } = useApp();

  // ========================================================
  // إحصائيات المخزون والوحدات (Company Inventory Analytics)
  // ========================================================
  const inventoryStats = useMemo(() => {
    const totalUnits = myUnits.length;
    const available = myUnits.filter((u) => u.status === 'available');
    const reserved = myUnits.filter((u) => u.status === 'reserved');
    const sold = myUnits.filter((u) => u.status === 'sold');

    const totalAvailableValue = available.reduce((acc, u) => acc + (u.price || 0), 0);
    const totalSoldValue = sold.reduce((acc, u) => acc + (u.price || 0), 0);
    const totalReservedValue = reserved.reduce((acc, u) => acc + (u.price || 0), 0);

    const totalArea = available.reduce((acc, u) => acc + (u.area || 0), 0);
    const avgPricePerMeter = totalArea > 0 ? Math.round(totalAvailableValue / totalArea) : 0;

    // تجميع الوحدات حسب الموظف الذي أضافها
    const creatorMap: Record<string, { name: string; count: number; totalValue: number }> = {};
    myUnits.forEach((u) => {
      const creatorName = u.createdByName?.trim() || 'غير محدد';
      if (!creatorMap[creatorName]) {
        creatorMap[creatorName] = { name: creatorName, count: 0, totalValue: 0 };
      }
      creatorMap[creatorName].count++;
      creatorMap[creatorName].totalValue += u.price || 0;
    });
    const creatorList = Object.values(creatorMap).sort((a, b) => b.count - a.count);

    // تجميع الوحدات حسب المنطقة
    const zoneMap: Record<number, { zoneId: number; name: string; count: number; available: number }> = {};
    myUnits.forEach((u) => {
      if (!zoneMap[u.zoneId]) {
        zoneMap[u.zoneId] = {
          zoneId: u.zoneId,
          name: zoneDisplayName(u.zoneId, zones),
          count: 0,
          available: 0,
        };
      }
      zoneMap[u.zoneId].count++;
      if (u.status === 'available') zoneMap[u.zoneId].available++;
    });
    const zoneList = Object.values(zoneMap).sort((a, b) => b.count - a.count);

    // تجميع الوحدات حسب النوع
    const kindMap: Record<string, { kind: UnitKind; label: string; count: number }> = {};
    myUnits.forEach((u) => {
      if (!kindMap[u.unitKind]) {
        kindMap[u.unitKind] = {
          kind: u.unitKind,
          label: UNIT_KIND_LABELS[u.unitKind] || u.unitKind,
          count: 0,
        };
      }
      kindMap[u.unitKind].count++;
    });
    const kindList = Object.values(kindMap).sort((a, b) => b.count - a.count);

    return {
      totalUnits,
      availableCount: available.length,
      reservedCount: reserved.length,
      soldCount: sold.length,
      totalAvailableValue,
      totalSoldValue,
      totalReservedValue,
      avgPricePerMeter,
      creatorList,
      zoneList,
      kindList,
    };
  }, [myUnits, zones]);

  // ========================================================
  // إحصائيات مسار الصفقات والعملاء (CRM Pipeline Analytics)
  // ========================================================
  const crmStats = useMemo(() => {
    const totalCustomers = myCustomers.length;
    const stages: CustomerStage[] = ['lead', 'asking', 'viewed', 'negotiating', 'reserved', 'closed', 'lost'];

    const stageBreakdown = stages.map((st) => {
      const list = myCustomers.filter((c) => c.stage === st);
      const budgetSum = list.reduce((acc, c) => acc + (c.budget || 0), 0);
      const pct = totalCustomers > 0 ? Math.round((list.length / totalCustomers) * 100) : 0;
      return {
        stage: st,
        config: STAGE_CONFIG[st],
        count: list.length,
        budgetSum,
        pct,
      };
    });

    const activeNegotiating = myCustomers.filter((c) => c.stage === 'negotiating' || c.stage === 'reserved');
    const negotiatingBudget = activeNegotiating.reduce((acc, c) => acc + (c.budget || 0), 0);
    const expectedCommission = Math.round(negotiatingBudget * 0.025);

    const closedCustomers = myCustomers.filter((c) => c.stage === 'closed');
    const closedVolume = closedCustomers.reduce((acc, c) => acc + (c.budget || 0), 0);

    // مصادر العملاء
    const sourceMap: Record<string, number> = {};
    myCustomers.forEach((c) => {
      const src = c.source?.trim() || 'أخرى / مباشر';
      sourceMap[src] = (sourceMap[src] || 0) + 1;
    });
    const sourceList = Object.entries(sourceMap)
      .map(([src, count]) => ({ source: src, count, pct: totalCustomers > 0 ? Math.round((count / totalCustomers) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);

    return {
      totalCustomers,
      stageBreakdown,
      activeNegotiatingCount: activeNegotiating.length,
      negotiatingBudget,
      expectedCommission,
      closedVolume,
      closedCount: closedCustomers.length,
      sourceList,
    };
  }, [myCustomers]);

  if (!currentUser) return null;

  const isAdmin = isCompanyAdmin || isSuperAdmin;
  const companyBrokers = companyUsers.filter((u) => u.role === 'user');

  return (
    <div className="flex flex-col w-full space-y-space-lg animate-in fade-in duration-300 pb-12">
      {/* 1. Header Banner */}
      <div className="rounded-2xl bg-surface-container-low p-5 sm:p-6 border border-surface-container-high/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/"
              className="text-xs font-bold text-on-surface-variant hover:text-primary flex items-center gap-1 transition"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة للوحة الرئيسية</span>
            </Link>
            <span className="text-outline">•</span>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-xs">
              📊 تقارير الأداء والإحصائيات
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-on-surface tracking-tight">
            {isAdmin
              ? `التقارير التحليلية لشركة ${currentCompany?.name || currentUser.companyName || 'العقارية'}`
              : `التقارير الإحصائية ومسار الصفقات — ${currentUser.fullName}`}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            {isAdmin
              ? 'مؤشرات شاملة عن المخزون العقاري، تقييم المحفظة، أداء الوسطاء ومصادر الوحدات المسجلة.'
              : 'مؤشرات دقيقة لمسار العملاء، الصفقات قيد التفاوض، العمولات التقديرية ومعدلات الإغلاق.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {isAdmin && (
            <button
              type="button"
              onClick={() => exportUnitsToExcel(myUnits)}
              className="btn-tonal px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 min-h-[40px] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تصدير Excel للمحفظة</span>
            </button>
          )}
          <Link
            href="/units"
            className="btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 min-h-[40px]"
          >
            <Building2 className="w-4 h-4" />
            <span>عرض الوحدات</span>
          </Link>
        </div>
      </div>

      {/* 2. Top Highlights Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {isAdmin ? (
          <>
            <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 shadow-xs">
              <span className="text-xs font-bold text-on-surface-variant block mb-1">إجمالي قيمة المعروض المتاح</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-primary font-mono tabular-nums">
                  {(inventoryStats.totalAvailableValue / 1_000_000).toFixed(1)}
                </span>
                <span className="text-xs font-bold text-on-surface-variant">مليون ج.م</span>
              </div>
              <span className="text-[11px] text-on-surface-variant mt-1 block">
                {inventoryStats.availableCount} وحدة سكنية متاحة
              </span>
            </div>

            <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 shadow-xs">
              <span className="text-xs font-bold text-on-surface-variant block mb-1">متوسط سعر المتر</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-on-surface font-mono tabular-nums">
                  {inventoryStats.avgPricePerMeter.toLocaleString('ar-EG')}
                </span>
                <span className="text-xs font-bold text-on-surface-variant">ج/م²</span>
              </div>
              <span className="text-[11px] text-success font-semibold mt-1 block">
                محسوب على الوحدات المتاحة
              </span>
            </div>

            <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 shadow-xs">
              <span className="text-xs font-bold text-on-surface-variant block mb-1">الوحدات المباعة والمحجوزة</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-on-surface tabular-nums">
                  {inventoryStats.reservedCount + inventoryStats.soldCount}
                </span>
                <span className="text-xs font-bold text-on-surface-variant">وحدة</span>
              </div>
              <span className="text-[11px] text-on-surface-variant mt-1 block">
                {inventoryStats.reservedCount} حجز مؤقت • {inventoryStats.soldCount} مباعة
              </span>
            </div>

            <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 shadow-xs">
              <span className="text-xs font-bold text-on-surface-variant block mb-1">فريق العمل والوسطاء</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-warning tabular-nums">
                  {companyBrokers.length}
                </span>
                <span className="text-xs font-bold text-on-surface-variant">وسيط مسجل</span>
              </div>
              <span className="text-[11px] text-on-surface-variant mt-1 block">
                {inventoryStats.creatorList.length} أعضاء شاركوا في إضافة المخزون
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 shadow-xs">
              <span className="text-xs font-bold text-on-surface-variant block mb-1">حجم صفقات التفاوض</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-primary font-mono tabular-nums">
                  {crmStats.negotiatingBudget >= 1_000_000
                    ? (crmStats.negotiatingBudget / 1_000_000).toFixed(1)
                    : (crmStats.negotiatingBudget / 1_000).toFixed(0)}
                </span>
                <span className="text-xs font-bold text-on-surface-variant">
                  {crmStats.negotiatingBudget >= 1_000_000 ? 'مليون ج.م' : 'ألف ج.م'}
                </span>
              </div>
              <span className="text-[11px] text-on-surface-variant mt-1 block">
                {crmStats.activeNegotiatingCount} عملاء في مرحلة التفاوض والحجز
              </span>
            </div>

            <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 shadow-xs">
              <span className="text-xs font-bold text-on-surface-variant block mb-1">العمولة المتوقعة (2.5%)</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-success font-mono tabular-nums">
                  {crmStats.expectedCommission.toLocaleString('ar-EG')}
                </span>
                <span className="text-xs font-bold text-on-surface-variant">ج.م</span>
              </div>
              <span className="text-[11px] text-success font-semibold mt-1 block">
                تقدير الأرباح عند إتمام الصفقات
              </span>
            </div>

            <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 shadow-xs">
              <span className="text-xs font-bold text-on-surface-variant block mb-1">إجمالي الصفقات المغلقة</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-on-surface tabular-nums">
                  {crmStats.closedCount}
                </span>
                <span className="text-xs font-bold text-on-surface-variant">صفقة منجزة</span>
              </div>
              <span className="text-[11px] text-on-surface-variant mt-1 block">
                بقيمة {(crmStats.closedVolume / 1_000_000).toFixed(1)} مليون ج.م
              </span>
            </div>

            <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 sm:p-5 shadow-xs">
              <span className="text-xs font-bold text-on-surface-variant block mb-1">قاعدة العملاء الإجمالية</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-on-surface tabular-nums">
                  {crmStats.totalCustomers}
                </span>
                <span className="text-xs font-bold text-on-surface-variant">عميل مسجل</span>
              </div>
              <span className="text-[11px] text-on-surface-variant mt-1 block">
                {myCustomers.filter((c) => c.nextFollowupAt).length} مواعيد متابعة مستحقة
              </span>
            </div>
          </>
        )}
      </div>

      {/* 3. Detailed Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
        {/* Panel 1: Status Distribution */}
        <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
            <h3 className="font-bold text-sm sm:text-base text-on-surface flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span>{isAdmin ? 'توزيع حالات الوحدات العقارية' : 'توزيع مراحل العملاء (Sales Pipeline)'}</span>
            </h3>
            <span className="text-xs text-on-surface-variant font-bold">
              {isAdmin ? `${inventoryStats.totalUnits} وحدة إجمالاً` : `${crmStats.totalCustomers} عميل إجمالاً`}
            </span>
          </div>

          {isAdmin ? (
            <div className="space-y-4">
              {/* Available */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-success flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    متاحة للبيع
                  </span>
                  <span className="font-mono text-on-surface">
                    {inventoryStats.availableCount} وحدة ({inventoryStats.totalUnits > 0 ? Math.round((inventoryStats.availableCount / inventoryStats.totalUnits) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
                  <div
                    className="h-full bg-success rounded-full transition-all duration-500"
                    style={{ width: `${inventoryStats.totalUnits > 0 ? (inventoryStats.availableCount / inventoryStats.totalUnits) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Reserved */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-warning flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-warning" />
                    حجز مؤقت (مفاوضات)
                  </span>
                  <span className="font-mono text-on-surface">
                    {inventoryStats.reservedCount} وحدة ({inventoryStats.totalUnits > 0 ? Math.round((inventoryStats.reservedCount / inventoryStats.totalUnits) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
                  <div
                    className="h-full bg-warning rounded-full transition-all duration-500"
                    style={{ width: `${inventoryStats.totalUnits > 0 ? (inventoryStats.reservedCount / inventoryStats.totalUnits) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Sold */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-on-surface-variant flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-outline" />
                    تم البيع والتعاقد
                  </span>
                  <span className="font-mono text-on-surface">
                    {inventoryStats.soldCount} وحدة ({inventoryStats.totalUnits > 0 ? Math.round((inventoryStats.soldCount / inventoryStats.totalUnits) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
                  <div
                    className="h-full bg-outline rounded-full transition-all duration-500"
                    style={{ width: `${inventoryStats.totalUnits > 0 ? (inventoryStats.soldCount / inventoryStats.totalUnits) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {crmStats.stageBreakdown.map((item) => (
                <div key={item.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold ${item.config.color}`}>
                      {item.config.label}
                    </span>
                    <span className="font-mono text-on-surface font-semibold text-[11px]">
                      {item.count} عميل ({item.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.config.bg}`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel 2: Team Production (Created By) OR Customer Sources */}
        <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
            <h3 className="font-bold text-sm sm:text-base text-on-surface flex items-center gap-2">
              {isAdmin ? <UserCheck className="w-4 h-4 text-primary" /> : <TrendingUp className="w-4 h-4 text-primary" />}
              <span>{isAdmin ? 'إنتاجية الفريق (من قام بإضافة الوحدات)' : 'مصادر استقطاب العملاء (Lead Sources)'}</span>
            </h3>
            <span className="text-xs text-on-surface-variant font-bold">
              {isAdmin ? `${inventoryStats.creatorList.length} منشئ` : `${crmStats.sourceList.length} مصادر`}
            </span>
          </div>

          {isAdmin ? (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {inventoryStats.creatorList.length === 0 ? (
                <p className="text-xs text-on-surface-variant text-center py-6">لا توجد بيانات متاحة حالياً</p>
              ) : (
                inventoryStats.creatorList.map((creator, idx) => (
                  <div
                    key={creator.name}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-surface-container-high/60 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-surface-container text-on-surface-variant font-mono font-bold flex items-center justify-center text-[11px]">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-on-surface block">{creator.name}</span>
                        <span className="text-[10px] text-on-surface-variant">
                          بقيمة {(creator.totalValue / 1_000_000).toFixed(1)} مليون ج.م
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold font-mono">
                      {creator.count} وحدة
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {crmStats.sourceList.length === 0 ? (
                <p className="text-xs text-on-surface-variant text-center py-6">لا توجد بيانات متاحة حالياً</p>
              ) : (
                crmStats.sourceList.map((src) => (
                  <div
                    key={src.source}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-surface-container-high/60 text-xs"
                  >
                    <span className="font-bold text-on-surface">{src.source}</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-on-surface">{src.count} عميل</span>
                      <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[10px] font-semibold">
                        {src.pct}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. Secondary Breakdown: Zones and Types for Admin */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
          {/* Units by Zone */}
          <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 sm:p-6 shadow-xs space-y-3">
            <h3 className="font-bold text-sm sm:text-base text-on-surface flex items-center gap-2 pb-2 border-b border-surface-container-high">
              <Compass className="w-4 h-4 text-primary" />
              <span>توزيع الوحدات حسب المناطق السكنية</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {inventoryStats.zoneList.map((z) => (
                <div key={z.zoneId} className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/60 text-xs flex items-center justify-between">
                  <span className="font-bold text-on-surface">{z.name}</span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-success font-bold text-[11px]">{z.available} متاح</span>
                    <span className="text-outline">/</span>
                    <span className="text-on-surface-variant font-bold text-[11px]">{z.count} كلي</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Units by Kind */}
          <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 sm:p-6 shadow-xs space-y-3">
            <h3 className="font-bold text-sm sm:text-base text-on-surface flex items-center gap-2 pb-2 border-b border-surface-container-high">
              <Building2 className="w-4 h-4 text-primary" />
              <span>توزيع الوحدات حسب نوع الوحدة</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {inventoryStats.kindList.map((k) => (
                <div key={k.kind} className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/60 text-xs flex items-center justify-between">
                  <span className="font-bold text-on-surface">{k.label}</span>
                  <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold font-mono text-[11px]">
                    {k.count} وحدة
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
