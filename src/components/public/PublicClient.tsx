'use client';

import React, { useState } from 'react';
import { PublicPageData } from '@/services/publicPageService';
import { PublicUnit } from '@/lib/types';
import PublicUnitCard from './PublicUnitCard';
import PublicUnitDetailModal from './PublicUnitDetailModal';
import ReservationModal from './ReservationModal';
import GalleryGrid from './GalleryGrid';
import { Building2, History, Phone, Mail, MapPin, KeyRound } from 'lucide-react';

export default function PublicClient({ data }: { data: PublicPageData }) {
  const { company, settings, units, gallery } = data;

  const [activeTab, setActiveTab] = useState<'units' | 'gallery'>('units');
  const [selectedUnit, setSelectedUnit] = useState<PublicUnit | null>(null);
  const [reservationUnit, setReservationUnit] = useState<PublicUnit | null>(null);

  return (
    <div className="min-h-screen">
      {/* الترويسة الرئيسية */}
      <header className="bg-gradient-to-tr from-emerald-900 via-emerald-800 to-emerald-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
            <div className="flex items-center gap-4 text-center sm:text-right">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-lg ring-2 ring-white/20"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shadow-lg ring-2 ring-white/20">
                  <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-white/90" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  {company.name}
                </h1>
                {company.commercialName && (
                  <p className="text-xs sm:text-sm text-white/70 font-bold mt-1">
                    {company.commercialName}
                  </p>
                )}
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-4 gap-y-1 mt-2 text-[11px] sm:text-xs font-semibold text-white/80">
                  {company.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {company.address}
                    </span>
                  )}
                  {company.phone && (
                    <a
                      href={`tel:${company.phone}`}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                      dir="ltr"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {company.phone}
                    </a>
                  )}
                  {company.email && (
                    <a
                      href={`mailto:${company.email}`}
                      className="flex items-center gap-1 hover:text-white transition-colors"
                      dir="ltr"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {company.email}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* بطاقات إحصائية */}
            <div className="flex gap-3">
              <div className="rounded-2xl bg-white/10 backdrop-blur px-4 py-3 text-center ring-1 ring-white/10">
                <div className="flex items-center justify-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-emerald-300" />
                  <span className="text-xl font-black">{units.length}</span>
                </div>
                <p className="text-[10px] font-bold text-white/70 mt-0.5">وحدة معروضة</p>
              </div>
              <div className="rounded-2xl bg-white/10 backdrop-blur px-4 py-3 text-center ring-1 ring-white/10">
                <div className="flex items-center justify-center gap-1.5">
                  <History className="w-4 h-4 text-emerald-300" />
                  <span className="text-xl font-black">{gallery.length}</span>
                </div>
                <p className="text-[10px] font-bold text-white/70 mt-0.5">عمل منجز</p>
              </div>
            </div>
          </div>
        </div>

        {/* التبويبات */}
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('units')}
            className={`px-5 sm:px-7 py-3 rounded-t-2xl text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'units'
                ? 'bg-surface text-primary'
                : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            الوحدات المعروضة ({units.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`px-5 sm:px-7 py-3 rounded-t-2xl text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'gallery'
                ? 'bg-surface text-primary'
                : 'bg-white/10 text-white/70 hover:bg-white/15 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            أعمال سابقة ({gallery.length})
          </button>
        </nav>
      </header>

      {/* المحتوى */}
      <main className="bg-surface min-h-[60vh]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {activeTab === 'units' ? (
            units.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-stone-100 dark:bg-stone-900 flex items-center justify-center mb-3">
                  <Building2 className="w-7 h-7 text-stone-400" />
                </div>
                <p className="font-bold text-stone-600 dark:text-stone-300">
                  لا توجد وحدات معروضة حالياً
                </p>
                <p className="text-xs text-stone-400 mt-1">تابعنا لمشاهدة العروض الجديدة</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {units.map((unit) => (
                  <PublicUnitCard
                    key={unit.id}
                    unit={unit}
                    settings={settings}
                    onView={setSelectedUnit}
                  />
                ))}
              </div>
            )
          ) : (
            <GalleryGrid items={gallery} />
          )}
        </div>
      </main>

      {/* تذييل بسيط */}
      <footer className="border-t border-stone-200 dark:border-stone-800 py-6 text-center">
        <p className="text-[11px] text-stone-400">
          {company.name} © {new Date().getFullYear()} — جميع الحقوق محفوظة
        </p>
      </footer>

      {/* المودالات */}
      <PublicUnitDetailModal
        key={selectedUnit?.id}
        unit={selectedUnit!}
        settings={settings}
        isOpen={!!selectedUnit}
        onClose={() => setSelectedUnit(null)}
        onReserve={(u) => {
          setSelectedUnit(null);
          setReservationUnit(u);
        }}
      />

      <ReservationModal
        unit={reservationUnit!}
        companyId={company.id}
        isOpen={!!reservationUnit}
        onClose={() => setReservationUnit(null)}
      />
    </div>
  );
}
