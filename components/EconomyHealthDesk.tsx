'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {Activity,ArrowRight,ArrowUpRight,BarChart3,RefreshCcw,ShieldAlert,TrendingDown,TrendingUp} from 'lucide-react';
import {assessMacro,MACRO_INDICATORS,MACRO_REGIONS,summarizeMacro} from '@/lib/economy-health';
import type {MacroRegion,MacroResponse,MacroRow,MacroStatus,MacroObservation} from '@/lib/economy-health';
type Props={compact?:boolean;onExpand?:()=>void};
const labels:Record<MacroStatus,string>={good:'Supportive',watch:'Watch',bad:'Pressure',unknown:'Unavailable'};
const regionCountry:Record<MacroRegion,string>={WLD:'1W',USA:'US',EMU:'XC',CHN:'CN',GRC:'GR'};
const formatted=(v:number)=>v.toLocaleString('en-US',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';
function Trend({values}:{values:MacroObservation[]}){
 const p=[...values].reverse().slice(-8);if(p.length<2)return <span className="eh-no-trend">Trend unavailable</span>;
 const min=Math.min(...p.map(x=>x.value)),max=Math.max(...p.map(x=>x.value)),range=max-min||1;
 const xy=p.map((x,i)=>(i/(p.length-1)*100).toFixed(1)+','+(36-(x.value-min)/range*27).toFixed(1)).join(' ');
 return <svg className="eh-spark" viewBox="0 0 100 42" preserveAspectRatio="none" role="img" aria-label={'Annual history: '+p.map(x=>x.year+': '+formatted(x.value)).join(', ')}>
 <path d="M0 40H100" fill="none" stroke="currentColor" opacity=".12" strokeDasharray="2 3"/>
 <polyline points={xy} fill="none" stroke="currentColor" strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinecap="round"/>
 </svg>;
}
export default function EconomyHealthDesk({compact=false,onExpand}:Props){
 const [data,setData]=useState<MacroResponse|null>(null),[loading,setLoading]=useState(true),[failed,setFailed]=useState(false),[region,setRegion]=useState<MacroRegion>('WLD');
 const retry=useCallback(async()=>{
  setLoading(true);setFailed(false);
  try{const r=await fetch('/api/economy-health');if(!r.ok)throw Error('api');const j=await r.json() as MacroResponse;
   if(!j.regions||!Array.isArray(j.regions.WLD))throw Error('shape');setData(j);
  }catch{setFailed(true)}finally{setLoading(false)}
 },[]);
 useEffect(()=>{void retry()},[retry]);
 const rows=data?.regions[region]||[];
 const now=new Date().getUTCFullYear();
 const summary=useMemo(()=>summarizeMacro(rows,now),[rows,now]);
 const headline=summary.available===0?'Waiting for verified data':summary.counts.bad>=3?'Multiple stress signals':summary.counts.bad>0?'Mixed economic signals':summary.counts.watch>=3?'Uneven momentum':'Mostly supportive readings';
 return <section className={'economy-health'+(compact?' eh-compact':'')} aria-label="World economy health monitor">
  <div className="eh-heading"><div><span className="eh-eyebrow"><Activity size={14}/> GLITCH / MACRO OBSERVATORY</span>
   <h2>{compact?'Is the world economy healthy?':'Global economy, without the guesswork'}<em>.</em></h2>
   <p>{compact?'Real growth, inflation and unemployment. Official published data — not invented live readings.':'A separate verdict for each economic indicator, the underlying year and the source. Green does not mean everyone is prosperous.'}</p>
  </div>{compact?<button className="eh-action" onClick={onExpand}>Explore economy <ArrowRight size={16}/></button>:<span className="eh-official"><BarChart3 size={15}/> ANNUAL / WORLD BANK</span>}</div>
  {loading&&!data&&<div className="eh-loading"><RefreshCcw size={15}/> Retrieving official annual figures…</div>}
  {failed&&!data&&<div className="eh-error"><ShieldAlert size={18}/> Official macro data unavailable. No synthetic figures substituted. <button onClick={()=>void retry()}>Retry</button></div>}
  {data&&<>
   {!compact&&<div className="eh-regions" role="group" aria-label="Economy selection">{MACRO_REGIONS.map(r=><button key={r.code} className={r.code===region?'active':''} aria-pressed={r.code===region} onClick={()=>setRegion(r.code)}>{r.label}</button>)}</div>}
   <div className="eh-overview"><div><small>{compact?'WORLD':'REGION / '+MACRO_REGIONS.find(r=>r.code===region)?.label.toUpperCase()}</small><strong>{headline}</strong><p>Screening guide — never a composite economic-health index, probability or forecast.</p></div>
    <div className="eh-counts">{(['good','watch','bad','unknown'] as MacroStatus[]).map(k=><div className={'eh-count eh-'+k} key={k}><b>{summary.counts[k]}</b><span>{labels[k]}</span></div>)}</div>
   </div>
   <div className={'eh-metrics'+(compact?' eh-metrics-mini':'')}>
    {MACRO_INDICATORS.filter(ind=>!compact||['NY.GDP.MKTP.KD.ZG','FP.CPI.TOTL.ZG','SL.UEM.TOTL.ZS','NY.GDP.PCAP.KD.ZG'].includes(ind.code)).map(ind=>{
     const row:MacroRow|undefined=rows.find(r=>r.code===ind.code);
     const a=assessMacro(ind.code,row?.current||null,row?.previous||null,now);
     return <article className={'eh-metric eh-'+a.status} key={ind.code}>
      <div className="eh-metric-top"><small>{ind.short}</small><span>{labels[a.status]}</span></div>
      {!compact&&<h3>{ind.label}</h3>}
      <div className="eh-number"><strong>{row?.current?formatted(row.current.value):'—'}</strong><small>{row?.current?'YEAR '+row.current.year:'NOT PUBLISHED'}</small></div>
      {!compact&&<><Trend values={row?.history||[]}/>
       <p className="eh-reason">{a.reason}</p>
       <p className="eh-trend">{a.trend==='improving'?<TrendingUp size={15}/>:a.trend==='deteriorating'?<TrendingDown size={15}/>:<Activity size={15}/>}
        {a.trend==='improving'?'Improved vs previous reading':a.trend==='deteriorating'?'Deteriorated vs previous reading':a.trend==='flat'?'Broadly unchanged':'Insufficient comparable readings'}</p>
       <p className="eh-detail">{ind.detail}</p>
       <a href={'https://data.worldbank.org/indicator/'+ind.code+'?locations='+regionCountry[region]} target="_blank" rel="noopener noreferrer">Inspect at World Bank <ArrowUpRight size={14}/></a>
      </>}
     </article>;
    })}
   </div>
   <div className="eh-disclaimer"><ShieldAlert size={16}/><p>{compact?'Annual macro statistics lag behind the news. Open the full dashboard for 5 regions, history and limitations.':'Diagnostic thresholds are editorial rules of thumb, not universal macroeconomic targets. Annual GDP does not measure household welfare; regional comparison needs structural context. Missing data remain unrated. This dashboard does not provide monthly inflation, live GDP, validated recession forecasts or global debt estimates.'}</p></div>
  </>}
 </section>;
}
