/** Read-only market data. Contract price is not a calibrated forecast. */
export type Venue='polymarket'|'kalshi';
export type MarketQuote={id:string;venue:Venue;question:string;probability:number;priceKind:'outcome'|'midpoint'|'last';volume24h:number|null;volumeTotal:number|null;changeReferencePP:number|null;sourceUrl:string;updatedAt:string|null;category:string;sampleNote:string};
export type VenueState={venue:Venue;status:'ok'|'unavailable';count:number;error?:string;sampleNote:string};
export type MarketsPayload={updatedAt:string;quotes:MarketQuote[];venues:VenueState[];methodology:{el:string;en:string}};
type Rec=Record<string,unknown>;
const rec=(v:unknown):Rec=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Rec:{};
const txt=(x:unknown):string=>typeof x==='string'?x.trim():typeof x==='number'&&Number.isFinite(x)?String(x):'';
const num=(x:unknown):number|null=>{if((typeof x==='string'&&x.trim())||typeof x==='number'){const n=Number(x);return Number.isFinite(n)?n:null}return null};
const nonNegative=(v:unknown)=>{const x=num(v);return x!==null&&x>=0?x:null};
const price=(v:unknown)=>{const x=num(v);return x!==null&&x>=0&&x<=1?x:null};
const array=(v:unknown):unknown[]=>{if(Array.isArray(v))return v;if(typeof v==='string'){try{const q=JSON.parse(v);return Array.isArray(q)?q:[]}catch{return []}}return []};
const iso=(v:unknown)=>{const n=Date.parse(txt(v));return Number.isFinite(n)?new Date(n).toISOString():null};
const polyNote='Δείγμα ενεργών γεγονότων, όχι ολόκληρο το Polymarket.';
const kalNote='Δείγμα ανοιχτών αγορών ανά γεγονός· όχι συνολική κατάταξη όλου του Kalshi.';
export function normalizePolymarket(data:unknown):MarketQuote[]{
 if(!Array.isArray(data))throw Error('Unexpected Polymarket events format');
 const items:MarketQuote[]=[];
 for(const eRaw of data){const e=rec(eRaw);if(e.closed===true||e.active===false)continue;
  let chosen:MarketQuote|null=null;
  for(const mRaw of array(e.markets)){const m=rec(mRaw);if(m.closed===true||m.active===false)continue;
   const names=array(m.outcomes).map(txt).map(x=>x.toLowerCase());const values=array(m.outcomePrices);
   const yes=names.indexOf('yes');if(names.length!==2||yes===-1||!names.includes('no'))continue;
   const p=price(values[yes]);if(p===null)continue;
   const slug=txt(e.slug)||txt(m.slug);if(!/^[a-z0-9-]+$/i.test(slug))continue;
   const question=(txt(m.question)||txt(e.title)).slice(0,260);if(question.length<8)continue;
   const q:MarketQuote={id:'poly-'+txt(m.id||e.id||slug),venue:'polymarket',question,probability:p,priceKind:'outcome',volume24h:nonNegative(m.volume24hr)??nonNegative(e.volume24hr),volumeTotal:nonNegative(m.volumeNum)??nonNegative(e.volume),changeReferencePP:null,sourceUrl:'https://polymarket.com/event/'+slug,updatedAt:iso(m.updatedAt)||iso(e.updatedAt),category:txt(e.category)||'Event',sampleNote:polyNote};
   if(!chosen||(q.volume24h??0)>(chosen.volume24h??0))chosen=q;
  }if(chosen)items.push(chosen);
 }
 return items.sort((a,b)=>(b.volume24h??0)-(a.volume24h??0)).slice(0,75);
}
function parseKalshiMarket(raw:unknown,eventTitle=''):MarketQuote|null{
 const m=rec(raw);if(m.status&&m.status!=='open'&&m.status!=='active')return null;
 const ticker=txt(m.ticker),event=txt(m.event_ticker);if(!/^[a-zA-Z0-9-]+$/.test(ticker))return null;
 const bid=price(m.yes_bid_dollars),ask=price(m.yes_ask_dollars),last=price(m.last_price_dollars);
 // Never treat empty 0.000 bid/ask or missing quotes as a valid market.
 const midpoint=bid!==null&&ask!==null&&bid>0&&ask<1&&ask>=bid;
 const current=midpoint?(bid!+ask!)/2:last;
 if(current===null||current<=0||current>=1)return null;
 const title=(txt(m.title)||eventTitle||txt(m.yes_sub_title)).slice(0,260);if(title.length<8)return null;
 const previous=price(m.previous_price_dollars);
 // Source link is the original exchange's event page. Individual ticker remains visible in diagnostics.
 const eventSegment=(event||ticker).toLowerCase();
 return {id:'kalshi-'+ticker,venue:'kalshi',question:title,probability:Math.round(current*10000)/10000,priceKind:midpoint?'midpoint':'last',volume24h:nonNegative(m.volume_24h_fp)??nonNegative(m.volume_24h),volumeTotal:nonNegative(m.volume_fp)??nonNegative(m.volume),changeReferencePP:previous===null?null:Math.round((current-previous)*1000)/10,sourceUrl:'https://kalshi.com/markets/'+encodeURIComponent(eventSegment),updatedAt:iso(m.updated_time),category:'Event',sampleNote:kalNote};
}
export function normalizeKalshi(data:unknown):MarketQuote[]{
 const v=rec(data);const result:MarketQuote[]=[];
 if(Array.isArray(v.events))for(const raw of v.events){const event=rec(raw);const title=txt(event.title);const pool=array(event.markets);let best:MarketQuote|null=null;for(const child of pool){const q=parseKalshiMarket(child,title);if(q&&(!best||(q.volume24h??0)>(best.volume24h??0)))best=q;}if(best)result.push(best);}
 else if(Array.isArray(v.markets))for(const child of v.markets){const q=parseKalshiMarket(child);if(q)result.push(q)}
 else throw Error('Unexpected Kalshi events/markets format');
 const dedup=new Map<string,MarketQuote>();for(const q of result)dedup.set(q.id,q);
 return [...dedup.values()].sort((a,b)=>(b.volume24h??0)-(a.volume24h??0)).slice(0,70);
}
const stop=new Set('will the and for with from this about what when into year does happen before after market markets price 2026 2027 2028 2029 2030 2031 yes no an a is are of or to in on at by be who have how more than would new that'.split(' '));
export function keywords(s:string){return [...new Set((s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').match(/[a-z\u0370-\u03ff]{4,}/g)||[]).filter(x=>!stop.has(x)))].slice(0,24)}
export function headlineOverlap(question:string,headlines:string[]){const q=keywords(question);if(q.length<2)return 0;return headlines.filter(h=>{const hs=new Set(keywords(h));return q.filter(t=>hs.has(t)).length>=2}).length}
