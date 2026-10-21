import {NextRequest,NextResponse} from 'next/server';
import webPush from 'web-push';
import {getFeed} from '@/lib/sources';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const escapeHtml=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const cap=(s:string,n:number)=>s.length>n?s.slice(0,n-1)+'…':s;
export async function GET(req:NextRequest){
 const key=process.env.CRON_SECRET;
 if(!key||req.headers.get('authorization')!==`Bearer ${key}`)return NextResponse.json({error:'Unauthorized'},{status:401});
 const redis=process.env.UPSTASH_REDIS_REST_URL,redisToken=process.env.UPSTASH_REDIS_REST_TOKEN;
 const telegramReady=Boolean(process.env.TELEGRAM_BOT_TOKEN&&process.env.TELEGRAM_CHAT_ID);
 const pushReady=Boolean(process.env.VAPID_PUBLIC_KEY&&process.env.VAPID_PRIVATE_KEY);
 if(!redis||!redisToken||(!telegramReady&&!pushReady))return NextResponse.json({error:'Configure Upstash Redis and at least one notification channel (Telegram or VAPID keys)'},{status:503});
 const headers={Authorization:'Bearer '+redisToken};
 const command=async(parts:(string|number)[])=>{
  const r=await fetch(redis+'/'+parts.map(x=>encodeURIComponent(String(x))).join('/'),{headers,cache:'no-store'});
  if(!r.ok)throw Error('Redis unavailable');
  const json=await r.json() as {result:unknown};
  return json.result;
 };
 const freshBy=(signals:{id:string}[],channel:string,limit:number)=>Promise.all(signals.map(async s=>({s,was:await command(['get','glitch:sent:'+channel+':'+s.id])}))).then(rows=>rows.filter(x=>!x.was).slice(0,limit).map(x=>x.s.id));
 try{
  const feed=await getFeed();
  const cutoff=Date.now()-86400000;
  const eligible=feed.signals.filter(s=>s.score>=74&&Date.parse(s.timestamp)>cutoff).slice(0,30);
  if(!eligible.length)return NextResponse.json({ok:true,telegram:0,push:0,reason:'No qualifying signals'});
  let telegram=0,push=0;
  if(telegramReady){
   const ids=await freshBy(eligible,'telegram',5);
   const candidates=eligible.filter(s=>ids.includes(s.id));
   if(candidates.length){
    const body='<b>GLITCH · NEW SIGNALS</b>\n\n'+candidates.map(s=>`• <b>${escapeHtml(s.title)}</b>\n${s.score}/100 · ${escapeHtml(s.source)}\n${escapeHtml(s.url)}`).join('\n\n');
    const send=await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:process.env.TELEGRAM_CHAT_ID,text:body,parse_mode:'HTML',disable_web_page_preview:true})});
    if(send.ok){telegram=candidates.length;await Promise.all(candidates.map(s=>command(['set','glitch:sent:telegram:'+s.id,'1','ex',604800])))}
   }
  }
  if(pushReady){
   webPush.setVapidDetails(process.env.VAPID_SUBJECT||'https://glitch-radar-github.vercel.app',process.env.VAPID_PUBLIC_KEY!,process.env.VAPID_PRIVATE_KEY!);
   const ids=await freshBy(eligible,'push',4);
   const candidates=eligible.filter(s=>ids.includes(s.id));
   if(candidates.length){
    const rows=await command(['smembers','glitch:push:devices']);
    const keys=Array.isArray(rows)?(rows as string[]).slice(0,100):[];
    const subs=await Promise.all(keys.map(async hash=>({hash,data:await command(['get','glitch:push:sub:'+hash])})));
    const valid=subs.filter(r=>typeof r.data==='string');
    const dead=subs.filter(r=>typeof r.data!=='string').map(r=>r.hash);
    if(dead.length)await Promise.all(dead.map(hash=>command(['srem','glitch:push:devices',hash])));
    const strongest=candidates[0];
    const payload=JSON.stringify({title:'GLITCH RADAR · '+strongest.score+'/100',body:cap(strongest.title,140),tag:'glitch-signal',url:'/?s=top'});
    const outcomes=await Promise.allSettled(valid.map(async ({hash,data})=>{
     try{await webPush.sendNotification(JSON.parse(data as string),payload,{TTL:3600,urgency:'normal'});return 'sent'}
     catch(e){const code=(e as {statusCode?:number}).statusCode;if(code===404||code===410){await command(['del','glitch:push:sub:'+hash]);await command(['srem','glitch:push:devices',hash])}return 'failed'}
    }));
    push=outcomes.filter(x=>x.status==='fulfilled'&&x.value==='sent').length;
    if(push>0)await Promise.all(candidates.map(s=>command(['set','glitch:sent:push:'+s.id,'1','ex',604800])));
   }
  }
  return NextResponse.json({ok:true,telegram,push,frequency:'daily on current Vercel cron'});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Delivery failed'},{status:502})}
}
