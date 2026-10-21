import {NextRequest,NextResponse} from 'next/server';
import webPush from 'web-push';
import {getFeed} from '@/lib/sources';
import type {Signal} from '@/lib/types';
import {getAdmin} from '@/lib/glitch-server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;

type Device={endpoint_hash:string;user_id:string;endpoint:string;p256dh:string;auth_key:string;last_signal_id:string|null;last_sent_at:string|null};
type Preference={id:string;topics:string[];min_score:number;notifications_enabled:boolean};
const escapeHtml=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const limit=(s:string,max:number)=>s.length>max?s.slice(0,max-1)+'…':s;
const channel=(s:Signal)=>s.category==='ai'?'tech':s.category==='space'?'science':s.category==='earth'?'climate':s.category;
const suits=(s:Signal,p:Preference)=>{
 const t=p.topics||['all'];
 const category=channel(s);
 return s.score>=(p.min_score||74)&&(t.includes('all')||t.includes(category)||(category==='science'&&t.includes('tech'))||(category==='world'&&t.includes('world')));
};

export async function GET(req:NextRequest){
 const secret=process.env.CRON_SECRET;
 if(!secret||req.headers.get('authorization')!==`Bearer ${secret}`)
  return NextResponse.json({error:'Unauthorized'},{status:401});
 const admin=getAdmin(),hasVapid=Boolean(process.env.VAPID_PUBLIC_KEY&&process.env.VAPID_PRIVATE_KEY);
 const hasPush=Boolean(admin&&hasVapid);
 const redis=process.env.UPSTASH_REDIS_REST_URL,redisKey=process.env.UPSTASH_REDIS_REST_TOKEN;
 const hasTelegram=Boolean(redis&&redisKey&&process.env.TELEGRAM_BOT_TOKEN&&process.env.TELEGRAM_CHAT_ID);
 if(!hasPush&&!hasTelegram)return NextResponse.json({error:'Configure Supabase/VAPID for push or Telegram/Redis for digest delivery'},{status:503});
 const feed=await getFeed();
 const eligible=feed.signals.filter(s=>Number.isFinite(s.score)&&Date.parse(s.timestamp)>Date.now()-24*60*60*1000).sort((a,b)=>b.score-a.score).slice(0,80);
 let telegram=0,push=0,failed=0;
 if(hasTelegram){
  const command=async(args:(string|number)[])=>{
   const r=await fetch(redis!+'/'+args.map(x=>encodeURIComponent(String(x))).join('/'),{headers:{Authorization:'Bearer '+redisKey},cache:'no-store'});
   if(!r.ok)throw Error('Redis unavailable');
   return (await r.json() as {result:unknown}).result;
  };
  try{
   const candidates=eligible.filter(s=>s.score>=74).slice(0,25);
   const unseen=(await Promise.all(candidates.map(async s=>({s,seen:await command(['get','glitch:sent:telegram:'+s.id])})))).filter(x=>!x.seen).slice(0,5).map(x=>x.s);
   if(unseen.length){
    const body='<b>GLITCH RADAR · NEW SIGNALS</b>\n\n'+unseen.map(s=>`• <b>${escapeHtml(s.title)}</b>\n${s.score}/100 · ${escapeHtml(s.source)}\n${escapeHtml(s.url)}`).join('\n\n');
    const sent=await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:process.env.TELEGRAM_CHAT_ID,text:body,parse_mode:'HTML',disable_web_page_preview:true})});
    if(sent.ok){telegram=unseen.length;await Promise.all(unseen.map(s=>command(['set','glitch:sent:telegram:'+s.id,'1','ex',604800])))}
    else failed++;
   }
  }catch{failed++}
 }
 if(hasPush&&admin){
  try{
   webPush.setVapidDetails(process.env.VAPID_SUBJECT||'https://glitch-radar-github.vercel.app',process.env.VAPID_PUBLIC_KEY!,process.env.VAPID_PRIVATE_KEY!);
   const devices:Device[]=[];
   for(let start=0;start<1000;start+=200){
    const {data,error}=await admin.from('push_subscriptions').select('endpoint_hash,user_id,endpoint,p256dh,auth_key,last_signal_id,last_sent_at').range(start,start+199);
    if(error)throw error;
    const batch=(data||[]) as Device[];devices.push(...batch);
    if(batch.length<200)break;
   }
   const profiles=new Map<string,Preference>();
   const ids=[...new Set(devices.map(d=>d.user_id))];
   for(let i=0;i<ids.length;i+=100){
    const {data,error}=await admin.from('user_profiles').select('id,topics,min_score,notifications_enabled').in('id',ids.slice(i,i+100));
    if(error)throw error;
    for(const p of (data||[]) as Preference[])profiles.set(p.id,p);
   }
   // Bound concurrency to protect the function, and skip devices that have received this signal.
   for(let i=0;i<devices.length;i+=8){
    await Promise.all(devices.slice(i,i+8).map(async d=>{
     const pref=profiles.get(d.user_id);
     if(!pref||!pref.notifications_enabled)return;
     if(d.last_sent_at&&Date.now()-Date.parse(d.last_sent_at)<4*3600000)return;
     const match=eligible.find(s=>s.id!==d.last_signal_id&&(!d.last_sent_at||Date.parse(s.timestamp)>Date.parse(d.last_sent_at))&&suits(s,pref));
     if(!match)return;
     try{
      await webPush.sendNotification({endpoint:d.endpoint,keys:{p256dh:d.p256dh,auth:d.auth_key}},
       JSON.stringify({title:'GLITCH RADAR · '+match.score+'/100',body:limit(match.title,140),tag:'glitch-'+match.id,url:'/?s=top'}),
       {TTL:3600,urgency:'normal',timeout:8000});
      const {error}=await admin.from('push_subscriptions').update({last_signal_id:match.id,last_sent_at:new Date().toISOString()}).eq('endpoint_hash',d.endpoint_hash).eq('user_id',d.user_id);
      if(error)failed++;else push++;
     }catch(e){
      failed++;
      const code=(e as {statusCode?:number}).statusCode;
      if(code===404||code===410)await admin.from('push_subscriptions').delete().eq('endpoint_hash',d.endpoint_hash);
     }
    }));
   }
  }catch{failed++}
 }
 return NextResponse.json({ok:true,push,telegram,failed,channel:'personalized',schedule:'Vercel project cron'});
}
