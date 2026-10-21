'use client';
import {useCallback,useEffect,useState} from 'react';

type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
type AlertStatus='checking'|'available'|'on'|'off'|'unsupported';
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
  const onController=()=>{
   if(sessionStorage.getItem('glitch-sw-reloaded')==='yes')return;
   sessionStorage.setItem('glitch-sw-reloaded','yes');
   window.location.reload();
  };
  navigator.serviceWorker.addEventListener('controllerchange',onController);
  navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).then(async reg=>{
   if(!active)return;
   const check=()=>{if(document.visibilityState==='visible'&&navigator.onLine)reg.update().catch(()=>{})};
   const onVisible=()=>{if(document.visibilityState==='visible'){check();refresh()}};
   document.addEventListener('visibilitychange',onVisible);
   window.addEventListener('online',check);
   interval=setInterval(check,15*60*1000);
   const refresh=async()=>{try{
    if(!('Notification' in window)||!('PushManager' in window)){setPush('unsupported');return}
    const subscription=await reg.pushManager.getSubscription();
    if(active)setPush(subscription?'on':'off');
   }catch{if(active)setPush('off')}};
   await refresh();
   if(reg.waiting){reg.waiting.postMessage({type:'SKIP_WAITING'});setUpdates(true)}
   reg.addEventListener('updatefound',()=>{const sw=reg.installing;sw?.addEventListener('statechange',()=>{if(sw.state==='installed'&&navigator.serviceWorker.controller){setUpdates(true);sw.postMessage({type:'SKIP_WAITING'})}})});
   // Keep cleanup handlers with this registration rather than attaching on each update.
   cleanup=()=>{document.removeEventListener('visibilitychange',onVisible);window.removeEventListener('online',check);if(interval)clearInterval(interval)};
  }).catch(()=>{if(active)setPush('unsupported')});
  let cleanup=()=>{};
  return()=>{active=false;cleanup();navigator.serviceWorker.removeEventListener('controllerchange',onController);window.removeEventListener('beforeinstallprompt',before);window.removeEventListener('appinstalled',onInstalled)};
 },[]);
 const install=useCallback(async()=>{
  if(installEvent){await installEvent.prompt();const result=await installEvent.userChoice;if(result.outcome==='accepted')setInstallEvent(null)}
  else setMessage(ios?'In Safari, tap Share → Add to Home Screen, then open GLITCH RADAR from its icon.':'Open your browser menu → Install app / Add to Home screen.');
 },[installEvent,ios]);
 const togglePush=useCallback(async()=>{
  setBusy(true);setMessage('');
  try{
   if(!('serviceWorker' in navigator)||!('Notification' in window)||!('PushManager' in window))throw Error('Push is not supported here. On iPhone, install the app from Safari first.');
   const reg=await navigator.serviceWorker.ready;
   const existing=await reg.pushManager.getSubscription();
   if(existing){
    await fetch('/api/push/subscribe',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({endpoint:existing.endpoint})});
    await existing.unsubscribe();setPush('off');setMessage('Push alerts disabled on this device.');return;
   }
   const conf=await fetch('/api/push/config',{cache:'no-store'}).then(r=>r.json()) as {enabled:boolean;publicKey?:string};
   if(!conf.enabled||!conf.publicKey)throw Error('Push delivery is not configured on the server yet. The app itself still works.');
   const permission=await Notification.requestPermission();
   if(permission!=='granted')throw Error('Notifications are blocked. Enable them in your device settings.');
   const sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decodeKey(conf.publicKey)});
   const result=await fetch('/api/push/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({subscription:sub.toJSON()})});
   if(!result.ok){await sub.unsubscribe();throw Error('Could not save this device for push alerts.')}
   setPush('on');setMessage('Alerts enabled for important GLITCH signals.');
  }catch(e){setMessage(e instanceof Error?e.message:'Could not change notifications.')}
  finally{setBusy(false)}
 },[]);
 return <div className="app-controls">
  {(!installed||installEvent)&&<button type="button" className="app-control-button app-install" onClick={install} title="Install GLITCH RADAR">↓ <span>Install</span></button>}
  <button type="button" className={'app-control-button'+(push==='on'?' active':'')} onClick={()=>{setOpen(o=>!o);setMessage('')}} aria-label="Notification settings" aria-expanded={open} title="Notification settings">
   <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><span className="app-control-label">Alerts</span>
  </button>
  {open&&<div className="app-alert-panel" role="dialog" aria-label="GLITCH RADAR alerts">
   <div className="app-alert-panel-title"><strong>GLITCH RADAR</strong><button onClick={()=>setOpen(false)} aria-label="Close">×</button></div>
   <p>Install the app and get alerts when the radar detects major news signals.</p>
   <button className="app-alert-action" onClick={togglePush} disabled={busy||push==='checking'||push==='unsupported'}>{busy?'Updating…':push==='on'?'Disable push alerts':push==='unsupported'?'Push unavailable on this browser':'Enable push alerts'}</button>
   <small>{push==='on'?'Push subscribed on this device.':push==='off'?'Push notifications are off.':push==='checking'?'Checking this device…':'Use a supported browser or installed app.'}</small>
   {message&&<p className="app-alert-message" role="status">{message}</p>}
   {updates&&<p className="app-alert-message">New app version detected; applying the update.</p>}
   {!installed&&<button className="app-alert-install" onClick={install}>How to install on my phone →</button>}
  </div>}
 </div>;
}
