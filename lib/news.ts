import type {Category,Signal,SourceStatus} from './types';
import {rssField,rssPlainText,googleNewsPreview} from './rss-text';
import {isEnglishForeignOutlet} from './source-policy';

type NewsSource={name:string;url:string;category:Category;limit:number};
const feeds:NewsSource[]=[
 {name:'UN News',url:'https://news.un.org/feed/subscribe/en/news/all/rss.xml',category:'world',limit:38},
 {name:'UN News SDGs',url:'https://news.un.org/feed/subscribe/en/news/topic/sdgs/feed/rss.xml',category:'world',limit:20},
 {name:'BBC World',url:'https://feeds.bbci.co.uk/news/world/rss.xml',category:'world',limit:24},
 {name:'BBC Europe',url:'https://feeds.bbci.co.uk/news/world/europe/rss.xml',category:'world',limit:30},
 {name:'BBC Middle East',url:'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml',category:'world',limit:26},
 {name:'BBC Business',url:'https://feeds.bbci.co.uk/news/business/rss.xml',category:'economy',limit:22},
 {name:'BBC Technology',url:'https://feeds.bbci.co.uk/news/technology/rss.xml',category:'tech',limit:22},
 {name:'Google News / AI Labs',url:'https://news.google.com/rss/search?q=%28OpenAI%20OR%20Anthropic%20OR%20DeepMind%20OR%20%22AI%20model%22%20OR%20%22AI%20agents%22%29%20when%3A2d&hl=en-US&gl=US&ceid=US%3Aen',category:'ai',limit:40},
 {name:'Google News / Global Tech Companies',url:'https://news.google.com/rss/search?q=%28Nvidia%20OR%20Microsoft%20OR%20Meta%20OR%20Apple%20OR%20Google%20OR%20TSMC%20OR%20Amazon%29%20when%3A2d&hl=en-US&gl=US&ceid=US%3Aen',category:'tech',limit:45},
 {name:'Google News / Enterprise and AI',url:'https://news.google.com/rss/search?q=%28%22AI%20investment%22%20OR%20%22AI%20data%20center%22%20OR%20%22chip%20exports%22%20OR%20%22AI%20regulation%22%29%20when%3A2d&hl=en-US&gl=US&ceid=US%3Aen',category:'ai',limit:34},
 {name:'Google News / Multinationals',url:'https://news.google.com/rss/search?q=%28%22multinational%22%20OR%20%22earnings%22%20OR%20%22merger%22%20OR%20%22supply%20chain%22%29%20when%3A2d&hl=en-US&gl=US&ceid=US%3Aen',category:'economy',limit:35},
 {name:'BBC Science',url:'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',category:'science',limit:20},
 {name:'BBC Health',url:'https://feeds.bbci.co.uk/news/health/rss.xml',category:'health',limit:18},
 {name:'BBC Culture',url:'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml',category:'culture',limit:18},
 {name:'BBC Sport',url:'https://feeds.bbci.co.uk/sport/rss.xml',category:'sports',limit:18},
 {name:'Guardian World',url:'https://www.theguardian.com/world/rss',category:'world',limit:20},
 {name:'Guardian Europe',url:'https://www.theguardian.com/world/europe-news/rss',category:'world',limit:24},
 {name:'Guardian Americas',url:'https://www.theguardian.com/us-news/rss',category:'world',limit:18},
 {name:'Google News / World Protests',url:'https://news.google.com/rss/search?q=protests%20OR%20demonstrations%20OR%20riots%20when%3A2d&hl=en-GB&gl=GB&ceid=GB%3Aen',category:'world',limit:30},
 {name:'Google News / France',url:'https://news.google.com/rss/search?q=France%20protests%20OR%20demonstrations%20when%3A2d&hl=en-GB&gl=GB&ceid=GB%3Aen',category:'world',limit:24},
 {name:'Google News / Albania',url:'https://news.google.com/rss/search?q=Albania%20protests%20OR%20unrest%20when%3A2d&hl=en-GB&gl=GB&ceid=GB%3Aen',category:'world',limit:24},
 {name:'Google News / World Conflicts',url:'https://news.google.com/rss/search?q=war%20OR%20airstrike%20OR%20ceasefire%20when%3A2d&hl=en-GB&gl=GB&ceid=GB%3Aen',category:'world',limit:34},
 {name:'Guardian Environment',url:'https://www.theguardian.com/environment/rss',category:'climate',limit:20},
 {name:'Guardian Technology',url:'https://www.theguardian.com/technology/rss',category:'tech',limit:20},
 {name:'Guardian Science',url:'https://www.theguardian.com/science/rss',category:'science',limit:18},
 {name:'Al Jazeera World',url:'https://www.aljazeera.com/xml/rss/all.xml',category:'world',limit:24},
 {name:'New York Times World',url:'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',category:'world',limit:30},
 {name:'New York Times Business',url:'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',category:'economy',limit:20},
 {name:'New York Times Technology',url:'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',category:'tech',limit:20},
 {name:'New York Times Science',url:'https://rss.nytimes.com/services/xml/rss/nyt/Science.xml',category:'science',limit:12},
 {name:'Sky News World',url:'https://feeds.skynews.com/feeds/rss/world.xml',category:'world',limit:12},
 {name:'Fox News World',url:'https://moxie.foxnews.com/google-publisher/world.xml',category:'world',limit:25},
 {name:'The Independent World',url:'https://www.independent.co.uk/news/world/rss',category:'world',limit:40},
 {name:'NPR World',url:'https://feeds.npr.org/1004/rss.xml',category:'world',limit:10},
 {name:'CBS News World',url:'https://www.cbsnews.com/latest/rss/world',category:'world',limit:25},
 {name:'Times of Israel',url:'https://www.timesofisrael.com/feed/',category:'world',limit:15},
 {name:'South China Morning Post',url:'https://www.scmp.com/rss/91/feed',category:'world',limit:30},
 {name:'DW',url:'https://rss.dw.com/rdf/rss-en-all',category:'world',limit:50},
 {name:'France 24 English',url:'https://www.france24.com/en/rss',category:'world',limit:30},
 {name:'France 24 Africa',url:'https://www.france24.com/en/africa/rss',category:'world',limit:25},
 {name:'Euronews English',url:'https://www.euronews.com/rss',category:'world',limit:30},
 {name:'Washington Post World',url:'https://feeds.washingtonpost.com/rss/world',category:'world',limit:24},
 {name:'Wall Street Journal World',url:'https://feeds.content.dowjones.io/public/rss/RSSWorldNews',category:'world',limit:22},
 {name:'The Economist World',url:'https://www.economist.com/the-world-this-week/rss.xml',category:'world',limit:16},
 {name:'CBC News Canada',url:'https://www.cbc.ca/webfeed/rss/rss-topstories',category:'world',limit:22},
 {name:'Times of India',url:'https://timesofindia.indiatimes.com/rssfeedstopstories.cms',category:'world',limit:27},
 {name:'PBS NewsHour',url:'https://www.pbs.org/newshour/feeds/rss/headlines',category:'world',limit:20},
 {name:'CNN World',url:'https://rss.cnn.com/rss/edition_world.rss',category:'world',limit:25},
 {name:'NPR News',url:'https://feeds.npr.org/1001/rss.xml',category:'world',limit:22},
 {name:'Wired',url:'https://www.wired.com/feed/rss',category:'tech',limit:20},
 {name:'TechCrunch',url:'https://techcrunch.com/feed/',category:'tech',limit:24},
 {name:'Ars Technica',url:'https://feeds.arstechnica.com/arstechnica/index',category:'tech',limit:18},
 {name:'Bloomberg Technology',url:'https://feeds.bloomberg.com/technology/news.rss',category:'tech',limit:20},
 {name:'Google News / Reuters',url:'https://news.google.com/rss/search?q=when%3A2d%20site%3Areuters.com&hl=en-US&gl=US&ceid=US%3Aen',category:'world',limit:34},
 {name:'Google News / Associated Press',url:'https://news.google.com/rss/search?q=when%3A2d%20site%3Aapnews.com&hl=en-US&gl=US&ceid=US%3Aen',category:'world',limit:34},
 {name:'Google News / World',url:'https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-US&gl=US&ceid=US:en',category:'world',limit:60},
 {name:'Google News / Business',url:'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en',category:'economy',limit:40}

];
const clean=(s:unknown,max=240)=>String(s??'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
// Preserve short publisher-supplied RSS previews. Never cut in the middle of a word.
export function readableExcerpt(value:string,max=1200):string{
 const text=value.replace(/\s+/g,' ').trim();
 if(text.length<=max)return text;
 const prefix=text.slice(0,max+1);
 const sentence=[...prefix.matchAll(/[.!?。！？](?=\s|$)/g)].map(m=>(m.index??0)+1).filter(i=>i>=max*.58 && i<=max);
 if(sentence.length)return text.slice(0,sentence[sentence.length-1]).trim();
 const words=prefix.slice(0,max).lastIndexOf(' ');
 return text.slice(0,words>=max*.65?words:max).replace(/[\s,;:–-]+$/,'').trim()+'…';
}
const dec=(s:string)=>s.replace(/&#x([0-9a-f]+);/gi,(_,v)=>String.fromCodePoint(parseInt(v,16))).replace(/&#(\d+);/g,(_,v)=>String.fromCodePoint(parseInt(v,10))).replace(/&(?:amp|lt|gt|quot|apos|nbsp|rsquo|lsquo|ldquo|rdquo|mdash|ndash|hellip);/g,(v)=>({
 '&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' ','&rsquo;':'’','&lsquo;':'‘','&ldquo;':'“','&rdquo;':'”','&mdash;':'—','&ndash;':'–','&hellip;':'…'
 } as Record<string,string>)[v]||v);
