export type AppRole = 'super_admin' | 'company_admin' | 'user' | 'admin';
export type UserRole = AppRole;

export interface Company {
  id: string;
  name: string; // اسم الشركة العقارية
  commercialName?: string; // السجل التجاري أو الاسم التجاري
  logoUrl?: string; // رابط الشعار
  phone?: string; // هاتف التواصل
  email?: string; // البريد الإلكتروني
  address?: string; // العنوان أو المقر
  isActive: boolean; // حالة تفعيل الشركة
  createdAt: string;
}

export type UnitStatus = 'available' | 'reserved' | 'sold';

export type UnitKind =
  | 'duplex'
  | 'ground_garden'
  | 'floor_1'
  | 'floor_2'
  | 'floor_3'
  | 'roof'
  | 'other';

export type MediaKind = 'image' | 'video' | 'link';

export type CustomerStage =
  | 'lead'
  | 'asking'
  | 'viewed'
  | 'negotiating'
  | 'reserved'
  | 'closed'
  | 'lost';

export type ActivityType = 'call' | 'whatsapp' | 'visit' | 'note' | 'stage_change';

export interface UserProfile {
  id: string;
  fullName: string; // الاسم بالكامل
  username: string; // اسم المستخدم (بدلاً من البريد الإلكتروني)
  password?: string; // كلمة المرور
  phone?: string; // رقم الهاتف
  role: AppRole; // مدير عام المنظومة، أو مدير شركة، أو وسيط عقاري
  companyId?: string; // الشركة التي يتبع لها المستخدم (فارغة لمدير المنصة Super Admin)
  companyName?: string; // اسم الشركة المنسوب إليها
  createdAt: string;
}

export const isSuperAdmin = (user?: UserProfile | null): boolean =>
  user?.role === 'super_admin';

export const isCompanyAdmin = (user?: UserProfile | null): boolean =>
  user?.role === 'company_admin' || user?.role === 'admin';

export const isBroker = (user?: UserProfile | null): boolean =>
  user?.role === 'user';


export interface Zone {
  id: number; // 1..16
  name: string;
  direction: 'بحري' | 'قبلي' | 'شرقي' | 'غربي' | 'وسط' | string;
  mapX: number; // نسبة مئوية 0-100
  mapY: number; // نسبة مئوية 0-100
  notes?: string;
  servicesCount?: number;
}

export interface Building {
  id: number;
  companyId?: string; // الشركة المالكة أو المطورة
  companyName?: string;
  zoneId: number;
  plotNo: number;
  landArea?: number;
  features?: string[]; // مميزات المبنى (أسانسير، مدخل رخام، واجهة فاخرة...)
  mapX?: number;
  mapY?: number;
  notes?: string;
}

export interface BuildingWithStats extends Building {
  units: Unit[];
  unitsCount: number;
  availableCount: number;
  reservedCount: number;
  soldCount: number;
  totalValue: number;
}

export interface UnitMedia {
  id: string;
  unitId: string;
  ownerId?: string;
  kind: MediaKind;
  storagePath?: string;
  externalUrl?: string;
  caption?: string;
  sortOrder?: number;
  sizeBytes?: number;
  createdAt: string;
}

export interface UnitHistory {
  id: string;
  unitId: string;
  changedBy?: string; // معرف المستخدم الذي قام بالتعديل
  changedByName?: string; // اسم المستخدم
  changeType: 'status_change' | 'price_change' | 'details_update' | 'created';
  oldStatus?: UnitStatus;
  newStatus?: UnitStatus;
  details?: string;
  changes?: Record<string, any>;
  createdAt: string;
}

export interface Unit {
  id: string;
  companyId?: string; // معرف الشركة العقارية المسؤولة (الوحدة تتبع للشركة ككل وليس لوسيط)
  companyName?: string; // اسم الشركة
  buildingId: number;
  zoneId: number;
  plotNo: number;
  unitKind: UnitKind;
  floor?: number;
  side?: string; // بحري، قبلي، يمين، يسار، واجهة، خلفي
  area: number; // متر مربع
  gardenArea?: number; // متر مربع
  price: number; // جنيه مصري
  negotiable: boolean;
  deliveryNote: string; // تسليم فوري، خلال 6 شهور، تحت الإنشاء
  paymentTerms: string; // كاش، مقدم 50% وتقسيط، إلخ
  description?: string;
  status: UnitStatus;
  media: UnitMedia[];
  features?: string[]; // مميزات خاصة بالوحدة (ترث من المبنى إذا كانت فارغة)
  lat?: number;
  lng?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: number;
  name: string;
  category: 'mall' | 'club' | 'road' | 'school' | 'hospital' | 'other';
  notes?: string;
  icon?: string;
}

export interface ZoneService {
  zoneId: number;
  serviceId: number;
}

export interface CustomerActivity {
  id: string;
  customerId: string;
  type: ActivityType;
  note: string;
  createdAt: string;
  authorName?: string;
}

