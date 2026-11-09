/** Distinguish a published release period from the time our API was checked. */
export function isMacroPeriodOutdated(period:string,asOf:number,months=4):boolean{
 const m=/^(20\d{2})-(0[1-9]|1[0-2])$/.exec(period);
 if(!m||!Number.isFinite(asOf)||asOf<=0)return true;
 const date=new Date(asOf);
 const delta=(date.getUTCFullYear()-Number(m[1]))*12+date.getUTCMonth()+1-Number(m[2]);
 return delta>=months||delta< -1;
}
export type MacroNowRow={id:string;title:string;value:number;unit:'%'|'thousand';period:string;source:'BLS'|'ECB';previous:number|null;description:string;sourceUrl:string};
type BlsObservation={year:string;period:string;value:string};
type BlsSeries={seriesID:string;data:BlsObservation[]};
type BlsResponse={status?:string;Results?:{series?:BlsSeries[]}};
const BLS='https://api.bls.gov/publicAPI/v1/timeseries/data/';
const ECB='https://data-api.ecb.europa.eu/service/data/ICP/M.U2+GR.N.000000.4.ANR?lastNObservations=3&format=csvdata';
const blsLabels=['CUUR0000SA0','LNS14000000','CES0000000001'] as const;
function parseObservations(rows:BlsObservation[]):{period:string;value:number}[]{
 return rows.filter(x=>/^M(0[1-9]|1[0-2])$/.test(x.period)&&/^\d{4}$/.test(x.year)&&Number.isFinite(Number(x.value))).map(x=>({period:x.year+'-'+x.period.slice(1),value:Number(x.value)})).sort((a,b)=>b.period.localeCompare(a.period));
}
export function parseBls(payload:unknown):MacroNowRow[]{
 const data=payload as BlsResponse;
 if(!data||data.status!=='REQUEST_SUCCEEDED'||!Array.isArray(data.Results?.series))return [];
 const rows=new Map<string,{period:string;value:number}[]>();
 for(const s of data.Results.series)if(blsLabels.includes(s.seriesID as typeof blsLabels[number]))rows.set(s.seriesID,parseObservations(s.data||[]));
 const result:MacroNowRow[]=[];
 const cpi=rows.get('CUUR0000SA0')||[];
 if(cpi.length>=13){
  const prior=cpi.find(x=>Number(x.period.slice(0,4))===Number(cpi[0].period.slice(0,4))-1&&x.period.slice(5)===cpi[0].period.slice(5));
  if(prior&&prior.value>0)result.push({id:'us-cpi',title:'US CPI inflation (YoY, NSA)',value:100*(cpi[0].value/prior.value-1),unit:'%',period:cpi[0].period,source:'BLS',previous:null,description:'Calculated annual change from published CPI-U all-items index, not a forecast.',sourceUrl:'https://www.bls.gov/cpi/'});
 }
 const un=rows.get('LNS14000000')||[];
 if(un.length)result.push({id:'us-unemployment',title:'US unemployment rate (SA)',value:un[0].value,unit:'%',period:un[0].period,source:'BLS',previous:un[1]?.value??null,description:'Official seasonally adjusted civilian unemployment rate.',sourceUrl:'https://www.bls.gov/news.release/empsit.toc.htm'});
 const jobs=rows.get('CES0000000001')||[];
 if(jobs.length>=2)result.push({id:'us-jobs',title:'US nonfarm payroll change (SA)',value:jobs[0].value-jobs[1].value,unit:'thousand',period:jobs[0].period,source:'BLS',previous:null,description:'Month-over-month change, thousands of jobs; revisions can change prior values.',sourceUrl:'https://www.bls.gov/news.release/empsit.toc.htm'});
 return result;
}
function csvCells(row:string):string[]{
 const cells:string[]=[];let value='',quoted=false;
 for(let i=0;i<row.length;i++){const c=row[i];if(c==='"'){if(quoted&&row[i+1]==='"'){value+='"';i++}else quoted=!quoted}else if(c===','&&!quoted){cells.push(value);value=''}else value+=c}
 cells.push(value);return cells;
}
export function parseEcb(csv:string):MacroNowRow[]{
 const lines=csv.replace(/\r/g,'').split('\n').filter(Boolean);
 if(lines.length<2)return [];
 const headers=csvCells(lines[0]);
 const area=headers.indexOf('REF_AREA'),time=headers.indexOf('TIME_PERIOD'),value=headers.indexOf('OBS_VALUE');
 if(area<0||time<0||value<0)return [];
 const latest=new Map<string,{period:string;value:number}>();
 for(const line of lines.slice(1)){
  const cols=csvCells(line);
  const region=cols[area],period=cols[time],v=Number(cols[value]);
  if(!['U2','GR'].includes(region)||!/^20\d\d-(0[1-9]|1[0-2])$/.test(period)||!Number.isFinite(v)||!cols[value]?.trim())continue;
  if(!latest.has(region)||period>latest.get(region)!.period)latest.set(region,{period,value:v});
 }
 return [...latest].map(([region,x])=>({id:region==='U2'?'ea-hicp':'gr-hicp',title:region==='U2'?'Euro area HICP inflation (YoY)':'Greece HICP inflation (YoY)',value:x.value,unit:'%' as const,period:x.period,source:'ECB' as const,previous:null,description:'Published harmonised consumer price inflation, annual rate of change (ECB/Eurostat).',sourceUrl:'https://data.ecb.europa.eu/'}));
}
export async function loadMacroNow():Promise<{rows:MacroNowRow[];sources:{name:'BLS'|'ECB';status:'ok'|'unavailable'}[]}>{
 const bls=async()=>{
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),8000);
  try{
   const response=await fetch(BLS,{method:'POST',body:JSON.stringify({seriesid:[...blsLabels]}),headers:{'Content-Type':'application/json','Accept':'application/json'},signal:ctl.signal,next:{revalidate:7200}});
   if(!response.ok)throw Error('BLS HTTP '+response.status);
   const payload=await response.json() as unknown;
   const result=parseBls(payload);if(!result.length)throw Error('BLS unavailable');
   return result;
  }finally{clearTimeout(timer)}
 };
 const ecb=async()=>{
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),8000);
  try{
   const response=await fetch(ECB,{headers:{Accept:'text/csv'},signal:ctl.signal,next:{revalidate:3600}});
   if(!response.ok)throw Error('ECB HTTP '+response.status);
   const result=parseEcb(await response.text());if(!result.length)throw Error('ECB unavailable');
   return result;
  }finally{clearTimeout(timer)}
 };
 const results=await Promise.allSettled([bls(),ecb()]);
 return {rows:results.flatMap(x=>x.status==='fulfilled'?x.value:[]),sources:(['BLS','ECB'] as const).map((name,i)=>({name,status:results[i].status==='fulfilled'?'ok' as const:'unavailable' as const}))};
}
