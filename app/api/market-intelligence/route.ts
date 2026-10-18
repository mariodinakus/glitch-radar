import {NextResponse} from 'next/server';
import {normalizeKalshi,normalizePolymarket,type MarketQuote,type VenueState} from '@/lib/markets';
import {relevantMarketQuotes} from '@/lib/market-focus';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const basePoly='https://gamma-api.polymarket.com/events?active=true&closed=false&limit=100&order=volume24hr&ascending=false';
const kalshi='https://api.elections.kalshi.com/trade-api/v2/events?status=open&with_nested_markets=true&limit=200';
const allowed=new Set(['gamma-api.polymarket.com','api.elections.kalshi.com']);
async function json(url:string):Promise<unknown>{
 const u=new URL(url);if(u.protocol!=='https:'||!allowed.has(u.hostname))throw Error('Unsupported provider');
 const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),11000);
 try{const res=await fetch(url,{signal:ctl.signal,next:{revalidate:600},headers:{Accept:'application/json','User-Agent':'GLITCH World Intelligence 12 (public-data research)'}});
  if(!res.ok)throw Error('Provider HTTP '+res.status);return res.json();
 }finally{clearTimeout(t)}
}
type Obj={events?:unknown[];cursor?:string};
async function fromPoly(offset:number){return normalizePolymarket(await json(basePoly+'&offset='+offset));}
async function fromKalshi(){
 const first=await json(kalshi) as Obj;
 const events=Array.isArray(first.events)?[...first.events]:[];
 if(first.cursor&&/^[\w=+/.-]{1,300}$/.test(first.cursor)){
  try{const extra=await json(kalshi+'&cursor='+encodeURIComponent(first.cursor)) as Obj;
   if(Array.isArray(extra.events))events.push(...extra.events);
  }catch{/* first page is still a valid sample */}
 }
 return normalizeKalshi({events});
}
const reason=(e:unknown)=>e instanceof Error?e.message.slice(0,140):'Source unavailable';
export async function GET(){
 const results=await Promise.allSettled([fromPoly(0),fromPoly(100),fromPoly(200),fromKalshi()]);
 const venues:VenueState[]=[];const all:MarketQuote[]=[];
 for(const venue of ['polymarket','kalshi'] as const){
  const pages=venue==='polymarket'?results.slice(0,3):results.slice(3);
  const ok=pages.filter((v):v is PromiseFulfilledResult<MarketQuote[]>=>v.status==='fulfilled');
  const sample=ok.flatMap(x=>x.value);
  all.push(...sample);
  venues.push({venue,status:ok.length?'ok':'unavailable',count:sample.length,
   error:ok.length?undefined:pages.filter((x):x is PromiseRejectedResult=>x.status==='rejected').map(x=>reason(x.reason)).join('; '),
   sampleNote:venue==='kalshi'?'First two available event pages':'Three active-event volume-ranked pages'});
 }
 const quotes=relevantMarketQuotes(all).slice(0,110);
 return NextResponse.json({updatedAt:new Date().toISOString(),quotes,venues,coverage:'Non-sports title-match sample, not exhaustive markets',disclaimer:'YES contract prices are not calibrated predictions; settlement rules, liquidity and stale quotes differ. No trading.'},
  {headers:{'Cache-Control':'public, s-maxage=600, stale-while-revalidate=600'}});
}
