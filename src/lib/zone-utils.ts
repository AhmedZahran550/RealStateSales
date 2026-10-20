import { Zone } from '@/lib/types';

/**
 * اسم المنطقة الرئيسية (بدون سلسلة) — مع fallback لرقمها إن حُذفت
 */
export function zoneShortName(zoneId: number, zones: Zone[]): string {
  const zone = zones.find((z) => z.id === zoneId);
  return zone ? zone.name : `منطقة ${zoneId}`;
}

/**
 * المسار الكامل للمنطقة: «المنطقة الرئيسية / المنطقة الفرعية»
 * - منطقة رئيسية: اسمها فقط
 * - منطقة فرعية: اسم الأب / اسمها
 * - منطقة غير موجودة: منطقة {id}
 */
export function zoneDisplayName(zoneId: number, zones: Zone[]): string {
  const zone = zones.find((z) => z.id === zoneId);
  if (!zone) return `منطقة ${zoneId}`;
  if (zone.parentId == null) return zone.name;
  const parent = zones.find((z) => z.id === zone.parentId);
  return parent ? `${parent.name} / ${zone.name}` : zone.name;
}
