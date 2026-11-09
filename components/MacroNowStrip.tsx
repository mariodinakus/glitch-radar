'use client';
import {useEffect,useState} from 'react';
import {Activity,ExternalLink} from 'lucide-react';
import {isMacroPeriodOutdated} from '@/lib/macro-now';
import type {MacroNowRow} from '@/lib/macro-now';
import css from './MarketIntelligence.module.css';
type Payload={updatedAt:string;rows:MacroNowRow[];sources:{name:'BLS'|'ECB';status:'ok'|'unavailable'}[]};
export default function MacroNowStrip({compact=false}:{compact?:boolean}){
 const [payload,setPayload]=useState<Payload|null>(null);
 const [loading,setLoading]=useState(true);
 useEffect(()=>{
  let alive=true;
  const fetchData=async()=>{
   try{const response=await fetch('/api/macro-now');if(!response.ok)throw Error('macro');
    const result=await response.json() as Payload;
    if(alive&&Array.isArray(result.rows))setPayload(result);
   }catch{if(alive)setPayload(p=>p||{updatedAt:'',rows:[],sources:[]})}
   finally{if(alive)setLoading(false)}
  };
  void fetchData();
  const id=setInterval(()=>{if(document.visibilityState==='visible')void fetchData()},3600000);
  return()=>{alive=false;clearInterval(id)};
 },[]);
 const rows=compact?(payload?.rows||[]).filter(r=>r.id!=='us-jobs').slice(0,4):(payload?.rows||[]);
 const status=(payload?.sources||[]).map(s=>s.name+' '+(s.status==='ok'?'OK':'unavailable')).join(' · ');
 const checkedAt=payload?.updatedAt?Date.parse(payload.updatedAt):0;
 const hasOutdated=rows.some(r=>isMacroPeriodOutdated(r.period,checkedAt));
 return <div className={css.macro} aria-label="Latest official monthly economic indicators">
   <div className={css.sectionHeading}><div><span className={css.eyebrow}><Activity size={13}/> LATEST OFFICIAL MACRO</span><h3>Available official economic readings</h3><p>Release periods vary by provider. Older observations are flagged, not presented as current inflation or employment.</p></div></div>
   {loading&&!payload&&<div className={css.empty}>Checking BLS and ECB published series…</div>}
   {rows.length>0&&<div className={css.macroGrid}>{rows.map(r=><a className={css.macroCard} key={r.id} href={r.sourceUrl} target="_blank" rel="noopener noreferrer">
    <div className={css.quoteTop}><span>{r.source} / {r.period}</span><ExternalLink size={11}/></div>
    <strong>{r.value>0&&r.id==='us-jobs'?'+':''}{r.value.toLocaleString('en-GB',{maximumFractionDigits:2,minimumFractionDigits:r.unit==='%'?1:0})}{r.unit==='%'?'%':'k'}</strong>
    <span className={css.macroLabel}>{r.title}</span>
    {isMacroPeriodOutdated(r.period,checkedAt)&&<span className={css.oldSeries}>HISTORICAL · NOT CURRENT</span>}
    {!compact&&<small>{r.description}</small>}
   </a>)}</div>}
   {hasOutdated&&<div className={css.warning}>Some sources returned older reference periods. These are historical observations, not today's economic readings.</div>}
   {!loading&&!rows.length&&<div className={css.empty}>No current official monthly readings are available from the connected public feeds. No replacement values are generated.</div>}
   {payload&&<p className={css.disclaimer}>Sources: {status||'unavailable'} · API checked: {payload.updatedAt?new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Athens'}).format(new Date(payload.updatedAt)):'unavailable'} (Athens). Monthly CPI, labour data and HICP can be revised. <strong>Checked time does not mean released time.</strong></p>}
 </div>;
}
