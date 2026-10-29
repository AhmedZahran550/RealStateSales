'use client';

import React, { useState, useMemo } from 'react';
import { PublicPageData } from '@/services/publicPageService';
import { PublicUnit, UnitKind, UNIT_KIND_LABELS } from '@/lib/types';
import PublicUnitCard from './PublicUnitCard';
import PublicUnitDetailModal from './PublicUnitDetailModal';
import ReservationModal from './ReservationModal';
import GalleryGrid from './GalleryGrid';
import {
  Building2,
  History,
  Phone,
  Mail,
  MapPin,
  KeyRound,
  Search,
  X,
  MessageCircle,
  Share2,
  Check,
  ArrowUp,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'area-desc';

const CATEGORY_TABS: Array<{ id: 'all' | UnitKind; label: string }> = [
  { id: 'all', label: 'جميع الوحدات' },
  { id: 'ground_garden', label: 'أرضي بحديقة' },
  { id: 'floor_1', label: 'دور أول متكرر' },
  { id: 'floor_2', label: 'دور ثاني متكرر' },
  { id: 'floor_3', label: 'دور ثالث' },
  { id: 'duplex', label: 'دوبلكس' },
  { id: 'roof', label: 'روف' },
  { id: 'other', label: 'أخرى' },
];

export default function PublicClient({ data }: { data: PublicPageData }) {
  const { company, settings, units, gallery } = data;

  const [activeTab, setActiveTab] = useState<'units' | 'gallery'>('units');
  const [selectedUnit, setSelectedUnit] = useState<PublicUnit | null>(null);
  const [reservationUnit, setReservationUnit] = useState<PublicUnit | null>(null);

  // التصفية والبحث
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | UnitKind>('all');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [copiedLink, setCopiedLink] = useState(false);

  // استخراج قائمة المناطق الفريدة من الوحدات
  const availableZones = useMemo(() => {
    const set = new Set<string>();
    units.forEach((u) => {
      if (u.zoneName) set.add(u.zoneName);
    });
    return Array.from(set);
  }, [units]);

  // تجهيز رابط واتساب المباشر للشركة
  const companyWaUrl = useMemo(() => {
    if (!company.phone) return '';
    let clean = company.phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('01')) {
      clean = '2' + clean;
    }
    const msg = `مرحباً ${company.name}، زرت صفحتكم العقارية وأود الاستفسار عن الوحدات المتاحة لديكم.`;
    return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
  }, [company.phone, company.name]);

  // نسخ رابط الصفحة
  const handleCopyLink = async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // ignore
    }
  };

  // تصفية وترتيب الوحدات
  const filteredUnits = useMemo(() => {
    let result = [...units];

    // تصفية حسب الفئة
    if (selectedCategory !== 'all') {
      result = result.filter((u) => u.unitKind === selectedCategory);
    }

    // تصفية حسب المنطقة
    if (selectedZone !== 'all') {
      result = result.filter((u) => u.zoneName === selectedZone);
    }

    // تصفية بنص البحث
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((u) => {
        const title = UNIT_KIND_LABELS[u.unitKind] || '';
        const zone = u.zoneName || '';
        const plot = u.plotNo ? `قطعة ${u.plotNo}` : '';
        const desc = u.description || '';
        const features = (u.features || []).join(' ');
        const full = `${title} ${zone} ${plot} ${desc} ${features}`.toLowerCase();
        return full.includes(q);
      });
    }

    // الترتيب
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'area-desc') {
      result.sort((a, b) => b.area - a.area);
    }

    return result;
  }, [units, selectedCategory, selectedZone, searchQuery, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== '' || selectedCategory !== 'all' || selectedZone !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedZone('all');
    setSortBy('newest');
  };

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      {/* الترويسة الرئيسية الفاخرة المتجاوبة */}
      <header className="hero-gradient text-white relative overflow-hidden shadow-md">
        {/* خلفية جمالية هندسية ناعمة */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-7 pb-6 sm:pt-12 sm:pb-10 relative z-10">
          <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between gap-5 sm:gap-6">
            {/* بطاقة هوية الشركة ومعلومات التواصل */}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3.5 sm:gap-5 text-center sm:text-right w-full sm:w-auto">
              {company.logoUrl ? (
                <div className="relative shrink-0">
                  <img
                    src={company.logoUrl}
                    alt={company.name}
                    className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl object-cover shadow-xl ring-2 sm:ring-4 ring-white/20 bg-white"
                  />
                  <span className="absolute -bottom-1 -right-1 p-0.5 sm:p-1 bg-primary text-white rounded-full ring-2 ring-white shadow-xs" title="شركة موثقة">
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </span>
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-xl ring-2 sm:ring-4 ring-white/20 shrink-0">
                  <Building2 className="w-8 h-8 sm:w-12 sm:h-12 text-white/95" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] sm:text-[11px] font-bold text-white shadow-xs">
                    <Sparkles className="w-3 h-3 text-primary-fixed" />
                    <span>شركة عقارية معتمدة</span>
                  </span>
                </div>

                <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white mt-1 drop-shadow-xs break-words">
                  {company.name}
                </h1>

                {company.commercialName && (
                  <p className="text-[11px] sm:text-sm text-white/80 font-bold mt-0.5">
                    {company.commercialName}
                  </p>
                )}

                {/* روابط وسجلات الاتصال */}
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-3 sm:gap-x-4 gap-y-1 mt-2 text-[11px] sm:text-xs font-semibold text-white/85">
                  {company.address && (
                    <span className="flex items-center gap-1 max-w-full truncate">
                      <MapPin className="w-3.5 h-3.5 text-primary-fixed shrink-0" />
                      <span className="truncate">{company.address}</span>
                    </span>
                  )}
                  {company.phone && (
                    <a
                      href={`tel:${company.phone}`}
                      className="flex items-center gap-1 hover:text-white transition-colors shrink-0"
                      dir="ltr"
                    >
                      <Phone className="w-3.5 h-3.5 text-primary-fixed shrink-0" />
                      <span>{company.phone}</span>
                    </a>
                  )}
                  {company.email && (
                    <a
                      href={`mailto:${company.email}`}
                      className="flex items-center gap-1 hover:text-white transition-colors shrink-0"
                      dir="ltr"
                    >
                      <Mail className="w-3.5 h-3.5 text-primary-fixed shrink-0" />
                      <span className="truncate max-w-[180px]">{company.email}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* أزرار الإجراءات السريعة والإحصائيات */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
              {/* إحصائيات سريعة */}
              <div className="flex gap-2 w-full sm:w-auto justify-center">
                <div className="rounded-2xl bg-white/10 backdrop-blur-md px-3.5 py-2.5 sm:px-4 sm:py-3 text-center ring-1 ring-white/15 flex-1 sm:flex-none min-w-[80px]">
                  <div className="flex items-center justify-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-primary-fixed" />
                    <span className="text-lg sm:text-xl font-black text-white">{units.length}</span>
                  </div>
                  <p className="text-[10px] font-bold text-white/80 mt-0.5">وحدة متاحة</p>
                </div>

                <div className="rounded-2xl bg-white/10 backdrop-blur-md px-3.5 py-2.5 sm:px-4 sm:py-3 text-center ring-1 ring-white/15 flex-1 sm:flex-none min-w-[80px]">
                  <div className="flex items-center justify-center gap-1">
                    <History className="w-3.5 h-3.5 text-primary-fixed" />
                    <span className="text-lg sm:text-xl font-black text-white">{gallery.length}</span>
                  </div>
                  <p className="text-[10px] font-bold text-white/80 mt-0.5">مشروع منجز</p>
                </div>
              </div>

              {/* أزرار التواصل المباشر في الترويسة */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {companyWaUrl && (
                  <a
                    href={companyWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 rounded-2xl bg-white text-primary font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:bg-surface-container-low transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>تواصل واتساب</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="min-h-[44px] min-w-[44px] p-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white ring-1 ring-white/20 transition-all cursor-pointer flex items-center justify-center shrink-0"
                  title="مشاركة رابط الصفحة"
                  aria-label="مشاركة رابط الصفحة"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-primary-fixed" /> : <Share2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* أشرطة التبويب الرئيسية بنمط Segmented Control ملائم للموبايل */}
        <div className="border-t border-white/15 bg-black/15 backdrop-blur-xs px-3 sm:px-6 py-2">
          <nav className="max-w-6xl mx-auto flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('units')}
              className={`flex-1 sm:flex-none px-4 sm:px-7 py-2.5 rounded-xl sm:rounded-t-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[40px] ${
                activeTab === 'units'
                  ? 'bg-surface text-primary shadow-xs'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span>الوحدات المعروضة</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                activeTab === 'units' ? 'bg-primary-container text-on-primary-container' : 'bg-white/20 text-white'
              }`}>
                {units.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('gallery')}
              className={`flex-1 sm:flex-none px-4 sm:px-7 py-2.5 rounded-xl sm:rounded-t-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[40px] ${
                activeTab === 'gallery'
                  ? 'bg-surface text-primary shadow-xs'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <History className="w-4 h-4 shrink-0" />
              <span>أعمال ومشاريع سابقة</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                activeTab === 'gallery' ? 'bg-primary-container text-on-primary-container' : 'bg-white/20 text-white'
              }`}>
                {gallery.length}
              </span>
            </button>
          </nav>
        </div>
      </header>

      {/* المحتوى الرئيسي للوحدات أو المعرض مع مسافة سفلية للشريط العائم */}
      <main className="flex-1 bg-surface py-5 sm:py-8 pb-28 sm:pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-5 sm:space-y-6">
          {activeTab === 'units' ? (
            <>
              {/* شريط البحث وتصفية الوحدات المتطور والمحكم للهواتف */}
              {units.length > 0 && (
                <div className="card card-bordered p-3.5 sm:p-5 shadow-xs bg-surface-container-lowest space-y-3 sm:space-y-4">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3">
                    {/* حقل البحث بالكلمات المفتاحية */}
                    <div className="relative flex-1">
                      <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث بالمنطقة، رقم القطعة، أو نوع الوحدة..."
                        className="input-base w-full min-h-[44px] py-2.5 pr-10 pl-9 text-xs sm:text-sm"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 min-h-[36px] min-w-[36px] text-outline hover:text-on-surface p-1 cursor-pointer flex items-center justify-center"
                          aria-label="مسح البحث"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* خيارات التصفية والترتيب: شبكة 2 عمود على الموبايل */}
                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                      {/* اختيار المنطقة إن توفرت مناطق متعددة */}
                      {availableZones.length > 0 && (
                        <div className="w-full sm:w-auto">
                          <select
                            value={selectedZone}
                            onChange={(e) => setSelectedZone(e.target.value)}
                            className="input-base min-h-[42px] py-2 px-2.5 text-xs font-bold text-on-surface w-full cursor-pointer"
                          >
                            <option value="all">جميع المناطق</option>
                            {availableZones.map((z) => (
                              <option key={z} value={z}>
                                {z}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* قائمة الترتيب */}
                      <div className="w-full sm:w-auto">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as SortOption)}
                          className="input-base min-h-[42px] py-2 px-2.5 text-xs font-bold text-on-surface w-full cursor-pointer"
                        >
                          <option value="newest">الترتيب: الأحدث</option>
                          <option value="price-asc">السعر: من الأقل</option>
                          <option value="price-desc">السعر: من الأعلى</option>
                          <option value="area-desc">المساحة: الأكبر</option>
                        </select>
                      </div>

                      {/* زر إعادة التصفية عند التفعيل */}
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="col-span-2 sm:col-span-1 min-h-[42px] px-3 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                          title="إلغاء التصفية"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>إعادة ضبط التصفية</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* أشرطة تصنيف أنواع الوحدات السريعة بتمرير لمسي خفيف */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar -mx-1 px-1 touch-pan-x">
                    {CATEGORY_TABS.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                          selectedCategory === cat.id
                            ? 'bg-primary text-on-primary border-primary shadow-xs'
                            : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:border-primary'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* شريط الإحصائية للنتائج */}
                  <div className="flex items-center justify-between text-[11px] sm:text-xs text-on-surface-variant font-semibold pt-1 border-t border-outline-variant/50">
                    <span>
                      عرض <strong className="text-on-surface font-black">{filteredUnits.length}</strong> من أصل{' '}
                      <strong className="text-on-surface font-black">{units.length}</strong> وحدة معروضة
                    </span>
                    {hasActiveFilters && (
                      <span className="text-primary text-[10px] sm:text-[11px] font-bold">
                        تصفية نشطة
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* شبكة عرض الوحدات */}
              {filteredUnits.length === 0 ? (
                <div className="empty-state card card-bordered bg-surface-container-lowest p-6 sm:p-12">
                  <div className="empty-state-icon">
                    <Building2 className="w-7 h-7 sm:w-8 sm:h-8 text-on-surface-variant" />
                  </div>
                  <h3 className="empty-state-title text-sm sm:text-base">
                    {units.length === 0
                      ? 'لا توجد وحدات معروضة حالياً'
                      : 'لا توجد وحدات تطابق خيارات البحث المحددة'}
                  </h3>
                  <p className="empty-state-hint text-xs mt-1">
                    {units.length === 0
                      ? 'تابعنا لمشاهدة الوحدات الجديدة فور إضافتها'
                      : 'جرب تغيير معايير البحث أو تصفية نوع الوحدة'}
                  </p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="btn-primary mt-4 px-5 py-2.5 text-xs"
                    >
                      إلغاء التصفية وعرض كل الوحدات
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredUnits.map((unit) => (
                    <PublicUnitCard
                      key={unit.id}
                      unit={unit}
                      settings={settings}
                      onView={setSelectedUnit}
                      companyPhone={company.phone}
                      companyName={company.name}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            /* معرض الأعمال السابقة */
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm sm:text-lg font-black text-on-surface">
                    أعمال ومشاريع الشركة المنجزة
                  </h3>
                  <p className="text-[11px] sm:text-xs text-on-surface-variant mt-0.5">
                    نماذج من المشروعات والإنشاءات التي تم تسليمها بنجاح للعملاء
                  </p>
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-xl">
                  {gallery.length} مشروع
                </span>
              </div>
              <GalleryGrid items={gallery} />
            </div>
          )}
        </div>
      </main>

      {/* التذييل العصري المطور */}
      <footer className="border-t border-outline-variant bg-surface-container-lowest py-6 sm:py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-right">
          <div>
            <p className="text-xs sm:text-sm font-black text-on-surface">
              {company.name} {company.commercialName ? `(${company.commercialName})` : ''}
            </p>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              جميع الحقوق محفوظة © {new Date().getFullYear()} — منصة الواحة العقارية
            </p>
          </div>

          <div className="flex items-center gap-3">
            {company.phone && (
              <a
                href={`tel:${company.phone}`}
                className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1"
                dir="ltr"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{company.phone}</span>
              </a>
            )}
            <button
              type="button"
              onClick={scrollToTop}
              className="min-h-[38px] min-w-[38px] p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition cursor-pointer flex items-center justify-center"
              title="العودة لأعلى الصفحة"
              aria-label="العودة لأعلى الصفحة"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>

      {/* الشريط العائم للتواصل السريع على شاشات الجوال مع دعم Safe Area */}
      {company.phone && (
        <div className="sm:hidden fixed bottom-3 inset-x-3 z-40 bg-surface-container-lowest/95 backdrop-blur-md border border-outline-variant rounded-2xl p-2 shadow-2xl flex items-center gap-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {companyWaUrl && (
            <a
              href={companyWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl bg-success text-on-success font-black text-xs flex items-center justify-center gap-1.5 shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>واتساب سريع</span>
            </a>
          )}
          <a
            href={`tel:${company.phone}`}
            className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl btn-primary text-xs font-black flex items-center justify-center gap-1.5"
          >
            <Phone className="w-4 h-4" />
            <span>اتصال هاتفي</span>
          </a>
        </div>
      )}

      {/* المودالات التفاعلية */}
      <PublicUnitDetailModal
        key={selectedUnit?.id}
        unit={selectedUnit}
        settings={settings}
        isOpen={Boolean(selectedUnit)}
        onClose={() => setSelectedUnit(null)}
        onReserve={(u) => {
          setSelectedUnit(null);
          setReservationUnit(u);
        }}
        companyPhone={company.phone}
        companyName={company.name}
      />

      {/* مودال حجز موعد المعاينة */}
      {reservationUnit && (
        <ReservationModal
          key={reservationUnit.id}
          unit={reservationUnit}
          companyId={company.id}
          isOpen={true}
          onClose={() => setReservationUnit(null)}
          companyPhone={company.phone}
          companyName={company.name}
        />
      )}
    </div>
  );
}
