import './globals.css';
import { Toaster } from '@/components/ui/sonner';

export const metadata = {
  title: 'Fresh Fold — Premium Laundry Pickup & Delivery | Geelong, VIC',
  description: 'Professional laundry pickup and delivery service in Geelong, Victoria. Subscription plans from $19.99/month. Wash, fold, iron — delivered to your door. Same-day service available.',
  keywords: 'laundry service Geelong, laundry pickup delivery Geelong, laundry subscription Geelong, Fresh Fold laundry, Geelong laundry service, Bellarine Peninsula laundry, Surf Coast laundry',
  openGraph: {
    title: 'Fresh Fold — Premium Laundry Pickup & Delivery',
    description: 'Geelong\'s premium laundry service. Pickup, wash, fold & deliver. Plans from $19.99/mo.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧺</text></svg>" />
      </head>
      <body className="min-h-screen">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
