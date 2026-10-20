import {NextRequest,NextResponse} from 'next/server';
import {SOCIAL_INDICATORS} from '@/lib/society-indicators';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=30;

type Observation={year:number;value:number;coverage?:number};
type Row={indicator?:{id?:string};country?:{id?:string;value?:string};date?:string;value?:number|null};
type Country={iso2Code?:string;region?:{id?:string}};
const empty=(code:string)=>({code,current:null as Observation|null,previous:null as Observation|null,scope:'world' as const});
async function wb(url:string){
 const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),12500);
 try{
  const r=await fetch(url,{signal:ctrl.signal,next:{revalidate:43200},headers:{Accept:'application/json'}});
  if(!r.ok)throw Error('WB HTTP '+r.status);
  const json=await r.json() as unknown;
  if(!Array.isArray(json)||!Array.isArray(json[1]))throw Error('WB invalid data');
  return json[1] as Row[];
 }finally{clearTimeout(timer)}
}
function annual(series:Row[],year?:number):Observation|null{
 const x=series.filter(r=>typeof r.value==='number'&&Number.isFinite(r.value)&&Number.isInteger(Number(r.date)))
  .map(r=>({year:Number(r.date),value:r.value as number})).sort((a,b)=>b.year-a.year);
 return year===undefined?x[0]||null:x.find(z=>z.year===year)||null;
}
/** Returns independently sourced WORLD aggregates, plus explicitly described unweighted
 * cross-country governance averages. WGI country scores are NOT summed/weighted by population. */
export async function GET(req:NextRequest){
 if(req.nextUrl.searchParams.has('country')&&req.nextUrl.searchParams.get('country')!=='WLD')
  return NextResponse.json({error:'This dashboard provides world-level measures only.'},{status:400});
 const indicatorList=SOCIAL_INDICATORS;
 const countriesPromise=wb('https://api.worldbank.org/v2/country?format=json&per_page=400')
  .then(rows=>(rows as unknown as Country[]).filter(c=>c.iso2Code&&c.iso2Code.length===2&&c.region?.id!=='NA').map(c=>c.iso2Code as string))
  .catch(()=>[] as string[]);
 const fetched=await Promise.allSettled(indicatorList.map(async i=>{
  const governance=i.group==='governance';
  const where=governance?'all':'WLD';
  const date=governance?'2023:2026':'2016:2026';
  const url='https://api.worldbank.org/v2/country/'+where+'/indicator/'+i.code+'?format=json&date='+date+'&per_page='+ (governance?'1800':'40');
  const all=await wb(url);
  if(!governance){const entries=all.filter(r=>r.indicator?.id===i.code);
   const sorted=entries.filter(r=>typeof r.value==='number').sort((a,b)=>Number(b.date)-Number(a.date));
   return {code:i.code,current:annual(sorted),previous:annual(sorted,Number(sorted[0]?.date)-1),scope:'world' as const};
  }
  const known=new Set(await countriesPromise);
  if(!known.size)throw Error('Country metadata unavailable');
  const entries=all.filter(r=>r.indicator?.id===i.code&&known.has(r.country?.id||'')
    &&typeof r.value==='number'&&Number.isFinite(r.value));
  const grouped=new Map<number,number[]>();
  for(const x of entries){const year=Number(x.date);if(!Number.isInteger(year))continue;const v=grouped.get(year)||[];v.push(x.value as number);grouped.set(year,v)}
  // Ignore incomplete latest years with just a handful of national reports.
  const years=[...grouped.entries()].filter(([,rows])=>rows.length>=60).map(([year])=>year).sort((a,b)=>b-a);
  const mean=(year?:number):Observation|null=>{
   if(year===undefined)return null;
   const values=grouped.get(year)||[];
   return values.length?{year,value:values.reduce((a,b)=>a+b,0)/values.length,coverage:values.length}:null;
  };
  return {code:i.code,current:mean(years[0]),previous:mean(years[1]),scope:'country-mean' as const};
 }));
 const series=fetched.map((v,i)=>v.status==='fulfilled'?v.value:empty(indicatorList[i].code));
 const available=series.filter(s=>s.current!==null).length;
 if(!available)return NextResponse.json({error:'World Bank global data unavailable',series},{status:502});
 return NextResponse.json({country:'WLD',source:'World Bank World Development Indicators and Worldwide Governance Indicators',
  updatedAt:new Date().toISOString(),available,series,method:'World Bank WLD aggregates; WGI unweighted means of reporting economies, not an official global score.'},
  {headers:{'Cache-Control':'public, s-maxage=43200, stale-while-revalidate=86400'}});
}
