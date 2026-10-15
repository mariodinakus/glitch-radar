import {NextRequest,NextResponse} from 'next/server';
import {GOOGLE_WORLD_REGIONS,REGIONS,isRegion,mergeCountryTrends,parseGoogleTrends,parseXTrends,type Trend,type TrendProvider,type TrendRegion,type TrendsResult} from '@/lib/trends';
export const runtime='nodejs';
// CDN cache is best effort; large-scale polling of the metered X API should use a persistent cache + budget cap.
export const revalidate=1800;
const empty=(provider:TrendProvider,region:TrendRegion,status:TrendsResult['status'],message:string,checkedRegions:TrendRegion[]=[],failedRegions:TrendRegion[]=[]):TrendsResult=>({provider,region,status,updatedAt:new Date().toISOString(),trends:[],checkedRegions,failedRegions,message,methodology:provider==='x'?'Official X Trends by WOEID. X rankings are platform-specific and do not measure event importance.':'Google Search trending queries from the selected regional RSS feeds. Not X trends and not representative of worldwide opinion.'});
async function readGoogle(region:TrendRegion):Promise<Trend[]>{
 const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),7000);
 try{const res=await fetch('https://trends.google.com/trending/rss?geo='+region,{next:{revalidate:1800},signal:ctrl.signal,headers:{'Accept':'application/rss+xml, application/xml, text/xml','User-Agent':'GLITCH/7.0 trends research dashboard'}});
  if(!res.ok)throw Error(`Google Trends HTTP ${res.status}`);
  const xml=(await res.text()).slice(0,1200000);return parseGoogleTrends(xml,region);
 }finally{clearTimeout(timeout)}
}
async function readX(region:TrendRegion):Promise<Trend[]>{
 const token=process.env.X_BEARER_TOKEN;
 if(!token||process.env.X_TRENDS_ENABLED!=='true')throw new Error('X developer token and explicit X_TRENDS_ENABLED=true required');
 const woeid=REGIONS.find(x=>x.id===region)?.woeid||1;
 const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),8000);
 try{const res=await fetch(`https://api.x.com/2/trends/by/woeid/${woeid}?max_trends=30&trend.fields=trend_name,tweet_count`,{next:{revalidate:3600},signal:ctrl.signal,headers:{Authorization:`Bearer ${token}`,Accept:'application/json'}});
  if(!res.ok)throw Error(`X API HTTP ${res.status}`);
  return parseXTrends(await res.json(),region);
 }finally{clearTimeout(timeout)}
}
export async function GET(request:NextRequest){
 const q=request.nextUrl.searchParams;
 const provider:TrendProvider=q.get('provider')==='x'?'x':'google';const requested=q.get('region')||'WORLD';
 if(!isRegion(requested))return NextResponse.json({error:'Unsupported region'},{status:400});
 const region=requested;
 let out:TrendsResult;
 if(provider==='x'){
  if(!process.env.X_BEARER_TOKEN||process.env.X_TRENDS_ENABLED!=='true')out=empty('x',region,'unconfigured','Official X API is not connected. Add X_BEARER_TOKEN and opt in with X_TRENDS_ENABLED=true to enable metered requests.');
  else try{const trends=await readX(region);out={...empty('x',region,'ok','Live X trends by geographic WOEID. Some topics have no tweet count.',[region]),trends}}
  catch(e){out=empty('x',region,'unavailable',e instanceof Error?e.message:'X API unavailable',[region],[region])}
 }else{
  const regions:TrendRegion[]=region==='WORLD'?GOOGLE_WORLD_REGIONS:[region];
  const settled=await Promise.allSettled(regions.map(readGoogle));
  const failed=regions.filter((_,i)=>settled[i].status==='rejected');
  const fetched=settled.flatMap(r=>r.status==='fulfilled'?r.value:[]);
  const trends=region==='WORLD'?mergeCountryTrends(fetched):fetched;
  out={...empty('google',region,failed.length===regions.length?'unavailable':failed.length?'partial':'ok',region==='WORLD'?`Regional sample: ${regions.length-failed.length}/${regions.length} country feeds available. Cross-country presence is NOT a worldwide trend ranking.`:'Google Trends RSS for the selected country.',regions,failed),trends};
 }
 return NextResponse.json(out,{headers:{'Cache-Control':'public, s-maxage=1800, stale-while-revalidate=3600','X-Content-Type-Options':'nosniff'}});
}
