import type {Signal} from '@/lib/types';
import {getEditorialContext} from '@/lib/editorial';
import {getStackedBrief} from '@/lib/stacked-brief';

export function StackedBrief({signal,summary,mode,onExpand}:{
 signal:Signal;
 summary:string;
 mode:'hero'|'card'|'detail';
 onExpand?:()=>void;
}){
 const context=getEditorialContext(signal);
 const all=getStackedBrief(signal,summary,context.why,context.impact);
 const items=mode==='detail'?all:mode==='hero'?all.slice(1):all.filter(v=>v.id==='cause'||v.id==='impact');
 return <section className={'stacked-brief stacked-'+mode} aria-label="Σχολιασμός και ανάλυση ειδησεογραφίας">
   <header className="stacked-head">
     <span className="stacked-head-mark">GLITCH<span className="stacked-head-dot">.</span></span>
     <strong>ΑΝΑΛΥΣΗ ΣΕ {mode==='detail'?'5':mode==='hero'?'4':'2'} ΕΠΙΠΕΔΑ</strong>
     <span>ΤΕΚΜΗΡΙΩΣΗ / ΕΚΤΙΜΗΣΗ</span>
   </header>
   <div className="stacked-list">
    {items.map(item=><div className={'stacked-step stacked-'+item.evidence} key={item.id}>
      <div className="stacked-step-index"><span>{item.number}</span></div>
      <div className="stacked-step-body">
        <div className="stacked-step-heading"><h4>{item.title}</h4><span className="stacked-evidence">{item.evidenceLabel}</span></div>
        <p>{item.text}</p>
      </div>
    </div>)}
   </div>
   {mode==='card'&&onExpand&&<button className="stacked-more" onClick={onExpand}>ΠΛΗΡΗΣ ΑΝΑΛΥΣΗ · 5 ΕΠΙΠΕΔΑ <span aria-hidden="true">↗</span></button>}
   {mode==='detail'&&<p className="stacked-caveat">Τα γεγονότα βασίζονται στη συγκεκριμένη αναφερόμενη πηγή. Τα αίτια μπορεί να μην έχουν επιβεβαιωθεί και οι εκτιμήσεις είναι ενδεχόμενα, όχι βέβαιες προβλέψεις. <a href={signal.url} target="_blank" rel="noopener noreferrer">Δες το πλήρες ρεπορτάζ ↗</a></p>}
 </section>;
}
