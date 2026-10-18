'use client';
import {useState} from 'react';
import {ArrowUpRight,BookOpen,GitCompareArrows,ShieldAlert,ScanSearch} from 'lucide-react';
import type {Signal} from '@/lib/types';
import {getStackedBrief} from '@/lib/stacked-brief';
import {relatedReports} from '@/lib/related-reports';

type View='insight'|'gaps'|'sources';
const short=(s:string,max=300)=>s.length>max?s.slice(0,max).replace(/\s+\S*$/,'')+'…':s;
export function SignalLens({signal,title,summary,all,mode,onExpand,onOpen}:{
 signal:Signal;title:string;summary:string;all:Signal[];
 mode:'hero'|'card'|'detail';
 onExpand?:()=>void;onOpen?:(s:Signal)=>void;
}){
 const [view,setView]=useState<View>('insight');
 const steps=getStackedBrief(signal,summary,undefined,undefined,title);
 const evidence=steps.filter(x=>x.id!=='fact');
 const cross=mode==='card'?[]:relatedReports(signal,all);
 const hasCause=steps.some(x=>x.id==='cause');
 const hasImpact=steps.some(x=>x.id==='impact');
 const hasActors=steps.some(x=>x.id==='people');
 const watch=steps.find(x=>x.id==='watch');
 const gaps=[
  ...(!hasCause?['Δεν τεκμηριώνεται συγκεκριμένη αιτία ή αίτημα']:[]),
  ...(!hasImpact?['Δεν περιγράφεται μετρήσιμη επίπτωση στο διαθέσιμο απόσπασμα']:[]),
  ...(!hasActors?['Δεν προσδιορίζονται σαφώς εμπλεκόμενα μέρη ή τόποι']:[]),
  ...(cross.length===0?['Δεν βρέθηκαν στενά συναφείς τίτλοι από διαφορετικούς εκδότες στο δείγμα']:[])
 ];
 const canShow=mode==='detail'||evidence.length>0||cross.length>0;
 if(!canShow)return null;
 if(mode==='card'){
  if(evidence.length===0)return null;
  const first=evidence[0];
  return <button className="lens-mini" onClick={onExpand} aria-label="Αναλυτικός έλεγχος δημοσιεύματος">
   <span className="lens-mini-flag">GLITCH / LENS</span>
   <span className="lens-mini-title">{first.title}</span>
   <span className="lens-mini-text">{short(first.text,144)}</span>
   <span className="lens-mini-more">ΕΛΕΓΧΟΣ ΣΤΟΙΧΕΙΩΝ <ArrowUpRight size={14}/></span>
  </button>;
 }
 if(mode==='hero'){
  return <section className="lens-hero" aria-label="Ειδική ανάγνωση GLITCH">
   <div className="lens-hero-heading"><span className="lens-hero-brand">THE GLITCH LENS<span>.</span></span><span>ΠΕΡΑ ΑΠΟ ΤΟΝ ΤΙΤΛΟ</span></div>
   {evidence.length>0?<div className="lens-hero-angles">{evidence.slice(0,2).map(item=><div key={item.id} className="lens-hero-angle">
     <small>{item.title}</small><p>{short(item.text,240)}</p>
    </div>)}</div>:<p className="lens-hero-empty">Η αρχική δημοσίευση δεν δίνει αρκετά επαληθεύσιμα στοιχεία για ασφαλή ερμηνεία.</p>}
   {cross.length>0&&<div className="lens-hero-compare"><GitCompareArrows size={15}/> Υπάρχουν {cross.length} πιθανώς συναφείς αναφορές από άλλες πηγές — όχι ανεξάρτητη επιβεβαίωση.</div>}
  </section>;
 }
 return <section className="lens-panel" aria-label="Ανάλυση δημοσιεύματος GLITCH">
   <div className="lens-panel-brand"><span>G<span className="lens-red">.</span> / LENS</span><small>ΕΡΕΥΝΑ ΣΤΟΙΧΕΙΩΝ · {signal.source}</small></div>
   <div className="lens-tabs" role="group" aria-label="Διαστάσεις είδησης">
    <button aria-pressed={view==='insight'} className={view==='insight'?'selected':''} onClick={()=>setView('insight')}><BookOpen size={15}/> ΤΙ ΞΕΡΟΥΜΕ</button>
    <button aria-pressed={view==='gaps'} className={view==='gaps'?'selected':''} onClick={()=>setView('gaps')}><ShieldAlert size={15}/> ΤΙ ΛΕΙΠΕΙ <b>{gaps.length}</b></button>
    <button aria-pressed={view==='sources'} className={view==='sources'?'selected':''} onClick={()=>setView('sources')}><GitCompareArrows size={15}/> ΑΛΛΕΣ ΠΗΓΕΣ <b>{cross.length}</b></button>
   </div>
   {view==='insight'&&<div className="lens-insight">
    <div className="lens-primary"><span>ΤΟ ΔΗΜΟΣΙΕΥΜΑ ΣΕ ΜΙΑ ΜΑΤΙΑ</span><p>{short(steps[0]?.text||title,480)}</p><small>ΑΝΑΦΟΡΑ ΠΗΓΗΣ · ΟΧΙ ΑΝΕΞΑΡΤΗΤΗ ΕΠΑΛΗΘΕΥΣΗ</small></div>
    {evidence.length?<div className="lens-evidence-list">{evidence.filter(item=>item.id!=='watch').map(item=><div key={item.id} className="lens-evidence">
     <span className="lens-evidence-mark">{item.id==='cause'?'↳':item.id==='impact'?'↗':item.id==='watch'?'◎':'•'}</span>
     <div><strong>{item.title}</strong><p>{item.text}</p><small>{item.evidenceLabel}</small></div>
    </div>)}</div>:<div className="lens-empty"><ScanSearch size={21}/><p>Η είδηση διαθέτει μόνο τίτλο ή πολύ σύντομη αναφορά. Δεν υπάρχει ασφαλές έδαφος για ξεχωριστή ανάλυση αιτίων ή συνεπειών.</p></div>}
    {watch&&<div className="lens-watch"><strong>ΣΗΜΕΙΟ ΠΑΡΑΚΟΛΟΥΘΗΣΗΣ</strong><p>{watch.text}</p></div>}
   </div>}
   {view==='gaps'&&<div className="lens-gaps"><span className="lens-column-eyebrow">ΕΡΩΤΗΜΑΤΑ ΠΟΥ ΔΕΝ ΕΧΟΥΝ ΚΛΕΙΣΕΙ</span>
    {gaps.length?gaps.map((gap,i)=><div key={gap} className="lens-gap"><b>{String(i+1).padStart(2,'0')}</b><p>{gap}</p></div>):<p className="lens-no-gap">Στα διαθέσιμα πεδία δεν εντοπίστηκε προκαθορισμένο κενό. Αυτό δεν σημαίνει πλήρη επαλήθευση.</p>}
    <p className="lens-footnote">Τα κενά αφορούν μόνο την περιορισμένη ροή περιλήψεων που διαθέτει το GLITCH, όχι ολόκληρη τη δημοσιογραφική κάλυψη.</p>
   </div>}
   {view==='sources'&&<div className="lens-sources"><span className="lens-column-eyebrow">ΤΙ ΑΝΑΦΕΡΟΥΝ ΑΛΛΟΙ</span>
    {cross.length?cross.map(article=><button key={article.id} onClick={()=>onOpen?.(article)} className="lens-source">
     <span>{article.source}<small>{new Date(article.timestamp).toLocaleDateString('el-GR')}</small></span><ArrowUpRight size={17}/>
    </button>):<div className="lens-empty"><ScanSearch size={20}/><p>Δεν εντοπίσαμε στενά συναφείς τίτλους από διαφορετικούς εκδότες στο τρέχον δείγμα. Αυτό δεν αποδεικνύει ότι δεν υπάρχει άλλη κάλυψη.</p></div>}
    <p className="lens-footnote">Οι τίτλοι συγκρίνονται με κοινές λέξεις και κοντινή χρονική δημοσίευση. Συναφής αναφορά δεν σημαίνει ίδια είδηση ή διασταύρωση γεγονότων.</p>
   </div>}
   <a className="lens-source-link" href={signal.url} target="_blank" rel="noopener noreferrer">ΠΡΩΤΟΤΥΠΟ ΡΕΠΟΡΤΑΖ <ArrowUpRight size={16}/></a>
  </section>;
}