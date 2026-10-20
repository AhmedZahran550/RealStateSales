import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getPublicPageData } from '@/lib/server/public-data';
import PublicClient from '@/components/public/PublicClient';
import PublicUnavailable from '@/components/public/PublicUnavailable';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ companyId: string }>;
}): Promise<Metadata> {
  const { companyId } = await params;
  const result = await getPublicPageData(companyId);
  const name = result.data?.company.name ?? result.company?.commercialName ?? result.company?.name;
  return {
    title: name ? `${name} | الوحدات المتاحة للعرض` : 'الصفحة غير متاحة',
    description: name
      ? `استعرض الوحدات العقارية المتاحة من ${name} واحجز وحدتك الآن`
      : undefined,
  };
}

export default async function PublicCompanyPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-surface">
          <p className="text-sm font-bold text-on-surface-variant animate-pulse">
            جاري تحميل صفحة الشركة...
          </p>
        </div>
      }
    >
      <PublicPageContent companyId={companyId} />
    </Suspense>
  );
}

async function PublicPageContent({ companyId }: { companyId: string }) {
  const result = await getPublicPageData(companyId);

  if (!result.data) {
    // الشركة موجودة لكن الصفحة العامة غير مفعلة → حالة مخصصة بدل 404
    if (result.reason === 'disabled') {
      return <PublicUnavailable company={result.company} />;
    }
    notFound();
  }

  return <PublicClient data={result.data} />;
}
