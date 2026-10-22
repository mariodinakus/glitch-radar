'use client';
import {useMemo,useState} from 'react';
import type {Story} from '@/lib/stories';
import type {HeadlineChange} from '@/lib/matrix-detection';
import {headlineFingerprint} from '@/lib/matrix-detection';
import {coverageAxes,axisTitle} from '@/lib/coverage-signals';
import type {CoverageAxis} from '@/lib/coverage-signals';
import {publisherKey,storyRevisions} from '@/lib/investigation';

type Props={story:Story;lang:'el'|'en';revisions?:HeadlineChange[]};
export default function NarrativeDNA({story,lang,revisions=[]}:Props){
 const [expanded,setExpanded]=useState(false);
 const t=(el:string,en:string)=>lang==='el'?el:en;
 const rows=useMemo(()=>{
  const perPublisher=new Map<string,Story['reports'][number]>();
  for(const r of story.reports){
   const key=publisherKey(r.source);
   if(!key||!r.url||!Number.isFinite(Date.parse(r.timestamp)))continue;
   const prev=perPublisher.get(key);
   if(!prev||Date.parse(r.timestamp)<Date.parse(prev.timestamp))perPublisher.set(key,r);
  }
  return [...perPublisher.values()].sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp));
 },[story]);
 const frameGroups=useMemo(()=>{
  const groups=new Map<CoverageAxis,typeof rows>();
  for(const r of rows)for(const category of coverageAxes(r)){
   if(category==='other')continue;
   const members=groups.get(category)||[];
   members.push(r);groups.set(category,members);
  }
  return [...groups.entries()].sort((a,b)=>b[1].length-a[1].length);
 },[rows]);
 const history=useMemo(()=>storyRevisions(story,revisions),[story,revisions]);
 const differentTitles=new Set(rows.map(r=>headlineFingerprint(r.title))).size;
 const shown=expanded?rows:rows.slice(0,4);
 const earliest=rows[0];
 const date=(iso:string)=>new Date(iso).toLocaleString(lang==='el'?'el-GR':'en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
 return <section className="ndna" aria-label="Narrative DNA">
  <span className="ndna-kicker">GLITCH / NARRATIVE DNA</span>
  <h2>{t('Το DNA της αφήγησης','Narrative DNA')}</h2>
  <p className="ndna-note">{t('Ποιος δημοσίευσε στο διαθέσιμο δείγμα, ποια λέξη επέλεξε κάθε μέσο και ποιοι τίτλοι αναθεωρήθηκαν. Όλα συνδέονται με πηγές.','Who published in this feed sample, how headlines differ between outlets, and which stored headline versions changed. Every observation is source-linked.')}</p>
  <div className="ndna-metrics">
   <div><strong>{rows.length}</strong><span>{t('διακριτοί εκδότες','distinct outlets')}</span></div>
   <div><strong>{differentTitles}</strong><span>{t('διακριτοί τίτλοι','distinct headlines')}</span></div>
   <div><strong>{history.length}</strong><span>{t('αλλαγές RSS τίτλων','RSS headline revisions')}</span></div>
  </div>
  {frameGroups.length>0&&<><h3 className="ndna-head">{t('Διαφορετικά πλαίσια στην ίδια είδηση','How outlets frame the same event')}</h3>
   <div className="ndna-frames">{frameGroups.map(([axis,rs])=><span className="ndna-frame" key={axis}><b>{rs.length}</b>{axisTitle(axis,lang)}</span>)}</div>
   <div className="ndna-frame-comparison">{frameGroups.slice(0,4).map(([axis,rs])=><div key={axis}><strong>{axisTitle(axis,lang)}</strong>
    {rs.slice(0,2).map(r=><a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer"><small>{r.source} ↗</small>{r.title}</a>)}
   </div>)}</div>
  </>}
  <h3 className="ndna-head">{t('Πρώτα χρονολογημένα άρθρα στο δείγμα','Earliest dated feed reports in the sample')}</h3>
  <div className="ndna-timeline">{shown.map((r,i)=><div className="ndna-entry" key={r.source+'-'+i}>
   <time dateTime={r.timestamp}>{date(r.timestamp)}</time>
   <a href={r.url} target="_blank" rel="noopener noreferrer"><b>{r.source}</b>{r.title} ↗</a>
  </div>)}</div>
  {rows.length>4&&<button className="bc-more" onClick={()=>setExpanded(x=>!x)}>{expanded?t('Λιγότερα','Show fewer'):t('Όλοι οι εκδότες','All publishers')} ({rows.length})</button>}
  <h3 className="ndna-head">{t('Αναθεωρήσεις τίτλου στο ίδιο URL','Headline revisions on a matching URL')}</h3>
  {history.length?<div className="ndna-revisions">{history.slice(-5).reverse().map((h,i)=><div className="ndna-revision" key={h.id+'|'+h.lastSeen+'|'+i}>
   <div><b>{h.source}</b><time dateTime={h.lastSeen}>{date(h.lastSeen)}</time></div>
   <p><small>BEFORE</small>{h.before}</p><p><small>AFTER</small>{h.after}</p>
   <a href={h.url} target="_blank" rel="noopener noreferrer">{t('Πηγή RSS άρθρου','Source article link')} ↗</a>
  </div>)}</div>:<p className="ndna-note">{t('Καμία αναθεώρηση ίδιου URL δεν έχει καταγραφεί στο προσβάσιμο ιστορικό.','No same-URL headline revision was observed in the accessible history.')}</p>}
  <p className="ndna-disclaimer">{earliest?t('Πρώιμο χρονολογημένο άρθρο στο δείγμα','Earliest dated report in this sample')+': '+earliest.source+'. ':''}{t('Οι χρονοσημάνσεις προέρχονται από RSS και δεν αποδεικνύουν πρώτη παγκόσμια δημοσίευση. Οι θεματικές κατηγορίες είναι εκτιμήσεις βάσει λέξεων. Οι αλλαγές RSS δεν ισοδυναμούν με επιβεβαιωμένες αλλαγές της σελίδας ή fact-check.','Times come from feed metadata, not a global-first-publisher measurement. Frames are keyword-based. RSS revisions do not establish publisher webpage edits or independent fact-checking.')}</p>
 </section>;
}
