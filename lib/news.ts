import type {Category,Signal,SourceStatus} from './types';

type NewsSource={name:string;url:string;category:Category;limit:number};
const feeds:NewsSource[]=[
 {name:'UN News',url:'https://news.un.org/feed/subscribe/en/news/all/rss.xml',category:'world',limit:38},
 {name:'UN News SDGs',url:'https://news.un.org/feed/subscribe/en/news/topic/sdgs/feed/rss.xml',category:'world',limit:20},
 {name:'BBC World',url:'https://feeds.bbci.co.uk/news/world/rss.xml',category:'world',limit:24},
 {name:'BBC Business',url:'https://feeds.bbci.co.uk/news/business/rss.xml',category:'economy',limit:22},
 {name:'BBC Technology',url:'https://feeds.bbci.co.uk/news/technology/rss.xml',category:'tech',limit:22},
 {name:'BBC Science',url:'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',category:'science',limit:20},
 {name:'BBC Health',url:'https://feeds.bbci.co.uk/news/health/rss.xml',category:'health',limit:18},
 {name:'BBC Culture',url:'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml',category:'culture',limit:18},
 {name:'BBC Sport',url:'https://feeds.bbci.co.uk/sport/rss.xml',category:'sports',limit:18},
 {name:'Guardian World',url:'https://www.theguardian.com/world/rss',category:'world',limit:20},
 {name:'Guardian Environment',url:'https://www.theguardian.com/environment/rss',category:'climate',limit:20},
 {name:'Guardian Technology',url:'https://www.theguardian.com/technology/rss',category:'tech',limit:20},
 {name:'Guardian Science',url:'https://www.theguardian.com/science/rss',category:'science',limit:18},
 {name:'Al Jazeera World',url:'https://www.aljazeera.com/xml/rss/all.xml',category:'world',limit:24},
 {name:'ΕΡΤ Ειδήσεις',url:'https://www.ertnews.gr/feed/',category:'world',limit:36},
 {name:'Ναυτεμπορική',url:'https://www.naftemporiki.gr/feed/',category:'economy',limit:32}
];
const clean=(s:unknown,max=240)=>String(s??'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
const dec=(s:string)=>s.replace(/&#x([0-9a-f]+);/gi,(_,v)=>String.fromCodePoint(parseInt(v,16))).replace(/&#(\d+);/g,(_,v)=>String.fromCodePoint(parseInt(v,10))).replace(/&(?:amp|lt|gt|quot|apos|nbsp|rsquo|lsquo|ldquo|rdquo|mdash|ndash|hellip);/g,(v)=>({
 '&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' ','&rsquo;':'’','&lsquo;':'‘','&ldquo;':'“','&rdquo;':'”','&mdash;':'—','&ndash;':'–','&hellip;':'…'
 } as Record<string,string>)[v]||v);
