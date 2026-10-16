import {NextRequest,NextResponse} from 'next/server';
import {GOOGLE_WORLD_REGIONS,isRegion,mergeCountryTrends,parseGoogleTrends,type Trend,type TrendRegion,type TrendsResult} from '@/lib/trends';
export const runtime='nodejs';
export const revalidate=1800;
async function readGoogle(region:TrendRegion):Promise<Trend[]>{
 const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),8000);
 try{
  const response=await fetch('https://trends.google.com/trending/rss?geo='+region,{next:{revalidate:1800},signal:ctrl.signal,headers:{Accept:'application/rss+xml, application/xml, text/xml','User-Agent':'GLITCH/10.0'}});
  if(!response.ok)throw Error(`Google Trends HTTP ${response.status}`);
  return parseGoogleTrends((await response.text()).slice(0,1200000),region);
 }finally{clearTimeout(timer)}
}
export async function GET(request:NextRequest){
 if(request.nextUrl.searchParams.has('provider')&&request.nextUrl.searchParams.get('provider')!=='google')return NextResponse.json({error:'Μόνο οι τάσεις Google υποστηρίζονται.'},{status:400});
 const requested=request.nextUrl.searchParams.get('region')||'WORLD';
 if(!isRegion(requested))return NextResponse.json({error:'Μη έγκυρη περιοχή'},{status:400});
 const region=requested;const regions:TrendRegion[]=region==='WORLD'?GOOGLE_WORLD_REGIONS:[region];
 const settled=await Promise.allSettled(regions.map(readGoogle));
 const failed=regions.filter((_,i)=>settled[i].status==='rejected');
 const available=settled.flatMap(x=>x.status==='fulfilled'?x.value:[]);
 const status:TrendsResult['status']=failed.length===regions.length?'unavailable':failed.length?'partial':'ok';
 const out:TrendsResult={provider:'google',region,status,updatedAt:new Date().toISOString(),trends:region==='WORLD'?mergeCountryTrends(available):available,checkedRegions:regions,failedRegions:failed,
 message:region==='WORLD'?`Απάντησαν ${regions.length-failed.length}/${regions.length} περιφερειακές ροές αναζήτησης.`:'Τάσεις αναζητήσεων Google για την επιλεγμένη χώρα.',
 methodology:'Τάσεις αναζητήσεων Google ανά χώρα. Η παγκόσμια προβολή είναι δείγμα περιοχών και όχι ενιαία παγκόσμια κατάταξη.'};
 return NextResponse.json(out,{headers:{'Cache-Control':'public, s-maxage=1800, stale-while-revalidate=3600','X-Content-Type-Options':'nosniff'}});
}
