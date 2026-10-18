'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,BrainCircuit,Building2,ChevronRight,Cpu,Globe2,Layers3,Radio,RefreshCw,ScanEye,TrendingUp} from 'lucide-react';
import type {Signal} from '@/lib/types';
import type {StoryCase} from '@/lib/world-pulse';
import type {MarketQuote,VenueState} from '@/lib/markets';
import {marketLenses,type MarketLens} from '@/lib/market-focus';

type Lang='el'|'en';
type NewsProps={cases:StoryCase[];lang:Lang;titleFor:(s:Signal)=>string;onOpen:(c:StoryCase)=>void};
const w=(lang:Lang,el:string,en:string)=>lang==='el'?el:en;
const total=(c:StoryCase)=>c.reports.length+c.sources.length*5+Math.min(30,c.headline.score/4)+(c.headline.imageUrl?8:0);
const short=(s:string,n=135)=>s.length>n?s.slice(0,n).replace(/\s+\S*$/,'')+'…':s;
const TIME=(date:string,lang:Lang)=>{const n=Date.now()-Date.parse(date);const hours=Math.floor(n/3600000);return !Number.isFinite(n)?'—':hours<=0?w(lang,'μόλις τώρα','just now'):hours<24?hours+w(lang,'ω πριν','h ago'):Math.floor(hours/24)+w(lang,'η πριν','d ago');};

