/** Transparent screening of annual World Bank data. Not a forecast, score or investment advice. */
export const MACRO_REGIONS=[{code:'WLD',label:'World'},{code:'USA',label:'United States'},{code:'EMU',label:'Euro area'},{code:'CHN',label:'China'},{code:'GRC',label:'Greece'}] as const;
export type MacroRegion=(typeof MACRO_REGIONS)[number]['code'];
export const MACRO_INDICATORS=[
 {code:'NY.GDP.MKTP.KD.ZG',label:'Real GDP growth',short:'GROWTH',detail:'Annual inflation-adjusted output change.'},
 {code:'FP.CPI.TOTL.ZG',label:'Consumer price inflation',short:'INFLATION',detail:'Annual consumer price change; falling inflation does not mean falling prices.'},
 {code:'SL.UEM.TOTL.ZS',label:'Unemployment',short:'JOBS',detail:'ILO-modelled unemployment as a share of the labor force.'},
 {code:'NY.GDP.PCAP.KD.ZG',label:'GDP per person growth',short:'PER PERSON',detail:'Real output per capita, not household income.'},
 {code:'NE.EXP.GNFS.KD.ZG',label:'Real exports growth',short:'WORLD TRADE',detail:'Annual inflation-adjusted export volume change.'},
 {code:'SL.UEM.1524.ZS',label:'Youth unemployment',short:'YOUTH JOBS',detail:'Unemployment among economically active people aged 15–24.'}
] as const;
export type MacroCode=(typeof MACRO_INDICATORS)[number]['code'];
export type MacroStatus='good'|'watch'|'bad'|'unknown';
export type MacroObservation={year:number;value:number};
export type MacroRow={code:MacroCode;history:MacroObservation[];current:MacroObservation|null;previous:MacroObservation|null};
export type MacroResponse={updatedAt:string;source:string;regions:Record<MacroRegion,MacroRow[]>;methodology:string;missingIndicators?:MacroCode[]};
export type MacroAssessment={status:MacroStatus;reason:string;trend:'improving'|'deteriorating'|'flat'|'unknown';stale:boolean};
export function assessMacro(code:MacroCode,current:MacroObservation|null,previous:MacroObservation|null,now:number):MacroAssessment{
 if(!current||!Number.isFinite(current.value))return {status:'unknown',reason:'No official observation published.',trend:'unknown',stale:false};
 if(now-current.year>3)return {status:'unknown',reason:'Latest published observation is too old to assess current conditions.',trend:'unknown',stale:true};
 const v=current.value;let status:MacroStatus='watch';let reason='';
 if(code==='NY.GDP.MKTP.KD.ZG'){status=v<0?'bad':v<2?'watch':'good';reason=v<0?'Real output contracted.':v<2?'Output expanded slowly.':'Real output expanded.'}
 if(code==='NY.GDP.PCAP.KD.ZG'){status=v<0?'bad':v<1?'watch':'good';reason=v<0?'Real output per person fell.':v<1?'Per-person output grew slowly.':'Real output per person grew.'}
 if(code==='FP.CPI.TOTL.ZG'){status=v<0?'bad':v<=3?'good':v<=6?'watch':'bad';reason=v<0?'Deflation can reflect economic weakness.':v<=3?'Price rises are relatively contained.':v<=6?'Elevated price inflation.':'High inflation strains purchasing power.'}
 if(code==='SL.UEM.TOTL.ZS'){status=v<=5?'good':v<=8?'watch':'bad';reason=v<=5?'Relatively low unemployment.':v<=8?'Some labor-market slack.':'Elevated measured unemployment.'}
 if(code==='SL.UEM.1524.ZS'){status=v<=12?'good':v<=20?'watch':'bad';reason=v<=12?'Relatively contained youth unemployment.':v<=20?'Young workers face labor-market pressure.':'Elevated youth unemployment.'}
 if(code==='NE.EXP.GNFS.KD.ZG'){status=v<0?'bad':v<2?'watch':'good';reason=v<0?'Export volumes contracted.':v<2?'Export growth is subdued.':'Real exports increased.'}
 let trend:MacroAssessment['trend']='unknown';
 if(previous&&Number.isFinite(previous.value)&&current.year-previous.year<=2){
  const d=v-previous.value;trend=Math.abs(d)<0.3?'flat':(d<0)===['FP.CPI.TOTL.ZG','SL.UEM.TOTL.ZS','SL.UEM.1524.ZS'].includes(code)?'improving':'deteriorating';
  if(code==='FP.CPI.TOTL.ZG'&&v<0)trend='deteriorating';
 }
 return {status,reason,trend,stale:false};
}
export function summarizeMacro(rows:MacroRow[],now:number){
 const counts={good:0,watch:0,bad:0,unknown:0};
 for(const r of rows)counts[assessMacro(r.code,r.current,r.previous,now).status]++;
 return {counts,available:rows.length-counts.unknown};
}
/** World Bank sends country.id in ISO-2 / provider aggregate codes,
 * while the dashboard routes use ISO-3 codes. Use both explicitly.
 * Examples: USA => US, GRC => GR, WLD => 1W, EMU => XC.
 */
export type WorldBankDatum={
 country?:{id?:string;value?:string};
 countryiso3code?:string;
 indicator?:{id?:string};
 date?:string;
 value?:number|null;
};
const WORLD_BANK_ALIASES:Record<MacroRegion,string[]>={
 WLD:['WLD','1W'],
 USA:['USA','US'],
 EMU:['EMU','XC'],
 CHN:['CHN','CN'],
 GRC:['GRC','GR']
};
export function extractWdiHistory(
 observations:WorldBankDatum[],region:MacroRegion,code:MacroCode,latestYear:number
):MacroObservation[]{
 const aliases=WORLD_BANK_ALIASES[region];
 const years=new Set<number>();
 return observations.filter(o=>{
  const ids=[o.countryiso3code,o.country?.id].map(x=>(x||'').toUpperCase());
  return o.indicator?.id===code&&ids.some(id=>aliases.includes(id))
   &&typeof o.value==='number'&&Number.isFinite(o.value)
   &&String(o.date||'').length===4&&Number.isInteger(Number(o.date))&&Number(o.date)<=latestYear
   &&Number(o.date)>=latestYear-10;
 }).map(o=>({year:Number(o.date),value:o.value as number}))
  .sort((a,b)=>b.year-a.year)
  .filter(o=>years.has(o.year)?false:(years.add(o.year),true))
  .slice(0,9);
}
