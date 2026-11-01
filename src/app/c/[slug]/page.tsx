import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getPublicPageData } from '@/lib/server/public-data';
import PublicClient from '@/components/public/PublicClient';
import PublicUnavailable from '@/components/public/PublicUnavailable';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicPageData(slug);
  const name = result.data?.company.name ?? result.company?.commercialName ?? result.company?.name;
  return {
    title: name ? `${name} | الوحدات المتاحة للعرض` : 'الصفحة غير متاحة',
    description: name
      ? `استعرض الوحدات العقارية المتاحة من ${name} واحجز وحدتك الآن`
      : undefined,
  };
}

export default async function PublicCompanySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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
      <PublicSlugPageContent slug={slug} />
    </Suspense>
  );
}

async function PublicSlugPageContent({ slug }: { slug: string }) {
  const result = await getPublicPageData(slug);

  if (!result.data) {
    if (result.reason === 'disabled') {
      return <PublicUnavailable company={result.company} />;
    }
    notFound();
  }

  return <PublicClient data={result.data} />;
}

