'use client';

import React, { useState, useEffect } from 'react';
import { Customer, CustomerStage, Unit, STAGE_CONFIG, UNIT_KIND_LABELS } from '@/lib/types';
import { X, Users, UserPlus, Phone, Calendar, DollarSign, Tag, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { INITIAL_UNITS } from '@/lib/mock-data';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customerData: any) => void;
  initialCustomer?: Customer | null;
  units?: Unit[];
}

const LEAD_SOURCES = [
  'إعلان فيسبوك وتيك توك',
  'إحالة من عميل سابق',
  'زيارة مقر الشركة',
  'موقع أوليكس ودوبيزل',
  'لافتة على العمارة بالحي المتميز',
  'معارف وعلاقات شخصية',
  'أخرى',
];

export default function CustomerModal({
  isOpen,
  onClose,
  onSubmit,
  initialCustomer,
  units: propsUnits,
}: CustomerModalProps) {
  const contextApp = useApp();
  const units = (propsUnits && propsUnits.length > 0)
    ? propsUnits
    : (contextApp?.myUnits && contextApp.myUnits.length > 0 ? contextApp.myUnits : (contextApp?.units || INITIAL_UNITS));
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [budget, setBudget] = useState<number | undefined>(undefined);
  const [source, setSource] = useState('إعلان فيسبوك وتيك توك');
  const [stage, setStage] = useState<CustomerStage>('lead');
  const [nextFollowupAt, setNextFollowupAt] = useState('');
  const [notes, setNotes] = useState('');
  const [interestedUnitIds, setInterestedUnitIds] = useState<string[]>([]);

  const toDatetimeLocal = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const setPresetFollowup = (preset: 'today' | 'tomorrow' | '3days' | 'nextweek' | 'clear') => {
    if (preset === 'clear') {
      setNextFollowupAt('');
      return;
    }
    const d = new Date();
    if (preset === 'today') {
      d.setHours(d.getHours() + 2);
    } else if (preset === 'tomorrow') {
      d.setDate(d.getDate() + 1);
      d.setHours(12, 0, 0, 0);
    } else if (preset === '3days') {
      d.setDate(d.getDate() + 3);
      d.setHours(12, 0, 0, 0);
    } else if (preset === 'nextweek') {
      d.setDate(d.getDate() + 7);
      d.setHours(12, 0, 0, 0);
    }
    setNextFollowupAt(toDatetimeLocal(d.toISOString()));
  };

  useEffect(() => {
    if (initialCustomer) {
      setName(initialCustomer.name);
      setPhone(initialCustomer.phone);
      setWhatsapp(initialCustomer.whatsapp || '');
      setBudget(initialCustomer.budget);
      setSource(initialCustomer.source || 'إعلان فيسبوك وتيك توك');
      setStage(initialCustomer.stage);
      setNextFollowupAt(toDatetimeLocal(initialCustomer.nextFollowupAt));
      setNotes(initialCustomer.notes || '');
      setInterestedUnitIds(initialCustomer.interestedUnitIds || []);
    } else {
      setName('');
      setPhone('');
      setWhatsapp('');
      setBudget(undefined);
      setSource('إعلان فيسبوك وتيك توك');
      setStage('lead');
      // Default follow up: tomorrow at 12:00
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      setNextFollowupAt(toDatetimeLocal(tomorrow.toISOString()));
      setNotes('');
      setInterestedUnitIds([]);
    }
  }, [initialCustomer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || undefined,
      budget: budget ? Number(budget) : undefined,
      source,
      stage,
      nextFollowupAt: nextFollowupAt ? new Date(nextFollowupAt).toISOString() : undefined,
      notes: notes.trim() || undefined,
      interestedUnitIds,
    };

    onSubmit(payload);
    onClose();
  };

  const toggleUnit = (uId: string) => {
    setInterestedUnitIds((prev) =>
      prev.includes(uId) ? prev.filter((id) => id !== uId) : [...prev, uId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#131a26] rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden my-auto sm:my-8 max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-amber-100 dark:border-stone-800 bg-[#fbf9f6] dark:bg-[#18202e] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-600/30 shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#1c1917] dark:text-[#f5f5f4]">
                {initialCustomer ? 'تعديل بيانات العميل' : 'تسجيل عميل جديد'}
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                إدارة ومتابعة العملاء – منظومة الواحة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[78vh] overflow-y-auto text-xs flex-1">
          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                اسم العميل بالكامل *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: أ. محمود صادق"
                className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                رقم الهاتف (مطلوب) *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678"
                className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                required
              />
            </div>
          </div>

          {/* WhatsApp & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                رقم الواتساب (اختياري)
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="201012345678"
                className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                الميزانية التقريبية (ج.م)
              </label>
              <input
                type="number"
                value={budget || ''}
                onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="مثال: 3500000"
                className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-bold text-amber-800 dark:text-amber-400 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Stage & Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                مرحلة العميل الحالية *
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as CustomerStage)}
                className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {Object.entries(STAGE_CONFIG).map(([k, cfg]) => (
                  <option key={k} value={k}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
                مصدر قدوم العميل
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold"
              >
                {LEAD_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Follow-up Date & Time */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-stone-700 dark:text-stone-300">
                موعد المتابعة القادمة (التاريخ والساعة)
              </label>
              {nextFollowupAt && (
                <button
                  type="button"
                  onClick={() => setPresetFollowup('clear')}
                  className="text-[11px] text-rose-600 hover:underline font-bold"
                >
                  إلغاء الموعد
                </button>
              )}
            </div>
            <input
              type="datetime-local"
              value={nextFollowupAt}
              onChange={(e) => setNextFollowupAt(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs"
            />
            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-stone-400 font-bold">اختيار سريع:</span>
              <button
                type="button"
                onClick={() => setPresetFollowup('today')}
                className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 hover:text-amber-700 text-[11px] font-bold text-stone-600 dark:text-stone-300 transition"
              >
                اليوم (+2س)
              </button>
              <button
                type="button"
                onClick={() => setPresetFollowup('tomorrow')}
                className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 hover:text-amber-700 text-[11px] font-bold text-stone-600 dark:text-stone-300 transition"
              >
                غداً (12ظ)
              </button>
              <button
                type="button"
                onClick={() => setPresetFollowup('3days')}
                className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 hover:text-amber-700 text-[11px] font-bold text-stone-600 dark:text-stone-300 transition"
              >
                بعد 3 أيام
              </button>
              <button
                type="button"
                onClick={() => setPresetFollowup('nextweek')}
                className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 hover:text-amber-700 text-[11px] font-bold text-stone-600 dark:text-stone-300 transition"
              >
                الأسبوع القادم
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-1">
              ملاحظات وتفاصيل طلب العميل
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="شروط العميل: حديقة، دور أول، طريقة الدفع، تفضيلاته بالمنطقة..."
              className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Interested Units Selector */}
          <div>
            <label className="block font-bold text-stone-700 dark:text-stone-300 mb-2">
              الوحدات المهتم بها من قاعدة بياناتك:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40">
              {(units || []).map((u) => {
                const isSelected = interestedUnitIds.includes(u.id);
                return (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => toggleUnit(u.id)}
                    className={`p-2 rounded-xl text-right border transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-950 dark:text-amber-200 font-bold'
                        : 'bg-white dark:bg-[#131a26] border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <div>
                      <span>منطقة {u.zoneId} – ق {u.plotNo}</span>
                      <span className="block text-[10px] text-stone-400">
                        {UNIT_KIND_LABELS[u.unitKind]} ({u.area} م²)
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 via-amber-600 to-amber-500 hover:from-amber-800 hover:to-amber-600 text-white font-black shadow-md shadow-amber-600/30 transition transform active:scale-95"
            >
              {initialCustomer ? 'حفظ التعديلات' : 'تسجيل العميل'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
