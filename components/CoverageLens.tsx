'use client';
import {useState} from 'react';
import {ArrowUpRight,BookOpenCheck,Eye,Landmark,ShieldAlert,Users2} from 'lucide-react';
import type {StoryCase} from '@/lib/world-pulse';
const contexts:{match:RegExp;el:string;en:string;url:string}[]=[
 {match:/^the guardian$|^guardian\b/i,el:'Scott Trust / ιδιοκτησία μέσω trust',en:'Scott Trust / trust ownership',url:'https://www.theguardian.com/about/2017/nov/17/who-owns-the-guardian-our-unique-independent-structure'},
 {match:/^bbc\b/i,el:'BBC / δημόσιος ραδιοτηλεοπτικός φορέας ΗΒ',en:'BBC / UK public-service broadcaster',url:'https://www.bbc.com/aboutthebbc'},
 {match:/^un news/i,el:'ΟΗΕ / θεσμικός εκδότης',en:'UN / institutional publisher',url:'https://news.un.org/en/'},
 {match:/^ert\b|^ερτ/i,el:'ΕΡΤ / δημόσια ραδιοτηλεόραση Ελλάδας',en:'ERT / Greek public broadcaster',url:'https://www.ert.gr/'}
];
export function CoverageLens({story,lang}:{story:StoryCase;lang:'el'|'en'}){
 const [all,setAll]=useState(false);
 const reports=story.reports;
 const publishers=[...new Map(reports.map(r=>[r.source.toLocaleLowerCase(),{source:r.source,report:r}])).values()];
 const shown=all?publishers:publishers.slice(0,5);
 const known=publishers.filter(s=>contexts.some(c=>c.match.test(s.source)));
 const tx=(el:string,en:string)=>lang==='el'?el:en;
 return <section className="coverage-lens">
  <div className="coverage-heading"><div><span>GLITCH / SOURCE INTELLIGENCE</span><h3>{tx('Ποιοι καλύπτουν το γεγονός;','Who is covering this story?')}</h3></div><div className="coverage-count"><strong>{publishers.length}</strong><small>{tx('εκδότες','publishers')}</small></div></div>
  <div className="coverage-meter" aria-label={tx('Μετρημένες πηγές ανά τύπο ιδιοκτησίας','Sampled publisher ownership context')}>
   <div><span><Users2 size={14}/> {tx('Διαφορετικοί εκδότες','Distinct publishers')}</span><strong>{publishers.length}</strong></div>
   <div><span><BookOpenCheck size={14}/> {tx('Με τεκμηριωμένο προφίλ','With sourced publisher profiles')}</span><strong>{known.length}</strong></div>
   <div><span><ShieldAlert size={14}/> {tx('Αξιόπιστη αξιολόγηση φιλοκυβερνητικής στάσης','Verified pro-government alignment score')}</span><strong>—</strong></div>
  </div>
  <p className="coverage-explainer">{tx('Η δημόσια ή ιδιωτική ιδιοκτησία δεν αποδεικνύει φιλοκυβερνητική στάση. Δεν αποδίδουμε πολιτικές ταμπέλες χωρίς τεκμηριωμένη, ειδική για τη χώρα και την περίοδο αξιολόγηση. Οι οργανισμοί παρακάτω δηλώνονται μόνο ως εκδότες στο διαθέσιμο δείγμα.','Public or private ownership does not prove government alignment. We do not assign political labels without sourced, country- and time-specific ratings. The names below are publishers within our limited feed sample.')}</p>
  <div className="coverage-publishers">{shown.map(({source,report})=>{
   const context=contexts.find(c=>c.match.test(source));
   return <div className="coverage-publisher" key={source}>
    <span className="coverage-publisher-monogram">{source.slice(0,2).toUpperCase()}</span>
    <div><strong>{source}</strong><small>{context?(lang==='el'?context.el:context.en):tx('Ιδιοκτησία / στάση: μη ταξινομημένη','Ownership / alignment: unclassified')}</small></div>
    {context&&<a href={context.url} target="_blank" rel="noopener noreferrer" title={tx('Τεκμηρίωση προφίλ','Profile evidence')}><Landmark size={15}/></a>}
    <a href={report.url} target="_blank" rel="noopener noreferrer" title={tx('Άρθρο πηγής','Source article')}><ArrowUpRight size={16}/></a>
   </div>;
  })}</div>
  {publishers.length>5&&<button className="coverage-more" onClick={()=>setAll(v=>!v)}>{all?tx('Λιγότερες πηγές','Fewer publishers'):tx('Όλοι οι εκδότες','All publishers')+' ('+publishers.length+')'}</button>}
  <div className="coverage-method"><Eye size={15}/><span>{tx('Το πλήθος δημοσιεύσεων είναι μέτρηση από RSS, όχι δείκτης μεροληψίας, πραγματολογικής ακρίβειας ή ισορροπίας.','RSS coverage count is not a measure of bias, factual reliability or balanced reporting.')}</span></div>
 </section>;
}
