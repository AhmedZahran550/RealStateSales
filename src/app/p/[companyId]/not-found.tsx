import Link from 'next/link';

/**
 * صفحة 404 بمظهر عام (للمسارات العامة /p/...) — بدون هيكل لوحة التحكم.
 */
export default function PublicNotFound() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="card max-w-sm w-full text-center p-8">
        <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center">
          <span className="material-symbols-outlined text-on-surface-variant text-3xl">
            search_off
          </span>
        </div>
        <h1 className="text-lg font-black text-on-surface mb-2">الصفحة غير موجودة</h1>
        <p className="text-sm font-semibold text-on-surface-variant leading-relaxed">
          الرابط الذي فتحته غير صحيح أو لم تعد هذه الصفحة متاحة
        </p>
        <Link
          href="/"
          className="btn-tonal inline-flex items-center justify-center mt-5 px-5 py-2.5 rounded-xl text-xs font-bold"
        >
          الصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
}
