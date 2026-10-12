import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import Navbar from '@/components/Navbar';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'الواحة | إدارة عقارات وخريطة الحي المتميز - مدينة بدر',
  description: 'منظومة عقارية متكاملة لإدارة عروض الوحدات، الخريطة التفاعلية، ومتابعة العملاء (CRM) للحي المتميز بمدينة بدر',
  icons: {
    icon: '/favicon.ico',
  },
};

import AuthGuard from '@/components/AuthGuard';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="min-h-screen flex flex-col bg-[#fbf9f6] dark:bg-[#0b0f17] text-[#1c1917] dark:text-[#f5f5f4] antialiased selection:bg-amber-600 selection:text-white">
        <AppProvider>
          <AuthGuard>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
                {children}
              </main>
            </div>
          </AuthGuard>
        </AppProvider>
      </body>
    </html>
  );
}
