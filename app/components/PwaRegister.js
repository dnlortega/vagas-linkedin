'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registrado com sucesso:', registration.scope);

            // Tenta registrar a Sincronização Periódica em segundo plano (Periodic Background Sync)
            if ('periodicSync' in registration) {
              registerPeriodicJob(registration);
            }
          })
          .catch((error) => {
            console.error('Falha ao registrar Service Worker:', error);
          });
      });
    }
  }, []);

  async function registerPeriodicJob(registration) {
    try {
      // Verifica o status da permissão de sincronização periódica
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync',
      });

      if (status.state === 'granted') {
        // Registra para buscar novas vagas a cada 4 horas (mínimo exigido em ms)
        await registration.periodicSync.register('check-new-jobs', {
          minInterval: 4 * 60 * 60 * 1000, // 4 horas
        });
        console.log('Periodic Sync "check-new-jobs" registrado com sucesso!');
      } else {
        console.log('Permissão para Periodic Sync não foi concedida ainda (necessita instalação do PWA).');
      }
    } catch (error) {
      console.warn('Periodic Sync não pôde ser ativado:', error);
    }
  }

  return null;
}
