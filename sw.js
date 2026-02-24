// 这是 PWA 的核心缓存引擎，有了它，手机才会认为这是一个“可安装的App”
const CACHE_NAME = 'cineflow-cache-v1.0';

// 需要缓存的基础文件列表
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// 1. 安装 Service Worker 并缓存核心文件
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  // 强制立即接管控制权
  self.skipWaiting();
});

// 2. 激活并清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. 拦截网络请求，优先使用缓存（加快启动速度并在弱网环境下提供支持）
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果缓存里有，直接返回缓存
        if (response) {
          return response;
        }
        // 如果缓存里没有，发起网络请求
        return fetch(event.request);
      })
  );
});