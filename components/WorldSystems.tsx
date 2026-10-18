'use client';

import {useMemo,useState} from 'react';
import {ArrowRight,ArrowUpRight,Building2,GitCompareArrows,GitFork,Globe2,Info,MoveRight,Radio,ScanSearch,Waypoints} from 'lucide-react';
import type {Signal} from '@/lib/types';
import type {StoryCase} from '@/lib/world-pulse';
import {actorArena,rippleForCase,worldDiff} from '@/lib/world-engines';
import type {ActorLink,EngineLang,RippleModel} from '@/lib/world-engines';

type Props={cases:StoryCase[];lastVisit:string|null;lang:EngineLang;titleFor:(signal:Signal)=>string;onOpen:(c:StoryCase)=>void};
const dateLabel=(text:string,lang:EngineLang)=>{
 const d=new Date(text);return Number.isFinite(d.getTime())?d.toLocaleString(lang==='el'?'el-GR':'en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'—';
};
const local=(lang:EngineLang,el:string,en:string)=>lang==='el'?el:en;
function SectionTitle({tag,heading,description}:{tag:string;heading:string;description:string}){
 return <header className="engine-section-head"><span>{tag}</span><h3>{heading}</h3><p>{description}</p></header>;
}
export function WorldDiff({cases,lastVisit,lang,titleFor,onOpen}:Props){
 const deltas=useMemo(()=>worldDiff(cases,lastVisit,6),[cases,lastVisit]);
 return <section className="engine-diff">
  <SectionTitle tag="01 / WORLD DIFF" heading={local(lang,'Η διαφορά από την προηγούμενη επίσκεψη','What changed since your last visit')}
   description={local(lang,'Νέες και μεταγενέστερες δημοσιεύσεις — δεν ισχυριζόμαστε ότι άλλαξε η πραγματική κατάσταση χωρίς τεκμηρίωση.','New or subsequent reports. A new headline alone does not prove the real-world situation changed.')}/>
  {!deltas.length&&<div className="engine-empty">{local(lang,'Δεν εντοπίστηκαν νεότερες δημοσιεύσεις στο διαθέσιμο δείγμα.','No newer reports appeared in the available sample.')}</div>}
  <div className="engine-diff-list">{deltas.map(d=>{
   const c=cases.find(x=>x.id===d.caseId);
   if(!c)return null;
   const label=d.kind==='new'?local(lang,'ΝΕΟΣ ΦΑΚΕΛΟΣ','NEW DOSSIER'):d.kind==='followup'?local(lang,'ΝΕΟΤΕΡΗ ΚΑΛΥΨΗ','FOLLOW-UP COVERAGE'):local(lang,'ΠΡΟΣΦΑΤΟ ΓΕΓΟΝΟΣ','RECENT EVENT');
   return <button type="button" onClick={()=>onOpen(c)} className="engine-diff-item" key={d.caseId}>
    <span className={'engine-diff-led engine-'+d.kind}/><span className="engine-diff-body">
     <span className="engine-diff-caption">{label} <b>· {d.reportsSince} {local(lang,'νέες εγγραφές','new records')} · {d.distinctSources} {local(lang,'πηγές','sources')}</b></span>
     <strong>{titleFor(d.headline)}</strong>
     {d.previous&&d.previous.id!==d.headline.id&&<small>{local(lang,'Προηγούμενη αναφορά στο δείγμα:','Earlier sampled report:')} {titleFor(d.previous)}</small>}
    </span><span className="engine-diff-date">{dateLabel(d.lastAt,lang)}<ArrowUpRight size={16}/></span>
   </button>;
  })}</div>
  <p className="engine-fineprint">{local(lang,'Τα «νέα» υπολογίζονται από την προηγούμενη επίσκεψη σε αυτήν τη συσκευή. Η ροή καλύπτει μόνο τις διαθέσιμες πηγές, όχι ολόκληρο τον κόσμο.','“New” is measured since this device’s last visit. Coverage reflects the available feeds, not the entire world.')}</p>
 </section>;
}

export function RippleEngine({caseFile,lang,titleFor}:{caseFile:StoryCase;lang:EngineLang;titleFor:(s:Signal)=>string}){
 const result=useMemo(()=>rippleForCase(caseFile),[caseFile]);
 const [active,setActive]=useState(0);
 if(!result)return <div className="engine-empty"><ScanSearch size={20}/><span>{local(lang,'Δεν υπάρχουν αρκετές θεματικές ενδείξεις για μια αξιόπιστη αλυσίδα πιθανών συνεπειών.','Not enough topic evidence for a useful conditional consequence chain.')}</span></div>;
 const step=result.steps[Math.min(active,result.steps.length-1)];
 return <div className="engine-ripple">
  <div className="engine-ripple-source"><Radio size={15}/><span><strong>{local(lang,'ΑΦΕΤΗΡΙΑ: ΑΝΑΦΟΡΑ ΠΗΓΗΣ','START: SOURCE REPORT')}</strong>{titleFor(result.trigger)}</span><a href={result.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={local(lang,'Αρχικό άρθρο','Original article')}><ArrowUpRight size={17}/></a></div>
  <div className="engine-ripple-signal">{local(lang,'Πιθανή αλυσίδα μηχανισμών · όχι πρόβλεψη ή επιβεβαιωμένος αντίκτυπος','Conditional chain of mechanisms · not a prediction or observed impact')}</div>
  <div className="engine-ripple-chain">{result.steps.map((s,i)=><div className="engine-ripple-cell" key={s.id}>
   {i>0&&<MoveRight size={18} className="engine-ripple-arrow"/>}
   <button className={'engine-ripple-node'+(i===active?' selected':'')} onClick={()=>setActive(i)} aria-pressed={i===active}>
    <small>0{i+1}</small><strong>{lang==='el'?s.el:s.en}</strong>
   </button>
  </div>)}</div>
  <div className="engine-ripple-explain" key={step.id}>
   <div><span>{local(lang,'ΥΠΟΘΕΤΙΚΟΣ ΜΗΧΑΝΙΣΜΟΣ','HYPOTHETICAL MECHANISM')}</span><p>{lang==='el'?step.mechanismEl:step.mechanismEn}</p></div>
   <div><span>{local(lang,'ΤΙ ΘΑ ΤΟ ΕΠΙΒΕΒΑΙΩΝΕ','WHAT WOULD VERIFY THIS')}</span><p>{lang==='el'?step.verifyEl:step.verifyEn}</p></div>
  </div>
  {result.mentionedCompanies.length>0&&<div className="engine-company-mentions"><Building2 size={15}/><span>{local(lang,'Εταιρείες που κατονομάζονται στις πηγές:','Companies named in reporting:')}</span>{result.mentionedCompanies.map(c=><strong key={c.id}>{c.name}</strong>)}</div>}
  <p className="engine-fineprint">{local(lang,'Οι συνδέσεις παρουσιάζουν δυνατούς μηχανισμούς βάσει θέματος. Δεν αποδεικνύουν ότι κάποιο βήμα συνέβη, ούτε ότι οι κατονομαζόμενες εταιρείες επηρεάστηκαν.','Connections show possible mechanisms by topic. No link proves an outcome occurred or that named companies were affected.')}</p>
 </div>;
}

export function ActorArena({cases,lang,titleFor,onOpen}:{cases:StoryCase[];lang:EngineLang;titleFor:(s:Signal)=>string;onOpen:(c:StoryCase)=>void}){
 const links=useMemo(()=>actorArena(cases,30),[cases]);
 const [linkId,setLinkId]=useState<string|null>(null);
 const [onlyExplicit,setOnlyExplicit]=useState(false);
 const options=links.filter(l=>!onlyExplicit||l.type==='explicit');
 const selected=options.find(x=>x.id===linkId)||options[0];
 return <div className="engine-arena">
  <div className="engine-arena-toggle"><span>{local(lang,'Συνδέσεις εντοπισμένες σε τίτλους δημοσιευμάτων','Links found in published headlines')}</span>
   <button className={onlyExplicit?'selected':''} onClick={()=>setOnlyExplicit(x=>!x)} aria-pressed={onlyExplicit}>{local(lang,'Μόνο ρητές σχέσεις','Stated links only')}</button>
  </div>
  {!options.length&&<div className="engine-empty">{local(lang,'Δεν υπάρχουν αρκετά στοιχεία για αναγνώριση σχέσεων στο διαθέσιμο δείγμα.','Not enough evidence of actor links in the current sample.')}</div>}
  {selected&&<div className="engine-arena-stage">
   <div className="engine-arena-actors">
    <div className="engine-actor-node"><span><Globe2 size={17}/></span><strong>{selected.from.name}</strong><small>{selected.from.type}</small></div>
    <div className={'engine-actor-edge'+(selected.type==='explicit'?' explicit':'')}><span>{lang==='el'?selected.labelEl:selected.labelEn}</span><Waypoints size={24}/></div>
    <div className="engine-actor-node"><span><Globe2 size={17}/></span><strong>{selected.to.name}</strong><small>{selected.to.type}</small></div>
   </div>
   <p className="engine-arena-evidence">{local(lang,'Τίτλος τεκμηρίωσης:','Source headline:')} <strong>{titleFor(selected.report)}</strong></p>
   <div className="engine-arena-actions"><a href={selected.report.url} target="_blank" rel="noopener noreferrer">{local(lang,'Άνοιγμα πηγής','Open source')} <ArrowUpRight size={15}/></a><button onClick={()=>{const c=cases.find(x=>x.id===selected.caseId);if(c)onOpen(c)}}>{local(lang,'Δες τον φάκελο','View dossier')} <ArrowRight size={15}/></button></div>
  </div>}
  {options.length>1&&<div className="engine-arena-list">{options.slice(0,8).map(l=><button key={l.id} onClick={()=>setLinkId(l.id)} className={selected?.id===l.id?'selected':''}><span>{l.from.name} <b>↔</b> {l.to.name}</span><small>{lang==='el'?l.labelEl:l.labelEn}</small></button>)}</div>}
  <p className="engine-fineprint">{local(lang,'Δύο ονόματα στον ίδιο τίτλο δεν είναι συμμαχία. Ακόμη και μια ρητή σχέση είναι ισχυρισμός της πηγής, όχι ανεξάρτητη διασταύρωση ή απόδειξη εμπλοκής.','Co-mentions are not alliances. Even a stated relationship is a source claim, not independent corroboration or proof of responsibility.')}</p>
 </div>;
}

export function WorldSystems(props:Props){
 const {cases,lang,titleFor,onOpen,lastVisit}=props;
 const [active,setActive]=useState<'diff'|'ripple'|'arena'>('diff');
 const rippleCases=useMemo(()=>cases.filter(c=>!!rippleForCase(c)).slice(0,30),[cases]);
 const [caseId,setCaseId]=useState<string|null>(null);
 const target=rippleCases.find(c=>c.id===caseId)||rippleCases[0];
 return <section className="engine-shell" aria-label="GLITCH World Consequence Engine">
  <div className="engine-header"><div><span className="engine-eyebrow"><GitFork size={16}/> GLITCH / CONSEQUENCE ENGINE</span><h2>{local(lang,'Όχι μόνο τι συνέβη.','Beyond what happened.')}<em>{local(lang,' Τι αλλάζει;',' What changes?')}</em></h2><p>{local(lang,'Τρεις διαφορετικοί τρόποι να κατανοήσεις τις παγκόσμιες εξελίξεις, χωρίς να μπερδεύεις δεδομένα και υποθέσεις.','Three ways to understand global developments, separating reported evidence from conditional scenarios.')}</p></div><div className="engine-live"><span/> {local(lang,'ΑΠΟ ΔΗΜΟΣΙΕΣ ΠΗΓΕΣ','PUBLIC SOURCE INPUT')}</div></div>
  <div className="engine-mode-rail" role="group" aria-label="World analysis modes">
   <button className={active==='diff'?'selected':''} onClick={()=>setActive('diff')} aria-pressed={active==='diff'}><GitCompareArrows size={18}/><span>01</span> WORLD DIFF</button>
   <button className={active==='ripple'?'selected':''} onClick={()=>setActive('ripple')} aria-pressed={active==='ripple'}><GitFork size={18}/><span>02</span> RIPPLE ENGINE</button>
   <button className={active==='arena'?'selected':''} onClick={()=>setActive('arena')} aria-pressed={active==='arena'}><Waypoints size={18}/><span>03</span> ACTOR ARENA</button>
  </div>
  <div className="engine-mode-content">
   {active==='diff'&&<WorldDiff {...props}/>}
   {active==='ripple'&&<section><SectionTitle tag="02 / RIPPLE ENGINE" heading={local(lang,'Από το γεγονός στις πιθανές συνέπειες','From events to potential consequences')} description={local(lang,'Επίλεξε έναν φάκελο, πάτησε ένα στάδιο και δες τον μηχανισμό και τι στοιχεία χρειάζονται.','Choose an event, select a stage and inspect the mechanism and the evidence needed.')}/>{target&&<label className="engine-case-selector">{local(lang,'ΓΕΓΟΝΟΣ','EVENT')}<select value={target.id} onChange={e=>setCaseId(e.target.value)}>{rippleCases.map(c=><option key={c.id} value={c.id}>{titleFor(c.headline).slice(0,105)}</option>)}</select></label>}{target?<RippleEngine key={target.id} caseFile={target} lang={lang} titleFor={titleFor}/>:<div className="engine-empty">{local(lang,'Δεν βρέθηκαν κατάλληλα γεγονότα για εργαστήριο πιθανών συνεπειών.','No suitable cases for the consequence lab.')}</div>}</section>}
   {active==='arena'&&<section><SectionTitle tag="03 / ACTOR ARENA" heading={local(lang,'Οι δρώντες που εμφανίζονται μαζί','How actors appear together')} description={local(lang,'Σχέσεις από συγκεκριμένους τίτλους με άμεσο σύνδεσμο στην πηγή.','Source-linked actor relations extracted from specific headlines.')}/><ActorArena cases={cases} lang={lang} titleFor={titleFor} onOpen={onOpen}/></section>}
  </div>
 </section>;
}
