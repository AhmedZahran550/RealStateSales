export type AppRole = 'super_admin' | 'company_admin' | 'user' | 'admin';

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
    color: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-50 dark:bg-sky-950/60',
    border: 'border-sky-300 dark:border-sky-800',
  },
  asking: {
    label: 'يسأل عن التفاصيل',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    border: 'border-amber-300 dark:border-amber-800',
  },
  viewed: {
    label: 'معاينة موقعية',
    color: 'text-indigo-700 dark:text-indigo-300',
    bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    border: 'border-indigo-300 dark:border-indigo-800',
  },
  negotiating: {
    label: 'مرحلة التفاوض',
    color: 'text-purple-700 dark:text-purple-300',
    bg: 'bg-purple-50 dark:bg-purple-950/60',
    border: 'border-purple-300 dark:border-purple-800',
  },
  reserved: {
    label: 'تم الحجز المبدئي',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    border: 'border-emerald-300 dark:border-emerald-800',
  },
  closed: {
    label: 'تم التعاقد والبيع',
    color: 'text-amber-800 dark:text-amber-300',
    bg: 'bg-amber-100 dark:bg-amber-950/70',
    border: 'border-amber-400 dark:border-amber-700',
  },
  lost: {

    label: 'صفقة ملغاة',
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-50 dark:bg-rose-950/60',
    border: 'border-rose-300 dark:border-rose-800',
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

export const UNIT_STATUS_CONFIG: Record<UnitStatus, { label: string; badgeClass: string }> = {
  available: {
    label: 'متاح للبيع',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
  },
  reserved: {
    label: 'حجز مؤقت',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
  },
  sold: {
    label: 'تم البيع',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
};
