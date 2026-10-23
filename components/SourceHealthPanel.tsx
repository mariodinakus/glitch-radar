'use client';
import {useMemo,useState} from 'react';
import {ChevronDown,DatabaseZap} from 'lucide-react';
import type {SourceStatus} from '@/lib/types';
export default function SourceHealthPanel({sources,generatedAt}:{sources:SourceStatus[];generatedAt:string}){
 const [expanded,setExpanded]=useState(false);
 const counts=useMemo(()=>({ok:sources.filter(s=>s.ok).length,bad:sources.filter(s=>!s.ok).length,items:sources.reduce((sum,s)=>sum+(s.count||0),0)}),[sources]);
 return <section className="source-health" aria-label="Source reliability audit">
  <div className="sh-header"><div><span className="sh-eyebrow"><DatabaseZap size={14}/> GLITCH / SOURCE AUDIT</span><h2>What is the feed missing<em>?</em></h2><p>Look behind the coverage: which providers responded, and which did not?</p></div>
   <button onClick={()=>setExpanded(v=>!v)} aria-expanded={expanded}>{expanded?'Hide source checks':'Inspect sources'} <ChevronDown size={16}/></button></div>
  <div className="sh-grid"><div><strong>{sources.length?counts.ok:'—'}</strong><span>providers responding</span></div><div><strong style={{color:counts.bad?'#ff8996':undefined}}>{sources.length?counts.bad:'—'}</strong><span>provider failures</span></div><div><strong>{sources.length?counts.items:'—'}</strong><span>items before deduplication</span></div></div>
  <p className="sh-note">Feed generated {generatedAt&&Number.isFinite(Date.parse(generatedAt))?new Date(generatedAt).toLocaleString('en-GB'):'at an unknown time'}. A successful response does not guarantee exhaustive, balanced or independent reporting.</p>
  {expanded&&<div className="sh-list">{sources.length?sources.map((s,i)=><div key={s.source+'-'+i}><b>{s.source}</b><span className={s.ok?'good':'bad'}>{s.ok?s.count+' feed items':'Unavailable'}{!s.ok&&s.error?' · provider error':''}</span></div>):<p>Source-status metadata unavailable.</p>}</div>}
 </section>;
}