import Link from 'next/link';

/**
 * صفحة 404 العامة للتطبيق (كل المسارات غير الموجودة).
 * تظهر داخل هيكل التطبيق للمستخدم المسجّل، أو كشاشة مستقلة للزائر عبر /login.
 */
export default function GlobalNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-10">
      <div className="card max-w-sm w-full text-center p-8">
        <p className="text-6xl font-black text-primary mb-2" aria-hidden="true">
          404
        </p>
        <h1 className="text-lg font-black text-on-surface mb-2">الصفحة غير موجودة</h1>
        <p className="text-sm font-semibold text-on-surface-variant leading-relaxed">
          الرابط الذي فتحته غير صحيح أو تمت إزالة هذه الصفحة
        </p>
        <Link
          href="/"
          className="btn-tonal inline-flex items-center justify-center mt-5 px-5 py-2.5 rounded-xl text-xs font-bold"
        >
          العودة إلى الرئيسية
        </Link>
      </div>
    </div>
  );
}
