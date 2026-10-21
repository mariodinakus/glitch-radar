'use client';
import {useCallback,useEffect,useState} from 'react';
import {getGlitchClient} from '@/lib/glitch-auth';

type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
type AlertStatus='checking'|'on'|'off'|'unsupported';
function decodeKey(str:string):Uint8Array<ArrayBuffer>{
 const base64=str.replace(/-/g,'+').replace(/_/g,'/');
 const raw=atob(base64.padEnd(Math.ceil(base64.length/4)*4,'='));
 const key=new Uint8Array(new ArrayBuffer(raw.length));
 for(let i=0;i<raw.length;i++)key[i]=raw.charCodeAt(i);
 return key;
}
export default function MobileAppControls(){
 const [installEvent,setInstallEvent]=useState<InstallEvent|null>(null);
 const [installed,setInstalled]=useState(false);
 const [ios,setIos]=useState(false);
 const [open,setOpen]=useState(false);
 const [push,setPush]=useState<AlertStatus>('checking');
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 const [updates,setUpdates]=useState(false);
 useEffect(()=>{
  setInstalled(window.matchMedia('(display-mode: standalone)').matches||('standalone' in navigator&&(navigator as Navigator&{standalone?:boolean}).standalone===true));
  setIos(/iPad|iPhone|iPod/.test(navigator.userAgent));
  const before=(e:Event)=>{e.preventDefault();setInstallEvent(e as InstallEvent)};
  const onInstalled=()=>{setInstalled(true);setInstallEvent(null)};
  window.addEventListener('beforeinstallprompt',before);
  window.addEventListener('appinstalled',onInstalled);
  if(!('serviceWorker' in navigator)){setPush('unsupported');return()=>{window.removeEventListener('beforeinstallprompt',before);window.removeEventListener('appinstalled',onInstalled)}}
  let active=true;let interval:ReturnType<typeof setInterval>|undefined;
  let cleanup=()=>{};
  const onController=()=>{
   if(sessionStorage.getItem('glitch-sw-reloaded')==='yes')return;
   sessionStorage.setItem('glitch-sw-reloaded','yes');
   location.reload();
  };
  navigator.serviceWorker.addEventListener('controllerchange',onController);
  navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).then(async reg=>{
   if(!active)return;
   const check=()=>{if(document.visibilityState==='visible'&&navigator.onLine)reg.update().catch(()=>{})};
   const refresh=async()=>{try{
    if(!('Notification' in window)||!('PushManager' in window)){setPush('unsupported');return}
    const subscription=await reg.pushManager.getSubscription();
    if(active)setPush(subscription?'on':'off');
   }catch{if(active)setPush('off')}};
   const onVisible=()=>{if(document.visibilityState==='visible'){check();void refresh()}};
   document.addEventListener('visibilitychange',onVisible);
   window.addEventListener('online',check);
   interval=setInterval(check,15*60*1000);
   await refresh();
   if(reg.waiting){reg.waiting.postMessage({type:'SKIP_WAITING'});setUpdates(true)}
   reg.addEventListener('updatefound',()=>{const sw=reg.installing;sw?.addEventListener('statechange',()=>{if(sw.state==='installed'&&navigator.serviceWorker.controller){setUpdates(true);sw.postMessage({type:'SKIP_WAITING'})}})});
   cleanup=()=>{document.removeEventListener('visibilitychange',onVisible);window.removeEventListener('online',check);if(interval)clearInterval(interval)};
  }).catch(()=>{if(active)setPush('unsupported')});
  return()=>{active=false;cleanup();navigator.serviceWorker.removeEventListener('controllerchange',onController);window.removeEventListener('beforeinstallprompt',before);window.removeEventListener('appinstalled',onInstalled)};
 },[]);
 const install=useCallback(async()=>{
  if(installEvent){await installEvent.prompt();const result=await installEvent.userChoice;if(result.outcome==='accepted')setInstallEvent(null)}
  else setMessage(ios?'In Safari, tap Share → Add to Home Screen, then open GLITCH RADAR from its icon.':'Open your browser menu → Install app / Add to Home screen.');
 },[installEvent,ios]);
 const togglePush=useCallback(async()=>{
  setBusy(true);setMessage('');
  try{
   if(!('serviceWorker' in navigator)||!('Notification' in window)||!('PushManager' in window))throw Error('Push requires a supported browser or an installed Home Screen app on iPhone.');
   const sb=getGlitchClient();
   if(!sb){window.dispatchEvent(new Event('glitch-open-profile'));throw Error('Accounts must be configured before enabling personal alerts.')}
   const {data:{session}}=await sb.auth.getSession();
   if(!session){window.dispatchEvent(new Event('glitch-open-profile'));throw Error('Sign in to your profile first, then activate alerts.')}
   const reg=await navigator.serviceWorker.ready;
   const existing=await reg.pushManager.getSubscription();
   const bearer={'Authorization':'Bearer '+session.access_token,'Content-Type':'application/json'};
   if(existing){
    const response=await fetch('/api/push/subscribe',{method:'DELETE',headers:bearer,body:JSON.stringify({endpoint:existing.endpoint})});
    if(!response.ok)throw Error('Could not remove your device from the notification server.');
    await existing.unsubscribe();setPush('off');setMessage('Push disabled for this device.');return;
   }
   const conf=await fetch('/api/push/config',{cache:'no-store'}).then(r=>r.json()) as {enabled:boolean;publicKey?:string};
   if(!conf.enabled||!conf.publicKey)throw Error('Push delivery needs VAPID and Supabase server configuration.');
   const permission=await Notification.requestPermission();
   if(permission!=='granted')throw Error('Notifications blocked. Check device notification settings.');
   const sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decodeKey(conf.publicKey)});
   const response=await fetch('/api/push/subscribe',{method:'POST',headers:bearer,body:JSON.stringify({subscription:sub.toJSON()})});
   if(!response.ok){await sub.unsubscribe();throw Error('Could not link this device to your GLITCH profile.')}
   setPush('on');setMessage('Push alerts activated. Change categories and sensitivity in your profile.');
  }catch(e){setMessage(e instanceof Error?e.message:'Could not update notifications.')}
  finally{setBusy(false)}
 },[]);
 return <div className="app-controls">
  {(!installed||installEvent)&&<button type="button" className="app-control-button app-install" onClick={install} title="Install GLITCH RADAR">↓ <span>Install</span></button>}
  <button type="button" className={'app-control-button'+(push==='on'?' active':'')} onClick={()=>{setOpen(o=>!o);setMessage('')}} aria-label="Notification settings" aria-expanded={open} title="Notification settings">
   <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><span className="app-control-label">Alerts</span>
  </button>
  {open&&<div className="app-alert-panel" role="dialog" aria-label="GLITCH RADAR alerts">
   <div className="app-alert-panel-title"><strong>PERSONAL ALERTS</strong><button onClick={()=>setOpen(false)} aria-label="Close">×</button></div>
   <p>Sign in to save your notification topics, then allow the app to send major GLITCH signals to this phone.</p>
   <button className="app-alert-action" onClick={togglePush} disabled={busy||push==='checking'||push==='unsupported'}>{busy?'Updating…':push==='on'?'Disable alerts on this phone':push==='unsupported'?'Push unavailable in this browser':'Enable push alerts'}</button>
   <small>{push==='on'?'This browser has a push subscription.':'Notifications are disabled on this device.'}</small>
   {message&&<p className="app-alert-message" role="status">{message}</p>}
   {updates&&<p className="app-alert-message">New app version found. Applying the update.</p>}
   <button className="app-alert-install" onClick={()=>window.dispatchEvent(new Event('glitch-open-profile'))}>Manage my profile →</button>
   {!installed&&<button className="app-alert-install" onClick={install}>Install on my phone →</button>}
  </div>}
 </div>;
}
