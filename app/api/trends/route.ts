import {NextRequest,NextResponse} from 'next/server';
import {GOOGLE_WORLD_REGIONS,REGIONS,isRegion,mergeCountryTrends,parseGoogleTrends,parseXTrends,parseGetXapiTrends,type XBackend,type Trend,type TrendProvider,type TrendRegion,type TrendsResult} from '@/lib/trends';
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
const backend=():XBackend=>process.env.X_TRENDS_PROVIDER==='getxapi'?'getxapi':'official';
const xConfigured=()=>process.env.X_TRENDS_ENABLED==='true'&&!!(backend()==='getxapi'?process.env.GETXAPI_KEY:process.env.X_BEARER_TOKEN);
async function readX(region:TrendRegion):Promise<Trend[]>{
 if(!xConfigured())throw new Error('X trends require an explicitly enabled API credential');
 const chosen=backend();const token=chosen==='getxapi'?process.env.GETXAPI_KEY!:process.env.X_BEARER_TOKEN!;
 const woeid=REGIONS.find(x=>x.id===region)?.woeid||1;
 const ctrl=new AbortController();const timeout=setTimeout(()=>ctrl.abort(),8000);
 try{
  // Both services are metered. A one-hour Next.js fetch cache limits repeat requests per region.
  const address=chosen==='getxapi'?`https://api.getxapi.com/twitter/trends?woeid=${woeid}&count=30`:`https://api.x.com/2/trends/by/woeid/${woeid}?max_trends=30&trend.fields=trend_name,tweet_count`;
  const res=await fetch(address,{next:{revalidate:3600},signal:ctrl.signal,headers:{Authorization:`Bearer ${token}`,Accept:'application/json'}});
  if(!res.ok)throw Error(`X trends provider HTTP ${res.status}`);
  const body=await res.json();
  return chosen==='getxapi'?parseGetXapiTrends(body,region):parseXTrends(body,region);
 }finally{clearTimeout(timeout)}
}
export async function GET(request:NextRequest){
 const q=request.nextUrl.searchParams;
 const provider:TrendProvider=q.get('provider')==='x'?'x':'google';const requested=q.get('region')||'WORLD';
 if(!isRegion(requested))return NextResponse.json({error:'Unsupported region'},{status:400});
 const region=requested;
 let out:TrendsResult;
 if(provider==='x'){
  if(!xConfigured())out=empty('x',region,'unconfigured','X API is not connected. Use X_TRENDS_PROVIDER=official with X_BEARER_TOKEN or X_TRENDS_PROVIDER=getxapi with GETXAPI_KEY, and set X_TRENDS_ENABLED=true to accept metered requests.');
  else try{const trends=await readX(region);out={...empty('x',region,'ok',backend()==='official'?'Official X trends by WOEID.':'X trends supplied by third-party GetXAPI (not directly by X).',[region]),backend:backend(),trends}}
  catch(e){out={...empty('x',region,'unavailable',e instanceof Error?e.message:'X API unavailable',[region],[region]),backend:backend()}}
 }else{
  const regions:TrendRegion[]=region==='WORLD'?GOOGLE_WORLD_REGIONS:[region];
  const settled=await Promise.allSettled(regions.map(readGoogle));
  const failed=regions.filter((_,i)=>settled[i].status==='rejected');
  const fetched=settled.flatMap(r=>r.status==='fulfilled'?r.value:[]);
  const trends=region==='WORLD'?mergeCountryTrends(fetched):fetched;
  out={...empty('google',region,failed.length===regions.length?'unavailable':failed.length?'partial':'ok',region==='WORLD'?`Regional sample: ${regions.length-failed.length}/${regions.length} country feeds available. Cross-country presence is NOT a worldwide trend ranking.`:'Google Trends RSS for the selected country.',regions,failed),trends};
 }
 return NextResponse.json(out,{headers:{'Cache-Control':provider==='x'?'public, s-maxage=3600, stale-while-revalidate=3600':'public, s-maxage=1800, stale-while-revalidate=3600','X-Content-Type-Options':'nosniff'}});
}
