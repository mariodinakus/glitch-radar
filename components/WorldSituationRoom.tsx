'use client';
import {useEffect,useMemo,useState} from 'react';
import {ArrowRight,ArrowUpRight,Expand,Flame,Globe2,MapPin,Radio,ScanEye,X} from 'lucide-react';
import type {StoryCase} from '@/lib/world-pulse';
import type {Signal} from '@/lib/types';
import {globeHotspots,majorEventSignal,rankMajorEvents} from '@/lib/major-events';
import type {EventClass,ImpactLens} from '@/lib/major-events';
import {publisherKey} from '@/lib/publisher-key';
import WorldGlobe from './WorldGlobe';

type Lang='el'|'en';
type Props={cases:StoryCase[];lang:Lang;titleFor:(s:Signal)=>string;summaryFor:(s:Signal)=>string;onOpen:(c:StoryCase)=>void};
const trans=(lang:Lang,el:string,en:string)=>lang==='el'?el:en;
const classNames:Record<EventClass,[string,string]>={
 conflict:['ΣΥΓΚΡΟΥΣΗ','CONFLICT'],protest:['ΔΙΑΔΗΛΩΣΗ','PROTEST'],election:['ΕΚΛΟΓΕΣ','ELECTION'],
 economy:['ΟΙΚΟΝΟΜΙΑ','ECONOMY'],disaster:['ΚΑΤΑΣΤΡΟΦΗ','DISASTER'],ai:['AI / ΤΕΧΝΟΛΟΓΙΑ','AI / TECHNOLOGY'],other:['ΔΙΕΘΝΕΣ','WORLD']
};
const whyWatch:Record<ImpactLens,[string,string]>={
 conflict:['Συγκρούσεις και διπλωματικές εξελίξεις μπορούν να επηρεάσουν την ασφάλεια και τους αμάχους.','Conflict and diplomacy can affect security and civilian lives.'],
 tension:['Οι εντάσεις μπορούν να επηρεάσουν την ασφάλεια και τις σχέσεις μεταξύ χωρών.','Tensions can affect security and relations between countries.'],
 energy:['Ο ενεργειακός εφοδιασμός και οι τιμές μπορούν να επηρεάσουν νοικοκυριά και οικονομίες.','Energy supply and prices can affect households and economies.'],
 election:['Οι εκλογές και οι αλλαγές κυβέρνησης μπορούν να αλλάξουν την πολιτική μιας χώρας.','Elections and changes of government can alter a country’s policies.'],
 protest:['Η κοινωνική αναταραχή μπορεί να επηρεάσει αποφάσεις και πολιτικές.','Social unrest can influence decisions and public policy.'],
 economy:['Οι οικονομικές αποφάσεις και οι συνθήκες στις αγορές μπορούν να επηρεάσουν εισοδήματα και τιμές.','Economic decisions and market conditions can affect incomes and prices.'],
 disaster:['Οι καταστροφές μπορούν να επηρεάσουν ανθρώπους, υποδομές και εφοδιασμό.','Disasters can affect people, infrastructure and supply.'],
 ai:['Οι σημαντικές τεχνολογικές αλλαγές και οι κανόνες μπορούν να επηρεάσουν εργασία και υποδομές.','Major technology changes and rules can affect work and infrastructure.'],
 health:['Οι εξελίξεις στη δημόσια υγεία μπορούν να επηρεάσουν πληθυσμούς και συστήματα υγείας.','Public health developments can affect populations and health systems.']
};
const time=(date:string,lang:Lang)=>{
 const hours=Math.max(0,Math.floor((Date.now()-Date.parse(date))/3600000));
 return hours<1?trans(lang,'Μόλις τώρα','Just now'):hours<24?hours+trans(lang,' ώρες πριν','h ago'):Math.floor(hours/24)+trans(lang,' ημέρες πριν','d ago');
};
export function WorldSituationRoom({cases,lang,titleFor,summaryFor,onOpen}:Props){
 const top=useMemo(()=>rankMajorEvents(cases,12),[cases]);
 // Markers must refer to the selectable set; otherwise a map click can open a different story.
 const hotspots=useMemo(()=>globeHotspots(top,18),[top]);
 const [selected,setSelected]=useState<string|null>(null);
 const [expanded,setExpanded]=useState(false);
 const focus=top.find(s=>s.id===selected)||top[0];
 const selectedInfo=focus?majorEventSignal(focus):null;
 const mapSignals=useMemo(()=>hotspots.map(p=>({
  ...p.story.headline,
  id:p.key,lat:p.location.lat,lon:p.location.lon,
  score:p.score,
  // Marker headline includes the country *mentioned*, not a claim the incident occurred there.
  title:(lang==='el'?p.location.el:p.location.en)+' · '+titleFor(p.story.headline)
 })),[hotspots,lang,titleFor]);
 const hit=(signal:Signal)=>{const p=hotspots.find(v=>v.key===signal.id);if(p){setSelected(p.story.id);setExpanded(false)}};
 useEffect(()=>{
  if(!expanded)return;
  const key=(ev:KeyboardEvent)=>{if(ev.key==='Escape')setExpanded(false)};
  window.addEventListener('keydown',key);
  return()=>window.removeEventListener('keydown',key);
 },[expanded]);
 const type=classNames[selectedInfo?.kind||'other'][lang==='el'?0:1];
 const featured=top.slice(0,6);
 const photo=focus?.headline.imageUrl||focus?.reports.find(r=>r.imageUrl)?.imageUrl;
 const sourceLinks=(focus?.reports||[]).filter((r,i,all)=>
  /^https:\/\//i.test(r.url)&&publisherKey(r.source)&&all.findIndex(x=>publisherKey(x.source)===publisherKey(r.source))===i
 ).slice(0,3);
 return <section className="situation-room" aria-label="Global Situation Room">
  <div className="situation-heading">
   <div className="situation-kicker"><Radio size={15}/>{trans(lang,'GLITCH / Ο ΚΟΣΜΟΣ ΣΕ ΚΙΝΗΣΗ','GLITCH / WORLD IN MOTION')}</div>
   <div className="situation-heading-row"><h2>{trans(lang,'Οι εξελίξεις που μετράνε','The developments that matter')}<em>.</em></h2><span>{trans(lang,'Πραγματικές πηγές · ενημερωμένη επιλογή','Real sources · updated selection')}</span></div>
   <p>{trans(lang,'Πόλεμοι, ενέργεια, εκλογές και διεθνείς εντάσεις — επιλεγμένα από πρόσφατους τίτλους. Οι θέσεις δείχνουν αναφερόμενες χώρες, όχι το ακριβές σημείο συμβάντος.','Wars, energy, elections and international tensions, selected from recent headlines. Globe markers identify mentioned countries, not exact incident sites.')}</p>
  </div>
  <div className="situation-hero-grid">
   <div className="situation-globe-column">
    <div className="situation-map-caption"><span><Globe2 size={16}/>{trans(lang,'ΧΑΡΤΗΣ ΠΑΓΚΟΣΜΙΩΝ ΕΙΔΗΣΕΩΝ','WORLD NEWS MAP')}</span><button onClick={()=>setExpanded(true)}><Expand size={15}/>{trans(lang,'Μεγέθυνση','Expand')}</button></div>
    <WorldGlobe signals={mapSignals} onChoose={hit} selected={selected||undefined} compact countryMentions language={lang}/>
    <div className="situation-pin-strip">
     {hotspots.length?hotspots.slice(0,7).map(p=><button key={p.key} onClick={()=>setSelected(p.story.id)} className={selected===p.story.id?'active':''}><MapPin size={12}/>{lang==='el'?p.location.el:p.location.en}</button>):
      <p>{trans(lang,'Δεν υπάρχουν ειδήσεις με αναγνωρίσιμη αναφορά χώρας στο τρέχον δείγμα.','No country-referenced event markers in the current feed sample.')}</p>}
    </div>
   </div>
   <div className="situation-spotlight">
    {photo?<img key={photo} src={photo} alt="" loading="eager" onError={e=>{e.currentTarget.style.display='none'}}/>:<div className="situation-photoless"><Globe2 size={80} strokeWidth={.75}/></div>}
    <div className="situation-spotlight-shade"/>
    {focus?<div className="situation-spotlight-content">
     <div className="situation-story-label"><span>{selectedInfo?.lens==='energy'?trans(lang,'ΕΝΕΡΓΕΙΑ','ENERGY'):type}</span><small>{time(focus.lastAt,lang)}</small></div>
     <h3>{titleFor(focus.headline)}</h3>
     <p>{summaryFor(focus.headline)}</p>
     {selectedInfo?.lens&&<div className="situation-why"><strong>{trans(lang,'ΓΙΑΤΙ ΤΟ ΠΑΡΑΚΟΛΟΥΘΟΥΜΕ','WHY WE WATCH IT')}</strong><p>{whyWatch[selectedInfo.lens][lang==='el'?0:1]} {trans(lang,'Δες την πηγή για τις πραγματικές συνέπειες.','See the source for the actual effects.')}</p></div>}
     <div className="situation-spotlight-sources"><strong>{selectedInfo?.publisherCount} {selectedInfo?.publisherCount===1?trans(lang,'εκδότης στο δείγμα','publisher in sample'):trans(lang,'εκδότες στο δείγμα','publishers in sample')}</strong>{sourceLinks.map(r=><a key={r.source} href={r.url} target="_blank" rel="noopener noreferrer">{r.source} ↗</a>)}</div>
     <div className="situation-story-actions"><button onClick={()=>onOpen(focus)}>{trans(lang,'Φάκελος γεγονότος','Open event dossier')} <ArrowUpRight size={17}/></button><span>{trans(lang,'Εκδοτική προτεραιότητα','Editorial priority')}: {selectedInfo?.score}/100</span></div>
    </div>:<div className="situation-spotlight-content"><div className="situation-story-label"><span>{trans(lang,'ΧΩΡΙΣ ΕΠΙΛΟΓΗ','NO MATCHING STORIES')}</span></div><h3>{trans(lang,'Δεν βρέθηκε πρόσφατη εξέλιξη στα διαθέσιμα δημοσιεύματα.','No recent developments matched the available reports.')}</h3><p>{trans(lang,'Δοκίμασε ξανά αργότερα ή άνοιξε τις τελευταίες ειδήσεις.','Check back later or open the latest news.')}</p></div>}
   </div>
  </div>
  <div className="situation-briefing">
   <div className="situation-brief-title"><span><Flame size={15}/>{trans(lang,'ΕΞΕΛΙΞΕΙΣ ΠΟΥ ΠΑΡΑΚΟΛΟΥΘΟΥΜΕ','DEVELOPMENTS TO WATCH')}</span><small>{trans(lang,'Επιλογή από τίτλους, χρονική εγγύτητα και αριθμό εκδοτών','Ranked from headlines, freshness and sampled publisher breadth')}</small></div>
   <div className="situation-brief-cards">{featured.map((c,i)=><button key={c.id} className={focus?.id===c.id?'active':''} onClick={()=>setSelected(c.id)}>
    <div className="situation-brief-photo">{c.headline.imageUrl?<img src={c.headline.imageUrl} alt="" loading="lazy" onError={e=>{e.currentTarget.style.display='none'}}/>:<Globe2 size={27}/>}<span>{String(i+1).padStart(2,'0')}</span></div>
    <div className="situation-brief-copy"><small>{majorEventSignal(c).lens==='energy'?trans(lang,'ΕΝΕΡΓΕΙΑ','ENERGY'):classNames[majorEventSignal(c).kind][lang==='el'?0:1]}</small><strong>{titleFor(c.headline)}</strong><span>{majorEventSignal(c).publisherCount} {majorEventSignal(c).publisherCount===1?trans(lang,'εκδότης','publisher'):trans(lang,'εκδότες','publishers')} <ArrowRight size={13}/></span></div>
   </button>)}</div>
  </div>
  <p className="situation-methodology">{trans(lang,'Αυτόματη επιλογή με βάση τον τίτλο, τη χρονική εγγύτητα και τους εκδότες του διαθέσιμου δείγματος. Δεν αποτελεί επαληθευμένη μέτρηση αντίκτυπου. Οι εικόνες προέρχονται από ειδησεογραφικές ροές όπου διατίθενται.','Automatically selected from headline wording, recency and publishers in the available sample. This is not a verified measure of impact. Images come from news feeds where available.')}</p>
  {expanded&&<div className="situation-expanded-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setExpanded(false)}}>
   <div className="situation-expanded" role="dialog" aria-modal="true" aria-label={trans(lang,'Παγκόσμιος χάρτης','World map')}>
    <header><strong>{trans(lang,'Υδρόγειος μεγάλων γεγονότων','Major events globe')}</strong><button onClick={()=>setExpanded(false)} aria-label={trans(lang,'Κλείσιμο','Close')}><X size={18}/></button></header>
    <WorldGlobe signals={mapSignals} onChoose={hit} selected={selected||undefined} countryMentions language={lang}/>
   </div>
  </div>}
 </section>;
}
