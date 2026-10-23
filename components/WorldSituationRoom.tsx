'use client';
import {useEffect,useMemo,useState} from 'react';
import {ArrowRight,ArrowUpRight,Expand,Flame,Globe2,MapPin,Radio,ScanEye,X} from 'lucide-react';
import type {StoryCase} from '@/lib/world-pulse';
import type {Signal} from '@/lib/types';
import {globeHotspots,majorEventSignal,rankMajorEvents} from '@/lib/major-events';
import type {GlobeHotspot,EventClass} from '@/lib/major-events';
import WorldGlobe from './WorldGlobe';

type Lang='el'|'en';
type Props={cases:StoryCase[];lang:Lang;titleFor:(s:Signal)=>string;summaryFor:(s:Signal)=>string;onOpen:(c:StoryCase)=>void};
const trans=(lang:Lang,el:string,en:string)=>lang==='el'?el:en;
const classNames:Record<EventClass,[string,string]>={
 conflict:['ΣΥΓΚΡΟΥΣΗ','CONFLICT'],protest:['ΔΙΑΔΗΛΩΣΗ','PROTEST'],election:['ΕΚΛΟΓΕΣ','ELECTION'],
 economy:['ΟΙΚΟΝΟΜΙΑ','ECONOMY'],disaster:['ΚΑΤΑΣΤΡΟΦΗ','DISASTER'],ai:['AI / ΤΕΧΝΟΛΟΓΙΑ','AI / TECHNOLOGY'],other:['ΔΙΕΘΝΕΣ','WORLD']
};
const time=(date:string,lang:Lang)=>{
 const hours=Math.max(0,Math.floor((Date.now()-Date.parse(date))/3600000));
 return hours<1?trans(lang,'Μόλις τώρα','Just now'):hours<24?hours+trans(lang,' ώρες πριν','h ago'):Math.floor(hours/24)+trans(lang,' ημέρες πριν','d ago');
};
export function WorldSituationRoom({cases,lang,titleFor,summaryFor,onOpen}:Props){
 const top=useMemo(()=>rankMajorEvents(cases,12),[cases]);
 const hotspots=useMemo(()=>globeHotspots(cases,18),[cases]);
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
 if(!focus)return null;
 const type=classNames[selectedInfo?.kind||'other'][lang==='el'?0:1];
 const featured=top.slice(0,6);
 return <section className="situation-room" aria-label="Global Situation Room">
  <div className="situation-heading">
   <div className="situation-kicker"><Radio size={15}/>{trans(lang,'GLITCH / ΚΕΝΤΡΟ ΠΑΓΚΟΣΜΙΩΝ ΕΞΕΛΙΞΕΩΝ','GLITCH / GLOBAL SITUATION ROOM')}</div>
   <div className="situation-heading-row"><h2>{trans(lang,'Ο κόσμος σε μία εικόνα','The world at a glance')}<em>.</em></h2><span>{trans(lang,'Μεγάλα γεγονότα · πραγματικές πηγές','Major events · real news sources')}</span></div>
   <p>{trans(lang,'Στο επίκεντρο οι συγκρούσεις, οι εκλογές, η οικονομία, η AI και οι μεγάλες καταστροφές. Οι θέσεις δείχνουν αναφερόμενες χώρες, όχι το ακριβές σημείο συμβάντος.','Conflicts, elections, the economy, AI and major disasters. Globe markers identify mentioned countries, not exact incident sites.')}</p>
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
    {focus.headline.imageUrl?<img src={focus.headline.imageUrl} alt="" loading="eager" onError={e=>{e.currentTarget.style.display='none'}}/>:<div className="situation-photoless"><Globe2 size={80} strokeWidth={.75}/></div>}
    <div className="situation-spotlight-shade"/>
    <div className="situation-spotlight-content">
     <div className="situation-story-label"><span>{type}</span><small>{time(focus.lastAt,lang)}</small></div>
     <h3>{titleFor(focus.headline)}</h3>
     <p>{summaryFor(focus.headline)}</p>
     <div className="situation-spotlight-sources"><strong>{focus.sources.length} {trans(lang,'εκδότες','publishers')}</strong>{focus.sources.slice(0,3).map(x=><span key={x}>{x}</span>)}</div>
     <div className="situation-story-actions"><button onClick={()=>onOpen(focus)}>{trans(lang,'Φάκελος γεγονότος','Open event dossier')} <ArrowUpRight size={17}/></button><span>{trans(lang,'Εκδοτική προτεραιότητα','Editorial priority')}: {selectedInfo?.score}/100</span></div>
    </div>
   </div>
  </div>
  <div className="situation-briefing">
   <div className="situation-brief-title"><span><Flame size={15}/>{trans(lang,'ΤΑ 6 ΓΕΓΟΝΟΤΑ ΠΟΥ ΠΑΡΑΚΟΛΟΥΘΟΥΜΕ','SIX DEVELOPMENTS TO WATCH')}</span><small>{trans(lang,'Επιλογή από τίτλους, χρονική εγγύτητα και αριθμό εκδοτών','Ranked from headlines, freshness and sampled publisher breadth')}</small></div>
   <div className="situation-brief-cards">{featured.map((c,i)=><button key={c.id} className={focus.id===c.id?'active':''} onClick={()=>setSelected(c.id)}>
    <div className="situation-brief-photo">{c.headline.imageUrl?<img src={c.headline.imageUrl} alt="" loading="lazy" onError={e=>{e.currentTarget.style.display='none'}}/>:<Globe2 size={27}/>}<span>{String(i+1).padStart(2,'0')}</span></div>
    <div className="situation-brief-copy"><small>{classNames[majorEventSignal(c).kind][lang==='el'?0:1]}</small><strong>{titleFor(c.headline)}</strong><span>{c.sources.length} {trans(lang,'εκδότες','publishers')} <ArrowRight size={13}/></span></div>
   </button>)}</div>
  </div>
  <p className="situation-methodology">{trans(lang,'Η βαθμολογία είναι εκδοτική ένδειξη προτεραιότητας, όχι επαληθευμένη μέτρηση αντίκτυπου. Επηρεάζεται από το είδος του τίτλου, τη χρονική εγγύτητα και το πλήθος εκδοτών. Οι εικόνες προέρχονται από τις αντίστοιχες ειδησεογραφικές ροές όπου διατίθενται.','The score is an editorial-priority heuristic, NOT verified real-world impact. It uses headline type, recency and publisher breadth. Photographs are sourced from the relevant news feeds when available.')}</p>
  {expanded&&<div className="situation-expanded-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setExpanded(false)}}>
   <div className="situation-expanded" role="dialog" aria-modal="true" aria-label={trans(lang,'Παγκόσμιος χάρτης','World map')}>
    <header><strong>{trans(lang,'Υδρόγειος μεγάλων γεγονότων','Major events globe')}</strong><button onClick={()=>setExpanded(false)} aria-label={trans(lang,'Κλείσιμο','Close')}><X size={18}/></button></header>
    <WorldGlobe signals={mapSignals} onChoose={hit} selected={selected||undefined} countryMentions language={lang}/>
   </div>
  </div>}
 </section>;
}
