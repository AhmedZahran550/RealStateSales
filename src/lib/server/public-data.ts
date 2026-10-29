import { serverSupabase } from '@/lib/server/supabase';
import { PublicPageData } from '@/services/publicPageService';
import { PublicUnit, UnitMedia, GalleryItem, CompanyPublicSettings, UnitKind } from '@/lib/types';

/**
 * جلب بيانات الصفحة العامة للشركة (مشترك بين الصفحة العامة والـ API العام)
 * يعيد الخطأ المناسب إذا لم تكن الشركة موجودة أو الصفحة غير مفعلة
 */
export type PublicPageFailure = {
  status: number;
  error?: string;
  /** سبب عدم التوفر: 'not_found' الشركة غير موجودة | 'disabled' الصفحة غير مفعلة */
  reason?: 'not_found' | 'disabled';
  /** معلومات مختصرة عن الشركة لعرضها في حالة «الصفحة غير مفعلة» */
  company?: { name: string; commercialName?: string; logoUrl?: string };
};

export async function getPublicPageData(
  companyId: string
): Promise<{ data?: PublicPageData } & PublicPageFailure> {
  // 1. جلب الشركة والتحقق من تفعيلها
  const { data: company, error: companyErr } = await serverSupabase
    .from('companies')
    .select('id, name, commercial_name, logo_url, phone, email, address, is_active')
    .eq('id', companyId)
    .maybeSingle();

  if (companyErr || !company || !company.is_active) {
    return {
      status: 404,
      error: 'هذه الصفحة غير متاحة حالياً',
      reason: 'not_found',
    };
  }

  // 2. جلب الإعدادات والتحقق من تفعيل الصفحة العامة
  const { data: dbSettings } = await serverSupabase
    .from('company_public_settings')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle();

  if (!dbSettings || !dbSettings.is_enabled) {
    return {
      status: 404,
      error: 'هذه الصفحة غير متاحة حالياً',
      reason: 'disabled',
      company: {
        name: company.name,
        commercialName: company.commercial_name || undefined,
        logoUrl: company.logo_url || undefined,
      },
    };
  }

  const settings: CompanyPublicSettings = {
    companyId,
    isEnabled: dbSettings.is_enabled,
    showPrice: dbSettings.show_price,
    showArea: dbSettings.show_area,
    showFloor: dbSettings.show_floor,
    showGarden: dbSettings.show_garden,
    showFeatures: dbSettings.show_features,
    showDescription: dbSettings.show_description,
    showDelivery: dbSettings.show_delivery,
    showPayment: dbSettings.show_payment,
  };

  // 3. جلب وحدات الشركة مع وسائطها + مناطقها (بدون كشف الحالة نهائياً)
  const [unitsRes, zonesRes, buildingsRes, galleryRes] = await Promise.all([
    serverSupabase
      .from('units')
      .select('*, unit_media(*), buildings (plot_no)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),
    serverSupabase.from('zones').select('id, name'),
    serverSupabase.from('buildings').select('id, zone_id').eq('company_id', companyId),
    serverSupabase
      .from('company_gallery_items')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),
  ]);

  if (unitsRes.error || galleryRes.error || buildingsRes.error) {
    return {
      status: 500,
      error:
        unitsRes.error?.message ||
        galleryRes.error?.message ||
        buildingsRes.error?.message ||
        'حدث خطأ غير متوقع في الخادم',
    };
  }

  const zoneNames = new Map<string, string>(
    (zonesRes.data || []).map((z: any) => [String(z.id), z.name])
  );
  const buildingZones = new Map<number, string>(
    (buildingsRes.data || []).map((b: any) => [b.id, String(b.zone_id)])
  );

  const units: PublicUnit[] = (unitsRes.data || []).map((u: any) => ({
    id: u.id,
    unitKind: u.unit_kind as UnitKind,
    // plot_no يأتي من المبنى المرتبط عبر building_id (الوحدة لا تحمل رقم قطعة بنفسها)
    plotNo: Number(u.buildings?.plot_no ?? 1),
    zoneName: zoneNames.get(buildingZones.get(u.building_id) || '') || undefined,
    floor: u.floor ?? undefined,
    side: u.side || undefined,
    area: Number(u.area),
    gardenArea: u.garden_area ? Number(u.garden_area) : undefined,
    price: Number(u.price),
    negotiable: !!u.negotiable,
    deliveryNote: u.delivery_note || undefined,
    paymentTerms: u.payment_terms || undefined,
    description: u.description || undefined,
    features: (u.features || []).length > 0 ? u.features : undefined,
    media: (u.unit_media || [])
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map(
        (m: any): UnitMedia => ({
        id: m.id,
        unitId: m.unit_id,
        kind: m.kind,
        storagePath: m.storage_path || undefined,
        externalUrl: m.external_url || undefined,
        caption: m.caption || undefined,
        sortOrder: m.sort_order ?? 0,
        createdAt: m.created_at,
      })
    ),
  }));

  const gallery: GalleryItem[] = (galleryRes.data || []).map((g: any) => ({
    id: g.id,
    companyId: g.company_id,
    buildingId: g.building_id || undefined,
    unitId: g.unit_id || undefined,
    title: g.title || undefined,
    description: g.description || undefined,
    price: g.price ? Number(g.price) : undefined,
    images: g.images || [],
    source: g.source,
    createdAt: g.created_at,
  }));

  return {
    status: 200,
    data: {
      company: {
        id: company.id,
        name: company.name,
        commercialName: company.commercial_name || undefined,
        logoUrl: company.logo_url || undefined,
        phone: company.phone || undefined,
        email: company.email || undefined,
        address: company.address || undefined,
      },
      settings,
      units,
      gallery,
    },
  };
}

