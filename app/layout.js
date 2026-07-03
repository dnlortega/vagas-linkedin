// Sistema de Vagas de TI em Bauru — Layout principal
// Criado por Daniel Ortega Pereira
// https://github.com/dnlortega/vagas-linkedin

import { Inter } from 'next/font/google';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'sonner';
import SplashScreen from './components/SplashScreen';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'Vagas de TI em Bauru',
  description: 'Vagas de tecnologia em Bauru e região — LinkedIn e VagasBauru',
  manifest: '/manifest.json',
  themeColor: '#1d4ed8',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VagasTI Bauru',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={inter.variable}>
        <TooltipProvider>
          <SplashScreen />
          {children}
        </TooltipProvider>
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
