'use client';
import {useEffect,useMemo,useState} from 'react';
import {Activity,ArrowRight,ArrowUpRight,BookOpen,CheckCircle2,ChevronLeft,Clock3,ExternalLink,GitCompareArrows,HelpCircle,Info,Landmark,Sparkles,X} from 'lucide-react';
import type {Signal} from '@/lib/types';
import type {StoryCase} from '@/lib/world-pulse';
import {mediaProfile} from '@/lib/media-profiles';
import {coverageFrames,axisTitle,sourceEdition,sourcesChronologically} from '@/lib/coverage-signals';
import {GlitchMark} from '@/components/GlitchMark';

type Lang='el'|'en';
type Editorial={analysis:string;importance:string;next:string;uncertainty:string};
type Mode='story'|'perspectives'|'timeline'|'view';
type Props={story:StoryCase;lang:Lang;titleFor:(r:Signal)=>string;summaryFor:(r:Signal)=>string;onClose:()=>void;aiEnabled:boolean;analysis:Editorial|null;analysisBusy:boolean;analysisError:string};
const tx=(lang:Lang,el:string,en:string)=>lang==='el'?el:en;
const date=(s:string,lang:Lang)=>new Date(s).toLocaleString(lang==='el'?'el-GR':'en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});

function SourceItem({r,lang}:{r:Signal;lang:Lang}){
 const p=mediaProfile(r.source);
 return <div className="orbit-source">
  <span className="orbit-source-avatar">{r.source.slice(0,2).toUpperCase()}</span>
  <div className="orbit-source-copy"><strong>{r.source}</strong>
   <small>{p?(lang==='el'?p.ownerEl:p.ownerEn):tx(lang,'Ιδιοκτησία: μη τεκμηριωμένη στη βάση','Ownership: not documented in this database')}</small>
   {p?.biasSource&&<small className="orbit-source-bias">{lang==='el'?p.biasEl:p.biasEn} · AllSides</small>}
  </div>
  <div className="orbit-source-links">{p?.ownershipSource&&<a href={p.ownershipSource} title={tx(lang,'Τεκμηρίωση ιδιοκτησίας','Ownership source')} target="_blank" rel="noopener noreferrer"><Landmark size={15}/></a>}
   {p?.biasSource&&<a href={p.biasSource} title={tx(lang,'Πηγή αξιολόγησης','Rating source')} target="_blank" rel="noopener noreferrer"><Info size={15}/></a>}
   <a href={r.url} target="_blank" rel="noopener noreferrer" title={tx(lang,'Άρθρο','Article')}><ArrowUpRight size={16}/></a></div>
 </div>;
}
export function StoryImmersion({story,lang,titleFor,summaryFor,onClose,aiEnabled,analysis,analysisBusy,analysisError}:Props){
 const [mode,setMode]=useState<Mode>('story');
 const editions=useMemo(()=>sourceEdition(story),[story]);
 const timeline=useMemo(()=>sourcesChronologically(story),[story]);
 const frames=useMemo(()=>coverageFrames(story),[story]);
 const [left,setLeft]=useState(editions[0]?.id||'');
 const [right,setRight]=useState(editions[1]?.id||editions[0]?.id||'');
 useEffect(()=>{const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=old}},[]);
 useEffect(()=>{const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape)},[onClose]);
 const tabs:{id:Mode;el:string;en:string;icon:typeof BookOpen}[]=[
  {id:'story',el:'Η είδηση',en:'The story',icon:BookOpen},
  {id:'perspectives',el:'Οι οπτικές',en:'Perspectives',icon:GitCompareArrows},
  {id:'timeline',el:'Το χρονικό',en:'Timeline',icon:Clock3},
  {id:'view',el:'Η ανάλυση',en:'Analysis',icon:Sparkles}
 ];
 const a=editions.find(s=>s.id===left)||editions[0];
 const b=editions.find(s=>s.id===right)||editions[0];
 const profiles=editions.filter(s=>!!mediaProfile(s.source)).length;
 return <div className="orbit-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <article className="orbit-reader" role="dialog" aria-modal="true" aria-label={titleFor(story.headline)}>
   <div className="orbit-reader-top"><button onClick={onClose}><ChevronLeft size={20}/>{tx(lang,'Πίσω','Back')}</button><span><GlitchMark size={25}/> GLITCH <i>/</i> {tx(lang,'ΦΑΚΕΛΟΣ ΓΕΓΟΝΟΤΟΣ','EVENT FILE')}</span><button onClick={onClose} aria-label={tx(lang,'Κλείσιμο','Close')}><X size={20}/></button></div>
   <div className="orbit-reader-scroll">
    <header className="orbit-story-hero">
     {story.headline.imageUrl&&<img src={story.headline.imageUrl} alt="" onError={e=>{e.currentTarget.style.display='none'}}/>}
     <div className="orbit-story-shade"/>
     <div className="orbit-story-title-area"><span className="orbit-overline"><span className="orbit-live-pulse"/> {tx(lang,'Η ΕΞΕΛΙΞΗ','DEVELOPMENT')} · {date(story.lastAt,lang)}</span>
      <h1>{titleFor(story.headline)}</h1><p>{summaryFor(story.headline)}</p>
     </div>
    </header>
    <section className="orbit-signal-panel" aria-label={tx(lang,'Αποτύπωμα κάλυψης','Coverage fingerprint')}>
     <div><small>{tx(lang,'ΔΗΜΟΣΙΕΥΣΕΙΣ','REPORTS')}</small><strong>{story.reports.length}</strong></div>
     <div><small>{tx(lang,'ΕΚΔΟΤΕΣ','PUBLISHERS')}</small><strong>{editions.length}</strong></div>
     <div><small>{tx(lang,'ΠΡΟΦΙΛ ΜΕ ΠΗΓΕΣ','SOURCED PROFILES')}</small><strong>{profiles}</strong></div>
     <div className="orbit-fingerprint"><small>{tx(lang,'ΠΟΥ ΕΣΤΙΑΖΟΥΝ ΟΙ ΤΙΤΛΟΙ','HEADLINE SUBJECTS')}</small><div className="orbit-fingerprint-line">{frames.map((f,i)=><div key={f.key} title={axisTitle(f.key,lang)+': '+f.count} style={{flex:f.count,background:['#e97d60','#6eb6af','#bea3ec','#f0c77a','#8a9fdf','#b8c6d3'][i%6]}}/>)}</div><small className="orbit-muted">{tx(lang,'Θέματα, όχι πολιτική μεροληψία.','Subjects, not political bias.')}</small></div>
    </section>
    <nav className="orbit-modebar" aria-label={tx(lang,'Τρόποι ανάγνωσης','Reading modes')}>{tabs.map(m=>{const Icon=m.icon;return <button key={m.id} className={mode===m.id?'active':''} onClick={()=>setMode(m.id)} aria-pressed={mode===m.id}><Icon size={16}/>{lang==='el'?m.el:m.en}</button>})}</nav>
    <div className="orbit-reader-inner">
     {mode==='story'&&<section className="orbit-brief">
      <div className="orbit-section-heading"><span>01 / {tx(lang,'Η ΟΥΣΙΑ','THE ESSENTIALS')}</span><h2>{tx(lang,'Τι έχει αναφερθεί','What was reported')}</h2><p>{tx(lang,'Στοιχεία από το διαθέσιμο απόσπασμα, όχι από ολόκληρο το άρθρο.','Information from the available excerpt, not a claim to have read the full article.')}</p></div>
      <div className="orbit-brief-text"><CheckCircle2 size={19}/><p>{summaryFor(story.headline)}</p></div>
      <div className="orbit-brief-grid"><div><small>{tx(lang,'ΠΡΩΤΗ ΣΤΟ ΔΕΙΓΜΑ','EARLIEST IN SAMPLE')}</small><strong>{date(story.firstAt,lang)}</strong></div><div><small>{tx(lang,'ΝΕΟΤΕΡΗ ΑΝΑΦΟΡΑ','LATEST REPORT')}</small><strong>{date(story.lastAt,lang)}</strong></div></div>
      <a className="orbit-primary-link" href={story.headline.url} target="_blank" rel="noopener noreferrer">{tx(lang,'Άνοιξε το πρωτότυπο άρθρο','Open original article')}<ArrowUpRight size={16}/></a>
      <div className="orbit-next-mode"><div><strong>{tx(lang,'Η ενδιαφέρουσα ερώτηση: ποιος το παρουσιάζει πώς;','The interesting question: who frames it how?')}</strong><p>{tx(lang,'Σύγκρινε τίτλους διαφορετικών εκδοτών χωρίς κατασκευασμένα στρατόπεδα.','Compare publishers without invented opposing camps.')}</p></div><button onClick={()=>setMode('perspectives')}>{tx(lang,'Σύγκριση','Compare')}<ArrowRight size={16}/></button></div>
     </section>}
     {mode==='perspectives'&&<section className="orbit-angles">
      <div className="orbit-section-heading"><span>02 / {tx(lang,'ΑΠΟΤΥΠΩΜΑ ΚΑΛΥΨΗΣ','COVERAGE DNA')}</span><h2>{tx(lang,'Διαφορετικές γωνίες στην ίδια είδηση','Different angles on one story')}</h2><p>{tx(lang,'Ο χάρτης βασίζεται στις λέξεις των τίτλων — όχι σε συμπεράσματα περί πολιτικής στάσης.','The map is based on headline wording, not judgments about political allegiance.')}</p></div>
      <div className="orbit-frame-list">{frames.map((f,i)=><div key={f.key}><span className="orbit-frame-count" style={{background:['#ec876d','#75b7b0','#b7a7df','#e3b871','#a6b4e5','#bac8d1'][i%6]}}>{f.count}</span><div><strong>{axisTitle(f.key,lang)}</strong><small>{f.sources.join(' · ')}</small></div></div>)}</div>
      {editions.length>=2?<div className="orbit-headline-compare"><div><label htmlFor="orbit-source-a">{tx(lang,'ΕΚΔΟΤΗΣ Α','PUBLISHER A')}</label><select id="orbit-source-a" value={a.id} onChange={e=>setLeft(e.target.value)}>{editions.map(r=><option key={r.id} value={r.id}>{r.source}</option>)}</select><blockquote>{titleFor(a)}</blockquote><a href={a.url} target="_blank" rel="noopener noreferrer">{tx(lang,'Άρθρο','Article')}<ExternalLink size={14}/></a></div>
      <div><label htmlFor="orbit-source-b">{tx(lang,'ΕΚΔΟΤΗΣ Β','PUBLISHER B')}</label><select id="orbit-source-b" value={b.id} onChange={e=>setRight(e.target.value)}>{editions.map(r=><option key={r.id} value={r.id}>{r.source}</option>)}</select><blockquote>{titleFor(b)}</blockquote><a href={b.url} target="_blank" rel="noopener noreferrer">{tx(lang,'Άρθρο','Article')}<ExternalLink size={14}/></a></div></div>
      :<div className="orbit-empty"><HelpCircle size={18}/>{tx(lang,'Στο διαθέσιμο δείγμα υπάρχει μόνο ένας εκδότης. Δεν επινοούμε δεύτερη «πλευρά».','Only one publisher appears in this sample. No opposing side is invented.')}</div>}
      <h3 className="orbit-secondary-title">{tx(lang,'Ιδιοκτησία και πολιτική οπτική','Ownership and political orientation')}</h3>
      <div className="orbit-sources-list">{editions.map(r=><SourceItem key={r.id} r={r} lang={lang}/>)}</div>
      <p className="orbit-methodology">{tx(lang,'Οι αξιολογήσεις AllSides αφορούν ιδεολογική οπτική, κυρίως στο πλαίσιο των ΗΠΑ — όχι φιλοκυβερνητικότητα ή ακρίβεια. Δημόσια χρηματοδότηση δεν αποδεικνύει πολιτική ταύτιση.','AllSides ratings describe ideological orientation, mainly in a U.S. context — not pro-government allegiance or accuracy. Public funding alone proves neither.')}</p>
     </section>}
     {mode==='timeline'&&<section className="orbit-chronology"><div className="orbit-section-heading"><span>03 / {tx(lang,'ΧΡΟΝΟΛΟΓΙΟ','TIMELINE')}</span><h2>{tx(lang,'Πώς εξελίχθηκε η κάλυψη','How coverage unfolded')}</h2><p>{tx(lang,'Πραγματικές ώρες δημοσίευσης. Νεότερο άρθρο δεν σημαίνει απαραίτητα αλλαγή γεγονότων.','Actual report times. Later coverage does not necessarily mean the facts changed.')}</p></div><div className="orbit-timeline">{timeline.map((r,i)=><a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"><span className="orbit-time-dot"/><time>{date(r.timestamp,lang)} · {i===0?tx(lang,'Πρώτη στο δείγμα','First in sample'):r.source}</time><strong>{titleFor(r)}</strong><small>{r.source} <ArrowUpRight size={13}/></small></a>)}</div></section>}
     {mode==='view'&&<section className="orbit-opinion"><div className="orbit-section-heading"><span>04 / {tx(lang,'ΑΝΑΛΥΣΗ GLITCH','GLITCH ANALYSIS')}</span><h2>{tx(lang,'Η ανάλυση οφείλει να αποδεικνύεται','Analysis should survive scrutiny')}</h2><p>{tx(lang,'Ξεχωρίζουμε ερμηνεία από τεκμήρια. Καμία έτοιμη «γνώμη» για κάθε είδηση.','Inference is separate from evidence. No generic recycled opinions.')}</p></div>
      {analysisBusy&&<div className="orbit-empty"><Activity size={16}/>{tx(lang,'Συντάσσεται η ανάλυση…','Generating source-grounded analysis…')}</div>}
      {analysis&&<div className="orbit-ai-result"><p>{analysis.analysis}</p><div><strong>{tx(lang,'ΓΙΑΤΙ ΕΧΕΙ ΣΗΜΑΣΙΑ','WHY IT MATTERS')}</strong><p>{analysis.importance}</p></div><div><strong>{tx(lang,'ΤΟ ΕΠΟΜΕΝΟ ΕΛΕΓΞΙΜΟ ΣΗΜΑ','NEXT VERIFIABLE SIGNAL')}</strong><p>{analysis.next}</p></div><div><strong>{tx(lang,'ΤΙ ΔΕΝ ΤΕΚΜΗΡΙΩΝΕΤΑΙ','EVIDENCE GAP')}</strong><p>{analysis.uncertainty}</p></div><small>{tx(lang,'Ανάλυση AI από δημοσιευμένους τίτλους και αποσπάσματα, όχι ανεξάρτητο ρεπορτάζ.','AI analysis from headlines and excerpts, not original reporting.')}</small></div>}
      {(!aiEnabled||analysisError)&&<div className="orbit-ai-off"><Sparkles size={25}/><h3>{tx(lang,'Ο πρωτότυπος σχολιασμός δεν είναι ακόμη ενεργός','Original AI commentary is not enabled yet')}</h3><p>{tx(lang,'Χρειάζεται ρύθμιση OpenAI API στον διακομιστή. Δεν εμφανίζουμε γενικόλογα κείμενα σαν να είναι εξατομικευμένη ανάλυση.','A server-side OpenAI API is needed. We do not disguise generic templates as original analysis.')}</p>{analysisError&&<small>{analysisError}</small>}</div>}
      <button className="orbit-return-to-sources" onClick={()=>setMode('perspectives')}>{tx(lang,'Έλεγξε τις πηγές','Review source evidence')}<ArrowRight size={16}/></button>
     </section>}
    </div>
   </div>
  </article>
 </div>;
}
