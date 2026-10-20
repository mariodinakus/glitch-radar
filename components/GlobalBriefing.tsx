'use client';
import {useMemo,useState} from 'react';
import {ArrowUpRight,ChevronDown,ChevronUp,Globe2,Radio} from 'lucide-react';
import type {Story} from '@/lib/stories';
import {conflictSummaries} from '@/lib/conflicts';

type Lang='el'|'en';
type Props={stories:Story[];lang:Lang;titleFor:(s:Story)=>string;onOpen:(s:Story)=>void;onWars:()=>void;compact?:boolean;updatedAt?:string};
const tr=(lang:Lang,el:string,en:string)=>lang==='el'?el:en;
type Group='conflicts'|'politics'|'economy'|'climate';
const definitions:{id:Group;el:string;en:string;noteEl:string;noteEn:string;match:(s:Story)=>boolean}[]=[
 {id:'conflicts',el:'Συγκρούσεις & ανθρωπιστικές κρίσεις',en:'Conflict & humanitarian crises',
  noteEl:'Μέτωπα, άμαχοι, εκεχειρίες, εκτοπισμοί',noteEn:'Front lines, civilians, ceasefires, displacement',
  match:s=>s.kind==='conflict'||s.storylines.some(x=>['ukraine','mideast'].includes(x))},
 {id:'politics',el:'Πολιτική & κοινωνικές εντάσεις',en:'Politics & social unrest',
  noteEl:'Θεσμοί, εκλογές και διαδηλώσεις',noteEn:'Institutions, elections and protests',
  match:s=>s.kind==='protest'||s.kind==='election'||s.storylines.includes('protests')},
 {id:'economy',el:'Παγκόσμια οικονομία & ενέργεια',en:'Global economy & energy',
  noteEl:'Τιμές, εμπόριο, εφοδιασμός, επιτόκια',noteEn:'Prices, trade, supply chains, rates',
  match:s=>s.section==='economy'||s.storylines.some(x=>['economy','energy'].includes(x))},
 {id:'climate',el:'Κλίμα & φυσικά φαινόμενα',en:'Climate & natural events',
  noteEl:'Καιρικά άκρα, καταστροφές, περιβάλλον',noteEn:'Extreme weather, disasters, environment',
  match:s=>s.kind==='disaster'||s.section==='climate'||s.storylines.includes('climate')}
];
export default function GlobalBriefing({stories,lang,titleFor,onOpen,onWars,compact=false,updatedAt}:Props){
 const [more,setMore]=useState(!compact);
 const now=updatedAt?Date.parse(updatedAt):Date.now();
 const daily=useMemo(()=>stories.filter(s=>Number.isFinite(Date.parse(s.lastAt))&&now-Date.parse(s.lastAt)<=86400000&&now-Date.parse(s.lastAt)>=-3600000),[stories,now]);
 const conflicts=useMemo(()=>conflictSummaries(stories),[stories]);
 const active=conflicts.filter(s=>s.last24>0);
 const groups=useMemo(()=>definitions.map(d=>{
  const matching=daily.filter(d.match);
  return {...d,stories:[...matching].sort((a,b)=>Date.parse(b.lastAt)-Date.parse(a.lastAt)),count:matching.length};
 }),[daily]);
 const publishers=new Set(daily.flatMap(s=>s.sources)).size;
 const sourceAt=Number.isFinite(now)?new Date(now).toLocaleString(lang==='el'?'el-GR':'en-GB',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'}):'';
 return <section className={'global-briefing'+(compact?' brief-compact':'')} aria-label={tr(lang,'Παγκόσμια σύνοψη','World briefing')}>
  <div className="global-brief-head">
   <div><span className="global-brief-kicker"><Globe2 size={14}/> GLITCH / WORLD BRIEF</span>
    <h2>{tr(lang,'Η παγκόσμια εικόνα τώρα','The global picture right now')}<em>.</em></h2>
    <p>{tr(lang,'Σύντομη αποτύπωση όσων καταγράφουν οι διαθέσιμες ειδησεογραφικές πηγές — όχι πρόβλεψη πολέμου ή συνολική μέτρηση της κατάστασης του πλανήτη.','A concise snapshot of what our available news sources are reporting — not a forecast or a definitive measure of the planet.')}</p>
   </div>
   {compact&&<button className="global-brief-toggle" onClick={()=>setMore(v=>!v)} aria-expanded={more}>{more?tr(lang,'Σύμπτυξη','Collapse'):tr(lang,'Πλήρης σύνοψη','Full briefing')}{more?<ChevronUp size={16}/>:<ChevronDown size={16}/>}</button>}
  </div>
  <div className="global-brief-stats">
   <div><strong>{daily.length}</strong><span>{tr(lang,'διακριτά θέματα / 24ωρο','distinct stories / 24h')}</span></div>
   <div><strong>{publishers}</strong><span>{tr(lang,'εκδότες στο δείγμα','publishers in sample')}</span></div>
   <div><strong>{active.length} <small>/ {conflicts.length}</small></strong><span>{tr(lang,'εστίες με κάλυψη / κατάλογος','situations reported / watchlist')}</span></div>
   <div><span className="global-brief-updated"><Radio size={12}/>{tr(lang,'Τελευταία ανάκτηση','Feed fetched')}</span><strong className="global-brief-date">{sourceAt||'—'}</strong></div>
  </div>
  {more&&<>
   <section className="global-context">
    <div className="global-context-title"><strong>{tr(lang,'Πού βρισκόμαστε παγκοσμίως','Where the world stands')}</strong>
     <span>{tr(lang,'Στοιχεία αναφοράς · 20 Οκτωβρίου 2026','Source snapshot · 20 October 2026')}</span></div>
    <p>{tr(lang,'Η εικόνα δεν είναι ένας ενιαίος «παγκόσμιος πόλεμος»: συνυπάρχουν ένοπλες συγκρούσεις, ανθρωπιστικές ανάγκες, οικονομικοί κίνδυνοι και κλιματική πίεση. Τα παρακάτω είναι χρονολογημένα στοιχεία από πηγές, όχι αυτοματοποιημένοι ζωντανοί μετρητές.','There is no single global war to summarize: ongoing conflicts, humanitarian needs, economic uncertainty and climate stress coexist. These are dated sourced observations, not live automatically updated counters.')}</p>
    <div className="global-context-grid">
     <div><span>{tr(lang,'Γεωπολιτική','Geopolitics')}</span><strong>{tr(lang,'27 εστίες στον κατάλογο CFR','27 conflicts on CFR tracker')}</strong>
       <p>{tr(lang,'Διακρατικοί πόλεμοι, εμφύλιοι, ένοπλη βία και εδαφικές εντάσεις. Το GLITCH παρακολουθεί επιπλέον δικές του εστίες, με διαφορετική μεθοδολογία.','Interstate wars, civil wars, armed violence and territorial disputes. GLITCH has a broader editorial watchlist with a different methodology.')}</p><a href="https://www.cfr.org/global-conflict-tracker/dashboard" target="_blank" rel="noopener noreferrer">CFR ↗</a></div>
     <div><span>{tr(lang,'Ανθρωπιστική κατάσταση','Humanitarian conditions')}</span><strong>{tr(lang,'Σουδάν και Γάζα υπό πίεση','Sudan and Gaza under strain')}</strong>
       <p>{tr(lang,'Ο ΠΟΥ προειδοποίησε στις 12/10 για αυξημένο κίνδυνο λιμού σε Νταρφούρ και Κορντοφάν. Στις 20/10 αναφέρθηκαν μεγάλες περικοπές επισιτιστικής βοήθειας στη Γάζα.','WHO warned on 12 October of rising famine risk in Darfur and Kordofan. Major food aid reductions in Gaza were reported on 20 October.')}</p>
       <a href="https://www.who.int/news/item/12-10-2026-ipc-sudan-food-insecurity-and-malnutrition-alert" target="_blank" rel="noopener noreferrer">WHO ↗</a> · <a href="https://apnews.com/article/d7ebbcf1fd30cc608c9b9ed5126deb95" target="_blank" rel="noopener noreferrer">AP / WFP ↗</a></div>
     <div><span>{tr(lang,'Παγκόσμια οικονομία','World economy')}</span><strong>{tr(lang,'3,1% ανάπτυξη το 2026','3.1% growth in 2026')}</strong>
       <p>{tr(lang,'Πρόβλεψη ΔΝΤ Οκτωβρίου 2026, με παγκόσμιο πληθωρισμό 4,7%. Η ανάπτυξη παραμένει θετική αλλά άνιση· γεωπολιτικές και ενεργειακές αναταράξεις πιέζουν.','IMF October 2026 projection, with global inflation at 4.7%. Growth remains positive but uneven, exposed to geopolitical and energy shocks.')}</p><a href="https://www.imf.org/en/Publications/WEO/Issues/2026/10/13/world-economic-outlook-october-2026" target="_blank" rel="noopener noreferrer">IMF ↗</a></div>
     <div><span>{tr(lang,'Κλίμα','Climate')}</span><strong>{tr(lang,'Περισσότερα παρατεταμένα κύματα ζέστης','Larger prolonged heat waves')}</strong>
       <p>{tr(lang,'Έρευνα Reuters στις 20/10 ανέδειξε την αυξανόμενη έκταση και διάρκεια των μεγάλων κυμάτων ακραίας ζέστης. Η εικόνα δεν είναι ομοιόμορφη σε όλες τις περιοχές.','Reuters research published on 20 October shows an increase in the extent and persistence of massive heat waves, with unequal effects across regions.')}</p><a href="https://www.reuters.com/investigations/takeaways-key-findings-our-investigation-supersized-heat-waves-2026-10-20/" target="_blank" rel="noopener noreferrer">Reuters ↗</a></div>
    </div>
   </section>
   <div className="global-brief-axes">{groups.map(g=><article key={g.id}>
    <div className="global-brief-axis-head"><h3>{lang==='el'?g.el:g.en}</h3><span>{g.count} {tr(lang,'θέματα / 24ωρο','stories / 24h')}</span></div>
    <p>{lang==='el'?g.noteEl:g.noteEn}</p>
    {g.stories.length?<ul>{g.stories.slice(0,3).map(s=><li key={s.id}><button onClick={()=>onOpen(s)}><span>{titleFor(s)}</span><ArrowUpRight size={14}/></button><small>{s.sources.slice(0,2).join(' · ')} · {new Date(s.lastAt).toLocaleTimeString(lang==='el'?'el-GR':'en-GB',{hour:'2-digit',minute:'2-digit'})}</small></li>)}</ul>:
     <p className="global-brief-muted">{tr(lang,'Δεν προκύπτει πρόσφατη κάλυψη από τις συνδεδεμένες πηγές.','No matching recent coverage in the connected sample.')}</p>}
   </article>)}</div>
   <div className="global-brief-bottom"><p>{tr(lang,'Τα νούμερα μετρούν άρθρα που ομαδοποίησε το GLITCH, όχι θύματα, αριθμό ενεργών πολέμων, ένταση κρίσεων ή «ποσοστό παγκόσμιας αστάθειας». Οι ίδιες ειδήσεις μπορεί να ανήκουν σε περισσότερες ενότητες.','Counts refer to grouped news stories, not deaths, number of active wars, conflict severity or a global instability percentage. One story may appear in several themes.')}</p>
    <button onClick={onWars}>{tr(lang,'Χάρτες & αναλυτικό WAR ROOM','Maps & full WAR ROOM')} <ArrowUpRight size={16}/></button>
   </div>
  </>}
 </section>;
}
