import {NextResponse} from 'next/server';
import {extractWdiHistory,MACRO_INDICATORS,MACRO_REGIONS} from '@/lib/economy-health';
import type {MacroCode,MacroRegion,MacroRow,WorldBankDatum} from '@/lib/economy-health';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=30;

/**
 * WDI multi-indicator queries may return incomplete indicator combinations.
 * Fetch ONE indicator per request (6 independent official API requests), across
 * the selected 5 economies. One unavailable indicator cannot blank the others.
 */
export async function GET(){
 const regions=MACRO_REGIONS.map(r=>r.code);
 const codes=MACRO_INDICATORS.map(i=>i.code);
 const latestYear=new Date().getUTCFullYear();
 const upstream=await Promise.allSettled(codes.map(async code=>{
  const ctl=new AbortController();
  const timeout=setTimeout(()=>ctl.abort(),12500);
  try{
   const url='https://api.worldbank.org/v2/country/'+regions.join(';')+'/indicator/'+code+
    '?format=json&source=2&date='+(latestYear-10)+':'+latestYear+'&per_page=250';
   const response=await fetch(url,{
    signal:ctl.signal,
    headers:{Accept:'application/json'},
    next:{revalidate:21600}
   });
   if(!response.ok)throw Error('HTTP '+response.status);
   const payload=await response.json() as unknown;
   if(!Array.isArray(payload)||!Array.isArray(payload[1]))
    throw Error('Invalid World Bank payload');
   return {code,observations:payload[1] as WorldBankDatum[]};
  }finally{clearTimeout(timeout)}
 }));
 const observations=new Map<MacroCode,WorldBankDatum[]>();
 const failures:MacroCode[]=[];
 for(let i=0;i<upstream.length;i++){
  const item=upstream[i];
  if(item.status==='fulfilled')observations.set(item.value.code,item.value.observations);
  else failures.push(codes[i]);
 }
 const output={} as Record<MacroRegion,MacroRow[]>;
 for(const region of regions){
  output[region]=codes.map(code=>{
   const history=extractWdiHistory(observations.get(code)||[],region,code,latestYear);
   return {code,history,current:history[0]||null,previous:history[1]||null};
  });
 }
 // A real outage or malformed response is not silently converted into a
 // fabricated "healthy" or "unhealthy" economy.
 const anyPublished=regions.some(region=>output[region].some(row=>row.current));
 if(!anyPublished){
  console.error('[economy-health] no usable official observations; failed indicators:',failures.join(','));
  return NextResponse.json({error:'Official World Bank macro indicators are temporarily unavailable',failedIndicators:failures},
   {status:503,headers:{'Cache-Control':'no-store'}});
 }
 if(failures.length)console.warn('[economy-health] partial WDI outage:',failures.join(','));
 return NextResponse.json({
  source:'World Bank · World Development Indicators',
  updatedAt:new Date().toISOString(),
  regions:output,
  missingIndicators:failures,
  methodology:'Official annual published observations, not real-time statistics. Country ISO-3 and World Bank ISO-2 aggregate identifiers are normalized. Each indicator is requested separately. Editorial status bands are heuristic, not a validated composite economic-health score; comparisons require context.'
 },{headers:{'Cache-Control':'public, s-maxage=21600, stale-while-revalidate=43200'}});
}
