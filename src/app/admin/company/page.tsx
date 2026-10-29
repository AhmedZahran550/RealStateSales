'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import CompanyAdminGuard from '@/guards/CompanyAdminGuard';
import LogoUploader from '@/components/common/LogoUploader';
import {
  Building2,
  Store,
  Phone,
  Mail,
  MapPin,
  Save,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Bell,
  Sparkles,
  Eye,
  Sliders,
  FileText,
  Loader2,
  Layers,
} from 'lucide-react';

export default function CompanyProfilePage() {
  const { currentCompany, currentUser, updateCompany, refreshFromDatabase } = useApp();

  const [name, setName] = useState('');
  const [commercialName, setCommercialName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);

  // إعدادات تشغيلية ومستقبلية
  const [leadDistribution, setLeadDistribution] = useState<'open_claim' | 'admin_assign'>('open_claim');
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [autoFollowupReminders, setAutoFollowupReminders] = useState(true);
  const [shareWatermark, setShareWatermark] = useState(true);

  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // تحميل البيانات الحالية للشركة
  useEffect(() => {
    if (currentCompany) {
      setName(currentCompany.name || '');
      setCommercialName(currentCompany.commercialName || '');
      setPhone(currentCompany.phone || '');
      setEmail(currentCompany.email || '');
      setAddress(currentCompany.address || '');
      setLogoUrl(currentCompany.logoUrl ?? undefined);
    }
  }, [currentCompany]);

  // استرجاع الإعدادات المحفوظة محلياً للمستقبل
  useEffect(() => {
    if (typeof window !== 'undefined' && currentCompany?.id) {
      try {
        const saved = localStorage.getItem(`company_future_settings_${currentCompany.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.leadDistribution) setLeadDistribution(parsed.leadDistribution);
          if (parsed.whatsappAlerts !== undefined) setWhatsappAlerts(parsed.whatsappAlerts);
          if (parsed.autoFollowupReminders !== undefined) setAutoFollowupReminders(parsed.autoFollowupReminders);
          if (parsed.shareWatermark !== undefined) setShareWatermark(parsed.shareWatermark);
        }
      } catch (e) {
        console.warn('تعذر قراءة إعدادات الشركة المحلية:', e);
      }
    }
  }, [currentCompany?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany) return;
    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'اسم الشركة الرسمي مطلوب' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await updateCompany(currentCompany.id, {
        name: name.trim(),
        commercialName: commercialName.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        logoUrl: logoUrl || null,
      });

      // حفظ الإعدادات المستقبلية
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          `company_future_settings_${currentCompany.id}`,
          JSON.stringify({
            leadDistribution,
            whatsappAlerts,
            autoFollowupReminders,
            shareWatermark,
          })
        );
      }

      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'تم حفظ وتحديث بيانات وشعار وإعدادات الشركة بنجاح',
        });
        await refreshFromDatabase();
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'فشل تحديث بيانات الشركة، يرجى المحاولة لاحقاً',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء الحفظ';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const publicPortfolioUrl = currentCompany ? `/p/${currentCompany.id}` : '#';

  return (
    <CompanyAdminGuard>
      <div className="flex flex-col w-full space-y-space-md animate-in fade-in duration-300 pb-12">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-surface-container-low p-4 sm:p-6 shadow-sm border border-surface-container-high/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs">
                  <Store className="w-3.5 h-3.5" />
                  إدارة ملف الشركة
                </span>
                <span className="text-on-surface-variant text-xs">
                  كود الشركة: <span className="font-mono text-on-surface font-semibold">{currentCompany?.id?.slice(0, 8)}</span>
                </span>
              </div>
              <h1 className="text-on-surface font-black text-xl sm:text-2xl">
                ملف الشركة والهوية والإعدادات
              </h1>
              <p className="text-on-surface-variant text-xs sm:text-sm mt-1">
                تحديث شعار الشركة، البيانات التجارية، والتفضيلات التشغيلية ومشاركة العروض.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={publicPortfolioUrl}
                target="_blank"
                className="px-3.5 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold text-xs inline-flex items-center gap-1.5 transition border border-surface-container-high shadow-xs"
              >
                <Eye className="w-4 h-4 text-primary" />
                <span>معاينة صفحة العروض العامة</span>
                <ExternalLink className="w-3 h-3 text-on-surface-variant" />
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-surface-container-high/40">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${activeTab === 'profile'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
            >
              <Building2 className="w-4 h-4" />
              <span>بيانات الشركة والشعار</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${activeTab === 'settings'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
            >
              <Sliders className="w-4 h-4" />
              <span>إعدادات العمليات والتوزيع</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 text-xs font-bold animate-in fade-in ${feedback.type === 'success'
                ? 'bg-success-container text-on-success-container border border-success-container'
                : 'bg-error-container text-on-error-container border border-error-container'
              }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5 shrink-0 text-success" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-error" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-space-md">
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-md">
              {/* Main Profile Form (2 cols) */}
              <div className="lg:col-span-2 space-y-space-md">
                {/* 1. شعار الشركة والهوية البصرية */}
                <div className="card p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-surface-container-high/40">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-on-surface">شعار الشركة (Company Logo)</h2>
                      <p className="text-[11px] text-on-surface-variant">
                        يظهر الشعار في القائمة الجانبية لجميع وسطاء الشركة، وعلى رأس صفحة العروض العامة، وبطاقات التصدير.
                      </p>
                    </div>
                  </div>

                  <div className="bg-surface-container-low p-4 rounded-xl border border-surface-container-high/40">
                    <LogoUploader
                      companyId={currentCompany?.id}
                      logoUrl={logoUrl}
                      onChange={setLogoUrl}
                      fallbackInitial={name || commercialName || 'ع'}
                      disabled={isSaving}
                    />
                    <div className="mt-3 pt-3 border-t border-surface-container-high/40 flex items-center gap-2 text-[11px] text-on-surface-variant">
                      <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />

                    </div>
                  </div>
                </div>

                {/* 2. البيانات الأساسية والتجارية */}
                <div className="card p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-surface-container-high/40">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-on-surface">البيانات التجارية والقانونية</h2>
                      <p className="text-[11px] text-on-surface-variant">الاسم الرسمي والاسم التجاري المعروض للعملاء والوسطاء</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-on-surface block mb-1.5">
                        اسم الشركة الرسمي <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="مثال: شركة الواحة للاستثمار والتطوير العقاري"
                        required
                        className="input-base w-full text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-on-surface block mb-1.5">
                        الاسم التجاري أو السجل التجاري
                      </label>
                      <input
                        type="text"
                        value={commercialName}
                        onChange={(e) => setCommercialName(e.target.value)}
                        placeholder="مثال: الواحة للتطوير (س.ت: 104829)"
                        className="input-base w-full text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. بيانات التواصل والمقر */}
                <div className="card p-5 space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-surface-container-high/40">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-on-surface">بيانات التواصل والمقر الرئيسي</h2>
                      <p className="text-[11px] text-on-surface-variant">تظهر في صفحة الشركة العامة وبطاقات الوحدات</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-on-surface block mb-1.5 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-primary" />
                        هاتف التواصل الرسمي
                      </label>
                      <input
                        type="tel"
                        dir="ltr"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="01012345678"
                        className="input-base w-full text-xs text-left"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-on-surface block mb-1.5 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-primary" />
                        البريد الإلكتروني للشركة
                      </label>
                      <input
                        type="email"
                        dir="ltr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="info@elwaha-realestate.com"
                        className="input-base w-full text-xs text-left"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-on-surface block mb-1.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        عنوان المقر الرئيسي / المكتب
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="مدينة بدر - الحي المتميز - مول الأمل الإداري - الدور الثاني"
                        className="input-base w-full text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar Preview & Quick Links (1 col) */}
              <div className="space-y-space-md">
                {/* بطاقة الهوية الحية (Live Card Preview) */}
                <div className="card p-5 space-y-4">
                  <h3 className="text-xs font-black text-on-surface flex items-center gap-1.5 pb-2 border-b border-surface-container-high/40">
                    <Sparkles className="w-4 h-4 text-primary" />
                    معاينة بطاقة الهوية
                  </h3>

                  <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/40 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-surface-container-lowest border border-outline-variant flex items-center justify-center overflow-hidden shadow-xs mb-3">
                      {logoUrl ? (
                        <img src={logoUrl} alt={name || 'شعار'} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary/10 text-primary font-black text-xl flex items-center justify-center">
                          {name ? name.charAt(0) : <Store className="w-8 h-8" />}
                        </div>
                      )}
                    </div>
                    <h4 className="text-sm font-black text-on-surface line-clamp-1">{name || 'اسم شركتك'}</h4>
                    {commercialName && (
                      <p className="text-[11px] text-on-surface-variant font-semibold mt-0.5">{commercialName}</p>
                    )}

                    <div className="w-full mt-3 pt-3 border-t border-surface-container-high/40 text-[11px] text-on-surface-variant space-y-1 text-right">
                      {phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-primary shrink-0" />
                          <span dir="ltr">{phone}</span>
                        </div>
                      )}
                      {address && (
                        <div className="flex items-center gap-1.5 line-clamp-1">
                          <MapPin className="w-3 h-3 text-primary shrink-0" />
                          <span>{address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* روابط سريعة مرتبطة */}
                <div className="card p-5 space-y-3">
                  <h3 className="text-xs font-black text-on-surface pb-2 border-b border-surface-container-high/40">
                    إدارة المحفظة والصفحة العامة
                  </h3>

                  <Link
                    href="/admin/public-page"
                    className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition flex items-center justify-between group text-xs font-bold text-on-surface"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      <span>تخصيص بنود الصفحة وسابقة الأعمال</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-primary transition" />
                  </Link>

                  <Link
                    href="/public-reservations"
                    className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition flex items-center justify-between group text-xs font-bold text-on-surface"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span>حجوزات واستفسارات الصفحة العامة</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-primary transition" />
                  </Link>

                  <Link
                    href="/admin/users"
                    className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition flex items-center justify-between group text-xs font-bold text-on-surface"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <span>فريق وسطاء الشركة وصلاحياتهم</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-primary transition" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="card p-6 space-y-6">
              <div className="border-b border-surface-container-high/40 pb-3">
                <h2 className="text-base font-black text-on-surface flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-primary" />
                  الإعدادات التشغيلية والتفضيلات المستقبلية
                </h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  تحديد سياسات توزيع الحجوزات الواردة، والتنبيهات، وقواعد مشاركة العروض لوسطاء الشركة.
                </p>
              </div>

              <div className="space-y-5 divide-y divide-surface-container-high/30">
                {/* 1. نظام توزيع الحجوزات */}
                <div className="pt-4 first:pt-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xs font-black text-on-surface">نظام استلام الحجوزات العامة</h3>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        كيفية إتاحة الحجوزات الواردة من صفحة الشركة للوسطاء
                      </p>
                    </div>

                    <select
                      value={leadDistribution}
                      onChange={(e) => setLeadDistribution(e.target.value as any)}
                      className="input-base text-xs py-1.5 px-3 max-w-[200px]"
                    >
                      <option value="open_claim">أسبقية الاستلام (متاح لجميع الوسطاء)</option>
                      <option value="admin_assign">توزيع يدوي بواسطة مدير الشركة فقط</option>
                    </select>
                  </div>
                </div>

                {/* 2. تنبيهات واتساب الفورية */}
                <div className="pt-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-black text-on-surface flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-primary" />
                      تنبيهات فورية عند وصول حجز جديد
                    </h3>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      إشعار مدير الشركة والوسطاء فور تقديم عميل جديد لطلب معاينة أو حجز.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whatsappAlerts}
                      onChange={(e) => setWhatsappAlerts(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>

                {/* 3. تذكيرات المتابعات اليومية */}
                <div className="pt-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-black text-on-surface">التذكير التلقائي بمواعيد المعاينات والمتابعات</h3>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      إبراز بطاقات المتابعة المستحقة لكل وسيط في لوحة تحكمه اليومية لضمان سرعة الإغلاق.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoFollowupReminders}
                      onChange={(e) => setAutoFollowupReminders(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>

                {/* 4. وضع علامة وشعار الشركة على كروت المشاركة */}
                <div className="pt-4 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-black text-on-surface">إدراج اسم وشعار الشركة في رسائل الواتساب</h3>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      تضمين ترويسة الشركة واسمها عند قيام الوسطاء بمشاركة عروض الوحدات مع المشترين.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shareWatermark}
                      onChange={(e) => setShareWatermark(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4 z-20 shadow-lg border-primary/20">
            <span className="text-xs text-on-surface-variant">
              سيتم تطبيق أي تعديل على الشعار والبيانات فوراً في حسابات جميع وسطاء الشركة وصفحتها العامة.
            </span>

            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary px-6 py-2.5 text-xs font-bold inline-flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center min-w-[160px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الحفظ…</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>حفظ التعديلات والشعار</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </CompanyAdminGuard>
  );
}