export function TopStoriesCarousel({cases,lang,titleFor,onOpen}:NewsProps){
 const ref=useRef<HTMLDivElement>(null);
 const top=useMemo(()=>cases.filter(c=>c.headline.category!=='sports'&&c.headline.category!=='culture')
  .sort((a,b)=>total(b)-total(a)||Date.parse(b.lastAt)-Date.parse(a.lastAt)).slice(0,9),[cases]);
 if(!top.length)return null;
 const shift=(direction:number)=>ref.current?.scrollBy({left:direction*Math.max(280,(ref.current?.clientWidth||320)*.84),behavior:'smooth'});
 return <section className="deck-section" aria-label="Top world stories">
  <header className="deck-heading"><div><span className="deck-eyebrow"><Radio size={13}/> GLITCH / EDITOR'S RADAR</span><h2>{w(lang,'Οι εξελίξεις που αξίζει να δεις','The developments worth watching')}<b>.</b></h2><p>{w(lang,'Επιλογή βάσει επικαιρότητας και κάλυψης στο διαθέσιμο δείγμα, όχι επιβεβαιωμένης παγκόσμιας σημαντικότητας.','Ranked by recency and sampled coverage, not verified global importance.')}</p></div><div className="deck-arrows"><button onClick={()=>shift(-1)} aria-label="Previous stories"><ArrowLeft size={17}/></button><button onClick={()=>shift(1)} aria-label="Next stories"><ArrowRight size={17}/></button></div></header>
  <div className="deck-track" ref={ref}>{top.map((c,i)=><article key={c.id} className="deck-slide">
   <div className="deck-image">{c.headline.imageUrl?<img src={c.headline.imageUrl} alt="" loading={i>1?'lazy':'eager'} onError={e=>{e.currentTarget.style.display='none'}}/>:<div className="deck-abstract"><Globe2 size={62} strokeWidth={.9}/></div>}<div className="deck-image-shade"/></div>
   <div className="deck-slide-info"><div className="deck-slide-top"><span>{String(i+1).padStart(2,'0')} / 09</span><span>{TIME(c.lastAt,lang)}</span></div>
    <span className="deck-slide-topic">{c.topic.toUpperCase()}</span>
    <button className="deck-slide-title" onClick={()=>onOpen(c)}>{short(titleFor(c.headline),170)}<ArrowUpRight size={18}/></button>
    <div className="deck-slide-publishers">{c.sources.slice(0,3).map(name=><span key={name}>{name}</span>)}{c.sources.length>3&&<span>+{c.sources.length-3}</span>}</div>
    <div className="deck-slide-bottom"><span>{c.sources.length} {w(lang,'διαφορετικοί εκδότες','publishers')} · {c.reports.length} {w(lang,'αναφορές','reports')}</span><button onClick={()=>onOpen(c)}>{w(lang,'ΔΕΣ ΠΟΙΟΙ ΤΟ ΚΑΛΥΠΤΟΥΝ','SEE WHO COVERED IT')} <ArrowRight size={14}/></button></div>
   </div>
  </article>)}</div>
 </section>;
}
type DeskFilter='all'|'ai'|'chips'|'robots'|'bigtech'|'finance';
const deskFilters:DeskFilter[]=['all','ai','chips','robots','bigtech','finance'];
const tags:Record<DeskFilter,{el:string;en:string;rx:RegExp}>={
 all:{el:'Όλα',en:'All',rx:/.*/},
 ai:{el:'AI Models',en:'AI Models',rx:/\b(openai|anthropic|chatgpt|gemini|deepmind|large language model|llms?|generative ai|foundation models?|artificial intelligence|gpt-?\d|ai agents?)\b|τεχνητ[ήής] νοημοσύν/iu},
 chips:{el:'Chips / Compute',en:'Chips / Compute',rx:/\b(nvidia|amd|intel|tsmc|semiconductors?|chips?|datacenter|data center|gpus?|blackwell|compute)\b|ημιαγωγ/iu},
 robots:{el:'Robotics',en:'Robotics',rx:/\b(robotics?|humanoid|automation|self.driving|robotaxi|autonomous|tesla optimus)\b|ρομποτικ/iu},
 bigtech:{el:'Big Tech',en:'Big Tech',rx:/\b(apple|microsoft|google|alphabet|amazon|meta|facebook|tesla|samsung|byd|oracle|netflix|spacex|openai|anthropic)\b/i},
 finance:{el:'Εταιρικές εξελίξεις',en:'Corporate Moves',rx:/\b(earnings|profits?|quarterly|revenue|merger|acquisition|ipo|buyout|valuation|layoffs?|investments?|company|shares?|dividend|regulation)\b|κέρδ|έσοδ|συγχώνευσ|εξαγορ/iu}
};
export function CorporateDesk({cases,lang,titleFor,onOpen}:NewsProps){
 const [filter,setFilter]=useState<DeskFilter>('all');
 const tagged=useMemo(()=>cases.filter(c=>c.actorIds.some(id=>id.startsWith('m:'))||c.topic==='technology'||c.headline.category==='ai'),[cases]);
 const filtered=useMemo(()=>tagged.filter(c=>filter==='all'||c.reports.some(r=>tags[filter].rx.test(r.title+' '+r.summary)))
  .sort((a,b)=>Date.parse(b.lastAt)-Date.parse(a.lastAt)),[tagged,filter]);
 const topCompanies=useMemo(()=>{
  const counts=new Map<string,number>();
  for(const c of tagged)for(const id of c.actorIds.filter(id=>id.startsWith('m:')))counts.set(id,(counts.get(id)||0)+1);
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8);
 },[tagged]);
 return <section className="desk-section" aria-label="AI and multinationals">
  <header className="deck-heading"><div><span className="deck-eyebrow"><Cpu size={14}/> AI / COMPANIES / COMPUTE</span><h2>{w(lang,'Οι εταιρείες που διαμορφώνουν το αύριο','The companies shaping what comes next')}<b>.</b></h2><p>{w(lang,'Μοντέλα AI, επενδύσεις, chips, ρομποτική και εταιρικές αποφάσεις. Ειδήσεις από επώνυμες πηγές.','AI labs, investments, chips, robotics and corporate decisions, linked to reporting.')}</p></div><span className="desk-count">{tagged.length} {w(lang,'φάκελοι στο δείγμα','sampled dossiers')}</span></header>
  <div className="desk-filters">{deskFilters.map(key=><button key={key} onClick={()=>setFilter(key)} className={filter===key?'selected':''} aria-pressed={filter===key}>{lang==='el'?tags[key].el:tags[key].en}</button>)}</div>
  <div className="desk-grid">
   {filtered.slice(0,6).map((c,i)=><button key={c.id} className={'desk-story'+(i===0?' featured':'')} onClick={()=>onOpen(c)}>
    <div className="desk-story-visual">{c.headline.imageUrl?<img src={c.headline.imageUrl} alt="" loading="lazy" onError={e=>{e.currentTarget.style.display='none'}}/>:<BrainCircuit size={35} strokeWidth={1}/>}</div>
    <div className="desk-story-body"><span><span className="desk-bullet"/> {c.headline.category.toUpperCase()} · {TIME(c.lastAt,lang)}</span><strong>{short(titleFor(c.headline),190)}</strong><small>{c.sources.slice(0,2).join(' · ')||w(lang,'Άγνωστος εκδότης','Publisher unknown')}{c.sources.length>2?' +'+(c.sources.length-2):''} <ArrowUpRight size={14}/></small></div>
   </button>)}
   {filtered.length===0&&<div className="engine-empty">{w(lang,'Δεν εντοπίστηκαν σχετικές δημοσιεύσεις στο τρέχον χρονικό δείγμα.','No matching published reports in this time window.')}</div>}
  </div>
  {topCompanies.length>0&&<div className="desk-company-index"><span>{w(lang,'ΣΥΧΝΟΤΕΡΕΣ ΑΝΑΦΟΡΕΣ ΕΤΑΙΡΕΙΩΝ','MOST MENTIONED COMPANIES')}<small>{w(lang,'Μετράμε εμφανίσεις, όχι μέγεθος επιρροής.','Mention counts, not influence rankings.')}</small></span><div>{topCompanies.map(([id,n])=><button key={id} onClick={()=>{setFilter('all');const c=tagged.find(c=>c.actorIds.includes(id));if(c)onOpen(c)}}><Building2 size={13}/> {id.replace(/^m:/,'').toUpperCase()} <b>{n}</b></button>)}</div></div>}
 </section>;
}
type MarketResponse={updatedAt:string;quotes:MarketQuote[];venues:VenueState[];disclaimer?:string;coverage?:string};
const focusLenses:MarketLens[]=['all','ai','companies','economy','politics','energy','science'];
const lensNames:Record<MarketLens,{el:string;en:string}>={all:{el:'Όλα',en:'All'},ai:{el:'AI / Robots',en:'AI / Robots'},companies:{el:'Πολυεθνικές',en:'Companies'},economy:{el:'Οικονομία',en:'Economy'},politics:{el:'Γεωπολιτική',en:'Politics'},energy:{el:'Ενέργεια',en:'Energy'},science:{el:'Επιστήμη',en:'Science'}};
const volume=(n:number|null,lang:Lang)=>n===null?'—':new Intl.NumberFormat(lang==='el'?'el-GR':'en-US',{notation:'compact',maximumFractionDigits:1}).format(n);
export function PredictionRadar({lang}:{lang:Lang}){
 const [data,setData]=useState<MarketResponse|null>(null);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 const [lens,setLens]=useState<MarketLens>('all');
 const [venue,setVenue]=useState<'all'|'polymarket'|'kalshi'>('all');
 useEffect(()=>{
  let alive=true;
  const reload=async()=>{try{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),24000);
   try{const r=await fetch('/api/market-intelligence',{signal:controller.signal});if(!r.ok)throw Error('HTTP '+r.status);const d=await r.json() as MarketResponse;if(alive){setData(d);setError('')}}finally{clearTimeout(timer)}}
   catch(e){if(alive)setError(e instanceof Error?e.message:'Upstream unavailable')}finally{if(alive)setLoading(false)}
  };
  void reload();const id=setInterval(()=>{if(document.visibilityState==='visible')void reload()},600000);
  return()=>{alive=false;clearInterval(id)};
 },[]);
 const quotes=useMemo(()=>(data?.quotes||[]).filter(q=>(venue==='all'||q.venue===venue)&&(lens==='all'||marketLenses(q).includes(lens))).slice(0,12),[data,venue,lens]);
 return <section className="pred-section" aria-label="Prediction markets non-sports research">
  <header className="deck-heading"><div><span className="deck-eyebrow"><TrendingUp size={15}/> GLITCH / MARKET SIGNALS</span><h2>{w(lang,'Τι αποτιμούν οι αγορές για το μέλλον','What markets are pricing about the future')}<b>.</b></h2><p>{w(lang,'Πραγματικές ανοιχτές αγορές Kalshi και Polymarket — μόνο AI, εταιρείες, οικονομία, πολιτική, ενέργεια και επιστήμη. Χωρίς αθλητικά.','Live public Kalshi and Polymarket market quotes on AI, business, the economy, politics, energy and science. No sports.')}</p></div><span className="pred-stamp"><Radio size={13}/> {data?new Date(data.updatedAt).toLocaleTimeString(lang==='el'?'el-GR':'en-US',{hour:'2-digit',minute:'2-digit'}):'—'}</span></header>
  <div className="pred-controls"><div className="pred-channels">{focusLenses.map(key=><button key={key} className={lens===key?'selected':''} onClick={()=>setLens(key)}>{lang==='el'?lensNames[key].el:lensNames[key].en}</button>)}</div><div className="pred-providers">{(['all','polymarket','kalshi'] as const).map(v=><button key={v} className={venue===v?'selected':''} onClick={()=>setVenue(v)}>{v==='all'?'BOTH':v.toUpperCase()}</button>)}</div></div>
  <div className="pred-venues">{data?.venues?.map(v=><span key={v.venue} className={v.status==='ok'?'healthy':'down'}><span className="pred-dot"/>{v.venue.toUpperCase()} {v.status==='ok'?w(lang,'διαθέσιμο','available'):w(lang,'μη διαθέσιμο','unavailable')}</span>)}</div>
  {loading&&<div className="pred-status"><RefreshCw size={14}/>{w(lang,'Φορτώνονται οι αγορές…','Loading public markets…')}</div>}
  {!loading&&error&&<div className="pred-status">{w(lang,'Πρόβλημα παρόχου:','Provider error:')} {error}</div>}
  {!loading&&!error&&quotes.length===0&&<div className="engine-empty">{w(lang,'Δεν υπάρχουν κατάλληλες ανοιχτές αγορές στο δείγμα. Δεν εμφανίζουμε επινοημένες προβλέψεις.','No eligible active contracts in the sample. No synthetic forecasts are shown.')}</div>}
  <div className="pred-list">{quotes.map(q=><a key={q.id} href={q.sourceUrl} target="_blank" rel="noopener noreferrer" className="pred-quote">
   <div className="pred-quote-name"><span><span className={'pred-provider '+q.venue}>{q.venue.toUpperCase()}</span> {marketLenses(q).filter(x=>x!=='all').slice(0,1).map(x=>w(lang,lensNames[x].el,lensNames[x].en))}</span><strong>{q.question}</strong><small>{w(lang,'24ωρος όγκος:','24h volume:')} {volume(q.volume24h,lang)} · {q.priceKind==='last'?w(lang,'τελευταία τιμή','last trade'):q.priceKind==='midpoint'?w(lang,'μέση τιμή αγοράς/πώλησης','bid/ask midpoint'):w(lang,'τιμή συμβολαίου','contract quote')}</small></div>
   <div className="pred-price"><strong>{(q.probability*100).toFixed(1)}<small>%</small></strong><span>YES {w(lang,'ΤΙΜΗ','QUOTE')}</span></div><ArrowUpRight size={16} className="pred-open"/>
  </a>)}</div>
  <p className="engine-fineprint">{w(lang,'Οι τιμές YES είναι τιμές συμβολαίων και όχι αξιόπιστες ή βαθμονομημένες επιστημονικές πιθανότητες. Δεν προτρέπουμε σε στοιχηματισμό και δεν διενεργούμε συναλλαγές. Η επιλογή είναι δείγμα από διαθέσιμα endpoints· αν μία πλατφόρμα αποτύχει, εμφανίζεται η κατάσταση της πηγής.','YES prices are contract quotations, not scientifically calibrated probabilities. This is read-only information, not betting advice. Markets are sampled from public API pages; provider availability is shown above.')}</p>
 </section>;
}
