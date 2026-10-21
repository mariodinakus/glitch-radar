/* GLITCH RADAR service worker: fast online app, safe offline fallback, push and seamless releases. */
const VERSION='glitch-radar-v13';
const SHELL=['/icon.svg','/manifest.webmanifest'];
self.addEventListener('install',event=>{
 event.waitUntil(Promise.allSettled(SHELL.map(async path=>{
  const cache=await caches.open(VERSION);
  const response=await fetch(path,{cache:'reload'});
  if(response.ok)await cache.put(path,response);
 })).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('glitch-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 const path=new URL(req.url).pathname;
 // Never cache news, API responses, HTML or Next.js build chunks across deploys.
 if(req.mode==='navigate'){
  event.respondWith(fetch(req).catch(async()=>{
   const clients=await self.clients.matchAll({type:'window'});
   if(clients.length)return new Response('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>GLITCH RADAR</title><body style="background:#090b13;color:#f3d58a;font:16px system-ui;padding:12vh 7%"><h1>GLITCH RADAR</h1><p>You appear to be offline. Reconnect to load the latest intelligence.</p><button onclick="location.reload()">Retry</button></body>',{headers:{'Content-Type':'text/html; charset=utf-8'}});
   return new Response('GLITCH RADAR is offline',{status:503,headers:{'Content-Type':'text/plain'}});
  }));
 } else if(SHELL.includes(path)){
  event.respondWith(fetch(req).then(async response=>{if(response.ok){const c=await caches.open(VERSION);c.put(path,response.clone())}return response}).catch(()=>caches.match(req)));
 }
});
self.addEventListener('push',event=>{
 let data={};
 try{data=event.data?event.data.json():{}}catch{}
 const title=typeof data.title==='string'?data.title:'GLITCH RADAR · New signal';
 const body=typeof data.body==='string'?data.body:'A new signal is ready.';
 const path=typeof data.url==='string'&&data.url.startsWith('/')&&!data.url.startsWith('//')?data.url:'/';
 event.waitUntil(self.registration.showNotification(title,{body,icon:'/api/icon-v2/192?v=5',badge:'/api/icon-v2/192?v=5',tag:typeof data.tag==='string'?data.tag:'glitch-signal',renotify:false,data:{url:path}}));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const path=event.notification.data?.url||'/';
 event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{
  const existing=clients.find(c=>new URL(c.url).origin===self.location.origin);
  if(existing){await existing.navigate(path);return existing.focus()}
  return self.clients.openWindow(path);
 }));
});
