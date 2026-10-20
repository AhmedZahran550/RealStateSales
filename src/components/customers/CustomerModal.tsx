'use client';

import React, { useState, useEffect } from 'react';
import { Customer, CustomerStage, Unit, STAGE_CONFIG, UNIT_KIND_LABELS } from '@/lib/types';
import { X, UserPlus, Phone, Calendar, DollarSign, Check, Trash2, Save, Edit3, MessageCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { zoneDisplayName } from '@/lib/zone-utils';

export interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customerData: any) => void;
  onDelete?: (customerId: string) => void;
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
  onDelete,
  initialCustomer,
  units: propsUnits,
}: CustomerModalProps) {
  const contextApp = useApp();
  const units = (propsUnits && propsUnits.length > 0)
    ? propsUnits
    : (contextApp?.myUnits && contextApp.myUnits.length > 0 ? contextApp.myUnits : (contextApp?.units || []));
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
      <div className="relative w-full max-w-2xl bg-surface rounded-3xl shadow-2xl border border-warning/70 overflow-hidden my-auto sm:my-8 max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-warning/25 bg-gradient-to-r from-warning/10 via-primary/5 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-warning text-white flex items-center justify-center shadow-md shadow-warning/30 shrink-0">
              {initialCustomer ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-on-surface ">
                {initialCustomer ? 'تعديل بيانات ومتابعة العميل' : 'تسجيل عميل جديد'}
              </h3>
              <p className="text-xs text-warning font-semibold mt-0.5">
                {initialCustomer ? `العميل: ${initialCustomer.name}` : 'إدارة ومتابعة العملاء – منظومة الواحة'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface-variant hover:bg-surface-container-high/60 transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[78vh] overflow-y-auto text-xs flex-1">
          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-on-surface mb-1.5 text-xs">
                اسم العميل بالكامل *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: أ. محمود صادق"
                className="w-full p-2.5 rounded-xl border border-outline-variant bg-white text-on-surface font-semibold placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all shadow-xs"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface mb-1.5 text-xs">
                رقم الهاتف (مطلوب) *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678"
                className="w-full p-2.5 rounded-xl border border-outline-variant bg-white text-on-surface font-semibold placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all font-mono tracking-wide shadow-xs"
                required
              />
            </div>
          </div>

          {/* WhatsApp & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-on-surface mb-1.5 text-xs">
                رقم الواتساب (اختياري)
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="201012345678"
                className="w-full p-2.5 rounded-xl border border-outline-variant bg-white text-on-surface font-semibold placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all font-mono tracking-wide shadow-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-on-surface mb-1.5 text-xs">
                الميزانية التقريبية (ج.م)
              </label>
              <input
                type="number"
                value={budget || ''}
                onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="مثال: 3500000"
                className="w-full p-2.5 rounded-xl border border-warning bg-warning-container/40 text-on-surface font-bold placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Stage & Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-on-surface mb-1.5 text-xs">
                مرحلة العميل الحالية *
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as CustomerStage)}
                className="w-full p-2.5 rounded-xl border border-outline-variant bg-white text-on-surface font-bold focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all shadow-xs cursor-pointer"
              >
                {Object.entries(STAGE_CONFIG).map(([k, cfg]) => (
                  <option key={k} value={k} className="bg-white text-on-surface py-1">
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-on-surface mb-1.5 text-xs">
                مصدر قدوم العميل
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-outline-variant bg-white text-on-surface font-semibold focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all shadow-xs cursor-pointer"
              >
                {LEAD_SOURCES.map((s) => (
                  <option key={s} value={s} className="bg-white text-on-surface py-1">
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Follow-up Date & Time */}
          <div className="space-y-1.5 bg-white p-3.5 rounded-2xl border border-outline-variant shadow-xs">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-on-surface text-xs">
                موعد المتابعة القادمة (التاريخ والساعة)
              </label>
              {nextFollowupAt && (
                <button
                  type="button"
                  onClick={() => setPresetFollowup('clear')}
                  className="text-[11px] text-error hover:underline font-bold cursor-pointer"
                >
                  إلغاء الموعد
                </button>
              )}
            </div>
            <input
              type="datetime-local"
              value={nextFollowupAt}
              onChange={(e) => setNextFollowupAt(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-outline-variant bg-white text-on-surface font-mono font-semibold focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none text-xs transition-all shadow-xs"
            />
            {nextFollowupAt && (
              <div className="flex items-center flex-wrap gap-1.5 p-2 rounded-xl bg-warning-container border border-warning text-xs">
                <span className="text-warning font-bold">📅 الموعد المختار:</span>
                <span className="px-2 py-0.5 rounded-md bg-warning text-white font-black text-[11px]">
                  {new Date(nextFollowupAt).toLocaleDateString('ar-EG', { weekday: 'long' })}
                </span>
                <span className="font-bold text-on-surface ">
                  {new Date(nextFollowupAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                </span>
                <span className="text-on-surface-variant">•</span>
                <span className="font-mono font-bold text-on-surface ">
                  {new Date(nextFollowupAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
              <span className="text-[11px] text-on-surface-variant font-bold">اختيار سريع:</span>
              <button
                type="button"
                onClick={() => setPresetFollowup('today')}
                className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-warning-container text-on-surface hover:text-warning border border-outline-variant text-[11px] font-bold transition cursor-pointer"
              >
                اليوم (+2س)
              </button>
              <button
                type="button"
                onClick={() => setPresetFollowup('tomorrow')}
                className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-warning-container text-on-surface hover:text-warning border border-outline-variant text-[11px] font-bold transition cursor-pointer"
              >
                غداً (12ظ)
              </button>
              <button
                type="button"
                onClick={() => setPresetFollowup('3days')}
                className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-warning-container text-on-surface hover:text-warning border border-outline-variant text-[11px] font-bold transition cursor-pointer"
              >
                بعد 3 أيام
              </button>
              <button
                type="button"
                onClick={() => setPresetFollowup('nextweek')}
                className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-warning-container text-on-surface hover:text-warning border border-outline-variant text-[11px] font-bold transition cursor-pointer"
              >
                الأسبوع القادم
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-on-surface mb-1.5 text-xs">
              ملاحظات وتفاصيل طلب العميل
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="شروط العميل: حديقة، دور أول، طريقة الدفع، تفضيلاته بالمنطقة..."
              className="w-full p-2.5 rounded-xl border border-outline-variant bg-white text-on-surface placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all leading-relaxed shadow-xs"
            />
          </div>

          {/* Interested Units Selector */}
          <div>
            <label className="block font-bold text-on-surface mb-2 text-xs">
              الوحدات المهتم بها من قاعدة بياناتك:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2.5 rounded-2xl border border-outline-variant bg-surface-container/60 ">
              {(units || []).map((u) => {
                const isSelected = interestedUnitIds.includes(u.id);
                return (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => toggleUnit(u.id)}
                    className={`p-2.5 rounded-xl text-right border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-warning-container  border-warning text-on-warning-container  font-bold shadow-xs'
                        : 'bg-white  border-outline-variant  text-on-surface  hover:border-warning'
                    }`}
                  >
                    <div>
                      <span className="font-bold">{zoneDisplayName(u.zoneId, contextApp?.zones || [])} – ق {u.plotNo}</span>
                      <span className="block text-[10px] text-on-surface-variant font-medium">
                        {UNIT_KIND_LABELS[u.unitKind]} ({u.area} م²)
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-warning flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit & Action Buttons */}
          <div className="pt-4 border-t border-outline-variant flex items-center justify-between gap-3 shrink-0">
            {/* Delete button (when editing existing customer) */}
            {initialCustomer && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`هل أنت متأكد من حذف العميل "${initialCustomer.name}" نهائياً من قاعدة البيانات؟`)) {
                    onDelete(initialCustomer.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2.5 rounded-xl bg-error-container text-error border border-error hover:bg-error hover:text-white transition-all flex items-center gap-1.5 font-bold text-xs shadow-xs cursor-pointer"
                title="حذف هذا العميل"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف العميل</span>
              </button>
            ) : (
              <div />
            )}

            {/* Cancel & Update / Submit Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-high/70 font-bold transition text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-warning hover:bg-warning active:bg-warning text-white font-extrabold text-xs shadow-md shadow-warning/30 hover:shadow-lg hover:shadow-warning/40 transition-all flex items-center gap-2 cursor-pointer"
              >
                {initialCustomer ? (
                  <>
                    <Save className="w-4 h-4" />
                    <span>تحديث بيانات العميل</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>تسجيل العميل</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
