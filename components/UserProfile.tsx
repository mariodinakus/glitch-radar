'use client';
import {useEffect,useState} from 'react';
import {getGlitchClient,TOPICS,type GlitchProfile} from '@/lib/glitch-auth';
import type {User} from '@supabase/supabase-js';

const DEFAULT:Omit<GlitchProfile,'id'>={display_name:'',topics:['all'],min_score:74,notifications_enabled:true};
export default function UserProfile(){
 const [open,setOpen]=useState(false);
 const [user,setUser]=useState<User|null>(null);
 const [profile,setProfile]=useState<Omit<GlitchProfile,'id'>>(DEFAULT);
 const [email,setEmail]=useState('');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [loading,setLoading]=useState(true);
 const sb=getGlitchClient();
 useEffect(()=>{
  if(!sb){setLoading(false);return}
  let active=true;
  void sb.auth.getUser().then(({data})=>{if(active)setUser(data.user)}).finally(()=>{if(active)setLoading(false)});
  const {data:{subscription}}=sb.auth.onAuthStateChange((_event,session)=>{if(active){setUser(session?.user||null);setMessage('')}});
  const show=()=>setOpen(true);
  window.addEventListener('glitch-open-profile',show);
  return()=>{active=false;subscription.unsubscribe();window.removeEventListener('glitch-open-profile',show)};
 },[sb]);
 useEffect(()=>{
  if(!sb||!user){setProfile(DEFAULT);return}
  let active=true;
  void sb.from('user_profiles').select('display_name,topics,min_score,notifications_enabled').eq('id',user.id).maybeSingle()
   .then(({data,error})=>{
    if(!active)return;
    if(error){setMessage('Profile storage is not ready. The Supabase migration may be missing.');return}
    if(data)setProfile({
     display_name:String(data.display_name||''),
     topics:Array.isArray(data.topics)?data.topics:['all'],
     min_score:Number(data.min_score||74),
     notifications_enabled:data.notifications_enabled!==false
    });
   });
  return()=>{active=false};
 },[sb,user?.id]);
 const signIn=async(e:React.FormEvent)=>{
  e.preventDefault();if(!sb)return;setBusy(true);setMessage('');
  try{
   const trimmed=email.trim().toLowerCase();
   if(trimmed.length>254||!/^\S+@\S+\.\S+$/.test(trimmed))throw Error('Enter a valid email address.');
   const {error}=await sb.auth.signInWithOtp({email:trimmed,options:{emailRedirectTo:window.location.origin+'/' }});
   if(error)throw error;
   setMessage('Check your email for your secure sign-in link. This also creates your profile.');
  }catch(e){setMessage(e instanceof Error?e.message:'Could not send login email.')}
  finally{setBusy(false)}
 };
 const save=async()=>{
  if(!sb||!user)return;setBusy(true);setMessage('');
  try{
   const payload={display_name:profile.display_name.trim().slice(0,50),
    topics:profile.topics, min_score:profile.min_score,
    notifications_enabled:profile.notifications_enabled};
   const {error}=await sb.from('user_profiles').update(payload).eq('id',user.id);
   if(error)throw error;
   setMessage('Profile saved. Preferences apply to your notification feed.');
   window.dispatchEvent(new CustomEvent('glitch-profile-updated'));
  }catch(e){setMessage(e instanceof Error?e.message:'Could not save profile.')}
  finally{setBusy(false)}
 };
 const secureSignOut=async()=>{
  if(!sb)return;
  setBusy(true);setMessage('');
  try{
   const {data:{session}}=await sb.auth.getSession();
   if(session&&'serviceWorker' in navigator){
    const reg=await navigator.serviceWorker.getRegistration('/sw.js');
    const sub=await reg?.pushManager.getSubscription();
    if(sub){
     const res=await fetch('/api/push/subscribe',{method:'DELETE',headers:{Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({endpoint:sub.endpoint})});
     if(!res.ok)throw Error('Could not disable notifications on this device. Disable alerts before signing out.');
     await sub.unsubscribe();
    }
   }
   const {error}=await sb.auth.signOut();if(error)throw error;
   setProfile(DEFAULT);setMessage('Signed out. This phone will no longer receive your personal alerts.');
  }catch(e){setMessage(e instanceof Error?e.message:'Could not sign out.')}
  finally{setBusy(false)}
 };
 const changeTopic=(id:string)=>{
  setProfile(p=>{
   if(id==='all')return {...p,topics:['all']};
   const topics=p.topics.filter(t=>t!=='all');
   const updated=topics.includes(id)?topics.filter(t=>t!==id):[...topics,id];
   return {...p,topics:updated.length?updated:['all']};
  });
 };
 return <div className="app-profile-wrap">
  <button type="button" className={'app-control-button app-profile-trigger'+(user?' active':'')} title="My profile" aria-label="My GLITCH profile" aria-expanded={open} onClick={()=>{setOpen(o=>!o);setMessage('')}}>
   <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3-7 8-7s8 3 8 7"/></svg>
   <span className="app-control-label">{user?(profile.display_name||'Profile'):'Sign in'}</span>
  </button>
  {open&&<div className="app-profile-panel" role="dialog" aria-label="Your GLITCH RADAR profile">
   <div className="app-alert-panel-title"><strong>YOUR RADAR PROFILE</strong><button type="button" aria-label="Close profile" onClick={()=>setOpen(false)}>×</button></div>
   {loading?<p>Loading account…</p>:!sb?<p>Account registration is not configured yet. A Supabase project and its public environment keys are required. News browsing remains available.</p>:!user?
    <form onSubmit={signIn} className="app-profile-form">
     <p>Create your personal GLITCH account or sign in with a secure email link. No password required.</p>
     <label htmlFor="glitch-email">Email address</label>
     <input id="glitch-email" autoComplete="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com"/>
     <button type="submit" className="app-alert-action" disabled={busy}>{busy?'Sending…':'Continue with email'}</button>
     <small>Your saved settings belong to your account, not another visitor of this device.</small>
    </form>:
    <div className="app-profile-form">
     <p className="app-profile-email">{user.email}</p>
     <label htmlFor="glitch-name">Display name</label>
     <input id="glitch-name" maxLength={50} placeholder="Your name" value={profile.display_name} onChange={e=>setProfile(p=>({...p,display_name:e.target.value}))}/>
     <label>Topics for your alerts</label>
     <div className="app-profile-topics">{TOPICS.map(t=><label key={t.id}><input type="checkbox" checked={profile.topics.includes(t.id)} onChange={()=>changeTopic(t.id)}/><span>{t.label}</span></label>)}</div>
     <label htmlFor="glitch-min-score">Minimum radar score <b>{profile.min_score}/100</b></label>
     <input id="glitch-min-score" type="range" min={60} max={95} step={1} value={profile.min_score} onChange={e=>setProfile(p=>({...p,min_score:Number(e.target.value)}))}/>
     <label className="app-profile-switch"><input type="checkbox" checked={profile.notifications_enabled} onChange={e=>setProfile(p=>({...p,notifications_enabled:e.target.checked}))}/><span>Allow important-news notifications</span></label>
     <button type="button" className="app-alert-action" disabled={busy} onClick={save}>{busy?'Saving…':'Save preferences'}</button>
     <button type="button" className="app-profile-signout" disabled={busy} onClick={()=>void secureSignOut()}>Sign out</button>
    </div>}
   {message&&<p role="status" className="app-alert-message">{message}</p>}
  </div>}
 </div>;
}
