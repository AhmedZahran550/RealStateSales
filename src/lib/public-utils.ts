import { UnitMedia } from './types';

/**
 * استخراج رابط أول صورة للوحدة (آمن للاستخدام من العميل والخادم)
 */
export function firstImageUrl(media: UnitMedia[]): string | undefined {
  if (!media || media.length === 0) return undefined;
  const sorted = [...media].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const image = sorted.find((m) => m.kind === 'image');
  return image?.storagePath || image?.externalUrl || undefined;
}

/**
 * استخراج كل روابط الصور من الوسائط (آمن للاستخدام من العميل والخادم)
 */
export function allImageUrls(media: UnitMedia[]): string[] {
  if (!media || media.length === 0) return [];
  const sorted = [...media].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  return sorted
    .filter((m) => m.kind === 'image')
    .map((m) => m.storagePath || m.externalUrl)
    .filter((u): u is string => !!u);
}
