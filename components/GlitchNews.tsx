'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import type {Signal} from '@/lib/types';
import {buildStories,diverseTop,forYou,leanMix,leanOf,storylineSummaries,storylines,getStoryline} from '@/lib/stories';
import type {Lean,Prefs,Section,Story,StorylineSummary} from '@/lib/stories';

/* ───────────── copy ───────────── */
type Lang='el'|'en';
const T={
 el:{
  foryou:'Για σένα',top:'Κορυφαία',world:'Κόσμος',economy:'Οικονομία',tech:'AI & Τεχνολογία',greece:'Ελλάδα',science:'Επιστήμη',climate:'Κλίμα',sports:'Αθλητισμός',latest:'Τελευταία',saved:'Αποθηκευμένα',
  bigThemes:'Τα μεγάλα θέματα της υφηλίου',bigThemesSub:'Οι ιστορίες που κινούν τον κόσμο αυτή τη στιγμή — κατά όγκο κάλυψης',
  topStories:'Κορυφαίες ειδήσεις',topSub:'Ταξινόμηση κατά βαρύτητα & εύρος κάλυψης',
  mostCovered:'Τα πιο πολυκαλυμμένα',trends:'Τι ψάχνει ο κόσμος',latestNews:'Μόλις τώρα',
  sources:'πηγές',source:'πηγή',articles:'άρθρα',stories:'ιστορίες',fullCoverage:'Πλήρης κάλυψη',openStory:'Δες την ιστορία',
  readOriginal:'Άνοιγμα πρωτότυπου',save:'Αποθήκευση',saved1:'Αποθηκεύτηκε',share:'Κοινοποίηση',less:'Λιγότερα τέτοια',
  follow:'Ακολούθησε',following:'Ακολουθείς',pickTitle:'Φτιάξε το δικό σου πρωτοσέλιδο',pickSub:'Διάλεξε θέματα. Θα ανεβαίνουν πρώτα — όσα κρύψεις θα εξαφανιστούν.',
  related:'Σχετικές ιστορίες',coverage:'Κάλυψη ανά πολιτική τάση εκδότη',left:'Αριστερά',center:'Κέντρο',right:'Δεξιά',unrated:'Χωρίς αξιολόγηση',
  leanNote:'Προσέγγιση σε επίπεδο εκδότη (κατά AllSides, με αμερικανικό πλαίσιο) — όχι αξιολόγηση του κάθε άρθρου.',
  search:'Αναζήτηση ειδήσεων…',loading:'Φορτώνει ο κόσμος…',error:'Δεν φόρτωσαν οι ειδήσεις. Δοκίμασε ξανά.',retry:'Ξανά',
  updated:'Ενημέρωση',live:'LIVE',seeAll:'Όλα',back:'Πίσω',emptySaved:'Δεν έχεις αποθηκεύσει ιστορίες ακόμα. Πάτα το σελιδοδείκτη σε μια είδηση.',
  noResults:'Δεν βρέθηκαν ειδήσεις.',timeline:'Χρονολόγιο',firstSeen:'Πρώτη αναφορά',hidden:'Κρυμμένα',
  kinds:{conflict:'Σύγκρουση',protest:'Διαδηλώσεις',election:'Πολιτική',economy:'Οικονομία',disaster:'Έκτακτο',ai:'Τεχνολογία',other:'Ειδήσεις'},
  trendRegions:{GR:'Ελλάδα',WORLD:'Κόσμος'},blind:'Μονόπλευρη κάλυψη',translatedNote:'Οι τίτλοι μεταφράζονται αυτόματα — δες το πρωτότυπο για ακρίβεια.'
 },
 en:{
  foryou:'For you',top:'Top',world:'World',economy:'Economy',tech:'AI & Tech',greece:'Greece',science:'Science',climate:'Climate',sports:'Sport',latest:'Latest',saved:'Saved',
  bigThemes:'The big stories of the world',bigThemesSub:'What is moving the planet right now — by volume of coverage',
  topStories:'Top stories',topSub:'Ranked by weight & breadth of coverage',
  mostCovered:'Most covered',trends:'What people search',latestNews:'Just in',
  sources:'sources',source:'source',articles:'articles',stories:'stories',fullCoverage:'Full coverage',openStory:'Open the story',
  readOriginal:'Read original',save:'Save',saved1:'Saved',share:'Share',less:'Show less like this',
  follow:'Follow',following:'Following',pickTitle:'Build your own front page',pickSub:'Pick topics. They rise to the top — muted ones disappear.',
  related:'Related stories',coverage:'Coverage by publisher lean',left:'Left',center:'Center',right:'Right',unrated:'Unrated',
  leanNote:'Publisher-level approximation (AllSides, US-centric) — not a rating of each article.',
  search:'Search news…',loading:'Loading the world…',error:'News failed to load. Try again.',retry:'Retry',
  updated:'Updated',live:'LIVE',seeAll:'All',back:'Back',emptySaved:'No saved stories yet. Tap the bookmark on any story.',
  noResults:'No stories found.',timeline:'Timeline',firstSeen:'First reported',hidden:'Hidden',
  kinds:{conflict:'Conflict',protest:'Protests',election:'Politics',economy:'Economy',disaster:'Breaking',ai:'Technology',other:'News'},
  trendRegions:{GR:'Greece',WORLD:'World'},blind:'One-sided coverage',translatedNote:''
 }
};
type Copy=typeof T.el;
const SECTIONS:Section[]=['top','foryou','world','economy','tech','greece','science','climate','sports','latest'];

