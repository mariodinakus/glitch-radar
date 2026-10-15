'use client';
import {Activity,ArrowUpRight,BookOpen,ChevronDown,ChevronUp,Eye,FlaskConical,Info,Layers3,Radio,ShieldAlert,TrendingUp} from 'lucide-react';
import type {Discovery} from '@/lib/intelligence';
import type {Signal} from '@/lib/types';
const icons={measured:Activity,coverage:Layers3,alert:Radio,research:FlaskConical,'source-health':ShieldAlert};
const classes={measured:'measured',coverage:'coverage',alert:'alert',research:'research','source-health':'health'};
export function DiscoveryCard({d,language,expanded,onExpand,onSignal,signals,isNew=false}:{d:Discovery;language:'el'|'en';expanded:boolean;onExpand:()=>void;onSignal:(s:Signal)=>void;signals:Signal[];isNew?:boolean}){
 const Icon=icons[d.kind];const isEl=language==='el';const linked=new Map(signals.map(s=>[s.id,s]));
 const kind=({measured:['ΜΕΤΡΗΣΗ','MEASUREMENT'],coverage:['ΣΥΓΚΛΙΣΗ ΠΗΓΩΝ','SOURCE OVERLAP'],alert:['ΕΠΙΣΗΜΟ ΔΕΛΤΙΟ','OFFICIAL BULLETIN'],research:['ΕΡΕΥΝΗΤΙΚΗ ΡΟΗ','RESEARCH INDEX'],'source-health':['ΥΓΕΙΑ ΠΗΓΩΝ','SOURCE HEALTH']} as const)[d.kind];
 return <article className={`insight-card insight-${classes[d.kind]} ${expanded?'open':''}`}>
  <div className="insight-card-top"><span className="insight-type"><Icon size={15}/>{kind[isEl?0:1]}</span><div className="insight-markers">{isNew&&<span className="insight-new">{isEl?'ΝΕΑ ΑΝΙΧΝΕΥΣΗ':'NEW FINDING'}</span>}<span className="insight-score" title={isEl?'Βαθμός προτεραιότητας εμφάνισης, όχι πιθανότητα':'Display priority; not a probability'}>{d.strength}/100</span></div></div>
  <div className="insight-main"><div><h3>{isEl?d.title.el:d.title.en}</h3><p>{isEl?d.description.el:d.description.en}</p></div><div className="insight-stat"><b>{d.metric}</b><span>{isEl?d.metricName.el:d.metricName.en}</span></div></div>
  <div className="insight-card-foot"><span className="insight-evidence"><Eye size={14}/>{d.evidence.length} {isEl?'παραπομπές':'linked records'}</span><button onClick={onExpand} aria-expanded={expanded}>{expanded?(isEl?'Απόκρυψη στοιχείων':'Hide evidence'):(isEl?'Δες γιατί προέκυψε':'Inspect the evidence')}{expanded?<ChevronUp size={15}/>:<ChevronDown size={15}/>}</button></div>
  {expanded&&<div className="insight-expanded"><p className="insight-caution"><Info size={15}/>{isEl?d.caveat.el:d.caveat.en}</p><b className="insight-link-label">{isEl?'Πηγές & τεκμήρια':'Sources & evidence'}</b>
   {d.evidence.length?d.evidence.map(x=><div className="insight-reference" key={x.id}><span><small>{x.source}</small><strong>{x.title}</strong></span><div>{linked.has(x.id)&&<button onClick={()=>onSignal(linked.get(x.id)!)} title={isEl?'Προβολή μέσα στην εφαρμογή':'Inspect in app'}><BookOpen size={15}/></button>}<a href={x.url} target="_blank" rel="noopener noreferrer" title={isEl?'Άνοιγμα πρωτοτύπου':'Original source'}><ArrowUpRight size={16}/></a></div></div>):<p>{isEl?'Ο δείκτης αφορά κατάσταση υπηρεσιών, όχι μεμονωμένα άρθρα.':'This status refers to source connectivity, not individual articles.'}</p>}
  </div>}
 </article>
}