export type PublicUnitDetail = PublicUnit & {
  price: number;
  description?: string;
  deliveryNote?: string;
  paymentTerms?: string;
  lat?: number;
  lng?: number;
  companyId: string;
  companyName?: string;
  features?: string[];
};

/**
 * جلب بيانات وحدة منفردة لصفحة المعاينة العامة (/u/[id])
 */
export async function getPublicUnitData(unitId: string): Promise<{
  unit?: PublicUnitDetail;
  company?: {
    id: string;
    name: string;
    commercialName?: string;
    logoUrl?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  settings?: CompanyPublicSettings;
  status: number;
  error?: string;
}> {
  // 1. جلب بيانات الوحدة مع المبنى والشركة والوسائط
  const { data: dbUnit, error: unitErr } = await serverSupabase
    .from('units')
    .select(`
      *,
      companies (*),
      buildings (plot_no, zone_id, zones (name)),
      unit_media (*)
    `)
    .eq('id', unitId)
    .maybeSingle();

  if (unitErr || !dbUnit) {
    return { status: 404, error: 'الوحدة غير موجودة' };
  }

  const company = dbUnit.companies;
  if (!company || !company.is_active) {
    return { status: 404, error: 'الشركة المالكة غير متاحة حالياً' };
  }

  // 2. جلب إعدادات الصفحة العامة للشركة
  const { data: dbSettings } = await serverSupabase
    .from('company_public_settings')
    .select('*')
    .eq('company_id', company.id)
    .maybeSingle();

  const settings: CompanyPublicSettings = {
    companyId: company.id,
    isEnabled: dbSettings?.is_enabled ?? true,
    showPrice: dbSettings?.show_price ?? true,
    showArea: dbSettings?.show_area ?? true,
    showFloor: dbSettings?.show_floor ?? true,
    showGarden: dbSettings?.show_garden ?? true,
    showFeatures: dbSettings?.show_features ?? true,
    showDescription: dbSettings?.show_description ?? true,
    showDelivery: dbSettings?.show_delivery ?? true,
    showPayment: dbSettings?.show_payment ?? true,
  };

  const embeddedZone = Array.isArray(dbUnit.buildings?.zones)
    ? dbUnit.buildings?.zones?.[0]
    : dbUnit.buildings?.zones;
  const zoneName = (embeddedZone as any)?.name || undefined;

  const sortedMedia: UnitMedia[] = (dbUnit.unit_media || [])
    .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((m: any) => ({
      id: m.id,
      unitId: m.unit_id,
      kind: m.kind,
      storagePath: m.storage_path || undefined,
      externalUrl: m.external_url || undefined,
      caption: m.caption || undefined,
      sortOrder: m.sort_order ?? 0,
      createdAt: m.created_at,
    }));

  const unit: PublicUnitDetail = {
    id: dbUnit.id,
    unitKind: dbUnit.unit_kind as UnitKind,
    plotNo: Number(dbUnit.buildings?.plot_no ?? 1),
    zoneName,
    floor: dbUnit.floor ?? undefined,
    side: dbUnit.side || undefined,
    area: Number(dbUnit.area),
    gardenArea: dbUnit.garden_area ? Number(dbUnit.garden_area) : undefined,
    price: Number(dbUnit.price),
    negotiable: Boolean(dbUnit.negotiable),
    deliveryNote: dbUnit.delivery_note || undefined,
    paymentTerms: dbUnit.payment_terms || undefined,
    description: dbUnit.description || undefined,
    features: dbUnit.features || [],
    lat: dbUnit.lat ? Number(dbUnit.lat) : undefined,
    lng: dbUnit.lng ? Number(dbUnit.lng) : undefined,
    companyId: company.id,
    companyName: company.name,
    media: sortedMedia,
  };

  return {
    status: 200,
    unit,
    company: {
      id: company.id,
      name: company.name,
      commercialName: company.commercial_name || undefined,
      logoUrl: company.logo_url || undefined,
      phone: company.phone || undefined,
      email: company.email || undefined,
      address: company.address || undefined,
    },
    settings,
  };
}

/**
 * استخراج رابط عرض أول وسائط الوحدة (صورة للكرت)
 */
export { firstImageUrl, allImageUrls } from '@/lib/public-utils';
