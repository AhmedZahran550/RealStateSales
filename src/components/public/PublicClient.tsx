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
  SlidersHorizontal,
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
      {/* الترويسة الرئيسية الفاخرة */}
      <header className="hero-gradient text-white relative overflow-hidden shadow-lg">
        {/* خلفية جمالية هندسية ناعمة */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-14 sm:pb-12 relative z-10">
          <div className="flex flex-col lg:flex-row items-center lg:items-end justify-between gap-6">
            {/* بطاقة هوية الشركة ومعلومات التواصل */}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 text-center sm:text-right">
              {company.logoUrl ? (
                <div className="relative shrink-0">
                  <img
                    src={company.logoUrl}
                    alt={company.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover shadow-xl ring-4 ring-white/20 bg-white"
                  />
                  <span className="absolute -bottom-1 -right-1 p-1 bg-primary text-white rounded-full ring-2 ring-white shadow-xs" title="شركة موثقة">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                </div>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-xl ring-4 ring-white/20 shrink-0">
                  <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-white/95" />
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold text-white shadow-xs">
                    <Sparkles className="w-3 h-3 text-primary-fixed" />
                    <span>شركة عقارية معتمدة</span>
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mt-1.5 drop-shadow-xs">
                  {company.name}
                </h1>

                {company.commercialName && (
                  <p className="text-xs sm:text-sm text-white/80 font-bold mt-1">
                    {company.commercialName}
                  </p>
                )}

                {/* روابط وسجلات الاتصال */}
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-4 gap-y-2 mt-3 text-xs font-semibold text-white/85">
                  {company.address && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary-fixed shrink-0" />
                      <span>{company.address}</span>
                    </span>
                  )}
                  {company.phone && (
                    <a
                      href={`tel:${company.phone}`}
                      className="flex items-center gap-1.5 hover:text-white transition-colors"
                      dir="ltr"
                    >
                      <Phone className="w-3.5 h-3.5 text-primary-fixed shrink-0" />
                      <span>{company.phone}</span>
                    </a>
                  )}
                  {company.email && (
                    <a
                      href={`mailto:${company.email}`}
                      className="flex items-center gap-1.5 hover:text-white transition-colors"
                      dir="ltr"
                    >
                      <Mail className="w-3.5 h-3.5 text-primary-fixed shrink-0" />
                      <span>{company.email}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* أزرار الإجراءات السريعة والإحصائيات */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              {/* إحصائيات سريعة */}
              <div className="flex gap-2.5 w-full sm:w-auto justify-center">
                <div className="rounded-2xl bg-white/10 backdrop-blur-md px-4 py-3 text-center ring-1 ring-white/15 min-w-[90px]">
                  <div className="flex items-center justify-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-primary-fixed" />
                    <span className="text-xl font-black text-white">{units.length}</span>
                  </div>
                  <p className="text-[10px] font-bold text-white/80 mt-0.5">وحدة متاحة</p>
                </div>

                <div className="rounded-2xl bg-white/10 backdrop-blur-md px-4 py-3 text-center ring-1 ring-white/15 min-w-[90px]">
                  <div className="flex items-center justify-center gap-1.5">
                    <History className="w-4 h-4 text-primary-fixed" />
                    <span className="text-xl font-black text-white">{gallery.length}</span>
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
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-white text-primary font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:bg-surface-container-low transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>تواصل واتساب</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white ring-1 ring-white/20 transition-all cursor-pointer"
                  title="مشاركة رابط الصفحة"
                  aria-label="مشاركة رابط الصفحة"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-primary-fixed" /> : <Share2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* أشرطة التبويب الرئيسية بتصميم متناسق */}
        <div className="border-t border-white/15 bg-black/10 backdrop-blur-xs">
          <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('units')}
              className={`px-6 sm:px-8 py-3 rounded-t-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'units'
                  ? 'bg-surface text-primary shadow-xs'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>الوحدات المعروضة</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'units' ? 'bg-primary-container text-on-primary-container' : 'bg-white/20 text-white'
              }`}>
                {units.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('gallery')}
              className={`px-6 sm:px-8 py-3 rounded-t-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'gallery'
                  ? 'bg-surface text-primary shadow-xs'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>أعمال ومشاريع سابقة</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'gallery' ? 'bg-primary-container text-on-primary-container' : 'bg-white/20 text-white'
              }`}>
                {gallery.length}
              </span>
            </button>
          </nav>
        </div>
      </header>

      {/* المحتوى الرئيسي للوحدات أو المعرض */}
      <main className="flex-1 bg-surface py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          {activeTab === 'units' ? (
            <>
              {/* شريط البحث وتصفية الوحدات المتطور */}
              {units.length > 0 && (
                <div className="card card-bordered p-4 sm:p-5 shadow-xs bg-surface-container-lowest space-y-4">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    {/* حقل البحث بالكلمات المفتاحية */}
                    <div className="relative flex-1">
                      <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث بالمنطقة، رقم القطعة، أو نوع الوحدة..."
                        className="input-base w-full py-2.5 pr-10 pl-9 text-xs sm:text-sm"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1 cursor-pointer"
                          aria-label="مسح البحث"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* خيارات التصفية والترتيب */}
                    <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                      {/* اختيار المنطقة إن توفرت مناطق متعددة */}
                      {availableZones.length > 0 && (
                        <div className="flex-1 sm:flex-none">
                          <select
                            value={selectedZone}
                            onChange={(e) => setSelectedZone(e.target.value)}
                            className="input-base py-2.5 px-3 text-xs font-bold text-on-surface w-full cursor-pointer"
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
                      <div className="flex-1 sm:flex-none">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as SortOption)}
                          className="input-base py-2.5 px-3 text-xs font-bold text-on-surface w-full cursor-pointer"
                        >
                          <option value="newest">الترتيب: الأحدث</option>
                          <option value="price-asc">السعر: من الأقل للأعلى</option>
                          <option value="price-desc">السعر: من الأعلى للأقل</option>
                          <option value="area-desc">المساحة: الأكبر أولاً</option>
                        </select>
                      </div>

                      {/* زر إعادة التصفية عند التفعيل */}
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="px-3 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                          title="إلغاء التصفية"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">إعادة ضبط</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* أشرطة تصنيف أنواع الوحدات السريعة */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
                    {CATEGORY_TABS.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
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
                  <div className="flex items-center justify-between text-xs text-on-surface-variant font-semibold pt-1 border-t border-outline-variant/50">
                    <span>
                      عرض <strong className="text-on-surface font-black">{filteredUnits.length}</strong> من أصل{' '}
                      <strong className="text-on-surface font-black">{units.length}</strong> وحدة معروضة
                    </span>
                    {hasActiveFilters && (
                      <span className="text-primary text-[11px] font-bold">
                        تصفية نشطة
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* شبكة عرض الوحدات */}
              {filteredUnits.length === 0 ? (
                <div className="empty-state card card-bordered bg-surface-container-lowest p-8 sm:p-12">
                  <div className="empty-state-icon">
                    <Building2 className="w-8 h-8 text-on-surface-variant" />
                  </div>
                  <h3 className="empty-state-title text-base sm:text-lg">
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
                      className="btn-primary mt-4 px-5 py-2 text-xs"
                    >
                      إلغاء التصفية وعرض كل الوحدات
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-on-surface">
                    أعمال ومشاريع الشركة المنجزة
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    نماذج من المشروعات والإنشاءات التي تم تسليمها بنجاح للعملاء
                  </p>
                </div>
                <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-3 py-1 rounded-xl">
                  {gallery.length} مشروع
                </span>
              </div>
              <GalleryGrid items={gallery} />
            </div>
          )}
        </div>
      </main>

      {/* التذييل العصري المطور */}
      <footer className="border-t border-outline-variant bg-surface-container-lowest py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
          <div>
            <p className="text-sm font-black text-on-surface">
              {company.name} {company.commercialName ? `(${company.commercialName})` : ''}
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">
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
              className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition cursor-pointer"
              title="العودة لأعلى الصفحة"
              aria-label="العودة لأعلى الصفحة"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>

      {/* الشريط العائم للتواصل السريع على الموبايل */}
      {company.phone && (
        <div className="sm:hidden fixed bottom-3 inset-x-3 z-40 bg-surface-container-lowest/95 backdrop-blur-md border border-outline-variant rounded-2xl p-2.5 shadow-2xl flex items-center gap-2">
          {companyWaUrl && (
            <a
              href={companyWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-3 rounded-xl bg-success text-on-success font-black text-xs flex items-center justify-center gap-1.5 shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>واتساب سريع</span>
            </a>
          )}
          <a
            href={`tel:${company.phone}`}
            className="flex-1 py-2.5 px-3 rounded-xl btn-primary text-xs font-black flex items-center justify-center gap-1.5"
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

      <ReservationModal
        unit={reservationUnit!}
        companyId={company.id}
        isOpen={Boolean(reservationUnit)}
        onClose={() => setReservationUnit(null)}
        companyPhone={company.phone}
        companyName={company.name}
      />
    </div>
  );
}
