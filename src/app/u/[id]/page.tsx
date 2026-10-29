import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicUnitData, firstImageUrl } from '@/lib/server/public-data';
import PublicUnitShowcaseClient from '@/components/public/PublicUnitShowcaseClient';
import { UNIT_KIND_LABELS } from '@/lib/types';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getPublicUnitData(id);

  if (!result.unit || !result.company) {
    return {
      title: 'الوحدة العقارية غير متاحة',
      description: 'تعذر العثور على الوحدة العقارية المطلوبة',
    };
  }

  const { unit, company, settings } = result;
  const unitKindTitle = UNIT_KIND_LABELS[unit.unitKind] || 'وحدة عقارية';
  const priceText = settings?.showPrice && unit.price ? `بسعر ${unit.price.toLocaleString('ar-EG')} ج.م` : '';
  const zoneText = unit.zoneName ? `في ${unit.zoneName}` : '';
  const plotText = unit.plotNo ? `(قطعة ${unit.plotNo})` : '';

  const title = `${unitKindTitle} ${unit.area} م² ${zoneText} ${plotText} | ${company.name}`.trim();
  const description = `${unitKindTitle} بمساحة ${unit.area} م² ${zoneText} ${plotText} ${priceText}. استعرض كافة الصور وفيديوهات المعاينة واحجز موعد زيارة للموقع.`.trim();

  const coverImage = firstImageUrl(unit.media);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: coverImage
        ? [
            {
              url: coverImage,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: coverImage ? [coverImage] : undefined,
    },
  };
}

export default async function PublicUnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getPublicUnitData(id);

  if (result.status !== 200 || !result.unit || !result.company || !result.settings) {
    notFound();
  }

  return (
    <PublicUnitShowcaseClient
      unit={result.unit}
      company={result.company}
      settings={result.settings}
    />
  );
}

