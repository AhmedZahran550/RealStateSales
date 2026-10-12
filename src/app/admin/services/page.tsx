'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Service } from '@/lib/types';
import {
  Sparkles,
  Plus,
  Building2,
  MapPin,
  Tag,
  Check,
  Search,
  ExternalLink,
} from 'lucide-react';

export default function AdminServicesPage() {
  const { services, zones, addService } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'mall' | 'club' | 'road' | 'school' | 'hospital' | 'other'>('mall');
  const [notes, setNotes] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addService({
      name: name.trim(),
      category,
      notes: notes.trim(),
    });

    setName('');
    setNotes('');
    setIsModalOpen(false);
  };

  const CATEGORY_LABELS = {
    mall: 'مول ومراكز تجارية',
    club: 'نوادي ومساحات ترفيهية',
    road: 'محاور وطرق رئيسية',
    school: 'جامعات ومدارس دولية',
    hospital: 'مجمعات ومراكز طبية',
    other: 'خدمات أخرى',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-600/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              دليل الخدمات والمولات والمعالم الرئيسية
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              بيانات مرجعية عامة يديرها الأدمن وتظهر لجميع الوسطاء عند استعراض المناطق والوحدات
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-600/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة خدمة / معلم جديد</span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s) => (
          <div
            key={s.id}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-amber-500 transition"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{s.name}</h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {CATEGORY_LABELS[s.category]}
                </span>
              </div>
              {s.notes && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {s.notes}
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-400 font-bold">
              <span>نشط ومعتمد للمنظومة</span>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
          </div>
        ))}
      </div>

      {/* Add Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
              إضافة خدمة أو معلم جديد بالحي المتميز
            </h3>
            <form onSubmit={handleAdd} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم المعلم / الخدمة *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: مول سيتي كلوب أو مجمع بنوك..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تصنيف الخدمة
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                >
                  <option value="mall">مول ومركز تجاري</option>
                  <option value="club">نادي ومساحات ترفيهية</option>
                  <option value="road">محور وطريق رئيسي</option>
                  <option value="school">جامعة أو مدرسة</option>
                  <option value="hospital">طبي ومستشفى</option>
                  <option value="other">أخرى</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات وموقع المعلم
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="تفاصيل الخدمات، الشارع، أو الفائدة للملاك..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/20"
                >
                  حفظ المعلم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
