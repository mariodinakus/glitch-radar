import {NextResponse} from 'next/server';
import {getFeed} from '@/lib/sources';
export const runtime='nodejs';
export const dynamic='force-dynamic';
// Read-only NEXUS bridge. This uses the same feed aggregator and source metadata as GLITCH.
export async function GET(){
 const base={schema:'nexus.v1',appId:'glitchradargithub',name:'GLITCH',url:'https://glitch-radar-github.vercel.app',source:'GLITCH verified feed',capabilities:['world-news','science','economy','space-weather'],notifications:[] as Array<{id:string;title:string;message:string;severity:string;time:string}>,status:'unavailable',data:null as null|object};
 try{
  const feed=await getFeed();const now=Date.now();const all=Array.isArray(feed.signals)?feed.signals:[];
  // Publisher and reported-source entries only. Editorial priority is not emergency severity.
  const recent=all.filter(s=>['publisher','reported'].includes(s.confidence)&&Number.isFinite(Date.parse(s.timestamp))&&now-Date.parse(s.timestamp)<6*3600000&&now>=Date.parse(s.timestamp));
  const featured=recent.filter(s=>Number(s.score)>=80).slice(0,3);
  const liveSources=(feed.sources||[]).filter(x=>x.ok).length;
  const response={...base,status:liveSources?'ok':'unavailable',data:{summary:`${recent.length} sourced signals in the last 6 hours`,recentCount:recent.length,featuredCount:featured.length,sourceFeedsOnline:liveSources,asOf:feed.generatedAt,source:'GLITCH feed · publisher/reported entries; editorial scores are not risk probabilities'},notifications:featured.map(s=>({id:`signal:${s.id}`,title:String(s.title).slice(0,115),message:`${String(s.summary).slice(0,170)} · ${String(s.source).slice(0,50)}`,severity:'notice',time:s.timestamp}))};
  return NextResponse.json(response,{headers:{'Cache-Control':'public, s-maxage=180, stale-while-revalidate=120'}})
 }catch{return NextResponse.json({...base,note:'GLITCH source aggregation unavailable, no stories invented.'},{headers:{'Cache-Control':'public, s-maxage=60'}})}
}