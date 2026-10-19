'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {ArrowRight,ArrowUpRight,Bookmark,ChevronLeft,ChevronRight,CircleDot,Clock3,Flame,Globe2,Newspaper,RotateCcw,Search,SlidersHorizontal,Sparkles,TrendingUp,Zap} from 'lucide-react';
import type {StoryCase} from '@/lib/world-pulse';
import type {Signal} from '@/lib/types';
import {CoverageSpectrum} from './CoverageSpectrum';
import {WorldSituationRoom} from './WorldSituationRoom';
import {dedupeCases,discoverRank,eventSignature,publisherCount,type DiscoverMode} from '@/lib/discover-ranking';
type Lang='el'|'en';
type Interest='innovation'|'money'|'geopolitics'|'society';
type Trend={term:string;traffic:string;region:string;url:string;started:string};
type Status={region:string;ok:boolean;count:number};
type Trends={updatedAt:string;trends:Trend[];status:Status[]};
type Props={cases:StoryCase[];lang:Lang;titleFor:(s:Signal)=>string;summaryFor:(s:Signal)=>string;onOpen:(c:StoryCase)=>void};
const loc=(l:Lang,el:string,en:string)=>l==='el'?el:en;
const storageSeen='glitch-read-history-v2',storageInterests='glitch-reader-interests-v2';
const interestNames:Record<Interest,{el:string;en:string}>={
 innovation:{el:'AI & τεχνολογία',en:'AI & technology'},money:{el:'Οικονομία',en:'Economy'},
 geopolitics:{el:'Διεθνείς σχέσεις',en:'World affairs'},society:{el:'Κοινωνία & περιβάλλον',en:'Society & climate'}
};
const categories:{key:Interest;match:(c:StoryCase)=>boolean}[]=[
 {key:'innovation',match:c=>c.topic==='technology'||c.topic==='science'},
 {key:'money',match:c=>c.topic==='economy'||c.topic==='energy'},
 {key:'geopolitics',match:c=>c.topic==='conflict'||c.topic==='politics'||c.topic==='protest'},
 {key:'society',match:c=>!['technology','science','economy','energy','conflict','politics','protest'].includes(c.topic)}
];
const time=(s:string,l:Lang)=>{
 const ms=Date.now()-Date.parse(s);if(!Number.isFinite(ms))return '—';
 const h=Math.max(0,Math.floor(ms/3600000));
 if(h<1)return loc(l,'Μόλις τώρα','Just now');if(h<24)return h+loc(l,' ώρες πριν','h ago');
 return Math.floor(h/24)+loc(l,' ημέρες πριν','d ago');
};
function miniUrl(c:StoryCase){return c.headline.imageUrl||'';}
export function DiscoverDesk({cases,lang,titleFor,summaryFor,onOpen}:Props){
 const [mode,setMode]=useState<DiscoverMode>('big');
 const [seen,setSeen]=useState<Record<string,number>>({});
 const [interests,setInterests]=useState<Interest[]>(['innovation','money']);
 const [search,setSearch]=useState('');
 const [all,setAll]=useState(false);
 const [trendData,setTrendData]=useState<Trends|null>(null);
 const [region,setRegion]=useState<'US'|'GR'|'GB'|'DE'>('GR');
 const [trendError,setTrendError]=useState(false);
 const [slide,setSlide]=useState(0);
 useEffect(()=>{
  try{
   const history=JSON.parse(localStorage.getItem(storageSeen)||'{}') as Record<string,number>;
   const opts=JSON.parse(localStorage.getItem(storageInterests)||'["innovation","money"]') as Interest[];
   setSeen(history);setInterests(opts.filter(x=>categories.some(c=>c.key===x)));
  }catch{ /* private mode */
  }
 },[]);
 useEffect(()=>{
  let active=true;
  fetch('/api/popular').then(r=>{if(!r.ok)throw Error('Trends unavailable');return r.json() as Promise<Trends>})
   .then(v=>{if(active)setTrendData(v)}).catch(()=>{if(active)setTrendError(true)});
  return()=>{active=false};
 },[]);
 const mark=useCallback((c:StoryCase)=>{
  setSeen(current=>{
   const next={...current,[eventSignature(c)]:Date.now()};
   const entries=Object.entries(next).sort((a,b)=>b[1]-a[1]).slice(0,180);
   const limited=Object.fromEntries(entries);
   try{localStorage.setItem(storageSeen,JSON.stringify(limited))}catch{}
   return limited;
  });
  onOpen(c);
 },[onOpen]);
 const sorted=useMemo(()=>discoverRank(cases,mode,interests,seen),[cases,mode,interests,seen]);
 const ranked=useMemo(()=>{
  const q=search.trim().toLocaleLowerCase();
  return q?sorted.filter(c=>c.reports.some(r=>(r.title+' '+r.source).toLocaleLowerCase().includes(q))):sorted;
 },[sorted,search]);
 const items=ranked.slice(0,all?32:13);
 const head=items.slice(0,5);
 const primary=head[Math.min(slide,Math.max(head.length-1,0))]||items[0];
 const popularCount=dedupeCases(cases).length;
 const shownBelow=mode==='big'?items.slice(6):items.filter(c=>!head.some(h=>h.id===c.id));
 const trends=(trendData?.trends||[]).filter(x=>x.region===region).slice(0,6);
 const pickMode=(next:DiscoverMode)=>{setMode(next);setAll(false);setSlide(0)};
 const interestsToggle=(key:Interest)=>setInterests(current=>{
  const next=current.includes(key)?current.filter(x=>x!==key):[...current,key];
  try{localStorage.setItem(storageInterests,JSON.stringify(next))}catch{}
  return next;
 });
 const nextSlide=(d:number)=>setSlide(i=>(i+d+head.length)%head.length);
 return <section className="discover" aria-label={loc(lang,'Ανακάλυψη ειδήσεων','Discover news')}>
  <div className="discover-topline">
   <div className="discover-topcopy"><span><CircleDot size={14}/>{loc(lang,'Ο ΠΑΛΜΟΣ ΤΟΥ ΚΟΣΜΟΥ','THE WORLD PULSE')}</span><h2>{loc(lang,'Τι συζητιέται. Τι έχει σημασία.','What is trending. What matters.')}<i>.</i></h2><p>{loc(lang,'Από την κάλυψη μεγάλων εκδοτών έως το πραγματικό ενδιαφέρον στις αναζητήσεις. Χωρίς να διαβάζεις τα ίδια ξανά και ξανά.','From publisher coverage to real search trends. Less repetition, more meaningful discovery.')}</p></div>
   <span className="discover-live"><span/>{loc(lang,'ΑΝΑΝΕΩΣΗ ΡΟΗΣ','LIVE FEED')}</span>
  </div>
  <div className="discover-controls"><div className="discover-tabs" role="group" aria-label={loc(lang,'Κατάταξη ειδήσεων','News ranking')}>
   <button className={mode==='big'?'active':''} aria-pressed={mode==='big'} onClick={()=>pickMode('big')}><Globe2 size={17}/>{loc(lang,'Μεγάλα γεγονότα','Big Events')}</button>
   <button className={mode==='popular'?'active':''} aria-pressed={mode==='popular'} onClick={()=>pickMode('popular')}><Flame size={17}/>{loc(lang,'Δημοφιλή','Popular')}</button>
   <button className={mode==='latest'?'active':''} aria-pressed={mode==='latest'} onClick={()=>pickMode('latest')}><Clock3 size={17}/>{loc(lang,'Νέα τώρα','Latest')}</button>
   <button className={mode==='foryou'?'active':''} aria-pressed={mode==='foryou'} onClick={()=>pickMode('foryou')}><Sparkles size={17}/>{loc(lang,'Για σένα','For you')}</button>
  </div>
   <label className="discover-search"><Search size={16}/><input aria-label={loc(lang,'Αναζήτηση ειδήσεων','Search news')} placeholder={loc(lang,'Αναζήτηση γεγονότος…','Find a story…')} value={search} onChange={e=>{setSearch(e.target.value);setSlide(0)}}/></label>
  </div>
  <div className="discover-explainer">
   <span><TrendingUp size={14}/>{mode==='big'?loc(lang,'Εκδοτική προτεραιότητα με βάση είδος γεγονότος, πηγές και χρονική εγγύτητα — όχι μέτρηση πραγματικού αντίκτυπου.','Editorial priority based on event type, publisher breadth and recency — not measured impact.'):mode==='popular'?loc(lang,'Κατάταξη από πλήθος εκδοτών και επικαιρότητα — όχι μετρήσεις κλικ.','Publisher coverage and recency — not click counts.'):mode==='latest'?loc(lang,'Δίνουμε προτεραιότητα σε όσα δεν έχεις διαβάσει.','Prioritizing reports you have not read.'):loc(lang,'Βάσει των ενδιαφερόντων που επιλέγεις στη συσκευή σου.','Based on the interests you select on this device.')}</span>
   <strong>{popularCount} {loc(lang,'διαφορετικά γεγονότα','distinct cases')}</strong>
  </div>
  {mode==='foryou'&&<div className="discover-interests"><span><SlidersHorizontal size={16}/>{loc(lang,'Τι σε ενδιαφέρει;','Your interests')}</span>{categories.map(c=><button className={interests.includes(c.key)?'active':''} key={c.key} onClick={()=>interestsToggle(c.key)}>{lang==='el'?interestNames[c.key].el:interestNames[c.key].en}</button>)}</div>}
  {mode==='big'?<WorldSituationRoom cases={cases} lang={lang} titleFor={titleFor} summaryFor={summaryFor} onOpen={mark}/>:primary?<div className="discover-lead-grid">
   <div className="discover-lead">
    {miniUrl(primary)?<img src={miniUrl(primary)} alt="" onError={e=>{e.currentTarget.style.display='none'}}/>:<div className="discover-no-photo"><Globe2 size={110} strokeWidth={.55}/></div>}
    <div className="discover-lead-shade"/>
    <div className="discover-lead-content">
     <div className="discover-lead-overline"><span>{mode==='popular'?loc(lang,'ΣΤΟ ΕΠΙΚΕΝΤΡΟ','IN FOCUS'):mode==='latest'?loc(lang,'ΤΩΡΑ','RIGHT NOW'):loc(lang,'ΓΙΑ ΤΑ ΕΝΔΙΑΦΕΡΟΝΤΑ ΣΟΥ','YOUR WORLD')}</span><small>{time(primary.lastAt,lang)}</small></div>
     <h3>{titleFor(primary.headline)}</h3>
     <p>{summaryFor(primary.headline)}</p>
     <div className="discover-source-pills">{primary.sources.slice(0,3).map(s=><span key={s}>{s}</span>)}{primary.sources.length>3&&<span>+{primary.sources.length-3}</span>}</div>
     <button className="discover-read" onClick={()=>mark(primary)}>{loc(lang,'Διάβασε τον φάκελο','Explore this story')}<ArrowUpRight size={19}/></button>
    </div>
    {head.length>1&&<div className="discover-lead-nav"><button onClick={()=>nextSlide(-1)} aria-label={loc(lang,'Προηγούμενη','Previous')}><ChevronLeft size={20}/></button><span>{slide+1} / {head.length}</span><button onClick={()=>nextSlide(1)} aria-label={loc(lang,'Επόμενη','Next')}><ChevronRight size={20}/></button></div>}
   </div>
   <aside className="discover-lead-rail">
    <header><Zap size={15}/>{loc(lang,'ΣΗΜΑΝΤΙΚΕΣ ΕΞΕΛΙΞΕΙΣ','TOP DEVELOPMENTS')}</header>
    {head.map((c,i)=><button className={i===slide?'active':''} onClick={()=>setSlide(i)} key={c.id}>
     <span className="discover-item-number">{String(i+1).padStart(2,'0')}</span>
     <div><strong>{titleFor(c.headline)}</strong><small>{publisherCount(c)} {loc(lang,'εκδότες','publishers')} · {time(c.lastAt,lang)}</small></div><ChevronRight size={15}/>
    </button>)}
   </aside>
  </div>:<div className="discover-no-result">{mode==='latest'?loc(lang,'Έχεις δει τις διαθέσιμες πρόσφατες ειδήσεις. Επίλεξε «Δημοφιλή» για όλο το δείγμα.','You have seen the available recent stories. Select Popular for the full sample.'):loc(lang,'Δεν υπάρχουν αποτελέσματα με αυτά τα φίλτρα.','No stories match these filters.')}</div>}
  <div className="discover-trends">
   <div className="discover-trend-title"><div><span><Flame size={15}/>{loc(lang,'ΤΙ ΨΑΧΝΕΙ Ο ΚΟΣΜΟΣ','WHAT PEOPLE ARE SEARCHING')}</span><strong>Google Trends</strong><small>{loc(lang,'Αναζητήσεις σε άνοδο · ξεχωριστές από την ειδησεογραφική κάλυψη','Rising searches · separate from news coverage')}</small></div>
    <div className="discover-region">{(['GR','US','GB','DE'] as const).map(r=><button key={r} onClick={()=>setRegion(r)} className={region===r?'active':''}>{r==='GR'?'GR':r==='US'?'US':r==='GB'?'UK':'DE'}</button>)}</div>
   </div>
   {trends.length>0?<div className="discover-trend-items">{trends.map((x,i)=><a key={i} href={x.url} target="_blank" rel="noopener noreferrer"><span>{String(i+1).padStart(2,'0')}</span><strong>{x.term}</strong><small>{x.traffic} {loc(lang,'αναζητήσεις (περίπου)','approx. searches')}</small><ArrowUpRight size={15}/></a>)}</div>:<div className="discover-trend-unavailable">{trendError||trendData?loc(lang,'Δεν υπάρχουν διαθέσιμες τάσεις για αυτή τη χώρα αυτή τη στιγμή.','No search trends available for this region right now.'):loc(lang,'Φορτώνονται οι τάσεις αναζητήσεων…','Loading search trends…')}</div>}
   <p>{loc(lang,'Πηγή: δημόσια ροή Google Trends ανά χώρα. Οι όγκοι είναι προσεγγιστικοί και δεν μετρούν «δημοφιλία ειδήσεων».','Source: country-level Google Trends public RSS. Volumes are approximate search interest, not measured news readership.')}</p>
  </div>
  {shownBelow.length>0&&<div className="discover-rest"><div className="discover-rest-head"><div><span>{loc(lang,'ΕΠΙΠΛΕΟΝ ΣΗΜΑΝΤΙΚΑ','MORE THAT MATTERS')}</span><h3>{mode==='big'?loc(lang,'Και άλλες σημαντικές εξελίξεις','More significant developments'):mode==='popular'?loc(lang,'Αυτά καλύπτουν οι πηγές','In the news right now'):mode==='latest'?loc(lang,'Πρόσφατες ειδήσεις','Fresh reporting'):loc(lang,'Για τις επιλογές σου','Tailored to your interests')}</h3></div><small>{loc(lang,'Χωρίς επανάληψη των κορυφαίων','No duplicate lead stories')}</small></div>
   <div className="discover-card-grid">{shownBelow.map(c=><article key={c.id} className="discover-card">
    <button className="discover-card-image" onClick={()=>mark(c)} aria-label={titleFor(c.headline)}>{miniUrl(c)?<img src={miniUrl(c)} alt="" loading="lazy" onError={e=>{e.currentTarget.style.display='none'}}/>:<div className="discover-no-photo"><Newspaper size={37}/></div>}</button>
    <div className="discover-card-inner"><div className="discover-card-meta"><span>{publisherCount(c)} {loc(lang,'εκδότες','publishers')}</span><small>{time(c.lastAt,lang)}</small></div>
     <button className="discover-card-title" onClick={()=>mark(c)}>{titleFor(c.headline)}</button>
     <p>{summaryFor(c.headline)}</p>
     <div className="discover-card-bottom"><span>{c.sources.slice(0,2).join(' · ')}</span><button onClick={()=>mark(c)} aria-label={loc(lang,'Άνοιγμα είδησης','Open story')}><ArrowUpRight size={18}/></button></div>
    </div>
   </article>)}</div>
  </div>}
  {ranked.length>items.length&&<button className="discover-more" onClick={()=>setAll(true)}>{loc(lang,'Περισσότερες ειδήσεις','More stories')}<ArrowRight size={17}/></button>}
 </section>;
}
