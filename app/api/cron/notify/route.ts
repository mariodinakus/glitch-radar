import {NextRequest,NextResponse} from 'next/server';
import {getFeed} from '@/lib/sources';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const escapeHtml=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
export async function GET(req:NextRequest){
 const key=process.env.CRON_SECRET;
 if(!key||req.headers.get('authorization')!==`Bearer ${key}`)return NextResponse.json({error:'Unauthorized'}, {status:401});
 const token=process.env.TELEGRAM_BOT_TOKEN,chatId=process.env.TELEGRAM_CHAT_ID,redis=process.env.UPSTASH_REDIS_REST_URL,redisToken=process.env.UPSTASH_REDIS_REST_TOKEN;
 if(!token||!chatId||!redis||!redisToken)return NextResponse.json({error:'Configure TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN before enabling delivery.'},{status:503});
 try{const feed=await getFeed();const cutoff=Date.now()-86400000;const eligible=feed.signals.filter(x=>x.score>=74&&Date.parse(x.timestamp)>cutoff).slice(0,30);
 const seen=await Promise.all(eligible.map(async s=>{const r=await fetch(`${redis}/get/${encodeURIComponent('glitch:sent:'+s.id)}`,{headers:{Authorization:`Bearer ${redisToken}`},cache:'no-store'});if(!r.ok)throw Error('Redis unavailable');return {s,was:(await r.json() as {result?:string}).result}}));const fresh=seen.filter(x=>!x.was).slice(0,5);
 if(fresh.length===0)return NextResponse.json({ok:true,sent:0,reason:'No fresh qualifying signals'});
 const body='<b>GLITCH · NEW SIGNALS</b>\n\n'+fresh.map(({s})=>`• <b>${escapeHtml(s.title)}</b>\n${s.score}/100 · ${escapeHtml(s.source)}\n${escapeHtml(s.url)}`).join('\n\n');
 const send=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:chatId,text:body,parse_mode:'HTML',disable_web_page_preview:true})});if(!send.ok)throw Error(`Telegram returned ${send.status}`);
 await Promise.all(fresh.map(async ({s})=>{const r=await fetch(`${redis}/set/${encodeURIComponent('glitch:sent:'+s.id)}/1/ex/604800`,{headers:{Authorization:`Bearer ${redisToken}`}});if(!r.ok)throw Error('Failed to store notification state')}));return NextResponse.json({ok:true,sent:fresh.length});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Delivery failed'},{status:502})}
}
