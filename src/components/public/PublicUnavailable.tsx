import type { PublicPageFailure } from '@/lib/server/public-data';
import { Building2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

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
  const initial = displayName ? displayName.trim().charAt(0) : 'ع';

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="card card-bordered max-w-md w-full text-center p-8 bg-surface-container-lowest shadow-xl">
        {company?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={company.logoUrl}
            alt={displayName || 'شعار الشركة'}
            className="w-20 h-20 rounded-3xl object-cover mx-auto mb-4 bg-surface-container border border-outline-variant shadow-sm"
          />
        ) : (
          <div className="w-20 h-20 rounded-3xl bg-primary text-on-primary font-black text-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            {initial}
          </div>
        )}

        <h1 className="text-xl font-black text-on-surface mb-2">
          {displayName ? `صفحة ${displayName}` : 'صفحة الشركة العامة'}
        </h1>

        <p className="text-sm font-semibold text-on-surface-variant leading-relaxed">
          الصفحة العامة لهذه الشركة غير مفعلة حالياً للعرض العام.
        </p>

        <div className="mt-5 rounded-2xl bg-surface-container-low border border-outline-variant/60 p-4 text-right">
          <p className="text-xs font-semibold text-on-surface-variant leading-relaxed">
            إذا كنت من مسؤولي أو إدارة الشركة، يمكنك تفعيل الصفحة العامة ومشاركة الوحدات والمعرض مباشرة من لوحة التحكم في أي وقت.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/login"
            className="btn-primary w-full py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5"
          >
            <span>تسجيل دخول الإدارة</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}
