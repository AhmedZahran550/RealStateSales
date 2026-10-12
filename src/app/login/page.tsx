'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithUsername } = useApp();
  const [username, setUsername] = useState('AhmedZahran');
  const [password, setPassword] = useState('Test@1234');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!username.trim()) {
      setError('يرجى إدخال اسم المستخدم أو البريد الإلكتروني');
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setError('يرجى إدخال كلمة المرور');
      setLoading(false);
      return;
    }

    const res = loginWithUsername(username.trim(), password.trim());
    if (res.success) {
      setSuccess(res.message);
      setTimeout(() => {
        router.replace('/');
      }, 500);
    } else {
      setError(res.message);
      setLoading(false);
    }
  };

  const fillCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen flex items-center justify-center p-3 sm:p-6 lg:p-12">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden shadow-2xl bg-surface-container-lowest border border-surface-container-high/60">
        {/* الجانب الترحيبي والبصري (الزمردي الداكن) */}
        <div className="lg:col-span-5 relative bg-primary p-5 sm:p-8 lg:p-12 flex flex-col justify-between overflow-hidden text-on-primary">
          {/* تأثيرات ضوئية خلفية ناعمة */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary-container/40 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none" />

          {/* الهيدر الداخلي للشعار */}
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-lowest p-2.5 shadow-md flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[32px]">real_estate_agent</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-md text-headline-md font-bold tracking-tight text-surface-container-lowest text-2xl">
                عقار سيلز
              </span>
              <span className="font-label-sm text-label-sm text-on-primary-container tracking-wider">
                Aqar Sales Pro
              </span>
            </div>
          </div>

          {/* الرسالة التحفيزية */}
          <div className="relative z-10 my-10 lg:my-0 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-container/40 text-on-primary-container backdrop-blur-sm">
              <span className="material-symbols-outlined text-sm">hotel_class</span>
              <span className="font-label-sm text-label-sm font-bold">المنصة الأولى لمستشاري العقارات</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-surface-container-lowest leading-snug font-extrabold text-3xl">
              منصتك الذكية لإغلاق الصفقات بذكاء وسرعة
            </h1>
            <p className="font-body-md text-body-md text-on-primary-container leading-relaxed">
              أهلاً بك في عقار سيلز - بوابتك الشاملة لإدارة الوحدات، متابعة العملاء المحتملين لحظياً، وتحقيق أهدافك البيعية بكل سهولة وموثوقية.
            </p>
          </div>

          {/* إحصائيات بصرية ملهمة */}
          <div className="relative z-10 grid grid-cols-2 gap-3 pt-6">
            <div className="bg-primary-container/30 p-4 rounded-xl backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-secondary-container text-xl">apartment</span>
                <span className="font-label-lg text-label-lg font-bold text-surface-container-lowest">+1,500</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-primary-container text-xs">وحدة مباعة وموثقة</p>
            </div>
            <div className="bg-primary-container/30 p-4 rounded-xl backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-tertiary-fixed-dim text-xl">star</span>
                <span className="font-label-lg text-label-lg font-bold text-surface-container-lowest">4.9 / 5</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-primary-container text-xs">تقييم خبراء المبيعات</p>
            </div>
          </div>
        </div>

        {/* جانب نموذج تسجيل الدخول */}
        <div className="lg:col-span-7 p-5 sm:p-8 lg:p-14 flex flex-col justify-center bg-surface-container-lowest">
          <div className="max-w-md w-full mx-auto space-y-6 sm:space-y-7">
            {/* عنوان النموذج */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-primary">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-label-sm text-label-sm font-semibold text-xs">بوابة مستشاري المبيعات</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface text-xl sm:text-2xl">
                تسجيل الدخول إلى حسابك
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                أدخل اسم المستخدم أو بريدك الوظيفي وكلمة المرور للمتابعة للوحة التحكم
              </p>
            </div>

            {/* تنبيهات النجاح والخطأ */}
            {error && (
              <div className="p-3.5 rounded-xl bg-error-container text-on-error-container text-xs sm:text-sm font-medium flex items-center gap-2 animate-in fade-in">
                <span className="material-symbols-outlined text-error text-[20px]">error</span>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3.5 rounded-xl bg-primary-fixed text-on-primary-fixed-variant text-xs sm:text-sm font-medium flex items-center gap-2 animate-in fade-in">
                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                <span>{success}</span>
              </div>
            )}

            {/* حسابات تجريبية سريعة */}
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high space-y-2">
              <span className="text-xs font-bold text-on-surface-variant block">دخول سريع بالحسابات المعتمدة:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials('AhmedZahran', 'Test@1234')}
                  className="p-2.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-right border border-surface-container-high transition-all cursor-pointer"
                >
                  <p className="text-xs font-bold text-primary">أحمد زهران</p>
                  <p className="text-[10px] text-on-surface-variant">مستشار عقاري • وحداته فقط</p>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('admin', 'Admin@1234')}
                  className="p-2.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-right border border-surface-container-high transition-all cursor-pointer"
                >
                  <p className="text-xs font-bold text-secondary">المدير العام</p>
                  <p className="text-[10px] text-on-surface-variant">صلاحيات كاملة • كافة الوحدات</p>
                </button>
              </div>
            </div>

            {/* نموذج تسجيل الدخول */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* حقل اسم المستخدم */}
              <div className="space-y-1.5">
                <label className="block font-label-md text-label-md text-on-surface font-semibold text-sm" htmlFor="sales-id">
                  اسم المستخدم أو البريد الإلكتروني
                </label>
                <div className="relative flex items-center rounded-xl bg-surface-container-low shadow-sm transition-all focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary">
                  <div className="pr-3.5 pl-2 flex items-center text-outline pointer-events-none">
                    <span className="material-symbols-outlined text-xl">alternate_email</span>
                  </div>
                  <input
                    id="sales-id"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="AhmedZahran أو ahmed.sales@aqarsales.com"
                    className="w-full py-3.5 pl-4 pr-1 bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:outline-none"
                  />
                </div>
              </div>

              {/* حقل كلمة المرور */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-label-md text-label-md text-on-surface font-semibold text-sm" htmlFor="password-input">
                    كلمة المرور
                  </label>
                  <a href="#" className="font-label-sm text-label-sm text-secondary font-bold hover:underline transition-all text-xs">
                    نسيت كلمة المرور؟
                  </a>
                </div>
                <div className="relative flex items-center rounded-xl bg-surface-container-low shadow-sm transition-all focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary">
                  <div className="pr-3.5 pl-2 flex items-center text-outline pointer-events-none">
                    <span className="material-symbols-outlined text-xl">lock</span>
                  </div>
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full py-3.5 px-2 bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:outline-none"
                  />
                  <button
                    id="toggle-pwd"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="إظهار كلمة المرور"
                    className="pl-3.5 pr-2 flex items-center text-outline hover:text-on-surface transition-colors focus:outline-none"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              {/* خيار تذكرني */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    id="remember-device"
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-0 bg-surface-container-high cursor-pointer"
                  />
                  <span className="font-body-sm text-body-sm text-on-surface-variant font-medium text-xs">
                    حفظ بيانات الدخول على هذا الجهاز
                  </span>
                </label>
              </div>

              {/* زر تسجيل الدخول */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-4 px-6 rounded-xl bg-primary text-on-primary font-headline-sm text-headline-sm font-bold shadow-md hover:shadow-xl hover:bg-primary-container transition-all flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'جاري التحقق...' : 'تسجيل الدخول إلى لوحة التحكم'}</span>
                <span className="material-symbols-outlined text-xl rotate-180">arrow_forward</span>
              </button>
            </form>

            {/* الدعم الفني وتذييل البطاقة */}
            <div className="pt-6 mt-6 bg-surface-container-low/50 -mx-5 -mb-5 sm:-mx-8 sm:-mb-8 lg:-mx-14 lg:-mb-14 p-4 sm:p-6 rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-surface-container-high">
              <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm text-xs">
                <span className="material-symbols-outlined text-primary text-lg">headset_mic</span>
                <span>تواجه مشكلة في الوصول لحسابك؟</span>
              </div>
              <a
                href="https://wa.me/201023456789"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-lowest text-primary hover:bg-primary hover:text-on-primary font-label-md text-label-md font-bold shadow-sm transition-all text-xs"
              >
                <span className="material-symbols-outlined text-base">chat</span>
                <span>واتساب المبيعات والدعم</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
