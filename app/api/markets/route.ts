import {NextResponse} from 'next/server';
import {normalizeKalshi,normalizePolymarket,type VenueState,type MarketQuote,type MarketsPayload} from '@/lib/markets';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const sources={
 polymarket:'https://gamma-api.polymarket.com/events?active=true&closed=false&limit=100&order=volume24hr&ascending=false',
 kalshi:'https://api.elections.kalshi.com/trade-api/v2/events?status=open&with_nested_markets=true&limit=200'
};
async function load(url:string){const c=new AbortController(),timeout=setTimeout(()=>c.abort(),12000);try{const r=await fetch(url,{signal:c.signal,next:{revalidate:600},headers:{Accept:'application/json','User-Agent':'GLITCH/9.0 read-only research'}});if(!r.ok)throw Error('HTTP '+r.status);return await r.json() as unknown}finally{clearTimeout(timeout)}}
const failure=(error:unknown)=>error instanceof Error?(error.name==='AbortError'?'Timeout upstream':error.message.slice(0,100)):'Upstream unavailable';
async function getKalshi(){try{const quotes=normalizeKalshi(await load(sources.kalshi));if(quotes.length)return quotes;throw Error('No valid priced open events in sample')}catch(first){
 // Fallback to a distinct endpoint, not fabricated quotes.
 try{const second=normalizeKalshi(await load('https://api.elections.kalshi.com/trade-api/v2/markets?status=open&mve_filter=exclude&limit=1000'));if(second.length)return second;throw Error('Zero valid non-combo markets')}catch(e){throw Error('Events/markets fallback: '+failure(first)+'; '+failure(e))}
}}
export async function GET(){
 const task=await Promise.allSettled([load(sources.polymarket).then(normalizePolymarket),getKalshi()]);
 const venues:VenueState[]=[];const quotes:MarketQuote[]=[];
 (['polymarket','kalshi'] as const).forEach((venue,i)=>{const row=task[i];const desc=venue==='polymarket'?'Top active events sample':'Open events sample with market fallback';if(row.status==='fulfilled'&&row.value.length){quotes.push(...row.value);venues.push({venue,status:'ok',count:row.value.length,sampleNote:desc});}else venues.push({venue,status:'unavailable',count:0,error:row.status==='rejected'?failure(row.reason):'No valid prices in current API sample',sampleNote:desc})});
 const response:MarketsPayload={updatedAt:new Date().toISOString(),quotes,venues,methodology:{el:'Οι τιμές YES είναι τιμές συμβολαίων, όχι εγγυημένες ή βαθμονομημένες πιθανότητες. Οι αγορές είναι δείγμα και οι δύο πλατφόρμες ενδέχεται να διαφέρουν στη ρευστότητα και στους κανόνες επίλυσης. Δεν πραγματοποιούνται συναλλαγές.',en:'YES prices are contract quotes, not guaranteed or calibrated probabilities. Displayed contracts are a sample, with potentially different liquidity and settlement rules. No trading.'}};
 return NextResponse.json(response,{headers:{'Cache-Control':'public, s-maxage=600, stale-while-revalidate=600'}});
}
