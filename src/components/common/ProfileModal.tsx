'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { User, Phone, CheckCircle2, Shield, X, Save, AlertCircle } from 'lucide-react';

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { currentUser, users, updateUserProfile } = useApp();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || '');
      setPhone(currentUser.phone || '');
      setSuccessMsg('');
      setErrorMsg('');
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanPhone = phone.trim();

    // التحقق من فرادة رقم الهاتف محلياً
    if (cleanPhone) {
      const existingPhone = (users || []).find(
        (u) => u.id !== currentUser.id && u.phone && u.phone.trim() === cleanPhone
      );
      if (existingPhone) {
        setErrorMsg(`رقم الهاتف (${cleanPhone}) مسجل مسبقاً لحساب آخر، يجب أن يكون رقم الهاتف فريداً لكل مستخدم.`);
        return;
      }
    }

    setSaving(true);

    try {
      const res = await updateUserProfile(currentUser.id, {
        fullName: fullName.trim(),
        phone: cleanPhone,
      });

      if (res.success) {
        setSuccessMsg('تم حفظ رقم الهاتف وتحديث الملف الشخصي بنجاح!');
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.message || 'حدث خطأ أثناء حفظ البيانات، يرجى المحاولة مرة أخرى.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'حدث خطأ غير متوقع');
    } finally {
      setSaving(false);
    }
  };

  const displayName = currentUser.fullName || currentUser.username || 'م';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-[#151d2a]/70">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/25 font-black text-lg">
              {displayName.slice(0, 1)}
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                تعديل الملف الشخصي وإعدادات الاتصال
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                @{currentUser.username} • {currentUser.role === 'admin' ? 'مدير عام المنظومة (Admin)' : 'مستشار عقاري معتمد'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="إغلاق"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4">
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-1">
              الاسم بالكامل *
            </label>
            <div className="relative">
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-600 pointer-events-none">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="أدخل اسمك بالكامل (مثال: م/ أحمد زهران)"
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-bold text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Phone Number Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                رقم الهاتف المحمول (واتساب) للتواصل *
              </label>
              <span className="text-[11px] text-amber-800 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/60">
                مهم جداً للمشاركة والدخول
              </span>
            </div>
            <div className="relative">
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01122334455"
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-[#151d2a] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-bold font-mono text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none transition-all shadow-xs tracking-wider"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              يُستخدم لتسجيل الدخول ويظهر تلقائياً كرقم الاتصال والمعاينة عند نسخ ومشاركة الوحدات مع العملاء.
            </p>
          </div>

          {/* Explanation Box */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-slate-800 dark:text-slate-200 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
              <Shield className="w-4 h-4 text-amber-600" />
              <span>مميزات تسجيل وتحديث رقم هاتفك في الحساب:</span>
            </div>
            <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 pr-4 list-disc font-semibold">
              <li>
                <strong>تسجيل الدخول:</strong> رقم الهاتف فريد لكل حساب، ويمكنك استخدامه مباشرة مع كلمة المرور لتسجيل الدخول بدلاً من اسم المستخدم.
              </li>
              <li>
                <strong>نسخ ومشاركة العروض:</strong> عند نسخ أي وحدة أو مشاركتها عبر واتساب للعميل، سيظهر رقمك تلقائياً كرقم الاتصال والمعاينة.
              </li>
              <li>
                <strong>تواصل العملاء المباشر:</strong> سيتواصل معك العملاء مباشرة على رقم هاتفك الشخصي المعين هنا.
              </li>
            </ul>
          </div>

          {/* Account Role Readonly */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-bold">نوع الحساب والصلاحيات:</span>
            <span className="font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 bg-amber-100/60 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-lg border border-amber-200/80 dark:border-amber-900/60">
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              {currentUser.role === 'admin' ? 'مدير عام المنظومة (كامل الصلاحيات)' : 'مستشار عقاري معتمد'}
            </span>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow-md shadow-amber-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
