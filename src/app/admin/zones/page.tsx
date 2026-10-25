'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Zone, Building } from '@/lib/types';
import {
  Compass,
  Building2,
  Check,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  MapPin,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

const DIRECTIONS = [
  { value: 'وسط', label: 'وسط (مركز المنطقة)' },
  { value: 'بحري', label: 'بحري (شمالي)' },
  { value: 'قبلي', label: 'قبلي (جنوبي)' },
  { value: 'شرقي', label: 'شرقي' },
  { value: 'غربي', label: 'غربي' },
];

export default function AdminZonesPage() {
  const {
    zones,
    buildings,
    myUnits,
    currentUser,
    currentCompany,
    isSuperAdmin,
    isCompanyAdmin,
    companies,
    addZone,
    updateZone,
    deleteZone,
    refreshZones,
  } = useApp();

  // فلترة حسب الشركة للمدير العام، أو تثبيت شركة المدير الحالي
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    isSuperAdmin ? (currentUser?.companyId || companies[0]?.id || '') : (currentUser?.companyId || '')
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirection, setFilterDirection] = useState<string>('all');

  // بيانات إضافة منطقة جديدة
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneDirection, setNewZoneDirection] = useState<string>('وسط');
  const [newZoneNotes, setNewZoneNotes] = useState('');
  const [newZoneParentId, setNewZoneParentId] = useState<string>('none');
  const [addingZone, setAddingZone] = useState(false);

  // التحكم في التعديل
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [editName, setEditName] = useState('');
  const [editDirection, setEditDirection] = useState('وسط');
  const [editNotes, setEditNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // التحكم في الحذف
  const [deletingZoneId, setDeletingZoneId] = useState<number | null>(null);

  // إضافة مجاورة فرعية سريعة تحت منطقة رئيسية
  const [quickSubZoneParentId, setQuickSubZoneParentId] = useState<number | null>(null);
  const [quickSubName, setQuickSubName] = useState('');
  const [quickSubDirection, setQuickSubDirection] = useState('وسط');
  const [addingSubZone, setAddingSubZone] = useState(false);

  // إشعار الإجراءات
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // طي وبسط المناطق الرئيسية
  const [collapsedZones, setCollapsedZones] = useState<Record<number, boolean>>({});
  const toggleCollapse = (id: number) => {
    setCollapsedZones((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // المناطق المتاحة بناءً على الصلاحيات
  const visibleZones = useMemo(() => {
    let list = isSuperAdmin && selectedCompanyId
      ? zones.filter((z) => z.companyId === selectedCompanyId || !z.companyId)
      : zones;

    if (filterDirection !== 'all') {
      list = list.filter((z) => z.direction === filterDirection);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(
        (z) =>
          z.name.toLowerCase().includes(q) ||
          z.id.toString().includes(q) ||
          (z.notes && z.notes.toLowerCase().includes(q))
      );
    }

    return list;
  }, [zones, isSuperAdmin, selectedCompanyId, filterDirection, searchTerm]);

  // تقسيم المناطق لرئيسية وفرعية
  const mainZones = useMemo(
    () => visibleZones.filter((z) => z.parentId == null),
    [visibleZones]
  );

  const allMainZonesForCompany = useMemo(() => {
    return (isSuperAdmin && selectedCompanyId
      ? zones.filter((z) => (z.companyId === selectedCompanyId || !z.companyId) && z.parentId == null)
      : zones.filter((z) => z.parentId == null));
  }, [zones, isSuperAdmin, selectedCompanyId]);

  const subZonesOf = (mainId: number) => {
    return visibleZones.filter((z) => z.parentId === mainId);
  };

  const getZoneBuildings = (zoneId: number): Building[] => {
    return buildings.filter((b) => b.zoneId === zoneId);
  };

  // إحصائيات سريعة
  const totalSubZonesCount = visibleZones.filter((z) => z.parentId != null).length;
  const totalLinkedBuildings = buildings.length;

  // معالجة إضافة منطقة جديدة (رئيسية أو فرعية)
  const handleCreateZone = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = newZoneName.trim();
    if (!name) {
      showToast('error', 'يرجى كتابة اسم المنطقة أو المجاورة');
      return;
    }

    if (isSuperAdmin && !selectedCompanyId) {
      showToast('error', 'يرجى تحديد الشركة المالكة للمنطقة');
      return;
    }

    setAddingZone(true);
    const parentId = newZoneParentId !== 'none' ? Number(newZoneParentId) : null;

    const res = await addZone({
      name,
      direction: newZoneDirection,
      notes: newZoneNotes.trim() || undefined,
      parentId,
      companyId: isSuperAdmin ? selectedCompanyId : undefined,
    });

    setAddingZone(false);
    if (res.success) {
      setNewZoneName('');
      setNewZoneNotes('');
      setNewZoneDirection('وسط');
      setNewZoneParentId('none');
      showToast('success', res.message || 'تمت إضافة المنطقة بنجاح');
    } else {
      showToast('error', res.message || 'تعذر إضافة المنطقة');
    }
  };

  // إضافة سريعة لمجاورة فرعية تحت منطقة محددة
  const handleQuickAddSubZone = async (parentId: number) => {
    const name = quickSubName.trim();
    if (!name) {
      showToast('error', 'يرجى كتابة اسم المجاورة أو الحي الفرعي');
      return;
    }

    setAddingSubZone(true);
    const res = await addZone({
      name,
      direction: quickSubDirection,
      parentId,
      companyId: isSuperAdmin ? selectedCompanyId : undefined,
    });
    setAddingSubZone(false);

    if (res.success) {
      setQuickSubName('');
      setQuickSubZoneParentId(null);
      showToast('success', 'تمت إضافة المجاورة الفرعية بنجاح');
      // تأكيد فتح المنطقة الرئيسية إن كانت مطوية
      setCollapsedZones((prev) => ({ ...prev, [parentId]: false }));
    } else {
      showToast('error', res.message || 'تعذر إضافة المجاورة الفرعية');
    }
  };

  // فتح نافذة التعديل
  const openEditModal = (zone: Zone) => {
    setEditingZone(zone);
    setEditName(zone.name);
    setEditDirection(zone.direction || 'وسط');
    setEditNotes(zone.notes || '');
  };

  // حفظ التعديل
  const handleSaveEdit = async () => {
    if (!editingZone) return;
    const name = editName.trim();
    if (!name) {
      showToast('error', 'اسم المنطقة مطلوب');
      return;
    }

    setSavingEdit(true);
    const res = await updateZone(editingZone.id, {
      name,
      direction: editDirection,
      notes: editNotes.trim() || undefined,
    });
    setSavingEdit(false);

    if (res.success) {
      setEditingZone(null);
      showToast('success', 'تم تحديث بيانات المنطقة بنجاح');
    } else {
      showToast('error', res.message || 'تعذر حفظ تعديلات المنطقة');
    }
  };

  // معالجة حذف المنطقة
  const handleDeleteZone = async (zone: Zone) => {
    const linked = getZoneBuildings(zone.id);
    if (linked.length > 0) {
      showToast(
        'error',
        `لا يمكن حذف "${zone.name}" — يوجد ${linked.length} مبنى/قطعة مرتبطة بها. احذف المباني والوحدات أولاً`
      );
      return;
    }

    const subs = zone.parentId == null ? subZonesOf(zone.id).length : 0;
    if (subs > 0) {
      showToast(
        'error',
        `لا يمكن حذف المنطقة الرئيسية "${zone.name}" لوجود ${subs} مجاورة فرعية فيها. احذف المجاورات أولاً`
      );
      return;
    }

    if (!confirm(`هل أنت متأكد من حذف ${zone.parentId ? 'المجاورة' : 'المنطقة'} "${zone.name}" نهائياً؟`)) {
      return;
    }

    setDeletingZoneId(zone.id);
    const res = await deleteZone(zone.id);
    setDeletingZoneId(null);

    if (res.success) {
      showToast('success', `تم حذف "${zone.name}" بنجاح`);
    } else {
      showToast('error', res.message || 'تعذر حذف المنطقة');
    }
  };

  return (
    <div className="flex flex-col w-full space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 border animate-in fade-in slide-in-from-bottom-2 ${
            toast.type === 'success'
              ? 'bg-success-container text-on-success-container border-success'
              : 'bg-error-container text-on-error-container border-error'
          }`}
        >
          {toast.type === 'success' ? (
            <Check className="w-4 h-4 text-success shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-error shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. Header Card */}
      <div className="card p-4 sm:p-6 border border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-sm shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-black text-on-surface">
                إدارة مناطق ومجاورات الشركة
              </h1>
              <span className="badge badge-neutral text-xs font-bold">
                {currentCompany?.name || 'الشركة العقارية'}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              تحكم كامل في المناطق الجغرافية الرئيسية والمجاورات والأحياء التابعة، وتتبع القطع والمباني المسجلة بكل منطقة.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
          <Link
            href="/units"
            className="btn-tonal text-xs flex-1 sm:flex-none flex items-center justify-center gap-1.5 min-h-[44px] px-4"
          >
            <Building2 className="w-4 h-4" />
            <span>عرض الوحدات</span>
          </Link>
          <Link
            href="/map"
            className="btn-primary text-xs flex-1 sm:flex-none flex items-center justify-center gap-1.5 min-h-[44px] px-4"
          >
            <MapPin className="w-4 h-4" />
            <span>الخريطة التفاعلية</span>
          </Link>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1 */}
        <div className="card p-3.5 sm:p-4 border border-outline-variant flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-on-surface-variant font-bold block truncate">
              المناطق الرئيسية
            </span>
            <span className="text-lg sm:text-2xl font-black text-on-surface">
              {mainZones.length}
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="card p-3.5 sm:p-4 border border-outline-variant flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-on-surface-variant font-bold block truncate">
              المجاورات الفرعية
            </span>
            <span className="text-lg sm:text-2xl font-black text-on-surface">
              {totalSubZonesCount}
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="card p-3.5 sm:p-4 border border-outline-variant flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-success-container text-on-success-container flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-success" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-on-surface-variant font-bold block truncate">
              قطع ومباني مسجلة
            </span>
            <span className="text-lg sm:text-2xl font-black text-on-surface">
              {totalLinkedBuildings}
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="card p-3.5 sm:p-4 border border-outline-variant flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-warning-container text-on-warning-container flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-warning" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-on-surface-variant font-bold block truncate">
              إجمالي المعروض
            </span>
            <span className="text-lg sm:text-2xl font-black text-on-surface">
              {myUnits.length} وحدة
            </span>
          </div>
        </div>
      </div>

      {/* 3. Add Zone / District Panel */}
      <div className="card p-4 sm:p-6 border border-outline-variant space-y-4">
        <div className="flex items-center gap-2 border-b border-outline-variant/60 pb-3">
          <div className="w-8 h-8 rounded-lg bg-primary-fixed text-primary flex items-center justify-center">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm sm:text-base text-on-surface">
              إضافة منطقة جديدة أو مجاورة فرعية
            </h2>
            <p className="text-[11px] text-on-surface-variant">
              يمكنك إضافة منطقة رئيسية مستقلة، أو اختيار منطقة رئيسية لإضافة مجاورة/حي فرعي تابع لها
            </p>
          </div>
        </div>

        {/* سوبر أدمن فقط: اختيار الشركة */}
        {isSuperAdmin && (
          <div className="max-w-md">
            <label className="block text-xs font-bold text-on-surface-variant mb-1">
              الشركة التابعة لها المنطقة *
            </label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="input-base text-xs min-h-[44px]"
            >
              <option value="">-- اختر الشركة --</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleCreateZone} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-end">
            {/* نوع التقسيم: رئيسي أو فرعي */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-bold text-on-surface-variant mb-1">
                نوع التقسيم *
              </label>
              <select
                value={newZoneParentId}
                onChange={(e) => setNewZoneParentId(e.target.value)}
                className="input-base text-xs min-h-[44px]"
              >
                <option value="none">📍 منطقة رئيسية مستقلة</option>
                {allMainZonesForCompany.map((mz) => (
                  <option key={mz.id} value={mz.id}>
                    ↳ مجاورة فرعية تحت: {mz.name}
                  </option>
                ))}
              </select>
            </div>

            {/* الاسم */}
            <div className="lg:col-span-4">
              <label className="block text-xs font-bold text-on-surface-variant mb-1">
                {newZoneParentId === 'none' ? 'اسم المنطقة الرئيسية *' : 'اسم المجاورة / الحي الفرعي *'}
              </label>
              <input
                type="text"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                placeholder={newZoneParentId === 'none' ? 'مثال: الحي المتميز، منطقة 1...' : 'مثال: المجاورة الأولى، حي الزهور...'}
                maxLength={80}
                className="input-base text-xs min-h-[44px]"
              />
            </div>

            {/* الاتجاه الجغرافي */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-on-surface-variant mb-1">
                الاتجاه الجغرافي
              </label>
              <select
                value={newZoneDirection}
                onChange={(e) => setNewZoneDirection(e.target.value)}
                className="input-base text-xs min-h-[44px]"
              >
                {DIRECTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* ملاحظات */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-bold text-on-surface-variant mb-1">
                ملاحظات أو معالم (اختياري)
              </label>
              <input
                type="text"
                value={newZoneNotes}
                onChange={(e) => setNewZoneNotes(e.target.value)}
                placeholder="مثال: واجهة على طريق السويس، قرب الخدمات..."
                maxLength={120}
                className="input-base text-xs min-h-[44px]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={addingZone || !newZoneName.trim()}
              className="btn-primary w-full sm:w-auto text-xs min-h-[44px] px-6 flex items-center justify-center gap-2"
            >
              {addingZone ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{newZoneParentId === 'none' ? 'إضافة المنطقة الرئيسية' : 'إضافة المجاورة الفرعية'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Filter & Search Bar */}
      <div className="card p-3.5 sm:p-4 border border-outline-variant flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-on-surface-variant absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم المنطقة أو المجاورة أو الرقم..."
            className="input-base text-xs pr-9 pl-3 min-h-[42px]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-on-surface-variant shrink-0">
            الاتجاه:
          </label>
          <select
            value={filterDirection}
            onChange={(e) => setFilterDirection(e.target.value)}
            className="input-base text-xs min-h-[42px] py-1.5"
          >
            <option value="all">كافة الاتجاهات</option>
            {DIRECTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.value}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. Hierarchical Directory (Tree of Areas and Districts) */}
      <div className="card border border-outline-variant overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm text-on-surface">
              دليل مناطق ومجاورات الشركة ({mainZones.length} رئيسية · {visibleZones.length} إجمالي)
            </h3>
          </div>
          <button
            onClick={() => {
              const allCollapsed = mainZones.every((z) => collapsedZones[z.id]);
              const next: Record<number, boolean> = {};
              mainZones.forEach((z) => {
                next[z.id] = !allCollapsed;
              });
              setCollapsedZones(next);
            }}
            className="text-xs text-primary font-bold hover:underline cursor-pointer"
          >
            {mainZones.every((z) => collapsedZones[z.id]) ? 'فتح الكل' : 'طي الكل'}
          </button>
        </div>

        {mainZones.length === 0 ? (
          <div className="p-10 sm:p-14 text-center space-y-3">
            <Building2 className="w-12 h-12 text-outline mx-auto" />
            <p className="text-sm font-bold text-on-surface">لم يتم العثور على مناطق تطابق البحث</p>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
              أضف أول منطقة رئيسية من النموذج أعلاه لبدء تنظيم الوحدات والأراضي
            </p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/70">
            {mainZones.map((zone) => {
              const subs = subZonesOf(zone.id);
              const directBuildings = getZoneBuildings(zone.id);
              const subBuildingsCount = subs.reduce((acc, s) => acc + getZoneBuildings(s.id).length, 0);
              const totalBuildings = directBuildings.length + subBuildingsCount;
              const isCollapsed = collapsedZones[zone.id];
              const isDeleting = deletingZoneId === zone.id;
              const canDelete = totalBuildings === 0 && subs.length === 0 && !isDeleting;

              return (
                <div key={zone.id} className="bg-surface transition-colors">
                  {/* صف المنطقة الرئيسية */}
                  <div className="p-3.5 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-container-low/40">
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      {/* زر الطي/البسط */}
                      <button
                        onClick={() => toggleCollapse(zone.id)}
                        className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition cursor-pointer shrink-0 mt-0.5 sm:mt-0"
                        title={isCollapsed ? 'عرض المجاورات الفرعية' : 'طي المجاورات'}
                      >
                        {isCollapsed ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronUp className="w-4 h-4" />
                        )}
                      </button>

                      {/* شارة المعرف */}
                      <span className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center text-xs font-black shrink-0">
                        {zone.id}
                      </span>

                      {/* معلومات المنطقة */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm sm:text-base text-on-surface truncate">
                            {zone.name}
                          </h4>
                          {zone.direction && (
                            <span className="badge badge-neutral text-[11px] font-semibold">
                              {zone.direction}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 sm:gap-4 flex-wrap text-xs text-on-surface-variant mt-1">
                          <span className="inline-flex items-center gap-1 font-semibold">
                            <Layers className="w-3.5 h-3.5 text-primary" />
                            <span>{subs.length} مجاورات وأحياء فرعية</span>
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold">
                            <Building2 className="w-3.5 h-3.5 text-outline" />
                            <span>
                              {totalBuildings} قطعة أرض
                              {subBuildingsCount > 0 ? ` (${directBuildings.length} مباشرة + ${subBuildingsCount} بالمجاورات)` : ''}
                            </span>
                          </span>
                          {zone.notes && (
                            <span className="text-[11px] text-on-surface-variant truncate max-w-xs">
                              • {zone.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* أزرار الإجراءات على المنطقة الرئيسية */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      {/* زر إضافة مجاورة فرعية سريعة */}
                      <button
                        onClick={() => {
                          setQuickSubZoneParentId(
                            quickSubZoneParentId === zone.id ? null : zone.id
                          );
                          setQuickSubName('');
                          setQuickSubDirection('وسط');
                        }}
                        className="btn-tonal text-xs min-h-[38px] px-3 flex items-center gap-1"
                        title="إضافة مجاورة فرعية تابعة لهذه المنطقة"
                      >
                        <Plus className="w-3.5 h-3.5 text-primary" />
                        <span className="hidden sm:inline">إضافة مجاورة</span>
                      </button>

                      {/* زر التعديل */}
                      <button
                        onClick={() => openEditModal(zone)}
                        className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
                        title="تعديل بيانات المنطقة"
                        aria-label="تعديل"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* زر الحذف */}
                      <button
                        onClick={() => handleDeleteZone(zone)}
                        disabled={!canDelete}
                        className={`p-2 rounded-xl transition cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center ${
                          canDelete
                            ? 'text-error hover:bg-error-container'
                            : 'text-outline/40 cursor-not-allowed'
                        }`}
                        title={
                          totalBuildings > 0
                            ? `لا يمكن الحذف — بها ${totalBuildings} قطعة/مبنى، احذف المباني والوحدات أولاً`
                            : subs.length > 0
                            ? `لا يمكن الحذف — بها ${subs.length} مجاورة فرعية، احذف المجاورات أولاً`
                            : 'حذف المنطقة'
                        }
                        aria-label="حذف"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin text-error" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* نموذج إضافة مجاورة سريعة تحت هذه المنطقة */}
                  {quickSubZoneParentId === zone.id && (
                    <div className="p-3.5 sm:p-4 bg-surface-container-low/70 border-t border-outline-variant/60 animate-in fade-in">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-primary font-bold text-xs">
                          ↳ إضافة مجاورة أو حي فرعي تابع لـ: <strong>{zone.name}</strong>
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-center">
                        <input
                          type="text"
                          value={quickSubName}
                          onChange={(e) => setQuickSubName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleQuickAddSubZone(zone.id);
                          }}
                          placeholder={`اسم المجاورة (مثال: المجاورة الأولى)`}
                          maxLength={80}
                          className="input-base text-xs min-h-[42px]"
                        />
                        <select
                          value={quickSubDirection}
                          onChange={(e) => setQuickSubDirection(e.target.value)}
                          className="input-base text-xs min-h-[42px] py-1.5"
                        >
                          {DIRECTIONS.map((d) => (
                            <option key={d.value} value={d.value}>
                              {d.value}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-1.5 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => handleQuickAddSubZone(zone.id)}
                            disabled={addingSubZone || !quickSubName.trim()}
                            className="btn-primary flex-1 sm:flex-initial text-xs min-h-[42px] px-4 flex items-center justify-center gap-1"
                          >
                            {addingSubZone ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Plus className="w-3.5 h-3.5" />
                            )}
                            <span>حفظ المجاورة</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickSubZoneParentId(null)}
                            className="btn-tonal text-xs min-h-[42px] px-3"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* قائمة المجاورات الفرعية التابعة للمنطقة */}
                  {!isCollapsed && subs.length > 0 && (
                    <div className="border-t border-outline-variant/60 divide-y divide-outline-variant/40 bg-surface-container-lowest/50">
                      {subs.map((sub) => {
                        const subBuildings = getZoneBuildings(sub.id);
                        const subCanDelete = subBuildings.length === 0 && deletingZoneId !== sub.id;

                        return (
                          <div
                            key={sub.id}
                            className="py-2.5 px-3.5 sm:px-6 sm:pr-12 flex items-center justify-between gap-2 hover:bg-surface-container-low transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span className="text-outline text-xs shrink-0" aria-hidden="true">
                                ↳
                              </span>
                              <span className="w-6 h-6 rounded-lg bg-surface-container-high text-on-surface-variant flex items-center justify-center text-[11px] font-bold shrink-0">
                                {sub.id}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-xs sm:text-sm text-on-surface truncate">
                                    {sub.name}
                                  </span>
                                  {sub.direction && (
                                    <span className="badge badge-neutral text-[10px] py-0 px-2 font-medium">
                                      {sub.direction}
                                    </span>
                                  )}
                                  {subBuildings.length > 0 ? (
                                    <span className="text-[11px] text-on-surface-variant font-semibold">
                                      ({subBuildings.length} قطعة)
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-outline font-normal">
                                      (لا توجد قطع بعد)
                                    </span>
                                  )}
                                </div>
                                {sub.notes && (
                                  <p className="text-[11px] text-on-surface-variant truncate">
                                    {sub.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => openEditModal(sub)}
                                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                                title="تعديل المجاورة"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteZone(sub)}
                                disabled={!subCanDelete}
                                className={`p-1.5 rounded-lg transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center ${
                                  subCanDelete
                                    ? 'text-error hover:bg-error-container'
                                    : 'text-outline/40 cursor-not-allowed'
                                }`}
                                title={
                                  subBuildings.length > 0
                                    ? `لا يمكن الحذف — بها ${subBuildings.length} مبنى/قطعة`
                                    : 'حذف المجاورة'
                                }
                              >
                                {deletingZoneId === sub.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-error" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Edit Area / District Modal */}
      {editingZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="card w-full max-w-lg p-5 sm:p-6 border border-outline-variant space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-fixed text-primary flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-on-surface">
                    تعديل بيانات {editingZone.parentId ? 'المجاورة الفرعية' : 'المنطقة الرئيسية'}
                  </h3>
                  <p className="text-[11px] text-on-surface-variant">معرف المنطقة: #{editingZone.id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingZone(null)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  اسم المنطقة / المجاورة *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={80}
                  className="input-base text-xs min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  الاتجاه الجغرافي
                </label>
                <select
                  value={editDirection}
                  onChange={(e) => setEditDirection(e.target.value)}
                  className="input-base text-xs min-h-[44px]"
                >
                  {DIRECTIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-1">
                  ملاحظات أو وصف توضيحي
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  maxLength={250}
                  className="input-base text-xs p-3"
                  placeholder="وصف الموقع، المعالم القريبة، طبيعة الحي..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/60">
              <button
                type="button"
                onClick={() => setEditingZone(null)}
                className="btn-tonal text-xs min-h-[42px] px-4"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit || !editName.trim()}
                className="btn-primary text-xs min-h-[42px] px-6 flex items-center justify-center gap-1.5"
              >
                {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>حفظ التعديلات</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
