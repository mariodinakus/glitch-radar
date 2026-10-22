'use client';
import {useMemo,useState} from 'react';
import type {Story} from '@/lib/stories';
import {coverageAxes,axisTitle} from '@/lib/coverage-signals';
import {headlineFingerprint} from '@/lib/matrix-detection';

export default function NarrativeDNA({story,lang}:{story:Story;lang:'el'|'en'}){
 const [expanded,setExpanded]=useState(false);
 const t=(el:string,en:string)=>lang==='el'?el:en;
 const rows=useMemo(()=>{
  const first=new Map<string,Story['reports'][number]>();
  for(const r of [...story.reports].sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp))){
   if(!r.source||!r.url)continue;
   if(!first.has(r.source))first.set(r.source,r);
  }
  return [...first.values()].sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp));
 },[story]);
 const frameCounts=new Map<string,Set<string>>();
 for(const r of rows)for(const key of coverageAxes(r)){
  if(key==='other')continue;
  const s=frameCounts.get(key)||new Set<string>();s.add(r.source);frameCounts.set(key,s);
 }
 const frames=[...frameCounts.entries()].sort((a,b)=>b[1].size-a[1].size);
 const uniqueTitles=new Set(rows.map(r=>headlineFingerprint(r.title))).size;
 const earliest=rows[0];
 const shown=expanded?rows:rows.slice(0,5);
 return <section className="ndna" aria-label="Narrative DNA">
  <span className="ndna-kicker">GLITCH / NARRATIVE DNA</span>
  <h2>{t('Ποιος το ανέφερε — και πώς','Who reported it — and how')}</h2>
  <p className="ndna-note">{t('Δημοσιευμένοι τίτλοι και χρονικές σημάνσεις από το διαθέσιμο δείγμα. Τα διαφορετικά πλαίσια είναι λεξιλογική ταξινόμηση, όχι απόδειξη πρόθεσης ή παραπληροφόρησης.','Publisher titles and timestamps from the monitored sample. Frames are keyword-based descriptions, not evidence of intent or misinformation.')}</p>
  <div className="ndna-metrics">
   <div><strong>{rows.length}</strong><span>{t('εκδότες στο δείγμα','outlets in sample')}</span></div>
   <div><strong>{uniqueTitles}</strong><span>{t('διαφορετικοί τίτλοι','distinct headlines')}</span></div>
   <div><strong>{frames.length}</strong><span>{t('θεματικά πλαίσια','headline frames')}</span></div>
  </div>
  {frames.length>0&&<div className="ndna-frames">{frames.map(([k,s])=><span className="ndna-frame" key={k}><b>{s.size}</b>{axisTitle(k as Parameters<typeof axisTitle>[0],lang)}</span>)}</div>}
  <h3 className="ndna-head">{t('Χρονογραμμή πρώτης καταγραφής ανά μέσο','First observed report by outlet')}</h3>
  <div className="ndna-timeline">{shown.map((r,i)=><div className="ndna-entry" key={r.source+'-'+i}>
   <time dateTime={r.timestamp}>{Number.isFinite(Date.parse(r.timestamp))?new Date(r.timestamp).toLocaleString(lang==='el'?'el-GR':'en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'—'}</time>
   <a href={r.url} target="_blank" rel="noopener noreferrer"><b>{r.source}</b>{r.title} ↗</a>
  </div>)}</div>
  {rows.length>5&&<button className="bc-more" onClick={()=>setExpanded(x=>!x)}>{expanded?t('Λιγότερα','Show fewer'):t('Όλες οι πηγές','Show all sources')} ({rows.length})</button>}
  <p className="ndna-disclaimer">{earliest?t('Πρώτη καταγραφή στο παρόν δείγμα','Earliest observed in this sample')+': '+earliest.source+'. ':''}{t('Δεν ισοδυναμεί με τον πρώτο παγκόσμιο δημοσιευτή. Διαφορετικά domains δεν εγγυώνται ανεξάρτητη πρωτογενή έρευνα.','Not necessarily the first publisher worldwide. Different domains do not guarantee independent original reporting.')}</p>
 </section>;
}