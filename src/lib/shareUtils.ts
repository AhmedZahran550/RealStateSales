import { Unit, UNIT_KIND_LABELS } from '@/lib/types';

export interface ConsultantInfo {
  fullName?: string;
  phone?: string;
}

/**
 * تنسيق قسم روابط الصور والفيديوهات للرسائل
 */
export function formatMediaLinksSection(unit: Unit): string {
  const mediaList = unit.media || [];
  if (mediaList.length === 0) return '';

  const mediaLines: string[] = [];

  mediaList.forEach((m, idx) => {
    const url = m.externalUrl || m.storagePath;
    if (!url) return;

    const label =
      m.caption ||
      (m.kind === 'video'
        ? `فيديو معاينة #${idx + 1}`
        : `صورة الوحدة #${idx + 1}`);

    const icon = m.kind === 'video' ? '🎥' : '📸';
    mediaLines.push(`${icon} ${label}:\n${url}`);
  });

  if (mediaLines.length === 0) return '';

  return `\n\n🖼 *صور وفيديوهات المعاينة:*\n${mediaLines.join('\n\n')}`;
}

/**
 * إنشاء النص التفصيلي الكامل للوحدة لنسخه للحافظة أو مشاركته
 */
export function formatUnitFullDetails(unit: Unit, consultant?: ConsultantInfo | null): string {
  const consultantName = consultant?.fullName || 'المستشار العقاري';
  const consultantPhone = consultant?.phone
    ? `\n📞 للتواصل والاستفسار (هاتف / واتساب): ${consultant.phone}`
    : '';

  const servicesText =
    unit.services && unit.services.length > 0
      ? `\nالمعالم والخدمات المحيطة: ${unit.services.join('، ')}`
      : '';

  const googleMapsUrl =
    unit.lat && unit.lng ? `\n📍 الموقع على الخريطة: https://www.google.com/maps?q=${unit.lat},${unit.lng}` : '';

  const mediaSection = formatMediaLinksSection(unit);

  const floorText = unit.floor === 0 ? 'الأرضي' : unit.floor ? `الدور ${unit.floor}` : 'متكرر';
  const sideText = unit.side ? ` (${unit.side})` : '';

  return `🏡 *عقار مميز بالحي المتميز (مدينة بدر)*:
كود الوحدة: #BD-${unit.zoneId}-${unit.plotNo}
المنطقة: منطقة ${unit.zoneId} | قطعة رقم ${unit.plotNo}
النوع: ${UNIT_KIND_LABELS[unit.unitKind] || 'شقة سكنية'} - ${floorText}${sideText}
المساحة: ${unit.area} م² ${unit.gardenArea ? `+ حديقة خاصة ${unit.gardenArea} م²` : ''}
السعر: ${unit.price.toLocaleString('ar-EG')} جنيه مصري${unit.negotiable ? ' (قابل للتفاوض)' : ''}
الاستلام: ${unit.deliveryNote || 'استلام فوري'}
نظام السداد: ${unit.paymentTerms || 'كاش أو تقسيط بتسهيلات'}${servicesText}${googleMapsUrl}${mediaSection}

المستشار العقاري: ${consultantName}${consultantPhone}`;
}

/**
 * إنشاء رابط مشاركة عبر واتساب لوحدة معينة
 */
export function createUnitWhatsAppUrl(
  unit: Unit,
  consultant?: ConsultantInfo | null,
  targetPhone?: string
): string {
  const text = formatUnitFullDetails(unit, consultant);
  const cleanPhone = targetPhone ? targetPhone.replace(/[^0-9]/g, '') : '';
  const baseUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : 'https://wa.me/';
  return `${baseUrl}?text=${encodeURIComponent(text)}`;
}

/**
 * إنشاء نص العرض المخصص للعميل في شاشة المطابقة (CRM Matching Studio)
 */
export function formatCustomerProposalMessage(
  customerName: string,
  unit: Unit,
  consultant?: ConsultantInfo | null,
  customerBudget?: number
): string {
  const consultantName = consultant?.fullName || 'المستشار العقاري';
  const consultantPhone = consultant?.phone || '';
  const budgetStr = customerBudget
    ? `في حدود ميزانية ${(customerBudget / 1000000).toFixed(1)} مليون ج.م`
    : 'بمدينة بدر';

  const locationFeatures =
    unit.services && unit.services.length > 0
      ? `قريب من: ${unit.services.join('، ')}`
      : unit.description || 'الحي المتميز بمدينة بدر';

  const googleMapsUrl =
    unit.lat && unit.lng ? `\n📍 الموقع على الخريطة: https://www.google.com/maps?q=${unit.lat},${unit.lng}` : '';

  const mediaSection = formatMediaLinksSection(unit);

  return `مساء الخير يا ${customerName}، أتمنى تكون بخير 🌿

بناءً على طلب حضرتك بخصوص البحث عن وحدة مميزة في الحي المتميز بمدينة بدر ${budgetStr}:

لقيت لحضرتك فرصة استثنائية مطابقة تماماً لطلبك:

🏡 *كود الوحدة:* #BD-${unit.zoneId}-${unit.plotNo}
📍 *الموقع:* الحي المتميز - منطقة ${unit.zoneId} (قطعة ${unit.plotNo})
📐 *المساحة:* ${unit.area} م² ${unit.gardenArea ? `+ حديقة خاصة ${unit.gardenArea} م²` : ''}
🏗 *نوع الوحدة:* ${UNIT_KIND_LABELS[unit.unitKind] || 'شقة سكنية'}
💰 *السعر الإجمالي:* ${unit.price.toLocaleString('ar-EG')} ج.م${unit.negotiable ? ' (قابل للتفاوض)' : ''}
💳 *نظام السداد:* ${unit.paymentTerms || 'كاش أو تقسيط بتسهيلات'}
⏳ *الاستلام:* ${unit.deliveryNote || 'استلام فوري'}

📍 *المعالم والخدمات المحيطة:*
${locationFeatures}${googleMapsUrl}${mediaSection}

حضرتك تحب نرتب ميعاد معاينة للموقع مع المستشار العقاري؟

تحياتي،
*${consultantName} | مستشار عقاري معتمد*
${consultantPhone ? `📞 رقم الهاتف للتواصل / واتساب: ${consultantPhone}` : ''}`;
}
