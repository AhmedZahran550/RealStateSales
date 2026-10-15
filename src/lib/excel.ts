import * as XLSX from 'xlsx';
import { Unit, UNIT_KIND_LABELS, UNIT_STATUS_CONFIG } from './types';

export const exportUnitsToExcel = (units: Unit[], filename = 'وحدات_الحي_المتميز_الواحة.xlsx') => {
  const data = units.map((u, index) => ({
    'م': index + 1,
    'المنطقة': `المنطقة ${u.zoneId}`,
    'رقم القطعة': u.plotNo,
    'نوع الوحدة': UNIT_KIND_LABELS[u.unitKind] || u.unitKind,
    'الدور': u.floor === 0 ? 'أرضي' : u.floor ? `دور ${u.floor}` : 'غير محدد',
    'الواجهة / الاتجاه': u.side || '-',
    'المساحة (م²)': u.area,
    'الحديقة (م²)': u.gardenArea || 0,
    'السعر الإجمالي (ج.م)': u.price,
    'سعر المتر التقريبي (ج.م)': Math.round(u.price / (u.area || 1)),
    'قابل للتفاوض': u.negotiable ? 'نعم' : 'لا',
    'موعد التسليم': u.deliveryNote,
    'نظام السداد': u.paymentTerms,
    'الحالة': UNIT_STATUS_CONFIG[u.status]?.label || u.status,
    'الشركة المسؤولة': u.companyName || '-',
    'المميزات والمواصفات': (u.features || []).join('، '),
    'تاريخ الإضافة': new Date(u.createdAt).toLocaleDateString('ar-EG'),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set Right-To-Left direction on worksheet
  worksheet['!views'] = [{ RTL: true }];

  // Column widths
  worksheet['!cols'] = [
    { wch: 5 }, // index
    { wch: 15 }, // zone
    { wch: 12 }, // plot
    { wch: 28 }, // kind
    { wch: 12 }, // floor
    { wch: 20 }, // side
    { wch: 14 }, // area
    { wch: 14 }, // garden
    { wch: 20 }, // price
    { wch: 22 }, // price/m
    { wch: 14 }, // neg
    { wch: 25 }, // delivery
    { wch: 30 }, // terms
    { wch: 16 }, // status
    { wch: 22 }, // broker
    { wch: 35 }, // services
    { wch: 16 }, // date
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الوحدات المتاحة');

  XLSX.writeFile(workbook, filename);
};
