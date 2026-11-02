import {NextResponse} from 'next/server';
import {CALENDAR_URLS,parseOfficialCalendar,parseBeaJson,type CalendarEvent,type CalendarSource} from '@/lib/economic-calendar';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=30;
const BEA_JSON='https://apps.bea.gov/API/signup/release_dates.json';
async function loadText(url:string):Promise<string>{
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),9000);
 try{
  const r=await fetch(url,{signal:ctl.signal,next:{revalidate:3600},headers:{Accept:'text/calendar,text/plain,*/*','User-Agent':'GLITCH world-intelligence public releases/1.0'}});
  if(!r.ok)throw Error('HTTP '+r.status);
  const content=await r.text();
  if(!content.includes('BEGIN:VCALENDAR'))throw Error('Invalid calendar');
  return content.slice(0,1000000);
 }finally{clearTimeout(timer)}
}
async function getBea(now:Date):Promise<CalendarEvent[]>{
 try{return parseOfficialCalendar(await loadText(CALENDAR_URLS.BEA),'BEA',now)}
 catch{
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),9000);
  try{
   const r=await fetch(BEA_JSON,{signal:ctl.signal,next:{revalidate:3600},headers:{Accept:'application/json'}});
   if(!r.ok)throw Error('BEA fallback '+r.status);
   return parseBeaJson(await r.json() as unknown,now);
  }finally{clearTimeout(timer)}
 }
}
export async function GET(){
 const now=new Date();
 const names:CalendarSource[]=['BLS','BEA'];
 const settled=await Promise.allSettled([loadText(CALENDAR_URLS.BLS).then(s=>parseOfficialCalendar(s,'BLS',now)),getBea(now)]);
 const sources=names.map((source,i)=>({name:source,status:settled[i].status==='fulfilled'?'ok' as const:'unavailable' as const,url:source==='BEA'?'https://www.bea.gov/news/schedule/':'https://www.bls.gov/schedule/news_release/'}));
 const events=settled.flatMap(x=>x.status==='fulfilled'?x.value:[])
  .sort((a,b)=>Date.parse(a.at)-Date.parse(b.at)||a.title.localeCompare(b.title)).slice(0,70);
 return NextResponse.json({
  generatedAt:now.toISOString(),horizonDays:45,events,sources,
  methodology:'Official scheduled U.S. publications only (BLS and BEA). Times shown are converted to your locale. Dates may change or be postponed. An upcoming release is NOT an economic prediction, and this is NOT a complete global calendar.'
 },{headers:{'Cache-Control':'public, s-maxage=3600, stale-while-revalidate=3600'}});
}
