'use client';

import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {
 Activity,ArrowLeft,ArrowRight,ArrowUpRight,Bookmark,BookmarkCheck,Building2,
 Check,ChevronRight,Clock3,Compass,ExternalLink,Eye,Filter,Globe2,
 Info,Layers3,MapPin,Menu,Network,Radio,RefreshCw,Search,ShieldCheck,
 Star,TrendingUp,Users2,X
} from 'lucide-react';
import type {Feed,Signal} from '@/lib/types';
import {nowTopics,newsTopic} from '@/lib/now-topics';
import type {NowTopic} from '@/lib/now-topics';
import {
 actorsMentioned,buildActorRadar,buildWorldCases,mentionedDomains,opposingSides
} from '@/lib/world-pulse';
import type {PulseActor,StoryCase} from '@/lib/world-pulse';

type Lang='el'|'en';
type Page='pulse'|'countries'|'companies'|'watchlist';
type Translation={title:string;summary:string;translated:boolean};
type TranslationMap=Record<string,Translation>;
const ui={
 el:{
  pulse:'Παγκόσμιος παλμός',countries:'Χώρες & θεσμοί',companies:'Πολυεθνικές',watch:'Η παρακολούθησή μου',
  eyebrow:'GLITCH / WORLD PULSE',title:'Δες τι',titleAccent:'αλλάζει.',
  subtitle:'Όχι άλλη μια λίστα ειδήσεων. Γεγονότα, χώρες, εταιρείες και το χρονολόγιο της παγκόσμιας επικαιρότητας — από πρωτότυπες πηγές.',
  tracked:'Παρακολουθείς',cases:'Φάκελοι γεγονότων',reports:'Δημοσιεύσεις',actors:'Δρώντες',
  changes:'Από την τελευταία σου επίσκεψη',sources:'Πηγές που απάντησαν',updated:'Τελευταίος έλεγχος',
  happening:'ΣΕ ΕΞΕΛΙΞΗ',feed:'Η ΠΑΓΚΟΣΜΙΑ ΕΙΚΟΝΑ',read:'Άνοιγμα φακέλου',
  first:'Πρώτη αναφορά',latest:'Νεότερη αναφορά',coverage:'Αναφορές από μέσα',
  mentioned:'Ρητές αναφορές',watchBtn:'Παρακολούθηση',unwatch:'Σταμάτα παρακολούθηση',
  noCases:'Δεν υπάρχουν σχετικά γεγονότα στο τρέχον δείγμα.',again:'Επαναφόρτωση',
  time:'ΧΡΟΝΙΚΟ ΠΑΡΑΘΥΡΟ',search:'Αναζήτηση γεγονότων, χωρών, εταιρειών…',
  nations:'ΧΩΡΕΣ',firms:'ΕΤΑΙΡΕΙΕΣ',institutions:'ΘΕΣΜΟΙ',viewAll:'Περισσότερα γεγονότα',
  findings:'Τι καταγράφεται',timeline:'Χρονικό δημοσιεύσεων',domains:'Θέματα που αναφέρονται',
  affected:'Συνδεδεμένοι δρώντες',sides:'Αντιπαράθεση στον τίτλο',sidesCaveat:'Εντοπίστηκε ρητή αντιπαράθεση στον τίτλο. Δεν αποτελεί χαρτογράφηση στρατοπέδων ή επιβεβαίωση ευθύνης.',
  impactCaveat:'Οι θεματικές ενδείξεις βασίζονται σε λέξεις του δημοσιεύματος. Δεν μετρούν πραγματικό οικονομικό ή γεωπολιτικό αντίκτυπο.',
  actorCaveat:'Οι εμφανίσεις μετρούν αναφορές ονομάτων, όχι εμπλοκή, συμμαχία, εταιρική έκθεση ή στάση υπέρ/κατά.',
  groupCaveat:'Τα άρθρα ομαδοποιούνται συντηρητικά από τίτλους και χρόνο. Ενδέχεται να υπάρχουν διαφορετικοί φάκελοι για το ίδιο γεγονός ή λανθασμένες συσχετίσεις.',
  dataset:'Τα δεδομένα είναι ένα δείγμα δημόσιων ειδησεογραφικών ροών. Απουσία αναφοράς δεν σημαίνει απουσία γεγονότος.',
  watchNone:'Διάλεξε χώρες ή πολυεθνικές για προσωπική παρακολούθηση. Δεν απαιτείται λογαριασμός.',
  actorSection:'Αναφορές στον παγκόσμιο Τύπο',selectActor:'Δες σχετικά γεγονότα',
  noTranslate:'Δεν ήταν διαθέσιμη η μετάφραση· εμφανίζεται ο πρωτότυπος τίτλος.',
  loading:'Συγχρονίζονται οι διαθέσιμες πηγές…',source:'ΠΡΩΤΟΤΥΠΗ ΠΗΓΗ',back:'Επιστροφή',
  newest:'ΝΕΟ ΑΠΟ ΤΗΝ ΤΕΛΕΥΤΑΙΑ ΕΠΙΣΚΕΨΗ',multi:'ΠΟΛΛΑΠΛΕΣ ΠΗΓΕΣ',single:'ΜΟΝΟ ΜΙΑ ΠΗΓΗ ΣΤΟ ΔΕΙΓΜΑ',
  noSummary:'Η πηγή δεν παρέχει ουσιαστική περίληψη. Δες το αρχικό δημοσίευμα.',
  press:'Άνοιξε την αρχική δημοσίευση',filtered:'ΦΙΛΤΡΟ',clear:'Καθαρισμός'
 },
 en:{
  pulse:'World pulse',countries:'Countries & institutions',companies:'Global companies',watch:'My watchlist',
  eyebrow:'GLITCH / WORLD PULSE',title:'See what is',titleAccent:'changing.',
  subtitle:'Not another news feed. Events, countries, companies, and a timeline of global developments — linked to original reporting.',
  tracked:'Watching',cases:'Event dossiers',reports:'Published reports',actors:'Actors',
  changes:'Since your last visit',sources:'Responding sources',updated:'Last checked',
  happening:'HAPPENING NOW',feed:'THE GLOBAL PICTURE',read:'Explore dossier',
  first:'First report',latest:'Latest report',coverage:'Reports by publishers',
  mentioned:'Explicit mentions',watchBtn:'Watch',unwatch:'Unwatch',
  noCases:'No related cases in the current source sample.',again:'Refresh',
  time:'TIME WINDOW',search:'Search events, countries, companies…',
  nations:'COUNTRIES',firms:'COMPANIES',institutions:'INSTITUTIONS',viewAll:'More dossiers',
  findings:'What is reported',timeline:'Publication timeline',domains:'Themes mentioned',
  affected:'Actors mentioned',sides:'Opposition in the headline',sidesCaveat:'Explicit opposition was detected in the headline. This does not establish alliances, responsibility, or verified geopolitical blocs.',
  impactCaveat:'These thematic signals reflect wording in reports, not measured economic or geopolitical consequences.',
  actorCaveat:'Mentions count names appearing in text, not involvement, alliance, corporate exposure, or political allegiance.',
  groupCaveat:'Stories are conservatively grouped by title and time. Related events may remain separate, and clustering errors are possible.',
  dataset:'This is a sample of public news sources. Missing coverage does not mean an event did not happen.',
  watchNone:'Choose countries or companies to follow. No account needed.',
  actorSection:'Mentioned in the global news sample',selectActor:'View related events',
  noTranslate:'Translation unavailable; the original headline is displayed.',
  loading:'Checking available news sources…',source:'ORIGINAL SOURCE',back:'Back',
  newest:'NEW SINCE LAST VISIT',multi:'MULTIPLE PUBLISHERS',single:'ONE PUBLISHER IN SAMPLE',
  noSummary:'No substantive summary in the source feed. Open the original article.',
  press:'Open original report',filtered:'FILTERED BY',clear:'Clear'
 }
};
const tabs:{id:Page;icon:typeof Activity}[]=[
 {id:'pulse',icon:Activity},{id:'countries',icon:Globe2},{id:'companies',icon:Building2},{id:'watchlist',icon:Star}
];
const displayTime=(s:string,lang:Lang)=>new Intl.DateTimeFormat(lang==='el'?'el-GR':'en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(s));
const relative=(date:string,lang:Lang)=>{const x=Date.now()-Date.parse(date);if(!Number.isFinite(x)||x<0)return '—';const h=Math.floor(x/3600000);const m=Math.floor(x/60000);return h<1?String(Math.max(0,m))+(lang==='el'?'λ':'m'):h<24?String(h)+(lang==='el'?'ω':'h'):String(Math.floor(h/24))+(lang==='el'?'η':'d')};
const hasGreek=(s:string)=>/[\u0370-\u03ff\u1f00-\u1fff]/u.test(s);
const safeRead=<T,>(k:string,initial:T):T=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v) as T:initial}catch{return initial}};
const trim=(s:string,n:number)=>s.length>n?s.slice(0,n).replace(/\s+\S*$/,'')+'…':s;
const summaryUseful=(s:string)=>!!s&&s.length>35&&!/^(?:Συγκεντρωτική αναφορά|Η πηγή δεν παρέχει|Δεν υπάρχει διαθέσιμη|Δεν διατίθεται|Η σύνοψη μεταφράζεται|No substantive|English summary unavailable)/iu.test(s);
const toTopic=(id:NowTopic,lang:Lang)=>lang==='el'?nowTopics.find(t=>t.key===id)?.label||id:({
 all:'All',conflict:'Conflict',protest:'Protests',politics:'Politics',economy:'Economy',disaster:'Disasters',energy:'Energy',technology:'Technology & AI',science:'Science',society:'Society',other:'Other'
} as Record<NowTopic,string>)[id];

