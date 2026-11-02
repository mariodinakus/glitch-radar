/**
 * Public official publication calendars. A release is a scheduled publication,
 * not a forecast of its value. Times are retained as ISO UTC instants.
 */
export type CalendarSource='BLS'|'BEA';
export type CalendarEvent={id:string;title:string;at:string;precision:'minute'|'date';source:CalendarSource;region:'US';importance:'high'|'medium';sourceUrl:string;watch:string};
const OFFICIAL:Record<CalendarSource,string>={
 BLS:'https://www.bls.gov/schedule/news_release/bls.ics',
 BEA:'https://www.bea.gov/news/schedule/ics/online-calendar-subscription.ics'
};
export const CALENDAR_URLS=OFFICIAL;
const relevant=/employment situation|consumer price index|producer price index|employment cost index|job openings and labor turnover|productivity and costs|import and export price|real earnings|gross domestic product|personal income and outlays|international trade in goods and services|corporate profits|international transactions and investment position/i;
const priority=/employment situation|consumer price index|gross domestic product|personal income and outlays|international trade in goods and services|employment cost index|producer price index|job openings and labor turnover/i;
function timezoneOffsetMinutes(year:number,month:number,day:number,zone:string):number{
 const dt=new Date(Date.UTC(year,month-1,day,12));
 const str=new Intl.DateTimeFormat('en-US',{timeZone:zone,timeZoneName:'shortOffset',hour:'2-digit'}).formatToParts(dt).find(x=>x.type==='timeZoneName')?.value||'GMT';
 const match=str.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
 if(!match)return 0;
 return (match[1]==='+'?1:-1)*(Number(match[2])*60+Number(match[3]||0));
}
export function parseIcsDate(value:string,zone='America/New_York'):{at:string;precision:'minute'|'date'}|null{
 const v=value.trim(),m=v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
 if(!m)return null;
 const [yr,mo,day,hr,mi,sec]=[Number(m[1]),Number(m[2]),Number(m[3]),Number(m[4]||0),Number(m[5]||0),Number(m[6]||0)];
 if(mo<1||mo>12||day<1||day>31||hr>23||mi>59||sec>59)return null;
 const hasTime=!!m[4];
 const offset=hasTime&&!m[7]?timezoneOffsetMinutes(yr,mo,day,zone):0;
 const utc=Date.UTC(yr,mo-1,day,hasTime?hr:12,hasTime?mi:0,hasTime?sec:0)-offset*60000;
 const d=new Date(utc);
 if(!Number.isFinite(d.valueOf())||new Date(Date.UTC(yr,mo-1,day)).getUTCDate()!==day)return null;
 return {at:d.toISOString(),precision:hasTime?'minute':'date'};
}
function impactFor(title:string):string{
 if(/consumer price index|producer price index|personal income and outlays|real earnings/i.test(title))return 'Prices, inflation expectations and interest-rate sensitivity';
 if(/employment situation|job openings|employment cost/i.test(title))return 'Labour market, bonds and monetary-policy expectations';
 if(/gross domestic product|productivity|corporate profits/i.test(title))return 'Growth outlook, equities and bond yields';
 if(/trade|transactions|export|import/i.test(title))return 'Trade, exchange rates and growth expectations';
 return 'Potential impact depends on the actual release and prior expectations';
}
/** ICS line unfolding plus the publisher's own DTSTART time zone. */
export function parseOfficialCalendar(ics:string,source:CalendarSource,now=new Date(),horizonDays=45):CalendarEvent[]{
 const unfolded=ics.replace(/\r\n[ \t]|\n[ \t]/g,'').replace(/\r/g,'');
 const blocks=unfolded.split(/BEGIN:VEVENT(?:\n|$)/).slice(1);
 const cutoff=now.getTime()+horizonDays*86400000;const seen=new Set<string>();const out:CalendarEvent[]=[];
 for(const block of blocks){
  const body=block.split(/\nEND:VEVENT/)[0]||'';
  const row=body.split('\n');
  const summary=row.find(x=>x.startsWith('SUMMARY:'))?.slice(8).replace(/\\([,;\\])/g,'$1').replace(/\\n/g,' ')?.trim();
  const line=row.find(x=>/^DTSTART(?:;[^:]*)?:/.test(x));
  if(!summary||!line||!relevant.test(summary))continue;
  const [head,...rest]=line.split(':');const value=rest.join(':');
  const zone=head.match(/TZID=([^;:]+)/)?.[1]||'America/New_York';
  const parsed=parseIcsDate(value,zone);
  if(!parsed)continue;
  const ts=Date.parse(parsed.at);
  if(ts<now.getTime()-60000||ts>cutoff)continue;
  const key=source+'|'+summary.toLowerCase()+'|'+parsed.at;if(seen.has(key))continue;seen.add(key);
  out.push({id:key,title:summary,at:parsed.at,precision:parsed.precision,source,region:'US',importance:priority.test(summary)?'high':'medium',sourceUrl:OFFICIAL[source],watch:impactFor(summary)});
 }
 return out.sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
}
export function parseBeaJson(payload:unknown,now=new Date(),horizonDays=45):CalendarEvent[]{
 if(!payload||typeof payload!=='object'||Array.isArray(payload))return [];
 const cutoff=now.getTime()+horizonDays*86400000;
 const out:CalendarEvent[]=[];const seen=new Set<string>();
 for(const [title,info] of Object.entries(payload as Record<string,unknown>)){
  if(!relevant.test(title)||!info||typeof info!=='object')continue;
  const dates=(info as {release_dates?:unknown}).release_dates;
  if(!Array.isArray(dates))continue;
  for(const date of dates){
   if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(date))continue;
   const ms=Date.parse(date);
   if(!Number.isFinite(ms)||ms<now.getTime()-60000||ms>cutoff)continue;
   const at=new Date(ms).toISOString(),key='BEA|'+title.toLowerCase()+'|'+at;
   if(seen.has(key))continue;seen.add(key);
   out.push({id:key,title,at,precision:'minute',source:'BEA',region:'US',importance:priority.test(title)?'high':'medium',sourceUrl:'https://www.bea.gov/news/schedule/',watch:impactFor(title)});
  }
 }
 return out.sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
}
export function daysUntil(iso:string,now=new Date()):number{return Math.max(0,Math.ceil((Date.parse(iso)-now.getTime())/86400000))}
