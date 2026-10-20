import { UnitMedia } from './types';

/**
 * استخراج رابط أول صورة للوحدة (آمن للاستخدام من العميل والخادم)
 */
export function firstImageUrl(media: UnitMedia[]): string | undefined {
  const image = media.find((m) => m.kind === 'image');
  return image?.storagePath || image?.externalUrl || undefined;
}

/**
 * استخراج كل روابط الصور من الوسائط (آمن للاستخدام من العميل والخادم)
 */
export function allImageUrls(media: UnitMedia[]): string[] {
  return media
    .filter((m) => m.kind === 'image')
    .map((m) => m.storagePath || m.externalUrl)
    .filter((u): u is string => !!u);
}
