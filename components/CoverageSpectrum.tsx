'use client';
import {Info} from 'lucide-react';
import type {StoryCase} from '@/lib/world-pulse';
import {coverageBreakdown} from '@/lib/coverage-bias';
import {mediaProfile} from '@/lib/media-profiles';
type Lang='el'|'en';
export function CoverageSpectrum({story,lang,compact=false}:{story:StoryCase;lang:Lang;compact?:boolean}){
 const d=coverageBreakdown(story);
 const tx=(el:string,en:string)=>lang==='el'?el:en;
 if(compact)return <div className="spectrum-mini" title={tx('Μόνο πηγές με τεκμηριωμένη αξιολόγηση. Άγνωστες πηγές σε γκρι.','Rated publishers only; unrated sources shown in grey.')}>
  {d.rated===0?<div className="spectrum-mini-empty">{tx('Χωρίς επαρκή στοιχεία πολιτικής οπτικής','No political rating data')}</div>:
   <><span className="spectrum-l" style={{flex:d.left}}/><span className="spectrum-c" style={{flex:d.center}}/><span className="spectrum-r" style={{flex:d.right}}/>{d.unrated>0&&<span className="spectrum-u" style={{flex:d.unrated}}/>}</>}
 </div>;
 return <section className="spectrum-section" aria-label={tx('Κατανομή πηγών με πολιτική αξιολόγηση','Rated publisher distribution')}>
  <div className="spectrum-head"><div><span>GLITCH / MEDIA SPECTRUM</span><h3>{tx('Πώς κατανέμεται η κάλυψη;','How is coverage distributed?')}</h3></div><small>{d.rated}/{d.total} {tx('πηγές με αξιολόγηση','publishers rated')}</small></div>
  {d.rated>0?<><div className="spectrum-scale">
   <div className="spectrum-l" style={{flex:d.left||0.01}} title={tx('Αριστερά','Left')+': '+d.left}/>
   <div className="spectrum-c" style={{flex:d.center||0.01}} title={tx('Κέντρο','Center')+': '+d.center}/>
   <div className="spectrum-r" style={{flex:d.right||0.01}} title={tx('Δεξιά','Right')+': '+d.right}/>
  </div><div className="spectrum-labels"><span>{tx('Αριστερά','Left')} <b>{d.ratedPct.left}%</b></span><span>{tx('Κέντρο','Center')} <b>{d.ratedPct.center}%</b></span><span>{tx('Δεξιά','Right')} <b>{d.ratedPct.right}%</b></span></div></>:
   <div className="spectrum-no-data">{tx('Δεν υπάρχουν αρκετές ταξινομημένες πηγές για μια αξιόπιστη μπάρα.','Insufficient rated sources to calculate a meaningful political coverage bar.')}</div>}
  <div className="spectrum-source-list">{d.sources.map(x=>{
   const m=mediaProfile(x.name);
   return <div key={x.name}><span className={'spectrum-source-dot spectrum-'+x.orientation}/><strong>{x.name}</strong><small>{x.orientation==='unrated'?tx('Μη αξιολογημένο','Unrated'):x.orientation==='center'?tx('Κέντρο','Center'):x.orientation==='left'?tx('Αριστερά','Left'):tx('Δεξιά','Right')}</small>{m?.biasSource&&<a href={m.biasSource} target="_blank" rel="noopener noreferrer" aria-label={tx('Πηγή βαθμολόγησης','Rating source')}><Info size={13}/></a>}</div>;
  })}</div>
  <p className="spectrum-method">{tx('Τα ποσοστά αφορούν αποκλειστικά τους αξιολογημένους εκδότες του μικρού δείγματος, όχι όλα τα άρθρα ή όλες τις πολιτικές τάσεις. Οι μη αξιολογημένοι εκδότες εξαιρούνται από τον παρονομαστή. Η ιδεολογική οπτική δεν ισοδυναμεί με φιλοκυβερνητική στάση, ποιότητα ή ακρίβεια.','Percentages use only rated publishers in this limited sample; unrated sources are excluded from the denominator. These labels describe publisher ideology, not loyalty to a government, quality or accuracy.')}</p>
 </section>;
}