export default function Home(){
 const [lang,setLang]=useState<Lang>('el');
 const [page,setPage]=useState<Page>('pulse');
 const [feed,setFeed]=useState<Feed|null>(null);
 const [err,setErr]=useState('');
 const [fetching,setFetching]=useState(false);
 const [hours,setHours]=useState<24|72>(72);
 const [topic,setTopic]=useState<NowTopic>('all');
 const [query,setQuery]=useState('');
 const [actorId,setActorId]=useState<string|null>(null);
 const [selected,setSelected]=useState<StoryCase|null>(null);
 const [watched,setWatched]=useState<string[]>([]);
 const [lastVisit,setLastVisit]=useState<string|null>(null);
 const [translations,setTranslations]=useState<TranslationMap>({});
 const [translationCycle,setTranslationCycle]=useState(0);
 const [showAll,setShowAll]=useState(false);
 const [ready,setReady]=useState(false);
 const busy=useRef(false);
 const lastKey=useRef('');
 const t=ui[lang];
 useEffect(()=>{
  setWatched(safeRead<string[]>('glitch-pulse-watch',[]));
  setLang(safeRead<Lang>('glitch-pulse-lang','el'));
  setTranslations(safeRead<TranslationMap>('glitch-pulse-translations',{}));
  const old=safeRead<string|null>('glitch-pulse-visit',null);
  setLastVisit(old);localStorage.setItem('glitch-pulse-visit',JSON.stringify(new Date().toISOString()));setReady(true);
 },[]);
 useEffect(()=>{if(ready){localStorage.setItem('glitch-pulse-watch',JSON.stringify(watched));localStorage.setItem('glitch-pulse-lang',JSON.stringify(lang));document.documentElement.lang=lang;}},[watched,lang,ready]);
 useEffect(()=>{if(ready)localStorage.setItem('glitch-pulse-translations',JSON.stringify(Object.fromEntries(Object.entries(translations).slice(-260))))},[translations,ready]);
 const load=useCallback(async()=>{
  setFetching(true);setErr('');
  const ctl=new AbortController();const timeout=setTimeout(()=>ctl.abort(),26000);
  try{
   const response=await fetch('/api/feed',{signal:ctl.signal,cache:'no-store'});
   if(!response.ok)throw Error('HTTP '+response.status);
   setFeed(await response.json() as Feed);
  }catch(e){setErr(e instanceof Error?e.message:'Unknown error')}finally{clearTimeout(timeout);setFetching(false)}
 },[]);
 useEffect(()=>{
  void load();const interval=setInterval(()=>{if(document.visibilityState==='visible')void load()},180000);
  return()=>clearInterval(interval);
 },[load]);
 const signals=useMemo(()=>feed?.signals||[],[feed]);
 const cases=useMemo(()=>buildWorldCases(signals,hours,150),[signals,hours]);
 const actorRadar=useMemo(()=>buildActorRadar(cases),[cases]);
 const totalReports=cases.reduce((sum,c)=>sum+c.reports.length,0);
 const changeCount=lastVisit?cases.filter(c=>Date.parse(c.lastAt)>Date.parse(lastVisit)).length:0;
 const filtered=useMemo(()=>cases.filter(c=>{
  if(topic!=='all'&&c.topic!==topic)return false;
  if(actorId&&!c.actorIds.includes(actorId))return false;
  if(page==='watchlist'&&!c.actorIds.some(id=>watched.includes(id)))return false;
  if(query.trim()){
   const needle=query.trim().toLocaleLowerCase();
   if(!c.reports.some(x=>(x.title+' '+x.source+' '+x.summary).toLocaleLowerCase().includes(needle)) &&
      !c.actorIds.some(id=>actorRadar.some(a=>a.id===id&&a.name.toLocaleLowerCase().includes(needle))))return false;
  }
  return true;
 }),[cases,topic,actorId,page,watched,query,actorRadar]);
 const displayCases=showAll?filtered:filtered.slice(0,18);
 const displayedForTranslation=useMemo(()=>{
  const list=[...displayCases.slice(0,14).map(c=>c.headline),...(selected?.reports||[]).slice(0,6)];
  return [...new Map(list.map(x=>[x.id,x])).values()];
 },[displayCases,selected]);
 useEffect(()=>{
  if(!ready||busy.current)return;
  const batch=displayedForTranslation.filter(s=>{
   const key=lang+':'+s.id;
   if(translations[key])return false;
   return lang==='el'?!hasGreek(s.title):hasGreek(s.title);
  }).slice(0,4);
  if(!batch.length)return;
  const cacheKey=lang+':'+batch.map(s=>s.id).join(',');
  if(lastKey.current===cacheKey)return;
  lastKey.current=cacheKey;busy.current=true;
  void(async()=>{
   try{
    const response=await fetch('/api/translate',{method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({target:lang,items:batch.map(s=>({id:s.id,title:s.title,summary:s.summary.slice(0,450)}))})});
    if(!response.ok)throw Error('Translation unavailable');
    const payload=await response.json() as {items:Array<{id:string;title:string;summary:string;translated:boolean}>};
    setTranslations(old=>({...old,...Object.fromEntries((payload.items||[]).map(x=>[lang+':'+x.id,x]))}));
   }catch{setTranslations(old=>({...old,...Object.fromEntries(batch.map(s=>[lang+':'+s.id,{title:s.title,summary:s.summary,translated:false}]))}));}
   finally{busy.current=false;setTranslationCycle(x=>x+1)}
  })();
 },[displayedForTranslation,lang,translations,ready,translationCycle]);
 const word=(s:Signal,field:'title'|'summary')=>{
  const tr=translations[lang+':'+s.id];
  if(tr?.translated)return tr[field];
  if(field==='summary'&&!summaryUseful(s.summary))return t.noSummary;
  return s[field];
 };
 const toggle=(id:string)=>setWatched(old=>old.includes(id)?old.filter(v=>v!==id):[...old,id]);
 const openCase=(c:StoryCase)=>{setSelected(c)};
 const pickActor=(id:string|null)=>{setActorId(id);setTopic('all');setPage('pulse');setShowAll(true);setSelected(null)};
 const current=selected?cases.find(c=>c.reports.some(v=>selected.reports.some(r=>r.id===v.id)))||selected:null;
 const countryActors=actorRadar.filter(a=>a.type==='country'||a.type==='institution');
 const companyActors=actorRadar.filter(a=>a.type==='company');
 const topActors=actorRadar.slice(0,9);
 const sourceOk=feed?.sources?.filter(s=>s.ok).length||0;
 const reportSummary=(s:Signal)=>{const text=word(s,'summary');return summaryUseful(text)?trim(text,260):t.noSummary};
 const ActorButton=({a,compact=false}:{a:PulseActor;compact?:boolean})=><button
  className={'pulse-actor'+(compact?' pulse-actor-compact':'')} onClick={()=>pickActor(a.id)}>
  <span className="pulse-actor-monogram">{a.type==='company'?<Building2 size={16}/>:a.type==='institution'?<Network size={16}/>:<Globe2 size={16}/>}</span>
  <span className="pulse-actor-name"><strong>{a.name}</strong><small>{a.caseCount} {t.cases.toLocaleLowerCase()}</small></span>
  <ChevronRight size={14}/></button>;
 const Dossier=({c}:{c:StoryCase})=>{
  const sides=opposingSides(c.headline);
  const actors=c.actorIds.map(id=>actorRadar.find(a=>a.id===id)).filter((a):a is PulseActor=>!!a);
  return <div className="pulse-dossier-underlay" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}>
   <section className="pulse-dossier" role="dialog" aria-modal="true" aria-label={t.findings}>
    <header className="pulse-dossier-header"><span>GLITCH / CASE FILE {c.id.slice(-7).toUpperCase()}</span><button onClick={()=>setSelected(null)} aria-label="Close"><X size={20}/></button></header>
    <div className="pulse-dossier-scroll">
     <div className="pulse-dossier-top"><span className="pulse-sector">{toTopic(c.topic,lang)}</span><span>{displayTime(c.lastAt,lang)}</span></div>
     {c.headline.imageUrl&&<img className="pulse-dossier-photo" src={c.headline.imageUrl} alt="" onError={e=>{e.currentTarget.style.display='none'}}/>}
     <h2>{word(c.headline,'title')}</h2>
     <div className="pulse-dossier-facts"><span>{c.reports.length} {t.reports.toLowerCase()}</span><span>{c.sources.length} {t.coverage.toLowerCase()}</span><span>{t.first}: {displayTime(c.firstAt,lang)}</span></div>
     <section className="pulse-dossier-text"><span className="pulse-overline">{t.findings}</span><p>{reportSummary(c.headline)}</p><a href={c.headline.url} target="_blank" rel="noopener noreferrer">{t.press} <ExternalLink size={14}/></a></section>
     {sides&&<section className="pulse-opposition"><span className="pulse-overline">{t.sides}</span><div><strong>{sides[0].name}</strong><span>VS</span><strong>{sides[1].name}</strong></div><p>{t.sidesCaveat}</p></section>}
     {actors.length>0&&<section className="pulse-dossier-entities"><span className="pulse-overline">{t.affected}</span><div>{actors.map(a=><button key={a.id} onClick={()=>pickActor(a.id)}>{a.name}<ArrowUpRight size={13}/></button>)}</div><p>{t.actorCaveat}</p></section>}
     {c.domains.length>0&&<section className="pulse-dossier-domains"><span className="pulse-overline">{t.domains}</span><div>{c.domains.map(d=><span key={d}>{d}</span>)}</div><p>{t.impactCaveat}</p></section>}
     <section className="pulse-timeline"><div className="pulse-timeline-head"><span className="pulse-overline">{t.timeline}</span><strong>{c.sources.length} {t.coverage.toLowerCase()}</strong></div>
      <div className="pulse-timeline-items">{[...c.reports].sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp)).map((report,i)=><a
       href={report.url} target="_blank" rel="noopener noreferrer" key={report.id} className="pulse-timeline-item">
       <div className="pulse-timeline-dot"/><span>{displayTime(report.timestamp,lang)} <b>{i===0?t.first:i===c.reports.length-1?t.latest:''}</b></span>
       <strong>{word(report,'title')}</strong><small>{report.source} <ArrowUpRight size={12}/></small></a>)}</div>
     </section>
     <p className="pulse-dossier-disclaimer">{t.groupCaveat} {t.dataset}</p>
    </div>
   </section></div>;
 };
 const CaseCard=({c,lead=false}:{c:StoryCase;lead?:boolean})=>{
  const related=c.actorIds.map(id=>actorRadar.find(a=>a.id===id)).filter((a):a is PulseActor=>!!a).slice(0,3);
  return <article className={'pulse-case'+(lead?' pulse-case-lead':'')}>
   {c.headline.imageUrl&&<div className="pulse-case-photo"><img src={c.headline.imageUrl} alt="" loading="lazy" onError={e=>{e.currentTarget.parentElement?.classList.add('pulse-img-error')}}/></div>}
   <div className="pulse-case-body">
    <div className="pulse-case-meta"><span className="pulse-sector">{toTopic(c.topic,lang)}</span><span><Clock3 size={12}/>{relative(c.lastAt,lang)}</span></div>
    <button className="pulse-case-title" onClick={()=>openCase(c)}><strong>{word(c.headline,'title')}</strong><ArrowUpRight size={17}/></button>
    <p>{reportSummary(c.headline)}</p>
    <div className="pulse-case-tags">{related.map(a=><button key={a.id} onClick={()=>pickActor(a.id)}>{a.name}</button>)}</div>
    <div className="pulse-case-foot">
      <span>{c.sources.length>1?t.multi:t.single}</span>
      <strong>{c.reports.length} {t.reports.toLowerCase()}</strong>
      <button onClick={()=>openCase(c)} aria-label={t.read}><ArrowRight size={19}/></button>
    </div>
   </div>
  </article>;
 };
 return <div className="pulse-shell">
   <aside className="pulse-sidebar">
    <button className="pulse-logo" onClick={()=>{setPage('pulse');setActorId(null);setTopic('all')}}><span>G<span>.</span></span><div><strong>GLITCH</strong><small>WORLD INTELLIGENCE</small></div></button>
    <span className="pulse-nav-label">EXPLORE</span>
    <nav aria-label="Main navigation">{tabs.map(x=>{const Icon=x.icon;return <button key={x.id} className={page===x.id?'active':''} onClick={()=>{setPage(x.id);setActorId(null);setTopic('all');setQuery('');setShowAll(false)}}><Icon size={17}/>{t[x.id==='pulse'?'pulse':x.id==='countries'?'countries':x.id==='companies'?'companies':'watch']}{x.id==='watchlist'&&watched.length>0&&<span>{watched.length}</span>}</button>})}</nav>
    <div className="pulse-sidebar-footer"><span className="pulse-live-dot"/> {lang==='el'?'ΔΗΜΟΣΙΕΣ ΠΗΓΕΣ':'PUBLIC SOURCES'}<p>{t.dataset}</p></div>
   </aside>
   <div className="pulse-main">
    <header className="pulse-topbar">
     <button className="pulse-mobile-brand" onClick={()=>setPage('pulse')}>GLITCH<span>.</span></button>
     <div className="pulse-top-state"><span className="pulse-live-dot"/>{t.eyebrow}</div>
     <div className="pulse-actions"><div className="pulse-language"><button aria-pressed={lang==='el'} className={lang==='el'?'active':''} onClick={()=>setLang('el')}>EL</button><button aria-pressed={lang==='en'} className={lang==='en'?'active':''} onClick={()=>setLang('en')}>EN</button></div><button className="pulse-refresh" onClick={()=>void load()} aria-label={t.again} disabled={fetching}><RefreshCw size={16} className={fetching?'pulse-spin':''}/></button></div>
    </header>
    <div className="pulse-mobile-tabs">{tabs.map(x=><button className={page===x.id?'active':''} key={x.id} onClick={()=>{setPage(x.id);setActorId(null);setQuery('');setTopic('all')}}>{t[x.id==='pulse'?'pulse':x.id==='countries'?'countries':x.id==='companies'?'companies':'watch']}</button>)}</div>
    <main className="pulse-content">
     <section className="pulse-hero"><div className="pulse-kicker"><Radio size={14}/> {t.eyebrow} <span> / 2026</span></div><h1>{t.title}<br/><em>{t.titleAccent}</em></h1><p>{t.subtitle}</p><div className="pulse-stats">
       <div><strong>{cases.length}</strong><span>{t.cases}</span></div>
       <div><strong>{totalReports}</strong><span>{t.reports}</span></div>
       <div><strong>{actorRadar.length}</strong><span>{t.actors}</span></div>
       <div><strong>{lastVisit?changeCount:'—'}</strong><span>{t.changes}</span></div>
     </div></section>
     {err&&<div className="pulse-error">{err} <button onClick={()=>void load()}>{t.again}</button></div>}
     {!feed&&fetching&&<div className="pulse-loading"><Activity size={20}/>{t.loading}</div>}
     <div className="pulse-body">
      {page==='pulse'&&<>
       <div className="pulse-head-row"><div><span className="pulse-overline">{t.happening}</span><h2>{t.feed}<b>.</b></h2></div><div className="pulse-window"><button className={hours===24?'active':''} onClick={()=>{setHours(24);setShowAll(false)}}>24H</button><button className={hours===72?'active':''} onClick={()=>{setHours(72);setShowAll(false)}}>72H</button></div></div>
       <div className="pulse-controls">
        <div className="pulse-topicrail">{nowTopics.map(tp=><button key={tp.key} className={topic===tp.key?'active':''} onClick={()=>{setTopic(tp.key);setShowAll(false)}}>{toTopic(tp.key,lang)}</button>)}</div>
        <div className="pulse-search"><Search size={16}/><input value={query} onChange={e=>{setQuery(e.target.value);setShowAll(true)}} placeholder={t.search}/>{query&&<button onClick={()=>setQuery('')}><X size={15}/></button>}</div>
       </div>
       {actorId&&<div className="pulse-selected-actor"><span>{t.filtered}: {actorRadar.find(a=>a.id===actorId)?.name}</span><button onClick={()=>{setActorId(null);setShowAll(false)}}>{t.clear}<X size={14}/></button></div>}
       <div className="pulse-workspace">
        <div className="pulse-feed"><div className="pulse-cases">{displayCases.length?displayCases.map((c,i)=><CaseCard key={c.id} c={c} lead={i===0&&!showAll&&!actorId&&!query}/>):<div className="pulse-empty">{t.noCases}</div>}</div>
         {!showAll&&filtered.length>displayCases.length&&<button className="pulse-more" onClick={()=>setShowAll(true)}>{t.viewAll}<ArrowRight size={17}/></button>}
        </div>
        <aside className="pulse-radar"><div className="pulse-radar-heading"><span className="pulse-overline">ACTOR RADAR</span><h3>{t.actorSection}</h3><small>{t.actorCaveat}</small></div>
         {topActors.map(a=><ActorButton key={a.id} a={a} compact/>)}
         <div className="pulse-radar-bottom"><strong>{t.updated}</strong><span>{feed?displayTime(feed.generatedAt,lang):'—'}</span><strong>{t.sources}</strong><span>{sourceOk}/{feed?.sources?.length||0}</span></div>
        </aside>
       </div>
      </>}
      {(page==='countries'||page==='companies')&&<section className="pulse-actor-screen">
       <div className="pulse-head-row"><div><span className="pulse-overline">{page==='countries'?'GLOBAL ACTORS':'CORPORATE RADAR'}</span><h2>{page==='countries'?t.countries:t.companies}<b>.</b></h2></div><span className="pulse-count">{page==='countries'?countryActors.length:companyActors.length} {t.actors}</span></div>
       <p className="pulse-muted-intro">{t.actorCaveat}</p>
       <div className="pulse-actor-directory">{(page==='countries'?countryActors:companyActors).map(a=><div key={a.id} className="pulse-actor-directory-item"><ActorButton a={a}/><button className={'pulse-actor-star'+(watched.includes(a.id)?' active':'')} onClick={()=>toggle(a.id)} title={watched.includes(a.id)?t.unwatch:t.watchBtn}>{watched.includes(a.id)?<BookmarkCheck size={17}/>:<Bookmark size={17}/>}</button></div>)}</div>
      </section>}
      {page==='watchlist'&&<section className="pulse-watch-screen">
       <div className="pulse-head-row"><div><span className="pulse-overline">PERSONAL WORLD MONITOR</span><h2>{t.watch}<b>.</b></h2></div><span className="pulse-count">{watched.length} {t.tracked.toLowerCase()}</span></div>
       {watched.length===0?<p className="pulse-empty">{t.watchNone}</p>:<><div className="pulse-watch-actors">{watched.map(id=>actorRadar.find(a=>a.id===id)).filter((a):a is PulseActor=>!!a).map(a=><button key={a.id} onClick={()=>toggle(a.id)}>{a.name}<X size={14}/></button>)}</div><div className="pulse-cases">{cases.filter(c=>c.actorIds.some(id=>watched.includes(id))).slice(0,25).map(c=><CaseCard key={c.id} c={c}/>)}</div></>}
      </section>}
      <footer className="pulse-footer"><span>GLITCH / WORLD PULSE</span><p>{t.groupCaveat} {t.dataset}</p></footer>
     </div>
    </main>
   </div>
   {current&&<Dossier c={current}/>}
 </div>;
}
