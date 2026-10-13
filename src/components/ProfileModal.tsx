'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { User, Phone, CheckCircle2, Shield, X, Save } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { currentUser, updateUserProfile } = useApp();
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
    setSaving(true);

    try {
      const ok = await updateUserProfile(currentUser.id, {
        fullName: fullName.trim(),
        phone: phone.trim(),
      });

      if (ok) {
        setSuccessMsg('تم حفظ رقم الهاتف وتحديث الملف الشخصي بنجاح!');
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1200);
      } else {
        setErrorMsg('حدث خطأ أثناء حفظ البيانات، يرجى المحاولة مرة أخرى.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'حدث خطأ غير متوقع');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-surface-container-lowest dark:bg-[#131a26] rounded-3xl shadow-2xl border border-surface-container-high/60 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-surface-container-high/50 bg-surface-container-low/60 dark:bg-[#18202e]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-md font-bold text-lg">
              {currentUser.fullName.charAt(0)}
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-on-surface">
                الملف الشخصي وإعدادات الاتصال
              </h3>
              <p className="text-xs text-on-surface-variant">
                @{currentUser.username} • {currentUser.role === 'admin' ? 'مدير عام المنظومة' : 'مستشار عقاري معتمد'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
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
            <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-primary-fixed text-on-primary-fixed-variant text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              الاسم بالكامل
            </label>
            <div className="relative flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#151d2a] shadow-xs focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
              <div className="pr-3 pl-2 text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="أدخل اسمك بالكامل"
                className="w-full py-2.5 pl-3 pr-1 bg-transparent text-sm text-slate-900 dark:text-white font-semibold focus:outline-none"
              />
            </div>
          </div>

          {/* Phone Number Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                رقم الهاتف / الواتساب للتواصل
              </label>
              <span className="text-[11px] text-primary font-bold">مهم جداً للمشاركة والدخول</span>
            </div>
            <div className="relative flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#151d2a] shadow-xs focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
              <div className="pr-3 pl-2 text-primary">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                required
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01122334455"
                className="w-full py-2.5 pl-3 pr-1 bg-transparent text-sm text-slate-900 dark:text-white font-bold focus:outline-none text-left tracking-wider"
              />
            </div>
          </div>

          {/* Explanation Box */}
          <div className="p-3.5 rounded-2xl bg-primary-fixed/20 border border-primary/20 text-on-surface space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span>مميزات تسجيل رقم هاتفك في الحساب:</span>
            </div>
            <ul className="text-[11px] text-on-surface-variant space-y-1 pr-4 list-disc">
              <li>
                <strong>تسجيل الدخول:</strong> يمكنك استخدام هذا الرقم مباشرة مع كلمة المرور لتسجيل الدخول بدلاً من اسم المستخدم.
              </li>
              <li>
                <strong>نسخ ومشاركة العروض:</strong> عند نسخ أي وحدة أو مشاركتها عبر واتساب للعميل، سيظهر رقمك تلقائياً كرقم الاتصال والمعاينة.
              </li>
              <li>
                <strong>تواصل العملاء:</strong> سيتواصل معك العملاء مباشرة على رقم هاتفك الشخصي المعين هنا.
              </li>
            </ul>
          </div>

          {/* Account Role Readonly */}
          <div className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between text-xs">
            <span className="text-on-surface-variant font-medium">نوع الحساب والصلاحيات:</span>
            <span className="font-bold text-primary flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              {currentUser.role === 'admin' ? 'مدير النظام (كامل الصلاحيات)' : 'مستشار عقاري (وحداته وعملائه فقط)'}
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-surface-container-high text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
