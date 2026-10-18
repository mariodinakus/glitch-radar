import type {Signal} from '@/lib/types';
import {getStackedBrief} from '@/lib/stacked-brief';

export function StackedBrief({signal,summary,title,mode,onExpand}:{
 signal:Signal;
 summary:string;
 title?:string;
 mode:'hero'|'card'|'detail';
 onExpand?:()=>void;
}){
 const all=getStackedBrief(signal,summary,undefined,undefined,title);
 // A story without evidence must not get five fabricated copies of category boilerplate.
 const relevant=all.filter(item=>item.id!=='fact');
 const items=mode==='detail'?all:mode==='hero'?relevant.slice(0,4):relevant.slice(0,2);
 if(mode!=='detail'&&items.length===0)return null;
 return <section className={'stacked-brief stacked-'+mode} aria-label="Στοιχεία και ανάλυση συγκεκριμένου δημοσιεύματος">
   <header className="stacked-head">
     <span className="stacked-head-mark">GLITCH<span className="stacked-head-dot">.</span></span>
     <strong>{mode==='detail'?'ΤΙ ΤΕΚΜΗΡΙΩΝΕΤΑΙ':items.length+' ΣΥΓΚΕΚΡΙΜΕΝΑ ΣΗΜΕΙΑ'}</strong>
     <span>ΜΟΝΟ ΟΣΑ ΣΤΗΡΙΖΟΝΤΑΙ ΣΤΗΝ ΠΗΓΗ</span>
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
   {mode==='card'&&onExpand&&<button className="stacked-more" onClick={onExpand}>ΠΕΡΙΣΣΟΤΕΡΑ ΓΙΑ ΤΟ ΣΥΓΚΕΚΡΙΜΕΝΟ ΓΕΓΟΝΟΣ <span aria-hidden="true">↗</span></button>}
   {mode==='detail'&&<>
    {all.length<3&&<p className="stacked-insufficient">Η διαθέσιμη ροή δεν τεκμηριώνει αρκετά στοιχεία για εξατομικευμένη ερμηνεία. Δεν προσθέτουμε γενικές «προβλέψεις» ως υποκατάστατο.</p>}
    <p className="stacked-caveat">Οι ενδείξεις δεν συνιστούν ανεξάρτητη επιβεβαίωση. Αίτιο, εκτιμήσεις και πραγματικές επιπτώσεις πρέπει να επαληθεύονται από περισσότερες έγκυρες πηγές. <a href={signal.url} target="_blank" rel="noopener noreferrer">Διάβασε το αρχικό άρθρο ↗</a></p>
   </>}
 </section>;
}
