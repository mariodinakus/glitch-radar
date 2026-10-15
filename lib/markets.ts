/** Unauthenticated, read-only public market snapshots. No orders, wallets, or bets. */
export type Venue='polymarket'|'kalshi';
export type MarketQuote={id:string;venue:Venue;question:string;probability:number;priceKind:'outcome'|'midpoint'|'last';volume24h:number|null;volumeTotal:number|null;changeReferencePP:number|null;sourceUrl:string;updatedAt:string|null;category:string;sampleNote:string};
export type VenueState={venue:Venue;status:'ok'|'unavailable';count:number;error?:string;sampleNote:string};
export type MarketsPayload={updatedAt:string;quotes:MarketQuote[];venues:VenueState[];methodology:{el:string;en:string}};
type Obj=Record<string,unknown>;
const obj=(v:unknown):Obj=>v&&typeof v==='object'&&!Array.isArray(v)?v as Obj:{};
const str=(x:unknown)=>typeof x==='string'?x.trim():typeof x==='number'&&Number.isFinite(x)?String(x):'';
const numeric=(x:unknown):number|null=>{if(typeof x==='number'&&Number.isFinite(x))return x;if(typeof x==='string'&&x.trim()!==''&&Number.isFinite(Number(x)))return Number(x);return null};
const qty=(x:unknown)=>{const v=numeric(x);return v!==null&&v>=0?v:null};
const probability=(x:unknown)=>{const v=numeric(x);return v!==null&&v>=0&&v<=1?v:null};
const date=(x:unknown)=>{const v=Date.parse(str(x));return Number.isFinite(v)?new Date(v).toISOString():null};
const arr=(x:unknown):unknown[]=>{if(Array.isArray(x))return x;if(typeof x==='string'){try{const a=JSON.parse(x);return Array.isArray(a)?a:[]}catch{return []}}return []};
const change=(current:number,previous:number|null)=>previous===null?null:Math.round((current-previous)*1000)/10;
const noDuplicates=(s:string)=>s.slice(0,220);
const polymarketNote='Sample of active events ordered by 24h volume; not all Polymarket markets.';
const kalshiNote='Sample of open non-combination markets, sorted client-side by sampled 24h volume; NOT the highest-volume markets across the whole exchange.';
export function normalizePolymarket(events:unknown):MarketQuote[]{
 if(!Array.isArray(events))throw new Error('Unexpected Polymarket event response');
 const result:MarketQuote[]=[];
 for(const raw of events){const event=obj(raw);const eMarkets=arr(event.markets);let best:MarketQuote|null=null;
  for(const entry of eMarkets){const m=obj(entry);if(m.closed===true||m.active===false)continue;
   const outcomes=arr(m.outcomes).map(str);const prices=arr(m.outcomePrices);
   if(outcomes.length!==2||prices.length!==2)continue;
   const yesIdx=outcomes.findIndex(x=>x.toLowerCase()==='yes');if(yesIdx<0||!outcomes.some(x=>x.toLowerCase()==='no'))continue;
   const p=probability(prices[yesIdx]);if(p===null)continue;
   const slug=str(event.slug)||str(m.slug);if(!slug||!/^[a-zA-Z0-9-]+$/.test(slug))continue;
   const volume24h=qty(m.volume24hr)??qty(event.volume24hr);
   const question=noDuplicates(str(m.question)||str(event.title));if(!question)continue;
   const v:MarketQuote={id:'poly-'+str(m.id||event.id||slug),venue:'polymarket',question,probability:p,priceKind:'outcome',volume24h,volumeTotal:qty(m.volumeNum)||qty(event.volume),changeReferencePP:null,sourceUrl:'https://polymarket.com/event/'+slug,updatedAt:date(m.updatedAt)||date(event.updatedAt),category:'Prediction market',sampleNote:polymarketNote};
   if(best===null||(v.volume24h??0)>(best.volume24h??0))best=v;
  }
  if(best)result.push(best);
 }
 return result.sort((a,b)=>(b.volume24h??0)-(a.volume24h??0)).slice(0,50);
}
export function normalizeKalshi(value:unknown):MarketQuote[]{
 const markets=obj(value).markets;if(!Array.isArray(markets))throw Error('Unexpected Kalshi markets response');
 const result:MarketQuote[]=[];
 for(const raw of markets){const m=obj(raw);if(m.status&&m.status!=='open')continue;
  const ticker=str(m.ticker);const event=str(m.event_ticker);if(!ticker||!/^[A-Z0-9-]+$/i.test(ticker))continue;
  const bid=probability(m.yes_bid_dollars),ask=probability(m.yes_ask_dollars),last=probability(m.last_price_dollars);
  const hasTwoSides=bid!==null&&ask!==null&&ask>=bid&&bid>0&&ask<1;
  const p=hasTwoSides?(bid+ask)/2:last;
  if(p===null)continue;
  const q=noDuplicates(str(m.title)||[event,str(m.yes_sub_title)].filter(Boolean).join(' — '));if(!q)continue;
  const prior=probability(m.previous_price_dollars);
  result.push({id:'kalshi-'+ticker,venue:'kalshi',question:q,probability:Math.round(p*10000)/10000,priceKind:hasTwoSides?'midpoint':'last',volume24h:qty(m.volume_24h_fp),volumeTotal:qty(m.volume_fp),changeReferencePP:change(p,prior),sourceUrl:'https://kalshi.com/markets'+(event?'/'+encodeURIComponent(event.toLowerCase()):''),updatedAt:date(m.updated_time),category:'Event contract',sampleNote:kalshiNote});
 }
 return result.sort((a,b)=>(b.volume24h??0)-(a.volume24h??0)).slice(0,40);
}
/** Strict lexical overlap: never represent as confirmation of the same underlying event. */
const common=new Set(['will','the','and','for','this','with','from','that','what','after','before','2026','2027','2028','2029','2030','over','under','new','more','than','year','next','market','markets','price','against','when','does','yes','no','is','are','can','by','to','in','of','on','at','be','as','a','an','it','its','how','who','which','percent','first','last','could','would','should','win','get','have','has']);
export const keywords=(s:string)=>[...new Set(s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').match(/[a-z\u0370-\u03ff]{4,}|\d{4}/gi)?.filter(w=>!common.has(w))||[])].slice(0,20);
export const headlineOverlap=(question:string,headlines:string[]):number=>{
 const qs=keywords(question);if(qs.length<2)return 0;
 return headlines.filter(h=>{const words=new Set(keywords(h));return qs.filter(t=>words.has(t)).length>=2}).length;
};