const field=(s:string,tag:string)=>{const safe=tag.replace(':','\\:');const r=new RegExp('<'+safe+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+safe+'>','i');return dec(clean(s.match(r)?.[1]||'',2000))};

/** Source-provided images only; no guessed images or generic stock replacements. */
function imageFromItem(item:string):{imageUrl?:string;imageCredit?:string}{
 const tags=[...item.matchAll(/<(media:content|media:thumbnail|enclosure|image|img)\b([^>]*)>/gi)].map(x=>({tag:x[1].toLowerCase(),attrs:x[2]}));
 const candidates:{url:string;weight:number}[]=[];
 for(const {tag,attrs} of tags){
  const raw=attrs.match(/\b(?:url|src)\s*=\s*(["'])(.*?)\1/i)?.[2];
  if(!raw)continue;
  const type=attrs.match(/\btype\s*=\s*(["'])(.*?)\1/i)?.[2]||'';
  const medium=attrs.match(/\bmedium\s*=\s*(["'])(.*?)\1/i)?.[2]||'';
  if(tag==='enclosure'&&type&&!type.toLowerCase().startsWith('image/'))continue;
  if(tag==='media:content'&&type&&!type.toLowerCase().startsWith('image/')&&medium.toLowerCase()!=='image')continue;
  const parsed=safeUrl(dec(raw).replace(/&amp;/g,'&'));
  if(!parsed)continue;
  const width=Number(attrs.match(/\bwidth\s*=\s*(["'])(\d+)\1/i)?.[2]||0);
  if(width>0&&width<220)continue;
  if(/\.(?:svg|gif)(?:[?#]|$)/i.test(parsed))continue;
  const weight=(tag==='media:content'?30:tag==='enclosure'?25:tag==='media:thumbnail'?20:0)+(width>=700?10:width>=400?5:0);
  candidates.push({url:parsed,weight});
 }
 // Some feeds embed HTML as escaped text in description/content:encoded.
 const desc=String(item.match(/<(?:description|content:encoded)(?:\s[^>]*)?>([\s\S]*?)<\/(?:description|content:encoded)>/i)?.[1]||'');
 const markup=dec(desc);
 const embedded=markup.match(/<img\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1/i)?.[2];
 const embeddedUrl=embedded?safeUrl(dec(embedded).replace(/&amp;/g,'&')):null;
 if(embeddedUrl&&!/\.(?:svg|gif)(?:[?#]|$)/i.test(embeddedUrl))candidates.push({url:embeddedUrl,weight:4});
 // Some feeds (e.g. CBS) put the URL as text: <image>https://…</image>
 const textImage=item.match(/<image>\s*(https:\/\/[^<\s]+)\s*<\/image>/i)?.[1];
 const textUrl=textImage?safeUrl(dec(textImage).replace(/&amp;/g,'&')):null;
 if(textUrl&&!/\.(?:svg|gif)(?:[?#]|$)/i.test(textUrl))candidates.push({url:textUrl,weight:22});
 const best=candidates.sort((a,b)=>b.weight-a.weight)[0];
 const credit=rssField(item,'media:credit',120)||rssField(item,'media:copyright',120);
 return best?{imageUrl:best.url,imageCredit:credit||undefined}:{};
}

const hash=(s:string)=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)};
const safeUrl=(s:string)=>{try{const x=new URL(s);if(x.protocol==='https:')return x.toString()}catch{}return null};
const important=/\b(first ever|first time|record[- ]breaking|unprecedented|breakthrough|discovered|discovery|rare|mystery|mysterious|historic|surprise|unexpected|warning|emergency|alert|massive|major|crisis|scientists discover|new evidence|astonishing|shock|unusual|incredible|global|historic high|all-time high)\b/i;
const aiPattern=/\b(artificial intelligence|generative ai|machine learning|chatgpt|openai|deepmind|anthropic|llm|large language model|robotics|humanoid robot|ai model|ai-powered|ai agents?)\b/i;
const climatePattern=/\b(climate|heatwave|warming|emissions|carbon|drought|flooding|wildfire|temperature record|ocean heat)\b/i;
const energyPattern=/\b(energy|renewables|nuclear|fusion|oil|gas|solar power|wind power|electricity grid|power station|hydrogen)\b/i;
function classify(base:Category,title:string,summary:string):Category{const txt=title+' '+summary;if(base==='tech'&&aiPattern.test(txt))return 'ai';if(base==='science'&&climatePattern.test(txt))return 'climate';if(base==='climate'&&energyPattern.test(txt)&&!climatePattern.test(txt))return 'energy';if(base==='economy'&&energyPattern.test(title))return 'energy';return base}
// A keyword appearing inside a film title or a review is NOT a breaking geopolitical event.
const cultureNotBreaking=/\b(review|theatre|theater|film|movie|trailer|series|novel|book review|album|concert|drama|thriller|fiction|game|entertainment|art exhibit|box office)\b|κριτική|ταινία|θεατρικ|σειρά|μυθιστόρημα|βιβλίο|παράσταση|θέατρο/iu;
const protestHeadline=/\b(protests?|protesters?|demonstrat(?:ion|ions|ors|or)|mass march|riots?|political unrest|general strike|anti-government rally)\b|διαδηλ|διαμαρτυρ|συλλαλητ|απεργ|αντικυβερνητικ/iu;
const conflictHeadline=/\b(airstrikes?|bombardment|bombings?|ceasefire|invasion|troops (?:advance|withdraw|deployed)|military offensives?|missile attack|drone strikes?|armed clash|shelling|war in|civil war|ukraine war|gaza war|israel.ham.as war|iran war|russia.ukraine war|frontline|hostage release)\b|βομβαρδ|εισβολ|εκεχειρ|πυραυλικ[ήη] επίθεση|ένοπλ[ηες] σύγκρουσ|πόλεμος στ|μάχες στ/iu;
function matchesGoogleSearch(name:string,title:string):boolean {
 if(!name.startsWith('Google News /'))return true;
 if(cultureNotBreaking.test(title))return false;
 if(name==='Google News / World Conflicts')return conflictHeadline.test(title);
 if(name==='Google News / World Protests'||name==='Google News / France'||name==='Google News / Albania')return protestHeadline.test(title);
 return true;
}
const cutoff=()=>Date.now()-4*86400000;
const priority=(title:string,age:number)=>{const hrs=Math.max(0,(Date.now()-age)/3600000);return Math.max(35,Math.min(88,Math.round(45+(important.test(title)?22:0)+(hrs<6?12:hrs<24?8:hrs<48?4:0))))};
async function readFeed(src:NewsSource):Promise<Signal[]>{const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),8000);try{
 const res=await fetch(src.url,{next:{revalidate:300},signal:ctl.signal,headers:{'Accept':'application/rss+xml, application/xml, text/xml, */*','User-Agent':'GLITCH Radar/2.0 (+public RSS news index)'}});
 if(!res.ok)throw Error(`RSS upstream HTTP ${res.status}`);
 const xml=(await res.text()).slice(0,900000);if(!/<rss|<rdf:RDF/i.test(xml)||!xml.includes('<item'))throw Error('Invalid or empty RSS');
 const matches=[...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].slice(0,src.limit+8);
 return matches.map(match=>{
  const t=match[1];const title=rssField(t,'title',600);
  const rawDescription=rssPlainText(t.match(/<description(?:\s[^>]*)?>([\s\S]*?)<\/description>/i)?.[1]||'',1700);
  const description=src.name.startsWith('Google News /')?googleNewsPreview(rawDescription):readableExcerpt(rawDescription);
  const link=safeUrl(field(t,'link'));const dateRaw=field(t,'pubDate')||field(t,'dc:date');const timestamp=Date.parse(dateRaw);
  if(!title||!link||!Number.isFinite(timestamp)||timestamp<cutoff()||!matchesGoogleSearch(src.name,title))return null;
  const publisher=src.name.startsWith('Google News /')?field(t,'source'):''; 
  const attribution=publisher?publisher.slice(0,95):src.name;
  if(!isEnglishForeignOutlet(attribution,title,link))return null;
  const cat=classify(src.category,title,description);const media=imageFromItem(t);const score=priority(title,timestamp);const level:Signal['level']=score>=90?'critical':score>=73?'high':'elevated';
  return {id:'rss-'+hash(src.name+link),category:cat,title,summary:description||'The publisher provides no detailed preview. Open the original report for context.',score,level,timestamp:new Date(timestamp).toISOString(),source:attribution,url:link,...media,details:[`Published by: ${attribution}`,`Discovered via: ${src.name}`,`Feed: ${src.url}`,`Original publication: ${dateRaw}`],metricLabel:'COVERAGE',metricValue:'NEW ARTICLE',reason:'Editorial discovery weight based on recency and headline wording; keyword matching does not verify unusualness, severity or factual accuracy.',confidence:'publisher' as const} as Signal;
 }).filter((x):x is Signal=>x!==null).slice(0,src.limit)
 }finally{clearTimeout(timer)}}

type SpaceNews={results?:{id:number;title:string;url:string;summary:string;published_at:string;news_site:string;image_url?:string;updated_at?:string}[]};
async function spaceflight():Promise<Signal[]>{const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),8000);try{
 const r=await fetch('https://api.spaceflightnewsapi.net/v4/articles/?limit=35',{next:{revalidate:300},signal:ctl.signal});if(!r.ok)throw Error('Spaceflight API '+r.status);
 const data=await r.json() as SpaceNews;
 return (data.results||[]).filter(a=>a.title&&safeUrl(a.url)&&isEnglishForeignOutlet(a.news_site,a.title,a.url)&&Number.isFinite(Date.parse(a.published_at))&&Date.parse(a.published_at)>=cutoff()).slice(0,30).map(a=>{
 const score=priority(a.title,Date.parse(a.published_at));return {id:'snapi-'+a.id,category:'space' as const,title:clean(a.title,800),imageUrl:safeUrl(a.image_url||'' )||undefined,summary:readableExcerpt(clean(a.summary,2000))||'Spaceflight coverage indexed by The Space Devs.',score,level:score>=73?'high' as const:'elevated' as const,timestamp:new Date(a.published_at).toISOString(),source:`Spaceflight News / ${clean(a.news_site,35)}`,url:a.url,details:[`Publisher: ${clean(a.news_site,70)}`,`Published: ${a.published_at}`],metricLabel:'SPACE NEWS',metricValue:'LATEST',reason:'News freshness and headline novelty heuristic. The source aggregates third-party spaceflight coverage; not NASA verification.',confidence:'publisher' as const};
 })
 }finally{clearTimeout(timer)}}
export async function getNewsProviders():Promise<{signals:Signal[];statuses:SourceStatus[]}>{
 const sources:[string,()=>Promise<Signal[]>][]=[...feeds.map(f=>[f.name,()=>readFeed(f)] as [string,()=>Promise<Signal[]>]),['Spaceflight News',spaceflight]];
 const results=await Promise.allSettled(sources.map(x=>x[1]()));
 return {statuses:results.map((x,i)=>x.status==='fulfilled'?{source:sources[i][0],ok:true,count:x.value.length}:{source:sources[i][0],ok:false,count:0,error:x.reason instanceof Error?x.reason.message:'Unavailable'}),signals:results.flatMap(x=>x.status==='fulfilled'?x.value:[])};
}
