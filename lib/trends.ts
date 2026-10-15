/** Trend provenance is part of the API contract: Google Search interest is NEVER an X trend. */
export type TrendProvider='google'|'x';
export type TrendRegion='WORLD'|'GR'|'US'|'GB'|'IN'|'JP'|'BR'|'DE'|'FR'|'CA'|'AU'|'KR'|'ZA'|'TR';
export type Trend={id:string;name:string;rank:number;provider:TrendProvider;regions:TrendRegion[];traffic:string|null;tweetCount:number|null;publishedAt:string|null;url:string;relatedHeadlines:string[]};
export type TrendsResult={provider:TrendProvider;region:TrendRegion;status:'ok'|'partial'|'unconfigured'|'unavailable';updatedAt:string;trends:Trend[];checkedRegions:TrendRegion[];failedRegions:TrendRegion[];message:string;methodology:string};
export const REGIONS:ReadonlyArray<{id:TrendRegion;el:string;en:string;woeid:number}>=[
 {id:'WORLD',el:'Παγκόσμια',en:'Worldwide',woeid:1},
 {id:'GR',el:'Ελλάδα',en:'Greece',woeid:23424833},
 {id:'US',el:'ΗΠΑ',en:'United States',woeid:23424977},
 {id:'GB',el:'Βρετανία',en:'United Kingdom',woeid:23424975},
 {id:'IN',el:'Ινδία',en:'India',woeid:23424848},
 {id:'JP',el:'Ιαπωνία',en:'Japan',woeid:23424856},
 {id:'BR',el:'Βραζιλία',en:'Brazil',woeid:23424768},
 {id:'DE',el:'Γερμανία',en:'Germany',woeid:23424829},
 {id:'FR',el:'Γαλλία',en:'France',woeid:23424819},
 {id:'CA',el:'Καναδάς',en:'Canada',woeid:23424775},
 {id:'AU',el:'Αυστραλία',en:'Australia',woeid:23424748},
 {id:'KR',el:'Ν. Κορέα',en:'South Korea',woeid:23424868},
 {id:'ZA',el:'Ν. Αφρική',en:'South Africa',woeid:23424942},
 {id:'TR',el:'Τουρκία',en:'Turkey',woeid:23424969}
];
export const GOOGLE_WORLD_REGIONS:TrendRegion[]=['US','GR','GB','IN','JP','BR','DE','FR'];
export const isRegion=(v:string):v is TrendRegion=>REGIONS.some(r=>r.id===v);
const unescapeXml=(s:string)=>s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')
 .replace(/&#x([\da-f]+);/gi,(_,v)=>String.fromCodePoint(parseInt(v,16)))
 .replace(/&#(\d+);/g,(_,v)=>String.fromCodePoint(parseInt(v,10)))
 .replace(/&(amp|lt|gt|quot|apos|nbsp);/gi,(_,v)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '} as Record<string,string>)[v.toLowerCase()]||'');
const clean=(s:string)=>unescapeXml(s.replace(/<[^>]+>/g,' ').trim()).replace(/\s+/g,' ').trim();
const tag=(xml:string,name:string)=>{const safe=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const m=xml.match(new RegExp(`<${safe}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${safe}>`,'i'));return m?clean(m[1]):''};
const id=(v:string)=>v.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('en-US').replace(/\s+/g,' ').trim();
const googleUrl=(term:string,region:TrendRegion)=>'https://trends.google.com/trends/explore?date=now%201-d&geo='+encodeURIComponent(region==='WORLD'?'':region)+'&q='+encodeURIComponent(term);
export function parseGoogleTrends(xml:string,region:TrendRegion):Trend[]{
 if(!/<rss\b/i.test(xml))throw new Error('Invalid Google Trends RSS');
 const items=[...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)];
 return items.slice(0,35).map(([_,item],i)=>{
  const name=tag(item,'title').slice(0,160);if(!name)return null;
  const d=Date.parse(tag(item,'pubDate'));
  const news=[...item.matchAll(/<ht:news_item(?:\s[^>]*)?>([\s\S]*?)<\/ht:news_item>/gi)]
   .map(m=>tag(m[1],'ht:news_item_title')).filter(Boolean).slice(0,3);
  return {id:'g-'+region+'-'+id(name),name,provider:'google' as const,rank:i+1,regions:[region],traffic:tag(item,'ht:approx_traffic')||null,tweetCount:null,publishedAt:Number.isFinite(d)?new Date(d).toISOString():null,url:googleUrl(name,region),relatedHeadlines:news};
 }).filter((x):x is NonNullable<typeof x>=>x!==null);
}
/** This is a multi-country sample, not a global ranking or worldwide total. */
export function mergeCountryTrends(trends:Trend[]):Trend[]{
 const m=new Map<string,Trend>();
 for(const trend of trends){const k=id(trend.name);const existing=m.get(k);if(existing){
  existing.regions=[...new Set([...existing.regions,...trend.regions])];
  existing.relatedHeadlines=[...new Set([...existing.relatedHeadlines,...trend.relatedHeadlines])].slice(0,4);
  existing.rank=Math.min(existing.rank,trend.rank);
 }else m.set(k,{...trend,regions:[...trend.regions]})}
 return [...m.values()].sort((a,b)=>b.regions.length-a.regions.length||a.rank-b.rank||a.name.localeCompare(b.name)).slice(0,65).map((t,i)=>({...t,rank:i+1,traffic:t.regions.length===1?t.traffic:null}));
}
export function parseXTrends(value:unknown,region:TrendRegion):Trend[]{
 if(!value||typeof value!=='object'||!Array.isArray((value as {data?:unknown}).data))throw new Error('Invalid X API response');
 return ((value as {data:unknown[]}).data).slice(0,50).map((item,i)=>{
  const v=item as {trend_name?:unknown;tweet_count?:unknown};
  if(typeof v?.trend_name!=='string'||!v.trend_name.trim())return null;
  const name=v.trend_name.trim().slice(0,160);const tweetCount=typeof v.tweet_count==='number'&&Number.isFinite(v.tweet_count)&&v.tweet_count>=0?v.tweet_count:null;
  return {id:'x-'+region+'-'+id(name),name,provider:'x' as const,rank:i+1,regions:[region],traffic:null,tweetCount,publishedAt:null,url:'https://x.com/search?q='+encodeURIComponent(name)+'&f=live',relatedHeadlines:[]};
 }).filter((x):x is NonNullable<typeof x>=>x!==null);
}
