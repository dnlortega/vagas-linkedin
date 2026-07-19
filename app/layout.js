// Sistema de Vagas em Bauru — Layout principal
// Criado por Daniel Ortega Pereira
// https://github.com/dnlortega/vagas-linkedin

import { Inter } from 'next/font/google';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'sonner';
import SplashScreen from './components/SplashScreen';
import PwaRegister from './components/PwaRegister';
import Providers from './components/Providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'Vagas em Bauru',
  description: 'Vagas de emprego em Bauru e região — LinkedIn, VagasBauru, Catho, Indeed e mais',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vagas Bauru',
  },
};

export const viewport = {
  themeColor: '#1d4ed8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={inter.variable}>
        <Providers>
          <TooltipProvider>
            <PwaRegister />
            <SplashScreen />
            {children}
          </TooltipProvider>
        </Providers>
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
