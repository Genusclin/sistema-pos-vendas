// Service Worker para cache offline
const CACHE_NAME = 'pos-vendas-v1';
const URLS_TO_CACHE = [
    '/',
    '/login.html',
    '/admin.html',
    '/posvenda.html',
    '/style.css',
    '/admin-menu.css',
    '/Logo.png',
    '/fundo.jpg'
];

// Instala o Service Worker e cacheia os arquivos
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Cache aberto');
                return cache.addAll(URLS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Ativa e limpa caches antigos
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Removendo cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Intercepta requisições e serve do cache se offline
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Se encontrou no cache, retorna
                if (response) {
                    return response;
                }
                // Senão, tenta buscar da rede
                return fetch(event.request).catch(() => {
                    // Se falhar e for uma página, retorna página offline
                    if (event.request.headers.get('accept').includes('text/html')) {
                        return caches.match('/offline.html');
                    }
                });
            })
    );
});