const field=(s:string,tag:string)=>{const safe=tag.replace(':','\\:');const r=new RegExp('<'+safe+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+safe+'>','i');return dec(clean(s.match(r)?.[1]||'',2000))};
const hash=(s:string)=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)};
const safeUrl=(s:string)=>{try{const x=new URL(s);if(x.protocol==='https:')return x.toString()}catch{}return null};
const important=/\b(first ever|first time|record[- ]breaking|unprecedented|breakthrough|discovered|discovery|rare|mystery|mysterious|historic|surprise|unexpected|warning|emergency|alert|massive|major|crisis|scientists discover|new evidence|astonishing|shock|unusual|incredible|global|historic high|all-time high)\b/i;
const aiPattern=/\b(artificial intelligence|generative ai|machine learning|chatgpt|openai|deepmind|anthropic|llm|large language model|robotics|humanoid robot|ai model|ai-powered|ai agents?)\b/i;
const climatePattern=/\b(climate|heatwave|warming|emissions|carbon|drought|flooding|wildfire|temperature record|ocean heat)\b/i;
const energyPattern=/\b(energy|renewables|nuclear|fusion|oil|gas|solar power|wind power|electricity grid|power station|hydrogen)\b/i;
function classify(base:Category,title:string,summary:string):Category{const txt=title+' '+summary;if(base==='tech'&&aiPattern.test(txt))return 'ai';if(base==='science'&&climatePattern.test(txt))return 'climate';if(base==='climate'&&energyPattern.test(txt)&&!climatePattern.test(txt))return 'energy';if(base==='economy'&&energyPattern.test(title))return 'energy';return base}
const cutoff=()=>Date.now()-4*86400000;
const priority=(title:string,age:number)=>{const hrs=Math.max(0,(Date.now()-age)/3600000);return Math.max(35,Math.min(88,Math.round(45+(important.test(title)?22:0)+(hrs<6?12:hrs<24?8:hrs<48?4:0))))};
async function readFeed(src:NewsSource):Promise<Signal[]>{const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),8000);try{
 const res=await fetch(src.url,{next:{revalidate:900},signal:ctl.signal,headers:{'Accept':'application/rss+xml, application/xml, text/xml, */*','User-Agent':'GLITCH Radar/2.0 (+public RSS news index)'}});
 if(!res.ok)throw Error(`RSS upstream HTTP ${res.status}`);
 const xml=(await res.text()).slice(0,900000);if(!/<rss|<rdf:RDF/i.test(xml)||!xml.includes('<item'))throw Error('Invalid or empty RSS');
 const matches=[...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].slice(0,src.limit+8);
 return matches.map(match=>{
  const t=match[1];const title=field(t,'title').slice(0,170);const description=field(t,'description').slice(0,260);
  const link=safeUrl(field(t,'link'));const dateRaw=field(t,'pubDate')||field(t,'dc:date');const timestamp=Date.parse(dateRaw);
  if(!title||!link||!Number.isFinite(timestamp)||timestamp<cutoff())return null;
  const cat=classify(src.category,title,description);const score=priority(title,timestamp);const level:Signal['level']=score>=90?'critical':score>=73?'high':'elevated';
  return {id:'rss-'+hash(src.name+link),category:cat,title,summary:description||'News headline from a credited publisher RSS feed. Open the original article for the full reporting.',score,level,timestamp:new Date(timestamp).toISOString(),source:src.name,url:link,details:[`Published by: ${src.name}`,`Feed: ${src.url}`,`Original publication: ${dateRaw}`],metricLabel:'COVERAGE',metricValue:'NEW ARTICLE',reason:'Editorial discovery weight based on recency and headline wording; keyword matching does not verify unusualness, severity or factual accuracy.',confidence:'publisher' as const} as Signal;
 }).filter((x):x is Signal=>x!==null).slice(0,src.limit)
 }finally{clearTimeout(timer)}}

type SpaceNews={results?:{id:number;title:string;url:string;summary:string;published_at:string;news_site:string;updated_at?:string}[]};
async function spaceflight():Promise<Signal[]>{const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),8000);try{
 const r=await fetch('https://api.spaceflightnewsapi.net/v4/articles/?limit=35',{next:{revalidate:900},signal:ctl.signal});if(!r.ok)throw Error('Spaceflight API '+r.status);
 const data=await r.json() as SpaceNews;
 return (data.results||[]).filter(a=>a.title&&safeUrl(a.url)&&Number.isFinite(Date.parse(a.published_at))&&Date.parse(a.published_at)>=cutoff()).slice(0,30).map(a=>{
 const score=priority(a.title,Date.parse(a.published_at));return {id:'snapi-'+a.id,category:'space' as const,title:clean(a.title,165),summary:clean(a.summary,230)||'Spaceflight coverage indexed by The Space Devs.',score,level:score>=73?'high' as const:'elevated' as const,timestamp:new Date(a.published_at).toISOString(),source:`Spaceflight News / ${clean(a.news_site,35)}`,url:a.url,details:[`Publisher: ${clean(a.news_site,70)}`,`Published: ${a.published_at}`],metricLabel:'SPACE NEWS',metricValue:'LATEST',reason:'News freshness and headline novelty heuristic. The source aggregates third-party spaceflight coverage; not NASA verification.',confidence:'publisher' as const};
 })
 }finally{clearTimeout(timer)}}
export async function getNewsProviders():Promise<{signals:Signal[];statuses:SourceStatus[]}>{
 const sources:[string,()=>Promise<Signal[]>][]=[...feeds.map(f=>[f.name,()=>readFeed(f)] as [string,()=>Promise<Signal[]>]),['Spaceflight News',spaceflight]];
 const results=await Promise.allSettled(sources.map(x=>x[1]()));
 return {statuses:results.map((x,i)=>x.status==='fulfilled'?{source:sources[i][0],ok:true,count:x.value.length}:{source:sources[i][0],ok:false,count:0,error:x.reason instanceof Error?x.reason.message:'Unavailable'}),signals:results.flatMap(x=>x.status==='fulfilled'?x.value:[])};
}
