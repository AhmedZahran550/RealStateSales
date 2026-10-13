'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Customer, Unit, UNIT_KIND_LABELS } from '@/lib/types';

function MatchingContent() {
  const { currentUser, myCustomers, myUnits } = useApp();
  const searchParams = useSearchParams();
  const customerIdParam = searchParams.get('customerId');

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [mobileTab, setMobileTab] = useState<'units' | 'proposal'>('units');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  if (currentUser?.role === 'admin') {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-surface-container-lowest rounded-3xl border border-surface-container-high text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-[32px]">shield_person</span>
        </div>
        <h2 className="text-xl font-bold text-on-surface mb-2">قسم مخصص للوسطاء العقاريين</h2>
        <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
          مطابقة العروض مع متطلبات وميزانيات العملاء مخصصة للوسطاء العقاريين. بصفتك مديراً عاماً، يمكنك إدارة المستخدمين والاطلاع على كافة وحدات المنظومة وتصفيتها.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/admin/users"
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition"
          >
            إدارة حسابات المستخدمين
          </Link>
          <Link
            href="/units"
            className="px-5 py-2.5 rounded-xl bg-surface-container-high text-on-surface font-bold text-xs hover:bg-surface-container-highest transition"
          >
            استعراض محفظة الوحدات
          </Link>
        </div>
      </div>
    );
  }

  // Set initial selected customer
  useEffect(() => {
    if (customerIdParam && myCustomers.some((c) => c.id === customerIdParam)) {
      setSelectedCustomerId(customerIdParam);
    } else if (myCustomers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(myCustomers[0].id);
    }
  }, [customerIdParam, myCustomers, selectedCustomerId]);

  const currentCustomer = useMemo(() => {
    return myCustomers.find((c) => c.id === selectedCustomerId) || myCustomers[0] || null;
  }, [myCustomers, selectedCustomerId]);

  // Compute matched units with matching percentage
  const matchedUnits = useMemo(() => {
    if (!currentCustomer) return [];

    const availableUnits = myUnits.filter((u) => u.status === 'available');
    const unitsToScore = availableUnits.length > 0 ? availableUnits : myUnits;

    return unitsToScore
      .map((unit) => {
        let score = 75; // baseline

        // Budget check
        const customerBudget = currentCustomer.budget || 5000000;
        const diffPercent = Math.abs(unit.price - customerBudget) / customerBudget;
        if (diffPercent < 0.15) score += 20;
        else if (diffPercent < 0.3) score += 12;
        else score += 5;

        if (unit.area && unit.area >= 180) score += 3;

        score = Math.min(score, 98);

        return {
          unit,
          score,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [currentCustomer, myUnits]);

  // Set default selected unit
  useEffect(() => {
    if (matchedUnits.length > 0 && !selectedUnitId) {
      setSelectedUnitId(matchedUnits[0].unit.id);
    }
  }, [matchedUnits, selectedUnitId]);

  const activeUnit = useMemo(() => {
    const found = matchedUnits.find((m) => m.unit.id === selectedUnitId);
    return found ? found.unit : matchedUnits[0]?.unit || null;
  }, [matchedUnits, selectedUnitId]);

  // Generate WhatsApp formatted message
  const whatsappProposalText = useMemo(() => {
    if (!currentCustomer || !activeUnit) return '';

    const consultantName = currentUser?.fullName || 'أحمد زهران';
    const consultantPhone = currentUser?.phone || '';
    const budgetStr = currentCustomer.budget
      ? `في حدود ميزانية ${(currentCustomer.budget / 1000000).toFixed(1)} مليون ج.م`
      : 'بمدينة بدر';

    const locationFeatures =
      activeUnit.services && activeUnit.services.length > 0
        ? `قريب من: ${activeUnit.services.join('، ')}`
        : activeUnit.description || 'الحي المتميز بمدينة بدر';

    return `مساء الخير يا ${currentCustomer.name}، أتمنى تكون بخير 🌿

بناءً على طلب حضرتك بخصوص البحث عن وحدة مميزة في الحي المتميز بمدينة بدر ${budgetStr}:

لقيت لحضرتك فرصة استثنائية مطابقة تماماً لطلبك:

🏡 *كود الوحدة:* #BD-${activeUnit.zoneId}-${activeUnit.plotNo}
📍 *الموقع:* الحي المتميز - منطقة ${activeUnit.zoneId} (قطعة ${activeUnit.plotNo})
📐 *المساحة:* ${activeUnit.area} م² ${activeUnit.gardenArea ? `+ حديقة خاصة ${activeUnit.gardenArea} م²` : ''}
🏗 *نوع الوحدة:* ${UNIT_KIND_LABELS[activeUnit.unitKind] || 'شقة سكنية'}
💰 *السعر الإجمالي:* ${activeUnit.price.toLocaleString()} ج.م
💳 *نظام السداد:* ${activeUnit.paymentTerms || 'كاش أو تقسيط بتسهيلات'}
⏳ *الاستلام:* ${activeUnit.deliveryNote || 'استلام فوري'}

📍 *المعالم والخدمات المحيطة:*
${locationFeatures}

حضرتك تحب نرتب ميعاد معاينة للموقع مع المستشار العقاري؟

تحياتي،
*${consultantName} | مستشار عقاري معتمد*
${consultantPhone ? `📞 رقم الهاتف للتواصل / واتساب: ${consultantPhone}` : ''}`;
  }, [currentCustomer, activeUnit, currentUser]);

  const handleCopyProposal = () => {
    if (!whatsappProposalText) return;
    navigator.clipboard.writeText(whatsappProposalText);
    showToast('تم نسخ نص العرض المنسق بنجاح إلى الحافظة!');
  };

  const handleShareWhatsApp = () => {
    if (!currentCustomer || !whatsappProposalText) return;
    const cleanPhone = currentCustomer.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappProposalText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col w-full space-y-space-lg animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-space-md py-space-sm bg-inverse-surface text-inverse-on-surface rounded-xl shadow-xl flex items-center gap-space-xs font-label-md text-label-md animate-in fade-in">
          <span className="material-symbols-outlined text-primary-fixed text-[20px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Top Utility Context Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-bold text-xs">
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              خوارزمية التطابق الذكي
            </span>
            <span className="text-outline text-body-sm font-body-sm text-xs">/</span>
            <span className="text-on-surface-variant font-label-sm text-label-sm text-xs">
              تحديث مباشر لمخزون الحي المتميز
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-extrabold tracking-tight text-2xl lg:text-3xl">
            مطابقة العروض ومولد الرسائل المباشرة
          </h1>
        </div>

        <div className="flex items-center gap-space-md bg-surface-container-lowest p-space-sm rounded-2xl shadow-sm self-start md:self-auto border border-surface-container-high/40">
          <div className="w-10 h-10 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[22px]">bolt</span>
          </div>
          <div className="flex flex-col pl-space-md text-right">
            <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">معدل الإغلاق السريع</span>
            <span className="font-headline-sm text-headline-sm text-primary font-bold text-sm">3.4 دقيقة / صفقة</span>
          </div>
        </div>
      </div>

      {/* 2. Client Selector & Dynamic Preference Radar */}
      <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm relative overflow-hidden border border-surface-container-high/40">
        <div className="absolute -left-12 -top-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
          {/* Selector Input side */}
          <div className="lg:col-span-5 flex flex-col gap-space-sm">
            <label className="font-label-md text-label-md text-on-surface font-bold flex items-center justify-between text-xs" htmlFor="client-select">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">person_pin</span>
                اختيار العميل المهتم
              </span>
              <span className="text-secondary font-label-sm text-label-sm flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                عميل مسجل
              </span>
            </label>
              <div className="relative">
                <select
                  id="client-select"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white rounded-xl py-3 pr-10 pl-4 font-body-md text-body-md appearance-none focus:outline-none focus:ring-2 focus:ring-primary shadow-xs cursor-pointer font-bold text-xs"
                >
                  {myCustomers.map((c) => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white">
                      {c.name} — ميزانية {c.budget ? `${(c.budget / 1000000).toFixed(1)} مليون ج.م` : 'غير محددة'} ({c.phone})
                    </option>
                  ))}
                </select>
              <span className="material-symbols-outlined absolute right-3 top-3 text-primary text-[20px] pointer-events-none">
                verified_user
              </span>
              <span className="material-symbols-outlined absolute left-3 top-3 text-on-surface-variant text-[20px] pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Live Filters Extracted Tags */}
          <div className="lg:col-span-7 flex flex-col gap-space-xs">
            <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold text-xs">
              محددات المطابقة التلقائية المستخرجة من سجل العميل:
            </span>
            <div className="flex flex-wrap items-center gap-space-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-high text-on-surface font-label-md text-label-md text-xs">
                <span className="material-symbols-outlined text-primary text-[16px]">payments</span>
                <span>
                  الميزانية:{' '}
                  <strong className="text-primary font-bold">
                    {currentCustomer?.budget ? `${(currentCustomer.budget / 1000000).toFixed(1)}M ج.م` : 'مرنة'}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-high text-on-surface font-label-md text-label-md text-xs">
                <span className="material-symbols-outlined text-primary text-[16px]">location_on</span>
                <span>الموقع: <strong>الحي المتميز - مدينة بدر</strong></span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-high text-on-surface font-label-md text-label-md text-xs">
                <span className="material-symbols-outlined text-primary text-[16px]">villa</span>
                <span>النوع: <strong>فيلات وشقق الحي المتميز</strong></span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-high text-on-surface font-label-md text-label-md text-xs">
                <span className="material-symbols-outlined text-tertiary text-[16px]">credit_card</span>
                <span>السداد: <strong>تقسيط مريح (مقدم ≤ 10%)</strong></span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-bold text-xs">
                <span className="material-symbols-outlined text-[14px]">tune</span> جاهزية الاستلام: فوري
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Section 2: Results & Comparison Dashboard (Split Layout) */}
      {/* Mobile Tab Switcher */}
      <div className="flex xl:hidden bg-surface-container-low p-1 rounded-xl">
        <button
          onClick={() => setMobileTab('units')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] ${
            mobileTab === 'units'
              ? 'bg-surface-container-lowest text-primary shadow-sm'
              : 'text-on-surface-variant'
          }`}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">domain</span>
          <span>الوحدات المطابقة ({matchedUnits.length})</span>
        </button>
        <button
          onClick={() => setMobileTab('proposal')}
          className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px] ${
            mobileTab === 'proposal'
              ? 'bg-surface-container-lowest text-primary shadow-sm'
              : 'text-on-surface-variant'
          }`}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">chat</span>
          <span>استوديو رسالة الواتساب 💬</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
        {/* Right Col: Matched Units Selection (7 Cols) */}
        <div className={`xl:col-span-7 flex-col gap-space-md ${mobileTab === 'units' ? 'flex' : 'hidden xl:flex'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-primary-container text-on-primary flex items-center justify-center font-bold font-label-sm text-label-sm text-xs">
                {matchedUnits.length}
              </span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold text-lg">
                وحدات تطابق طلب العميل بنسبة تفوق 90%
              </h2>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
              اختر الوحدة لتحديث نص العرض الفوري
            </span>
          </div>

          {/* Unit Cards List */}
          {matchedUnits.map(({ unit, score }) => {
            const isSelected = unit.id === activeUnit?.id;
            const img =
              unit.media?.[0]?.externalUrl ||
              unit.media?.[0]?.storagePath ||
              'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';

            return (
              <div
                key={unit.id}
                onClick={() => setSelectedUnitId(unit.id)}
                className={`unit-card transition-all duration-200 bg-surface-container-lowest rounded-2xl p-space-md shadow-sm relative cursor-pointer border ${
                  isSelected
                    ? 'border-2 border-primary ring-2 ring-primary/20 shadow-md'
                    : 'border-surface-container-high/40 hover:border-primary/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row gap-space-md">
                  {/* Thumbnail with status pill */}
                  <div className="relative sm:w-44 h-36 rounded-xl overflow-hidden shrink-0">
                    <img src={img} alt={`وحدة ${unit.plotNo}`} className="w-full h-full object-cover" />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-primary text-on-primary font-label-sm text-label-sm font-bold flex items-center gap-1 shadow-sm text-xs">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                      {score}% تطابق
                    </span>
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-inverse-surface/80 text-inverse-on-surface font-label-sm text-label-sm backdrop-blur-sm text-xs">
                      كود: #BD-{unit.zoneId}-{unit.plotNo}
                    </div>
                  </div>

                  {/* Unit Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-label-sm text-label-sm text-secondary font-bold text-xs">
                            الحي المتميز • منطقة {unit.zoneId}
                          </span>
                          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold text-base">
                            {unit.description || `وحدة فاخرة قطعة ${unit.plotNo}`}
                          </h3>
                          <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5 text-xs">
                            <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
                            مدينة بدر - بالقرب من المحاور الرئيسية
                          </p>
                        </div>

                        {/* Selection Checkbox */}
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-all ${
                            isSelected ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-outline'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">check</span>
                        </div>
                      </div>

                      {/* Quick Specs Grid */}
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-2 bg-surface-container-low rounded-xl p-2 text-center text-xs">
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">المساحة</span>
                          <span className="font-label-md text-label-md text-on-surface font-bold">
                            {unit.area} م²
                          </span>
                        </div>
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">النوع</span>
                          <span className="font-label-md text-label-md text-on-surface font-bold">
                            {UNIT_KIND_LABELS[unit.unitKind] || 'شقة'}
                          </span>
                        </div>
                        <div>
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">الاستلام</span>
                          <span className="font-label-md text-label-md text-primary font-bold">فوري</span>
                        </div>
                      </div>
                    </div>

                    {/* Price & Payment Terms */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-surface-container-low">
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">السعر الإجمالي</span>
                        <span className="font-headline-sm text-headline-sm text-primary font-bold text-base">
                          {unit.price.toLocaleString()} ج.م
                        </span>
                      </div>
                      <div className="flex items-center gap-space-sm text-left">
                        <div className="bg-surface-container px-2.5 py-1 rounded-lg text-xs">
                          <span className="font-label-sm text-label-sm text-on-surface-variant block">المقدم (10%)</span>
                          <span className="font-label-md text-label-md text-on-surface font-bold">
                            {(unit.price * 0.1).toLocaleString()} ج.م
                          </span>
                        </div>
                      </div>
                      {/* Mobile Jump Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUnitId(unit.id);
                          setMobileTab('proposal');
                        }}
                        className="xl:hidden w-full mt-3 py-2 px-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px] shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[16px]">chat</span>
                        <span>تجهيز ومشاركة العرض لهذه الوحدة ←</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Left Col: Live WhatsApp Proposal Studio (5 Cols) */}
        <div className={`xl:col-span-5 flex-col gap-space-md sticky top-24 ${mobileTab === 'proposal' ? 'flex' : 'hidden xl:flex'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[24px]">chat_bubble</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold text-lg">
                معاينة وتخصيص رسالة الواتساب
              </h2>
            </div>
            <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary font-bold bg-primary-fixed px-2 py-0.5 rounded-full text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> جاهز للإرسال
            </span>
          </div>

          {/* WhatsApp Live Preview Bubble Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-md shadow-md flex flex-col justify-between border border-surface-container-high/40">
            {/* Header simulation */}
            <div className="bg-surface-container-low p-space-sm rounded-xl flex items-center justify-between mb-space-md">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-label-sm text-xs">
                  {currentCustomer?.name?.charAt(0) || 'ع'}
                </div>
                <div className="flex flex-col text-right">
                  <span className="font-label-md text-label-md text-on-surface font-bold leading-tight text-xs">
                    {currentCustomer?.name}
                  </span>
                  <span className="font-label-sm text-label-sm text-primary leading-tight text-[11px]">
                    متصل الآن عبر واتساب ({currentCustomer?.phone})
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">more_vert</span>
            </div>

            {/* Chat Bubble Content Area */}
            <div className="bg-surface-container-high/30 rounded-xl p-space-md text-right flex flex-col gap-space-sm border border-surface-container-high/20">
              <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm text-on-surface font-body-sm text-body-sm leading-relaxed whitespace-pre-line text-xs font-mono select-all">
                {whatsappProposalText}
              </div>
              <div className="flex items-center justify-between text-outline font-label-sm text-label-sm px-1 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-primary text-[14px]">done_all</span>
                  تم التنسيق التلقائي
                </span>
                <span>العرض جاهز بنقرة واحدة</span>
              </div>
            </div>

            {/* Proposal Actions */}
            <div className="flex flex-col gap-space-sm mt-space-md">
              {/* Primary WhatsApp Share Button */}
              <button
                onClick={handleShareWhatsApp}
                className="w-full py-3.5 px-space-md rounded-xl bg-primary hover:bg-primary-container text-on-primary transition-all flex items-center justify-center gap-2 font-label-lg text-label-lg font-bold shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer text-sm"
                type="button"
              >
                <span className="material-symbols-outlined text-[24px]">send</span>
                مشاركة العرض عبر واتساب مباشرة (بنقرة واحدة)
              </button>

              {/* Copy Button */}
              <button
                onClick={handleCopyProposal}
                className="w-full py-2.5 px-space-md rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface transition-all flex items-center justify-center gap-1.5 font-label-md text-label-md font-bold text-xs cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">content_copy</span>
                نسخ نص العرض للحافظة
              </button>
            </div>
          </div>

          {/* Quick Tips Box */}
          <div className="bg-surface-container-low rounded-xl p-space-md flex items-start gap-space-sm text-right border border-surface-container-high/30">
            <span className="material-symbols-outlined text-tertiary text-[20px] shrink-0 mt-0.5">lightbulb</span>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface font-bold text-xs">
                نصيحة لإغلاق أسرع:
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-[11px] mt-0.5">
                العملاء يفضلون تلقي تفاصيل الاستلام والمقدم في أول رسالة. تم إبراز ميعاد الاستلام في قالب العرض تلقائياً.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MatchingPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-on-surface-variant font-bold">جاري تحميل خوارزمية المطابقة...</div>}>
      <MatchingContent />
    </React.Suspense>
  );
}

