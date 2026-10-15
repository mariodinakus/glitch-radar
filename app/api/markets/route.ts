import {NextResponse} from 'next/server';
import {normalizeKalshi,normalizePolymarket,type MarketQuote,type MarketsPayload,type VenueState} from '@/lib/markets';
export const runtime='nodejs';
const poly='https://gamma-api.polymarket.com/events?active=true&closed=false&order=volume_24hr&ascending=false&limit=80';
const kalshi='https://external-api.kalshi.com/trade-api/v2/markets?status=open&mve_filter=exclude&limit=400';
async function getJSON(url:string):Promise<unknown>{
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),9000);
 try{const r=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json','User-Agent':'GLITCH-World-Intelligence/7.0'},next:{revalidate:900}});
  if(!r.ok)throw new Error('Source returned HTTP '+r.status);
  return await r.json();
 }finally{clearTimeout(timer)}
}
const cleanError=(v:unknown)=>v instanceof Error?(v.name==='AbortError'?'Source timed out':v.message.slice(0,90)):'Source unavailable';
export async function GET(){
 const providers=[{name:'polymarket' as const,url:poly,normalize:normalizePolymarket,note:'Top 80 active events by 24h volume (sample)'},{name:'kalshi' as const,url:kalshi,normalize:normalizeKalshi,note:'Up to 400 open, non-combination markets (sample, not global volume ranking)'}];
 const results=await Promise.allSettled(providers.map(async p=>p.normalize(await getJSON(p.url))));
 const quotes:MarketQuote[]=[];const venues:VenueState[]=[];
 results.forEach((result,i)=>{const p=providers[i];if(result.status==='fulfilled'){quotes.push(...result.value);venues.push({venue:p.name,status:'ok',count:result.value.length,sampleNote:p.note})}else venues.push({venue:p.name,status:'unavailable',count:0,error:cleanError(result.reason),sampleNote:p.note})});
 const payload:MarketsPayload={updatedAt:new Date().toISOString(),quotes,venues,methodology:{el:'Οι τιμές συμβολαίων ΔΕΝ είναι στατιστικά βαθμονομημένες προβλέψεις. Polymarket: τιμή αποτελέσματος YES. Kalshi: μέσος διαθέσιμης τιμής bid/ask ή τελευταίας συναλλαγής. Οι αγορές δεν είναι απαραιτήτως συγκρίσιμες και τα δείγματα δεν περιλαμβάνουν ολόκληρες τις πλατφόρμες. Δεν υποστηρίζονται συναλλαγές.',en:'Contract prices are NOT calibrated forecasts. Polymarket: YES outcome price. Kalshi: midpoint of available bid/ask or last trade. Contracts are not necessarily comparable and the selected markets are not exchange-wide. No trading is supported.'}};
 return NextResponse.json(payload,{headers:{'Cache-Control':'public, s-maxage=900, stale-while-revalidate=900','X-Content-Type-Options':'nosniff'}});
}
