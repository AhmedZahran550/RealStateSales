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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-outline-variant overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-outline-variant bg-surface-container-low/70 ">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-warning text-white flex items-center justify-center shadow-md shadow-warning/30 font-black text-lg">
              {displayName.slice(0, 1)}
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-on-surface ">
                تعديل الملف الشخصي وإعدادات الاتصال
              </h3>
              <p className="text-xs text-on-surface-variant font-semibold mt-0.5">
                @{currentUser.username} • {currentUser.role === 'admin' ? 'مدير عام المنظومة (Admin)' : 'مستشار عقاري معتمد'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface-variant hover:bg-surface-container transition cursor-pointer"
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
            <div className="p-3.5 rounded-xl bg-error-container border border-error text-error text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-error" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-success-container border border-success text-success text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-success" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-on-surface mb-1">
              الاسم بالكامل *
            </label>
            <div className="relative">
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-warning pointer-events-none">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="أدخل اسمك بالكامل (مثال: م/ أحمد زهران)"
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border-2 border-outline-variant bg-white text-on-surface placeholder:text-outline font-bold text-sm focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Phone Number Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-on-surface ">
                رقم الهاتف المحمول (واتساب) للتواصل *
              </label>
              <span className="text-[11px] text-warning font-bold bg-warning-container px-2.5 py-0.5 rounded-full border border-warning ">
                مهم جداً للمشاركة والدخول
              </span>
            </div>
            <div className="relative">
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-success pointer-events-none">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01122334455"
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border-2 border-outline-variant bg-white text-on-surface placeholder:text-outline font-bold font-mono text-sm focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none transition-all shadow-xs tracking-wider"
              />
            </div>
            <p className="text-[11px] text-on-surface-variant ">
              يُستخدم لتسجيل الدخول ويظهر تلقائياً كرقم الاتصال والمعاينة عند نسخ ومشاركة الوحدات مع العملاء.
            </p>
          </div>

          {/* Explanation Box */}
          <div className="p-3.5 rounded-2xl bg-warning-container border border-warning text-on-surface space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-warning ">
              <Shield className="w-4 h-4 text-warning" />
              <span>مميزات تسجيل وتحديث رقم هاتفك في الحساب:</span>
            </div>
            <ul className="text-[11px] text-on-surface-variant space-y-1 pr-4 list-disc font-semibold">
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
          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-between text-xs">
            <span className="text-on-surface-variant font-bold">نوع الحساب والصلاحيات:</span>
            <span className="font-extrabold text-warning flex items-center gap-1.5 bg-warning-container/60 px-2.5 py-0.5 rounded-lg border border-warning/80 ">
              <Shield className="w-3.5 h-3.5 text-warning" />
              {currentUser.role === 'admin' ? 'مدير عام المنظومة (كامل الصلاحيات)' : 'مستشار عقاري معتمد'}
            </span>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-outline-variant flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant hover:bg-surface-container transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-warning hover:bg-warning text-white text-xs font-extrabold shadow-md shadow-warning/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
