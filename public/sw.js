// Service Worker para PWA - Vagas em Bauru
// Suporta PWA instalável, notificações em segundo plano e sincronização periódica

const CACHE_NAME = 'vagas-bauru-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Suporte a interceptação de fetch simples (exigência do PWA para ser instalável)
self.addEventListener('fetch', (event) => {
  // Pass-through simples para garantir bom funcionamento
  event.respondWith(fetch(event.request));
});

// Trata o clique do usuário na notificação do sistema
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se houver uma aba aberta no site, foca nela
      for (const client of clientList) {
        if (new URL(client.url).pathname === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Se não, abre uma nova janela
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Periodic Sync para checar novas vagas em segundo plano
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-new-jobs') {
    event.waitUntil(checkNewJobsAndNotify());
  }
});

// Função que busca novas vagas em segundo plano e avisa o usuário se houver novidades
async function checkNewJobsAndNotify() {
  try {
    const response = await fetch('/api/vagas?bg=true');
    if (!response.ok) return;

    // Duplicar a resposta para ler e salvar no cache
    const data = await response.clone().json();
    const newTotal = data.total || 0;

    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match('/api/vagas?bg=true');

    let notify = false;
    let text = 'Confira as últimas vagas de TI publicadas para Bauru e região!';

    if (cachedResponse) {
      const cachedData = await cachedResponse.json();
      const oldTotal = cachedData.total || 0;
      
      if (newTotal > oldTotal) {
        const diff = newTotal - oldTotal;
        text = `${diff} nova${diff > 1 ? 's vagas foram encontradas' : ' vaga foi encontrada'} desde sua última visita!`;
        notify = true;
      }
    } else {
      // Se for a primeira vez e tiver vagas, avisa o usuário
      if (newTotal > 0) {
        text = `Temos ${newTotal} vagas de TI abertas. Venha conferir!`;
        notify = true;
      }
    }

    // Atualiza o cache do Service Worker com a resposta mais fresca
    await cache.put('/api/vagas?bg=true', response);

    if (notify) {
      await self.registration.showNotification('Novas Vagas de TI!', {
        body: text,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'new-jobs-alert',
        renotify: true,
        data: { url: '/' }
      });
    }
  } catch (error) {
    console.error('Erro ao processar busca em segundo plano:', error);
  }
}
