import {NextRequest, NextResponse} from 'next/server';
import {topicTokens} from '@/lib/blindspots';
export const runtime='nodejs';
export const dynamic='force-dynamic';

type Gdelt={timeline?:{series?:string;data?:{date:string;value:number;norm?:number}[]}[]};
/** On-demand comparison only. Search recall depends heavily on token choice. */
export async function GET(request:NextRequest){
 const title=(request.nextUrl.searchParams.get('title')||'').trim();
 if(title.length<8||title.length>190)return NextResponse.json({error:'invalid_title'},{status:400});
 const tokens=topicTokens(title).filter(t=>/^[\p{L}]{4,25}$/u.test(t)).slice(0,3);
 if(tokens.length<2)return NextResponse.json({error:'insufficient_terms',message:'Not enough distinctive terms for a meaningful search'},{status:422});
 const query=tokens.join(' ');
 const u=new URL('https://api.gdeltproject.org/api/v2/doc/doc');
 u.searchParams.set('query',query);u.searchParams.set('mode','timelinevolraw');u.searchParams.set('format','json');u.searchParams.set('timespan','2d');
 const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),9000);
 try{const response=await fetch(u.toString(),{signal:ctrl.signal,next:{revalidate:1800},headers:{Accept:'application/json'}});
  if(!response.ok)return NextResponse.json({error:'upstream',status:response.status},{status:503});
  const raw=(await response.text()).slice(0,350000);
  let data:Gdelt;try{data=JSON.parse(raw) as Gdelt}catch{return NextResponse.json({error:'unavailable',message:'Global coverage query returned no valid JSON'},{status:503})}
  const rows=(data.timeline||[]).flatMap(x=>x.data||[]);
  if(!rows.length)return NextResponse.json({error:'no_data',query,terms:tokens},{status:503});
  const matches=rows.reduce((acc,x)=>acc+(Number.isFinite(x.value)?x.value:0),0);
  const total=rows.reduce((acc,x)=>acc+(Number.isFinite(x.norm)?Number(x.norm):0),0);
  return NextResponse.json({provider:'GDELT DOC 2.0',query,terms:tokens,window:'48h',matchedArticles:Math.round(matches),monitoredArticles:Math.round(total),coveragePercent:total>0?Number((100*matches/total).toFixed(5)):null,methodology:'Phrase/keyword-based query of the GDELT monitored news corpus, not a complete global census. Search terms may miss synonyms or different languages. Article count does not confirm factual accuracy or censorship.',sourceUrl:u.toString(),retrievedAt:new Date().toISOString()},{headers:{'Cache-Control':'public, s-maxage=1800, stale-while-revalidate=3600'}});
 }catch{return NextResponse.json({error:'unavailable',message:'GDELT did not respond in time'},{status:503})}
 finally{clearTimeout(timer)}
}
