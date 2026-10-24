'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { customerService } from '@/services/customerService';
import { Customer } from '@/lib/types';
import CustomerForm from '@/components/customers/CustomerForm';
import { Loader2, ArrowRight, Info } from 'lucide-react';

export default function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const customerId = resolvedParams.id;
  const { customers } = useApp();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const found = customers.find((c) => c.id === customerId);
    if (found) {
      setCustomer(found);
      setLoading(false);
    } else {
      customerService.getCustomerById(customerId).then((fetched) => {
        setCustomer(fetched);
        setLoading(false);
      });
    }
  }, [customers, customerId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="mx-auto max-w-2xl text-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-error-container text-error flex items-center justify-center mx-auto">
          <Info className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-on-surface">العميل غير موجود</h2>
        <p className="text-sm text-on-surface-variant">تعذر العثور على العميل المطلوب لتعديله.</p>
        <Link href="/customers" className="btn-primary inline-flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          العودة لقائمة العملاء
        </Link>
      </div>
    );
  }

  return <CustomerForm initialCustomer={customer} isEdit />;
}