export interface Customer {
  id: string;
  ownerId: string; // الوسيط صاحب العميل حصراً (حساب خاص معزول تماماً لا يتبع للشركة)
  ownerName?: string;
  name: string;
  phone: string;
  whatsapp?: string;
  budget?: number;
  source?: string; // إعلان، إحالة، فيسبوك، زيارة مقر، إلخ
  stage: CustomerStage;
  nextFollowupAt?: string;
  notes?: string;
  interestedUnitIds: string[];
  activities: CustomerActivity[];
  createdAt: string;
  updatedAt: string;
}

export const STAGE_CONFIG: Record<CustomerStage, { label: string; color: string; bg: string; border: string }> = {
  lead: {
    label: 'عميل محتمل',
    color: 'text-on-info-container',
    bg: 'bg-info-container',
    border: 'border-info',
  },
  asking: {
    label: 'يسأل عن التفاصيل',
    color: 'text-on-warning-container',
    bg: 'bg-warning-container',
    border: 'border-warning',
  },
  viewed: {
    label: 'معاينة موقعية',
    color: 'text-on-accent-indigo-container',
    bg: 'bg-accent-indigo-container',
    border: 'border-accent-indigo',
  },
  negotiating: {
    label: 'مرحلة التفاوض',
    color: 'text-on-accent-purple-container',
    bg: 'bg-accent-purple-container',
    border: 'border-accent-purple',
  },
  reserved: {
    label: 'تم الحجز المبدئي',
    color: 'text-on-success-container',
    bg: 'bg-success-container',
    border: 'border-success',
  },
  closed: {
    label: 'تم التعاقد والبيع',
    color: 'text-on-success-container',
    bg: 'bg-success-container',
    border: 'border-success',
  },
  lost: {

    label: 'صفقة ملغاة',
    color: 'text-on-error-container',
    bg: 'bg-error-container',
    border: 'border-error',
  },
};

export const UNIT_KIND_LABELS: Record<UnitKind, string> = {
  duplex: 'دوبلكس (أرضي + بدروم + حديقة)',
  ground_garden: 'شقة أرضي بحديقة خاصة',
  floor_1: 'دور أول متكرر',
  floor_2: 'دور ثاني متكرر',
  floor_3: 'دور ثالث',
  roof: 'روف (مبني / مصرح)',
  other: 'وحدة أخرى',
};

// ==========================================================
// الصفحة العامة للشركات (Public Company Page)
// ==========================================================

export type ReservationPeriod = 'morning' | 'afternoon' | 'evening';

export const RESERVATION_PERIOD_LABELS: Record<ReservationPeriod, string> = {
  morning: 'صباحي (9 ص - 12 م)',
  afternoon: 'بعد الظهر (12 م - 4 م)',
  evening: 'مسائي (4 م - 9 م)',
};

export type GalleryItemSource = 'manual' | 'auto_sold';

export interface CompanyPublicSettings {
  companyId: string;
  isEnabled: boolean; // تفعيل / إيقاف الصفحة العامة
  showPrice: boolean;
  showArea: boolean;
  showFloor: boolean;
  showGarden: boolean;
  showFeatures: boolean;
  showDescription: boolean;
  showDelivery: boolean;
  showPayment: boolean;
}

export interface GalleryItem {
  id: string;
  companyId: string;
  unitId?: string; // مرتبط بوحدة تم بيعها (اختياري)
  title?: string;
  description?: string;
  price?: number;
  images: string[];
  source: GalleryItemSource; // 'manual' (يدوي) | 'auto_sold' (تلقائي عند البيع)
  createdAt: string;
}

export interface PublicUnit {
  id: string;
  unitKind: UnitKind;
  plotNo: number;
  zoneName?: string;
  floor?: number;
  side?: string;
  area: number;
  gardenArea?: number;
  price: number;
  negotiable: boolean;
  deliveryNote?: string;
  paymentTerms?: string;
  description?: string;
  features?: string[];
  media: UnitMedia[];
}

export interface PublicReservation {
  id: string;
  companyId: string;
  unitId: string;
  unitLabel?: string;
  unitArea?: number;
  customerName: string;
  phone: string;
  preferredDate: string;
  period: ReservationPeriod;
  note?: string;
  status: 'new' | 'claimed';
  claimedBy?: string;
  claimedByName?: string;
  claimedCustomerId?: string;
  claimedCustomerStage?: CustomerStage;
  claimedAt?: string;
  createdAt: string;
}

export const UNIT_STATUS_CONFIG: Record<UnitStatus, { label: string; badgeClass: string }> = {
  available: {
    label: 'متاح للبيع',
    badgeClass: 'bg-success-container text-on-success-container border-success',
  },
  reserved: {
    label: 'حجز مؤقت',
    badgeClass: 'bg-warning-container text-on-warning-container border-warning',
  },
  sold: {
    label: 'تم البيع',
    badgeClass: 'bg-surface-container text-on-surface-variant border-outline',
  },
};
