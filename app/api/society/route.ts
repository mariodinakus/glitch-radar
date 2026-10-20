import {NextRequest,NextResponse} from 'next/server';
import {SOCIAL_COUNTRIES,SOCIAL_INDICATORS} from '@/lib/society-indicators';
export const runtime='nodejs';
export const dynamic='force-dynamic';
type Row={indicator?:{id?:string};date?:string;value?:number|null};
export async function GET(req:NextRequest){
 const supplied=(req.nextUrl.searchParams.get('country')||'GR').toUpperCase();
 if(!SOCIAL_COUNTRIES.some(c=>c.id===supplied))return NextResponse.json({error:'Unsupported country'},{status:400});
 const ids=SOCIAL_INDICATORS.map(s=>s.code);
 const url='https://api.worldbank.org/v2/country/'+supplied+'/indicator/'+ids.join(';')+'?format=json&source=2&per_page=800&date=2017:2026';
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),14000);
 try{
  const res=await fetch(url,{signal:controller.signal,next:{revalidate:21600},headers:{Accept:'application/json'}});
  if(!res.ok)throw new Error('World Bank HTTP '+res.status);
  const data=await res.json() as [unknown,Row[]];
  if(!Array.isArray(data)||!Array.isArray(data[1]))throw new Error('World Bank series unavailable');
  const series=ids.map(code=>{
   const observations=data[1].filter(r=>r.indicator?.id===code&&typeof r.value==='number'&&Number.isFinite(r.value))
    .map(r=>({year:Number(r.date),value:r.value as number}))
    .filter(x=>Number.isInteger(x.year)).sort((a,b)=>b.year-a.year);
   return {code,current:observations[0]||null,previous:observations[1]||null};
  });
  return NextResponse.json({country:supplied,source:'World Bank – WDI / WGI',sourceUrl:'https://data.worldbank.org/',updatedAt:new Date().toISOString(),series},
    {headers:{'Cache-Control':'public, s-maxage=21600, stale-while-revalidate=86400'}});
 }catch{
  return NextResponse.json({error:'Τα δεδομένα της Παγκόσμιας Τράπεζας δεν είναι διαθέσιμα αυτή τη στιγμή.'},{status:502});
 }finally{clearTimeout(timer)}
}