/* ───────────── helpers ───────────── */
const isGoogle=(s:Signal)=>s.url.includes('news.google.');
const GOOGLE_PLACEHOLDER=/^Συγκεντρωτική αναφορά/;
const cleanTitle=(s:Signal)=>isGoogle(s)?s.title.replace(/\s+-\s+[^-]{2,70}$/,''):s.title;
const summaryOf=(st:Story)=>{const r=[st.headline,...st.reports].find(x=>x.summary&&!GOOGLE_PLACEHOLDER.test(x.summary)&&x.summary.length>40);return r?.summary||''};
const hasGreek=(s:string)=>/[Ͱ-Ͽἀ-῿]/.test(s);
function ago(iso:string,lang:Lang):string{
 const m=Math.max(1,Math.round((Date.now()-Date.parse(iso))/60000));
 if(lang==='el'){if(m<60)return `πριν ${m}′`;const h=Math.round(m/60);if(h<24)return `πριν ${h} ώρ${h===1?'α':'ες'}`;const d=Math.round(h/24);return d===1?'χθες':`πριν ${d} μέρες`;}
 if(m<60)return `${m}m ago`;const h=Math.round(m/60);if(h<24)return `${h}h ago`;const d=Math.round(h/24);return d===1?'yesterday':`${d}d ago`;
}
const shortSource=(s:string)=>s.replace(/^Google News \/ /,'').replace(/^(BBC|Guardian|New York Times|UN News|Spaceflight News)\s.*$/,'$1').replace(/^Spaceflight News \/ /,'');
function load<T>(k:string,f:T):T{try{const v=localStorage.getItem(k);return v?JSON.parse(v) as T:f}catch{return f}}
function store(k:string,v:unknown){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
const PREFS_KEY='glitch.v11.prefs',TR_KEY='glitch.v11.tr',LANG_KEY='glitch.v11.lang',OG_KEY='glitch.v11.og';
const EMPTY:Prefs={follow:[],mute:[],read:[],saved:[]};

/* ───────────── icons (inline, no deps) ───────────── */
const I={
 chevL:<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>,
 chevR:<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>,
 x:<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>,
 search:<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
 bm:(on:boolean)=><svg viewBox="0 0 24 24" width="18" height="18" fill={on?'currentColor':'none'} stroke="currentColor" strokeWidth="2"><path d="M6 3h12v18l-6-4-6 4z"/></svg>,
 ext:<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/></svg>,
 share:<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>,
 eyeOff:<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l18 18M10.6 6.1A10 10 0 0 1 12 6c6 0 10 6 10 6a17 17 0 0 1-3.3 3.8M6.6 6.6C3.9 8.4 2 12 2 12s4 6 10 6a9.6 9.6 0 0 0 4.4-1"/></svg>,
 trend:<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 17 6-6 4 4 8-8M15 7h6v6"/></svg>,
 refresh:<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/></svg>
};
function Mark(){return <svg width="30" height="30" viewBox="0 0 64 64" fill="none" aria-hidden="true"><defs><linearGradient id="gmk" x1="0" y1="0" x2="64" y2="64"><stop stopColor="#F3D58A"/><stop offset="1" stopColor="#B8862B"/></linearGradient></defs><circle cx="32" cy="32" r="27" stroke="url(#gmk)" strokeWidth="3"/><ellipse cx="32" cy="32" rx="12" ry="27" stroke="url(#gmk)" strokeWidth="2"/><path d="M6 24h52M6 40h52" stroke="url(#gmk)" strokeWidth="2"/><path d="M44 14 54 6" stroke="#F3D58A" strokeWidth="4" strokeLinecap="round"/></svg>}

/* ───────────── small UI pieces ───────────── */
function Pic({src,alt,story,className,eager}:{src?:string;alt:string;story:Story;className?:string;eager?:boolean}){
 const [bad,setBad]=useState(false);
 useEffect(()=>setBad(false),[src]);
 if(!src||bad){
  const line=getStoryline(story.storylines[0]||'');
  return <div className={'ph ph-'+story.kind+' '+(className||'')} aria-hidden="true"><span className="ph-glyph">{line?.emoji||'◎'}</span><span className="ph-word">{line?.en||story.section}</span></div>;
 }
 // eslint-disable-next-line @next/next/no-img-element
 return <img className={className} src={src} alt={alt} loading={eager?'eager':'lazy'} decoding="async" referrerPolicy="no-referrer" onError={()=>setBad(true)}/>;
}
function LeanBar({story,compact}:{story:Story;compact?:boolean}){
 const mix=leanMix(story.sources);const total=story.sources.length;
 const parts:[Lean,number][]=(['left','center','right','unrated'] as Lean[]).map(k=>[k,mix[k]]);
 return <div className={'lean'+(compact?' lean-c':'')} title={parts.map(([k,v])=>k+': '+v).join(' · ')}>
  {parts.filter(([,v])=>v>0).map(([k,v])=><i key={k} className={'l-'+k} style={{flexGrow:v}}/>)}
  {total===0&&<i className="l-unrated" style={{flexGrow:1}}/>}
 </div>;
}
function Meta({story,lang,t}:{story:Story;lang:Lang;t:Copy}){
 const n=story.sources.length;
 return <div className="meta"><span className="m-src">{shortSource(story.headline.source)}</span>{n>1&&<span className="m-count">+{n-1} {t.sources}</span>}<span className="m-dot">·</span><time>{ago(story.lastAt,lang)}</time></div>;
}
function Kind({story,t,lang}:{story:Story;t:Copy;lang:Lang}){
 const line=getStoryline(story.storylines[0]||'');
 const label=story.kind!=='other'?t.kinds[story.kind]:line?(lang==='el'?line.el:line.en):t[story.section as keyof Copy] as string;
 return <span className={'kind k-'+story.kind}>{story.level==='top'&&<b className="pulse"/>}{label}</span>;
}

/* ───────────── main ───────────── */
type TrendItem={id:string;name:string;traffic:string|null;url:string;relatedHeadlines:string[]};
export default function GlitchNews(){
 const [signals,setSignals]=useState<Signal[]>([]);
 const [state,setState]=useState<'loading'|'ready'|'error'>('loading');
 const [updated,setUpdated]=useState<string>('');
 const [section,setSection]=useState<Section>('top');
 const [line,setLine]=useState<string|null>(null);
 const [lang,setLang]=useState<Lang>('el');
 const [prefs,setPrefs]=useState<Prefs>(EMPTY);
 const [open,setOpen]=useState<Story|null>(null);
 const [q,setQ]=useState('');
 const [tr,setTr]=useState<Record<string,string>>({});
 const [og,setOg]=useState<Record<string,string|null>>({});
 const [trendRegion,setTrendRegion]=useState<'GR'|'WORLD'>('GR');
 const [trends,setTrends]=useState<TrendItem[]>([]);
 const t=T[lang];

 useEffect(()=>{setPrefs(load(PREFS_KEY,EMPTY));setTr(load(TR_KEY,{}));setLang(load<Lang>(LANG_KEY,'el'));setOg(load(OG_KEY,{}));
  const h=new URLSearchParams(location.search);const s=h.get('s') as Section|null;if(s&&SECTIONS.includes(s))setSection(s);const l=h.get('topic');if(l&&getStoryline(l))setLine(l);},[]);
 useEffect(()=>store(PREFS_KEY,prefs),[prefs]);
 useEffect(()=>store(LANG_KEY,lang),[lang]);

 const fetchFeed=useCallback(async()=>{
  try{const r=await fetch('/api/feed',{cache:'no-store'});if(!r.ok)throw Error();const d=await r.json() as {signals:Signal[];generatedAt:string};
   setSignals(d.signals||[]);setUpdated(d.generatedAt);setState('ready');}
  catch{setState(s=>s==='ready'?'ready':'error')}
 },[]);
 useEffect(()=>{fetchFeed();const id=setInterval(fetchFeed,5*60000);return()=>clearInterval(id)},[fetchFeed]);
 useEffect(()=>{let live=true;fetch('/api/trends?region='+trendRegion).then(r=>r.ok?r.json():null).then(d=>{if(live&&d?.trends)setTrends(d.trends.slice(0,8))}).catch(()=>{});return()=>{live=false}},[trendRegion]);

 const stories=useMemo(()=>buildStories(signals),[signals]);
 // og:image enrichment for stories without a picture
 const withImg=useCallback((s:Story)=>s.image||og[s.id]||undefined,[og]);
 const ogBusy=useRef(false);
 useEffect(()=>{
  if(ogBusy.current||!stories.length)return;
  const need=stories.slice(0,80).filter(s=>!s.image&&!(s.id in og)).map(s=>({s,url:[s.headline,...s.reports].find(r=>!isGoogle(r))?.url})).slice(0,10);
  if(!need.length)return;ogBusy.current=true;
  Promise.all(need.map(async({s,url})=>{if(!url)return [s.id,null] as const;try{const r=await fetch('/api/og?url='+encodeURIComponent(url));const d=await r.json() as {image:string|null};return [s.id,d.image] as const}catch{return [s.id,null] as const}}))
   .then(rows=>setOg(o=>{const n={...o,...Object.fromEntries(rows)};store(OG_KEY,Object.fromEntries(Object.entries(n).slice(-400)));return n}))
   .finally(()=>{ogBusy.current=false});
 },[stories,og]);

 const title=useCallback((s:Story)=>{const raw=cleanTitle(s.headline);if(lang==='el'&&!hasGreek(raw)&&tr[s.id])return tr[s.id];return raw},[lang,tr]);

 /* derived lists */
 const visible=useMemo(()=>stories.filter(s=>!s.storylines.some(l=>prefs.mute.includes(l))),[stories,prefs.mute]);
 const hero=useMemo(()=>{const pick=diverseTop(visible.filter(s=>s.section!=='sports'&&s.section!=='greece'),6,{needImage:true,perLine:1});return pick.length>=3?pick:diverseTop(visible,6,{perLine:1})},[visible]);
 const heroIds=useMemo(()=>new Set(hero.map(h=>h.id)),[hero]);
 const themes=useMemo(()=>storylineSummaries(visible),[visible]);
 const top=useMemo(()=>{const list=diverseTop(visible.filter(s=>s.section!=='sports'),30,{exclude:heroIds,perLine:4});const img=list.filter(s=>s.image||og[s.id]),txt=list.filter(s=>!(s.image||og[s.id]));return [...img.slice(0,10),...txt,...img.slice(10)]},[visible,heroIds,og]);
 const shown=useMemo(()=>new Set([...heroIds,...top.slice(0,22).map(s=>s.id)]),[heroIds,top]);
 const railOf=useCallback((sec:Section)=>{const l=visible.filter(s=>s.section===sec&&!shown.has(s.id)).slice(0,18);return [...l.filter(s=>withImg(s)),...l.filter(s=>!withImg(s))].slice(0,14)},[visible,shown,withImg]);
 const mostCovered=useMemo(()=>[...visible].filter(s=>s.sources.length>1).sort((a,b)=>b.sources.length-a.sources.length||b.importance-a.importance).slice(0,6),[visible]);
 const latest=useMemo(()=>[...visible].sort((a,b)=>Date.parse(b.lastAt)-Date.parse(a.lastAt)),[visible]);
 const bySection=useCallback((sec:Section)=>visible.filter(s=>s.section===sec),[visible]);
 const mine=useMemo(()=>forYou(stories,prefs),[stories,prefs]);
 const searchHits=useMemo(()=>{const n=q.trim().toLocaleLowerCase();if(n.length<2)return [];return stories.filter(s=>(s.headline.title+' '+(tr[s.id]||'')+' '+s.reports.map(r=>r.title).join(' ')).toLocaleLowerCase().includes(n)).slice(0,40)},[q,stories,tr]);

 /* auto-translate titles (Greek mode) — hero + first screens, 4 at a time */
 const trBusy=useRef(false);const trFail=useRef(0);
 useEffect(()=>{
  if(lang!=='el'||trBusy.current||trFail.current>=3||!stories.length)return;
  const pool=[...hero,...themes.slice(0,8).map(x=>x.stories[0]),...top.slice(0,18),...mostCovered,...(open?[open]:[])].filter((s,i,a)=>s&&a.findIndex(x=>x.id===s.id)===i);
  const batch=pool.filter(s=>!tr[s.id]&&!hasGreek(cleanTitle(s.headline))).slice(0,4);
  if(!batch.length)return;trBusy.current=true;
  fetch('/api/translate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({target:'el',items:batch.map(s=>({id:s.id,title:cleanTitle(s.headline),summary:''}))})})
   .then(r=>r.ok?r.json():Promise.reject()).then((d:{items?:{id:string;title:string;translated:boolean}[]})=>{
    const ok=(d.items||[]).filter(x=>x.translated&&hasGreek(x.title));if(!ok.length)trFail.current++;else trFail.current=0;
    setTr(o=>{const n={...o,...Object.fromEntries(ok.map(x=>[x.id,x.title]))};
     // mark failures with the original so we don't retry forever
     for(const s of batch)if(!n[s.id])n[s.id]='';store(TR_KEY,Object.fromEntries(Object.entries(n).slice(-500)));return n});
   }).catch(()=>{trFail.current++}).finally(()=>{trBusy.current=false;setTimeout(()=>setTr(o=>({...o})),400)});
 },[lang,stories,hero,themes,top,mostCovered,open,tr]);

 /* prefs actions */
 const toggle=(k:keyof Prefs,v:string)=>setPrefs(p=>({...p,[k]:p[k].includes(v)?p[k].filter(x=>x!==v):[...p[k],v]}));
 const openStory=(s:Story)=>{setOpen(s);setPrefs(p=>p.read.includes(s.id)?p:{...p,read:[...p.read.slice(-300),s.id]})};
 const go=(sec:Section,l:string|null=null)=>{setSection(sec);setLine(l);setQ('');window.scrollTo({top:0,behavior:'smooth'});
  try{const u=new URL(location.href);u.searchParams.delete('s');u.searchParams.delete('topic');if(sec!=='top')u.searchParams.set('s',sec);if(l)u.searchParams.set('topic',l);history.replaceState(null,'',u)}catch{}};

 const ctx={t,lang,title,withImg,openStory,prefs,toggle};

 return <div className="gn">
  <header className="gn-top">
   <div className="gn-bar">
    <button className="brand" onClick={()=>go('top')} aria-label="GLITCH"><Mark/><span><b>GLITCH</b><small>{lang==='el'?'Ο κόσμος σε μια ματιά':'The world at a glance'}</small></span></button>
    <label className="gn-search">{I.search}<input value={q} onChange={e=>setQ(e.target.value)} placeholder={t.search}/>{q&&<button onClick={()=>setQ('')} aria-label="clear">{I.x}</button>}</label>
    <div className="gn-tools">
     <span className="live"><i/>{t.live}{updated&&<em>{new Date(updated).toLocaleTimeString(lang==='el'?'el-GR':'en-GB',{hour:'2-digit',minute:'2-digit'})}</em>}</span>
     <button className={'icon'+(section==='saved'?' on':'')} onClick={()=>go('saved')} aria-label={t.saved}>{I.bm(section==='saved')}{prefs.saved.length>0&&<sup>{prefs.saved.length}</sup>}</button>
     <div className="langs"><button className={lang==='el'?'on':''} onClick={()=>setLang('el')}>ΕΛ</button><button className={lang==='en'?'on':''} onClick={()=>setLang('en')}>EN</button></div>
    </div>
   </div>
   <nav className="gn-tabs" aria-label="sections">
    {SECTIONS.map(s=><button key={s} className={section===s&&!line?'on':''} onClick={()=>go(s)}>{s==='foryou'&&<span className="spark">✦</span>}{t[s]}</button>)}
   </nav>
  </header>

  <main className="gn-main">
   {state==='loading'&&<Skeleton t={t}/>}
   {state==='error'&&<div className="empty">{t.error}<button className="btn" onClick={()=>{setState('loading');fetchFeed()}}>{I.refresh}{t.retry}</button></div>}
   {state==='ready'&&(q.trim().length>=2?
    <SearchView hits={searchHits} q={q} {...ctx}/>:
    line?<StorylineView id={line} stories={visible.filter(s=>s.storylines.includes(line))} onBack={()=>go(section)} {...ctx}/>:
    section==='top'?<>
     <Hero slides={hero} {...ctx}/>
     <Themes themes={themes} onPick={l=>go(section,l)} {...ctx}/>
     <div className="split">
      <section className="col-main">
       <SectionHead title={t.topStories} sub={t.topSub}/>
       {top[0]&&<Feature story={top[0]} {...ctx}/>}
       <div className="grid">{top.slice(1,10).map(s=><Card key={s.id} story={s} {...ctx}/>)}</div>
       <div className="rows compact">{top.slice(10,22).map(s=><Row key={s.id} story={s} {...ctx}/>)}</div>
      </section>
      <aside className="col-side">
       <Side title={t.mostCovered} icon={I.trend}><ol className="ranked">{mostCovered.map((s,i)=><li key={s.id}><button onClick={()=>openStory(s)}><b>{i+1}</b><span><strong>{title(s)}</strong><small>{s.sources.length} {t.sources} · {ago(s.lastAt,lang)}</small><LeanBar story={s} compact/></span></button></li>)}</ol></Side>
       <Side title={t.trends} icon={<span className="g-dot"/>} extra={<div className="seg">{(['GR','WORLD'] as const).map(r=><button key={r} className={trendRegion===r?'on':''} onClick={()=>setTrendRegion(r)}>{t.trendRegions[r]}</button>)}</div>}>
        {trends.length?<ul className="trends">{trends.map((x,i)=><li key={x.id}><a href={x.url} target="_blank" rel="noreferrer"><b>{i+1}</b><span>{x.name}{x.relatedHeadlines[0]&&<small>{x.relatedHeadlines[0]}</small>}</span>{x.traffic&&<em>{x.traffic}</em>}</a></li>)}</ul>:<p className="muted small">…</p>}
       </Side>
       <Side title={t.latestNews} icon={<i className="live-dot"/>}><ul className="ticker">{latest.slice(0,8).map(s=><li key={s.id}><button onClick={()=>openStory(s)}><time>{new Date(s.lastAt).toLocaleTimeString('el-GR',{hour:'2-digit',minute:'2-digit'})}</time><span>{title(s)}</span></button></li>)}</ul></Side>
      </aside>
     </div>
     <Rail heading={t.world} stories={diverseTop(visible.filter(s=>s.section==='world'),14,{exclude:shown,perLine:3})} onAll={()=>go('world')} {...ctx}/>
     <Rail heading={t.economy} stories={railOf('economy')} onAll={()=>go('economy')} {...ctx}/>
     <Rail heading={t.tech} stories={railOf('tech')} onAll={()=>go('tech')} {...ctx}/>
     <Rail heading={t.greece} stories={railOf('greece')} onAll={()=>go('greece')} {...ctx}/>
     <Rail heading={t.science} stories={railOf('science')} onAll={()=>go('science')} {...ctx}/>
     <Rail heading={t.climate} stories={railOf('climate')} onAll={()=>go('climate')} {...ctx}/>
    </>:
    section==='foryou'?<ForYouView stories={mine} onPickLine={l=>go('foryou',l)} {...ctx}/>:
    section==='latest'?<ListView heading={t.latest} stories={latest.slice(0,80)} {...ctx}/>:
    section==='saved'?<ListView heading={t.saved} stories={stories.filter(s=>prefs.saved.includes(s.id))} empty={t.emptySaved} {...ctx}/>:
    <SectionView heading={t[section]} stories={bySection(section)} themes={themes.filter(x=>x.stories.some(s=>s.section===section)).slice(0,8)} onPick={l=>go(section,l)} {...ctx}/>
   )}
  </main>
  <footer className="gn-foot"><Mark/><p>GLITCH · {lang==='el'?'Ειδήσεις από':'News from'} BBC, Guardian, NYT, Al Jazeera, Sky, UN, ΕΡΤ, Πρώτο Θέμα, Ναυτεμπορική & Google News. {lang==='el'?'Η κατάταξη είναι αλγοριθμική — άνοιγε πάντα την πηγή.':'Ranking is algorithmic — always check the source.'}</p></footer>
  {open&&<Sheet story={open} all={stories} onClose={()=>setOpen(null)} onPick={l=>{setOpen(null);go(section,l)}} {...ctx}/>}
 </div>;
}

type Ctx={t:Copy;lang:Lang;title:(s:Story)=>string;withImg:(s:Story)=>string|undefined;openStory:(s:Story)=>void;prefs:Prefs;toggle:(k:keyof Prefs,v:string)=>void};

function Skeleton({t}:{t:Copy}){return <div className="skel"><div className="sk-hero"><span>{t.loading}</span></div><div className="sk-row">{[0,1,2,3,4].map(i=><div key={i}/>)}</div></div>}
function SectionHead({title,sub,onAll,allLabel}:{title:string;sub?:string;onAll?:()=>void;allLabel?:string}){return <div className="sec-head"><div><h2>{title}</h2>{sub&&<p>{sub}</p>}</div>{onAll&&<button className="link" onClick={onAll}>{allLabel}{I.chevR}</button>}</div>}
function Side({title,icon,extra,children}:{title:string;icon?:React.ReactNode;extra?:React.ReactNode;children:React.ReactNode}){return <div className="side"><div className="side-h"><h3>{icon}{title}</h3>{extra}</div>{children}</div>}

/* ───────────── hero carousel ───────────── */
function Hero({slides,t,lang,title,withImg,openStory}:Ctx&{slides:Story[]}){
 const [i,setI]=useState(0);const [paused,setPaused]=useState(false);const touch=useRef<number|null>(null);
 const n=slides.length;
 useEffect(()=>{if(i>=n)setI(0)},[n,i]);
 useEffect(()=>{if(paused||n<2)return;const id=setTimeout(()=>setI(x=>(x+1)%n),7500);return()=>clearTimeout(id)},[i,paused,n]);
 if(!n)return null;
 const s=slides[Math.min(i,n-1)];const sum=summaryOf(s);
 return <section className="hero" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}
  onTouchStart={e=>{touch.current=e.touches[0].clientX}} onTouchEnd={e=>{if(touch.current===null)return;const dx=e.changedTouches[0].clientX-touch.current;if(Math.abs(dx)>40)setI(x=>(x+(dx<0?1:-1)+n)%n);touch.current=null}}>
  <div className="hero-stage">
   {slides.map((x,k)=><div key={x.id} className={'hero-img'+(k===i?' on':'')}><Pic src={withImg(x)} alt="" story={x} eager={k<2}/></div>)}
   <div className="hero-shade"/>
   <div className="hero-copy" key={s.id}>
    <div className="hero-tags"><Kind story={s} t={t} lang={lang}/>{s.storylines.slice(0,2).map(l=><span key={l} className="tag">{lang==='el'?getStoryline(l)?.el:getStoryline(l)?.en}</span>)}</div>
    <h1 onClick={()=>openStory(s)}>{title(s)}</h1>
    {sum&&<p>{sum}</p>}
    <div className="hero-meta"><span><b>{s.sources.length}</b> {s.sources.length===1?t.source:t.sources} · <b>{s.reports.length}</b> {t.articles} · {ago(s.lastAt,lang)}</span><LeanBar story={s}/></div>
    <button className="btn gold" onClick={()=>openStory(s)}>{t.openStory}{I.chevR}</button>
   </div>
   <button className="hero-nav prev" onClick={()=>setI((i-1+n)%n)} aria-label="prev">{I.chevL}</button>
   <button className="hero-nav next" onClick={()=>setI((i+1)%n)} aria-label="next">{I.chevR}</button>
   <div className="hero-dots">{slides.map((x,k)=><button key={x.id} className={k===i?'on':''} onClick={()=>setI(k)} aria-label={'slide '+(k+1)}><i style={{animationPlayState:paused?'paused':'running'}}/></button>)}</div>
  </div>
  <ol className="hero-list">{slides.map((x,k)=><li key={x.id} className={k===i?'on':''}><button onClick={()=>setI(k)} onDoubleClick={()=>openStory(x)}>
   <span className="hl-img"><Pic src={withImg(x)} alt="" story={x}/></span>
   <span className="hl-txt"><Kind story={x} t={t} lang={lang}/><strong>{title(x)}</strong><small>{x.sources.length} {t.sources} · {ago(x.lastAt,lang)}</small></span>
   {k===i&&<i className="hl-prog" style={{animationPlayState:paused?'paused':'running'}}/>}
  </button></li>)}</ol>
 </section>;
}

/* ───────────── big themes carousel ───────────── */
function Themes({themes,onPick,t,lang,title,prefs,toggle}:Ctx&{themes:StorylineSummary[];onPick:(l:string)=>void}){
 const ref=useRef<HTMLDivElement>(null);
 if(!themes.length)return null;
 const max=Math.max(...themes.map(x=>x.heat));
 return <section className="themes">
  <SectionHead title={t.bigThemes} sub={t.bigThemesSub}/>
  <div className="rail-wrap">
   <button className="rail-btn l" onClick={()=>ref.current?.scrollBy({left:-600,behavior:'smooth'})} aria-label="prev">{I.chevL}</button>
   <div className="theme-rail" ref={ref}>
    {themes.slice(0,14).map((x,k)=>{const f=prefs.follow.includes(x.line.id);return <article key={x.line.id} className="theme" onClick={()=>onPick(x.line.id)}>
     <div className="theme-img">{x.image?/* eslint-disable-next-line @next/next/no-img-element */<img src={x.image} alt="" loading="lazy" referrerPolicy="no-referrer"/>:<div className={'ph ph-'+x.stories[0].kind}><span className="ph-glyph">{x.line.emoji}</span></div>}</div>
     <div className="theme-body">
      <span className="theme-rank">{String(k+1).padStart(2,'0')}</span>
      <h3>{lang==='el'?x.line.el:x.line.en}</h3>
      <p>{title(x.stories[0])}</p>
      <div className="heat"><i style={{width:Math.max(8,x.heat/max*100)+'%'}}/></div>
      <small>{x.stories.length} {t.stories} · {x.sources} {t.sources}</small>
     </div>
     <button className={'follow'+(f?' on':'')} onClick={e=>{e.stopPropagation();toggle('follow',x.line.id)}}>{f?'✓ '+t.following:'+ '+t.follow}</button>
    </article>})}
   </div>
   <button className="rail-btn r" onClick={()=>ref.current?.scrollBy({left:600,behavior:'smooth'})} aria-label="next">{I.chevR}</button>
  </div>
 </section>;
}

/* ───────────── cards ───────────── */
function Feature({story,t,lang,title,withImg,openStory,prefs,toggle}:Ctx&{story:Story}){
 const sum=summaryOf(story);
 return <article className="feature" onClick={()=>openStory(story)}>
  <div className="f-img"><Pic src={withImg(story)} alt="" story={story}/></div>
  <div className="f-body"><Kind story={story} t={t} lang={lang}/><h3>{title(story)}</h3>{sum&&<p>{sum}</p>}
   <div className="f-foot"><Meta story={story} lang={lang} t={t}/><LeanBar story={story}/></div>
   <SaveBtn id={story.id} prefs={prefs} toggle={toggle}/>
  </div>
 </article>;
}
function SaveBtn({id,prefs,toggle}:{id:string;prefs:Prefs;toggle:Ctx['toggle']}){const on=prefs.saved.includes(id);return <button className={'save'+(on?' on':'')} onClick={e=>{e.stopPropagation();toggle('saved',id)}} aria-label="save">{I.bm(on)}</button>}
function Card({story,t,lang,title,withImg,openStory,prefs,toggle}:Ctx&{story:Story}){
 const read=prefs.read.includes(story.id);const img=withImg(story);
 if(!img){const sum=summaryOf(story);return <article className={'card text k-bg-'+story.kind+(read?' read':'')} onClick={()=>openStory(story)}>
  <div className="c-body"><div className="c-top"><Kind story={story} t={t} lang={lang}/>{story.sources.length>2&&<span className="c-n">{story.sources.length} {t.sources}</span>}</div><h3>{title(story)}</h3>{sum&&<p>{sum}</p>}<div className="c-foot"><Meta story={story} lang={lang} t={t}/></div><LeanBar story={story} compact/></div>
  <SaveBtn id={story.id} prefs={prefs} toggle={toggle}/>
 </article>}
 return <article className={'card'+(read?' read':'')} onClick={()=>openStory(story)}>
  <div className="c-img"><Pic src={withImg(story)} alt="" story={story}/>{story.sources.length>2&&<span className="c-badge">{story.sources.length} {t.sources}</span>}</div>
  <div className="c-body"><Kind story={story} t={t} lang={lang}/><h3>{title(story)}</h3><div className="c-foot"><Meta story={story} lang={lang} t={t}/></div><LeanBar story={story} compact/></div>
  <SaveBtn id={story.id} prefs={prefs} toggle={toggle}/>
 </article>;
}
function Row({story,t,lang,title,withImg,openStory,prefs,toggle}:Ctx&{story:Story}){
 const sum=summaryOf(story);
 return <article className={'row'+(prefs.read.includes(story.id)?' read':'')} onClick={()=>openStory(story)}>
  <div className="r-body"><Kind story={story} t={t} lang={lang}/><h3>{title(story)}</h3>{sum&&<p>{sum}</p>}<div className="r-foot"><Meta story={story} lang={lang} t={t}/><LeanBar story={story} compact/></div></div>
  {withImg(story)&&<div className="r-img"><Pic src={withImg(story)} alt="" story={story}/></div>}
  <SaveBtn id={story.id} prefs={prefs} toggle={toggle}/>
 </article>;
}
function Rail({heading,stories,onAll,...ctx}:Ctx&{heading:string;stories:Story[];onAll:()=>void}){
 const ref=useRef<HTMLDivElement>(null);
 if(stories.length<3)return null;
 return <section className="rail">
  <SectionHead title={heading} onAll={onAll} allLabel={ctx.t.seeAll}/>
  <div className="rail-wrap">
   <button className="rail-btn l" onClick={()=>ref.current?.scrollBy({left:-640,behavior:'smooth'})} aria-label="prev">{I.chevL}</button>
   <div className="rail-track" ref={ref}>{stories.map(s=><Card key={s.id} story={s} {...ctx}/>)}</div>
   <button className="rail-btn r" onClick={()=>ref.current?.scrollBy({left:640,behavior:'smooth'})} aria-label="next">{I.chevR}</button>
  </div>
 </section>;
}

/* ───────────── views ───────────── */
function SectionView({heading,stories,themes,onPick,...ctx}:Ctx&{heading:string;stories:Story[];themes:StorylineSummary[];onPick:(l:string)=>void}){
 if(!stories.length)return <div className="empty">{ctx.t.noResults}</div>;
 const lead=diverseTop(stories,3,{needImage:true,perLine:1});const ids=new Set(lead.map(x=>x.id));
 const rest=stories.filter(s=>!ids.has(s.id));
 return <div className="view">
  <div className="view-head"><h1>{heading}</h1><span>{stories.length} {ctx.t.stories}</span></div>
  {themes.length>0&&<div className="chips">{themes.map(x=><button key={x.line.id} onClick={()=>onPick(x.line.id)}>{x.line.emoji} {ctx.lang==='el'?x.line.el:x.line.en}<em>{x.stories.length}</em></button>)}</div>}
  <div className="lead-grid">{lead[0]&&<Feature story={lead[0]} {...ctx}/>}<div className="lead-side">{lead.slice(1).map(s=><Card key={s.id} story={s} {...ctx}/>)}</div></div>
  <div className="grid">{rest.slice(0,9).map(s=><Card key={s.id} story={s} {...ctx}/>)}</div>
  <div className="rows">{rest.slice(9,60).map(s=><Row key={s.id} story={s} {...ctx}/>)}</div>
 </div>;
}
function ListView({heading,stories,empty,...ctx}:Ctx&{heading:string;stories:Story[];empty?:string}){
 return <div className="view"><div className="view-head"><h1>{heading}</h1><span>{stories.length} {ctx.t.stories}</span></div>
  {stories.length?<div className="rows">{stories.map(s=><Row key={s.id} story={s} {...ctx}/>)}</div>:<div className="empty">{empty||ctx.t.noResults}</div>}</div>;
}
function SearchView({hits,q,...ctx}:Ctx&{hits:Story[];q:string}){return <ListView heading={`“${q}”`} stories={hits} {...ctx}/>}
function StorylineView({id,stories,onBack,...ctx}:Ctx&{id:string;stories:Story[];onBack:()=>void}){
 const line=getStoryline(id)!;const f=ctx.prefs.follow.includes(id);const m=ctx.prefs.mute.includes(id);
 const cover=stories.find(s=>ctx.withImg(s));const srcs=new Set(stories.flatMap(s=>s.sources)).size;
 return <div className="view">
  <div className="line-hero">{cover&&<Pic src={ctx.withImg(cover)} alt="" story={cover}/>}<div className="line-shade"/>
   <div className="line-copy"><button className="link" onClick={onBack}>{I.chevL}{ctx.t.back}</button><span className="emoji">{line.emoji}</span><h1>{ctx.lang==='el'?line.el:line.en}</h1>
    <p>{stories.length} {ctx.t.stories} · {srcs} {ctx.t.sources}</p>
    <div className="line-act"><button className={'btn'+(f?'':' gold')} onClick={()=>ctx.toggle('follow',id)}>{f?'✓ '+ctx.t.following:'+ '+ctx.t.follow}</button><button className="btn ghost" onClick={()=>ctx.toggle('mute',id)}>{I.eyeOff}{m?ctx.t.hidden:ctx.t.less}</button></div></div></div>
  <h2 className="tl-h">{ctx.t.timeline}</h2>
  <ol className="timeline">{[...stories].sort((a,b)=>Date.parse(b.lastAt)-Date.parse(a.lastAt)).slice(0,60).map(s=><li key={s.id}><time>{new Date(s.lastAt).toLocaleString(ctx.lang==='el'?'el-GR':'en-GB',{weekday:'short',hour:'2-digit',minute:'2-digit'})}</time><Row story={s} {...ctx}/></li>)}</ol>
 </div>;
}
function ForYouView({stories,onPickLine,...ctx}:Ctx&{stories:Story[];onPickLine:(l:string)=>void}){
 const {t,prefs,toggle,lang}=ctx;
 const secs:Section[]=['world','economy','tech','greece','science','climate','sports'];
 return <div className="view">
  <div className="pick">
   <h1>{t.pickTitle}</h1><p>{t.pickSub}</p>
   <div className="chips big">{storylines.map(l=>{const f=prefs.follow.includes(l.id),m=prefs.mute.includes(l.id);return <span key={l.id} className={'chip2'+(f?' on':'')+(m?' off':'')}>
    <button onClick={()=>{if(m)toggle('mute',l.id);toggle('follow',l.id)}}>{l.emoji} {lang==='el'?l.el:l.en}</button>
    <button className="mute" title={t.less} onClick={()=>{if(f)toggle('follow',l.id);toggle('mute',l.id)}}>{m?'↺':'×'}</button></span>})}</div>
   <div className="chips">{secs.map(s=>{const k='sec:'+s;const f=prefs.follow.includes(k);return <button key={s} className={f?'on':''} onClick={()=>toggle('follow',k)}>{f?'✓ ':'+ '}{t[s]}</button>})}</div>
  </div>
  {prefs.follow.length>0&&<div className="chips">{prefs.follow.filter(x=>!x.startsWith('sec:')).map(l=><button key={l} onClick={()=>onPickLine(l)}>{getStoryline(l)?.emoji} {lang==='el'?getStoryline(l)?.el:getStoryline(l)?.en} →</button>)}</div>}
  <div className="lead-grid">{stories[0]&&<Feature story={stories[0]} {...ctx}/>}<div className="lead-side">{stories.slice(1,3).map(s=><Card key={s.id} story={s} {...ctx}/>)}</div></div>
  <div className="grid">{stories.slice(3,12).map(s=><Card key={s.id} story={s} {...ctx}/>)}</div>
  <div className="rows">{stories.slice(12,50).map(s=><Row key={s.id} story={s} {...ctx}/>)}</div>
 </div>;
}

/* ───────────── story sheet ───────────── */
function Sheet({story,all,onClose,onPick,...ctx}:Ctx&{story:Story;all:Story[];onClose:()=>void;onPick:(l:string)=>void}){
 const {t,lang,title,withImg,prefs,toggle}=ctx;
 useEffect(()=>{const k=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};document.addEventListener('keydown',k);const o=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',k);document.body.style.overflow=o}},[onClose]);
 const sum=summaryOf(story);const mix=leanMix(story.sources);const total=story.sources.length;
 const related=all.filter(s=>s.id!==story.id&&s.storylines.some(l=>story.storylines.includes(l))).slice(0,6);
 const reports=[...story.reports].sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp));
 const saved=prefs.saved.includes(story.id);
 const share=()=>{const url=story.headline.url;if(navigator.share)navigator.share({title:title(story),url}).catch(()=>{});else navigator.clipboard?.writeText(url)};
 const raw=cleanTitle(story.headline);
 const translated=title(story)!==raw;
 const pct=(v:number)=>total?Math.round(v/total*100):0;
 const oneSided=total>=3&&(mix.left===0||mix.right===0)&&(mix.left+mix.right)>=2;
 return <div className="sheet-bg" onClick={onClose}>
  <article className="sheet" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true">
   <button className="sheet-x" onClick={onClose} aria-label="close">{I.x}</button>
   <div className="sheet-img"><Pic src={withImg(story)} alt="" story={story} eager/><div className="sheet-shade"/></div>
   <div className="sheet-body">
    <div className="hero-tags"><Kind story={story} t={t} lang={lang}/>{story.storylines.map(l=><button key={l} className="tag" onClick={()=>onPick(l)}>{getStoryline(l)?.emoji} {lang==='el'?getStoryline(l)?.el:getStoryline(l)?.en}</button>)}</div>
    <h1>{title(story)}</h1>
    {translated&&<p className="orig">{raw}</p>}
    {sum&&<p className="lede">{sum}</p>}
    <div className="sheet-stats">
     <div><b>{total}</b><span>{t.sources}</span></div><div><b>{story.reports.length}</b><span>{t.articles}</span></div>
     <div><b>{ago(story.firstAt,lang)}</b><span>{t.firstSeen}</span></div><div><b>{ago(story.lastAt,lang)}</b><span>{t.updated}</span></div>
    </div>
    <div className="actions">
     <a className="btn gold" href={story.headline.url} target="_blank" rel="noreferrer">{t.readOriginal}{I.ext}</a>
     <button className={'btn'+(saved?' on':'')} onClick={()=>toggle('saved',story.id)}>{I.bm(saved)}{saved?t.saved1:t.save}</button>
     <button className="btn" onClick={share}>{I.share}{t.share}</button>
     {story.storylines[0]&&<button className="btn ghost" onClick={()=>{toggle('mute',story.storylines[0]);onClose()}}>{I.eyeOff}{t.less}</button>}
    </div>
    <section className="cov">
     <h2>{t.coverage}</h2>
     <div className="lean big">{(['left','center','right','unrated'] as Lean[]).filter(k=>mix[k]>0).map(k=><i key={k} className={'l-'+k} style={{flexGrow:mix[k]}}/>)}</div>
     <div className="cov-legend"><span><i className="l-left"/>{t.left} {pct(mix.left)}%</span><span><i className="l-center"/>{t.center} {pct(mix.center)}%</span><span><i className="l-right"/>{t.right} {pct(mix.right)}%</span><span><i className="l-unrated"/>{t.unrated} {pct(mix.unrated)}%</span></div>
     {oneSided&&<p className="warn">⚠ {t.blind}</p>}
     <p className="note">{t.leanNote}</p>
    </section>
    <section className="reports">
     <h2>{t.fullCoverage} <em>{story.reports.length}</em></h2>
     <ol>{reports.map(r=><li key={r.id}><a href={r.url} target="_blank" rel="noreferrer">
      <span className={'dot l-'+leanOf(r.source)}/>
      <span className="rp"><small>{shortSource(r.source)} · {ago(r.timestamp,lang)}</small><strong>{cleanTitle(r)}</strong>{r.summary&&!GOOGLE_PLACEHOLDER.test(r.summary)&&r.id!==story.headline.id&&<span>{r.summary.slice(0,180)}</span>}</span>
      {r.imageUrl&&/* eslint-disable-next-line @next/next/no-img-element */<img src={r.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer"/>}
     </a></li>)}</ol>
    </section>
    {related.length>0&&<section className="related"><h2>{t.related}</h2><div className="grid">{related.map(s=><Card key={s.id} story={s} {...ctx} openStory={x=>ctx.openStory(x)}/>)}</div></section>}
    {lang==='el'&&translated&&<p className="note">{t.translatedNote}</p>}
   </div>
  </article>
 </div>;
}
