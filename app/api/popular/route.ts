import {NextResponse} from 'next/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';

type Trend={term:string;traffic:string;region:string;started:string;url:string};
type Status={region:string;ok:boolean;count:number};
const regions=['US','GR','GB','DE'] as const;
const sports=/\b(nba|nfl|nhl|mlb|uefa|fifa|champions league|world cup|football|soccer|basketball|tennis|baseball|cricket|rugby|hockey|mma|ufc|wrestling|f1|formula 1|grand prix|olympics|playoffs|super bowl|esports|golf|nfl draft|lakers|celtics|warriors|premier league|arsenal|chelsea|real madrid|barcelona)\b/i;
const decode=(s:string)=>s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi,(_,name:string)=>{
 if(name[0]==='#'){const code=name[1].toLowerCase()==='x'?parseInt(name.slice(2),16):parseInt(name.slice(1),10);return Number.isFinite(code)&&code>=32&&code<=0x10FFFF?String.fromCodePoint(code):' '}
 return ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"} as Record<string,string>)[name.toLowerCase()]||' ';
}).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const field=(s:string,name:string)=>{
 const pattern=new RegExp('<'+name.replace(':','\\:')+'(?:\\s+[^>]*)?>([\\s\\S]*?)<\\/'+name.replace(':','\\:')+'>','i');
 return decode(s.match(pattern)?.[1]||'');
};
async function load(region:string):Promise<Trend[]>{
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
 try{
  const response=await fetch('https://trends.google.com/trending/rss?geo='+region,{signal:controller.signal,headers:{Accept:'application/rss+xml, application/xml, text/xml'},next:{revalidate:900}});
  if(!response.ok)throw Error('Trend feed '+response.status);
  const xml=(await response.text()).slice(0,260000);
  if(!xml.includes('<rss')&&!xml.includes('<item>'))throw Error('No RSS items');
  const out:Trend[]=[];
  for(const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)){
   const block=match[1];
   const term=field(block,'title').slice(0,130);
   if(term.length<3||sports.test(term))continue;
   const traffic=field(block,'ht:approx_traffic')||'—';
   const rawDate=field(block,'pubDate');
   const date=Date.parse(rawDate);
   const url='https://trends.google.com/trending?geo='+region;
   out.push({term,traffic,region,started:Number.isFinite(date)?new Date(date).toISOString():'',url});
   if(out.length>=10)break;
  }
  return out;
 }finally{clearTimeout(timeout)}
}
export async function GET(){
 const r=await Promise.allSettled(regions.map(load));
 const status:Status[]=r.map((x,i)=>({region:regions[i],ok:x.status==='fulfilled',count:x.status==='fulfilled'?x.value.length:0}));
 const trends=r.flatMap(x=>x.status==='fulfilled'?x.value:[]);
 return NextResponse.json({updatedAt:new Date().toISOString(),trends,status,source:'Google Trends — Trending now (public RSS)',method:'Country-specific approximate Google Search interest. Not global news popularity, not verified news reporting. RSS is a limited snapshot.'},
  {headers:{'Cache-Control':'public, s-maxage=900, stale-while-revalidate=900'}});
}
