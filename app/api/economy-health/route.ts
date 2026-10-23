import {NextResponse} from 'next/server';
import {MACRO_INDICATORS,MACRO_REGIONS} from '@/lib/economy-health';
import type {MacroCode,MacroObservation,MacroRegion,MacroRow} from '@/lib/economy-health';
export const runtime='nodejs';export const dynamic='force-dynamic';export const maxDuration=30;
type WBRow={country?:{id?:string};indicator?:{id?:string};date?:string;value?:number|null};
export async function GET(){
 const regions=MACRO_REGIONS.map(x=>x.code),codes=MACRO_INDICATORS.map(x=>x.code),year=new Date().getUTCFullYear();
 // One official multi-country and multi-indicator WDI call. No fabricated real-time observations.
 const url='https://api.worldbank.org/v2/country/'+regions.join(';')+'/indicator/'+codes.join(';')+'?format=json&source=2&date='+(year-10)+':'+year+'&per_page=1500';
 const ctl=new AbortController(),timeout=setTimeout(()=>ctl.abort(),14000);
 try{
  const r=await fetch(url,{signal:ctl.signal,next:{revalidate:43200},headers:{Accept:'application/json'}});
  if(!r.ok)throw Error('World Bank unavailable');
  const json=await r.json() as unknown;
  if(!Array.isArray(json)||!Array.isArray(json[1]))throw Error('Unexpected data shape');
  const observations=json[1] as WBRow[];
  const output={} as Record<MacroRegion,MacroRow[]>;
  for(const region of regions){
   output[region]=codes.map(code=>{
    const history:MacroObservation[]=observations.filter(x=>x.country?.id===region&&x.indicator?.id===code&&typeof x.value==='number'&&Number.isFinite(x.value))
     .map(x=>({year:Number(x.date),value:x.value as number})).filter(x=>Number.isInteger(x.year)&&x.year<=year).sort((a,b)=>b.year-a.year).slice(0,9);
    return {code:code as MacroCode,history,current:history[0]||null,previous:history[1]||null};
   });
  }
  if(!regions.some(region=>output[region].some(r=>r.current)))throw Error('No published observations');
  return NextResponse.json({source:'World Bank World Development Indicators',updatedAt:new Date().toISOString(),regions:output,methodology:'Annual published observations, not live macro data. Thresholds are transparent GLITCH heuristics, not validated economic health scores; indicators and labor-market definitions require context.'},
    {headers:{'Cache-Control':'public, s-maxage=43200, stale-while-revalidate=86400'}});
 }catch{return NextResponse.json({error:'World Bank data temporarily unavailable'}, {status:503,headers:{'Cache-Control':'no-store'}})}finally{clearTimeout(timeout)}
}