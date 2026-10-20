import type { PublicPageFailure } from '@/lib/server/public-data';

/**
 * حالة «الصفحة العامة غير مفعلة بعد» — تظهر عندما تكون الشركة موجودة
 * لكن الإدارة لم تفعّل الصفحة العامة من لوحة التحكم.
 */
export default function PublicUnavailable({
  company,
}: {
  company?: NonNullable<PublicPageFailure['company']>;
}) {
  const displayName = company?.commercialName || company?.name || '';
  const initial = displayName ? displayName.trim().charAt(0) : '؟';

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="card max-w-sm w-full text-center p-8">
        {company?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={company.logoUrl}
            alt={displayName || 'شعار الشركة'}
            className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4 bg-surface-container"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-on-primary font-black text-2xl mx-auto mb-4">
            {initial}
          </div>
        )}
        <h1 className="text-lg font-black text-on-surface mb-2">
          {displayName ? `صفحة ${displayName}` : 'الصفحة العامة'}
        </h1>
        <p className="text-sm font-semibold text-on-surface-variant leading-relaxed">
          الصفحة العامة غير مفعلة بعد لهذه الشركة
        </p>
        <div className="mt-4 rounded-xl bg-surface-container px-4 py-3">
          <p className="text-xs font-semibold text-on-surface-variant leading-relaxed">
            إذا كنت من إدارة الشركة، فعّل الصفحة العامة من لوحة التحكم لتظهر هنا
            ويمكنكم مشاركتها مع العملاء
          </p>
        </div>
      </div>
    </div>
  );
}
