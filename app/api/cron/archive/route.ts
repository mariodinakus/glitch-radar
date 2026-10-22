import {NextRequest,NextResponse} from 'next/server';
import type {HeadlineRecord,HeadlineChange} from '@/lib/matrix-detection';
import {assessRevision,updateHeadlineHistory} from '@/lib/matrix-detection';
import {archiveCommand} from '@/lib/archive-redis';
import {getFeed} from '@/lib/sources';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
/** A scheduled sample of actual feed snapshots. It is not web-page revision verification. */
export async function GET(req:NextRequest){
 const key=process.env.CRON_SECRET;
 if(!key||req.headers.get('authorization')!=='Bearer '+key)return NextResponse.json({error:'Unauthorized'},{status:401});
 try{
  const [priorRaw,eventsRaw,feed]=await Promise.all([
   archiveCommand(['GET','glitch:archive:records:v1']),
   archiveCommand(['GET','glitch:archive:events:v1']),getFeed()
  ]);
  const prior=priorRaw?JSON.parse(String(priorRaw)):[],old=eventsRaw?JSON.parse(String(eventsRaw)):[];
  const history=updateHeadlineHistory(Array.isArray(prior)?prior as HeadlineRecord[]:[],feed.signals,feed.generatedAt);
  const relevant=history.changes.filter(c=>assessRevision(c.before,c.after).level==='substantive');
  const found=new Map<string,HeadlineChange>();
  if(Array.isArray(old))for(const event of old as HeadlineChange[]){
   if(event?.id&&event.after)found.set(event.id+'|'+event.after,event);
  }
  for(const event of relevant)found.set(event.id+'|'+event.after,event);
  const events=[...found.values()].sort((a,b)=>Date.parse(a.lastSeen)-Date.parse(b.lastSeen)).slice(-150);
  const ttl=90*24*60*60;
  await Promise.all([
   archiveCommand(['SET','glitch:archive:records:v1',JSON.stringify(history.records),'EX',ttl]),
   archiveCommand(['SET','glitch:archive:events:v1',JSON.stringify(events),'EX',ttl]),
   archiveCommand(['SET','glitch:archive:audit:v1',feed.generatedAt,'EX',ttl])
  ]);
  return NextResponse.json({ok:true,records:history.records.length,newFindings:relevant.length,storedFindings:events.length,auditedAt:feed.generatedAt});
 }catch{return NextResponse.json({error:'Archive backend not configured or upstream unavailable'},{status:503})}
}
