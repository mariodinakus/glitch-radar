'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import type {Signal} from '@/lib/types';
import {buildStories,diverseTop,forYou,leanMix,leanOf,storylineSummaries,storylines,getStoryline} from '@/lib/stories';
import type {Lean,Prefs,Section,Story,StorylineSummary} from '@/lib/stories';
import {conflictSummaries} from '@/lib/conflicts';
import {PublisherBubbles,StorySequence,PublisherStack,cleanSummary} from '@/components/Publishers';
import type {ConflictSummary} from '@/lib/conflicts';
import {INDICATORS,indicatorBySymbol} from '@/lib/indicators';
import type {IndicatorGroup} from '@/lib/indicators';
import {SocietyDashboard} from '@/components/SocietyDashboard';
import ConflictAtlas from '@/components/ConflictAtlas';
import GlobalBriefing from '@/components/GlobalBriefing';
import {tidyNewsExcerpt} from '@/lib/translation-quality';
import BlackCatDetector from '@/components/BlackCatDetector';
import NarrativeDNA from '@/components/NarrativeDNA';
import {glitchScore} from '@/lib/glitch-score';
import MobileAppControls from '@/components/MobileAppControls';
import UserProfile from '@/components/UserProfile';
import {getGlitchClient,cleanPrefs} from '@/lib/glitch-auth';

/* ───────────── copy ───────────── */
type Lang='el'|'en';
const T={
 en:{
  foryou:'For you',top:'Top',wars:'Wars',markets:'Markets',society:'Society & Politics',more:'More stories',world:'World',economy:'Economy',tech:'AI & Tech',greece:'Greece',science:'Science',climate:'Climate',sports:'Sport',latest:'Latest',saved:'Saved',
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
type Copy=typeof T.en;
const SECTIONS:Section[]=['top','foryou','wars','world','society','economy','markets','tech','science','climate','sports','latest'];

/* ───────────── helpers ───────────── */
const isGoogle=(s:Signal)=>s.url.includes('news.google.');
const GOOGLE_PLACEHOLDER=/^Συγκεντρωτική αναφορά/;
const cleanTitle=(s:Signal)=>isGoogle(s)?s.title.replace(/\s+-\s+[^-]{2,70}$/,''):s.title;
const summaryOf=(st:Story)=>{const r=[st.headline,...st.reports].find(x=>x.summary&&!GOOGLE_PLACEHOLDER.test(x.summary)&&x.summary.length>40);return r?cleanSummary(r.summary):''};
const hasGreek=(s:string)=>/[Ͱ-Ͽἀ-῿]/.test(s);
function ago(iso:string,lang:Lang):string{
 const m=Math.max(1,Math.round((Date.now()-Date.parse(iso))/60000));
 if(lang==='el'){if(m<60)return `πριν ${m}′`;const h=Math.round(m/60);if(h<24)return `πριν ${h} ώρ${h===1?'α':'ες'}`;const d=Math.round(h/24);return d===1?'χθες':`πριν ${d} μέρες`;}
 if(m<60)return `${m}m ago`;const h=Math.round(m/60);if(h<24)return `${h}h ago`;const d=Math.round(h/24);return d===1?'yesterday':`${d}d ago`;
}
const shortSource=(s:string)=>s.replace(/^Google News \/ /,'').replace(/^(BBC|Guardian|New York Times|UN News|Spaceflight News)\s.*$/,'$1').replace(/^Spaceflight News \/ /,'');
function load<T>(k:string,f:T):T{try{const v=localStorage.getItem(k);return v?JSON.parse(v) as T:f}catch{return f}}
function store(k:string,v:unknown){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
const PREFS_KEY='glitch.v11.prefs',OG_KEY='glitch.v11.og';
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
function Mark(){return <svg width="32" height="32" viewBox="0 0 64 64" fill="none" aria-hidden="true">
 <circle cx="32" cy="32" r="23" stroke="#E2B857" strokeWidth="2.5" strokeDasharray="117 22" transform="rotate(-24 32 32)"/>
 <path d="M21.5 19.5c3.2-3.6 7-5.3 12-5.3 5.5 0 9.9 2.1 12.3 4.9M45.7 31.5H33.3m12.4 0V43c-4.1 4.2-8.7 6.2-13.9 6.2-9.6 0-17-7.2-17-17.2 0-3.7 1-6.7 2.5-9.4" stroke="#E2B857" strokeWidth="4" strokeLinecap="square" strokeLinejoin="round"/>
 <path d="M10 38.7h13.8M36 25.6h18.5" stroke="#FF526D" strokeWidth="3" strokeLinecap="round"/><circle cx="51.2" cy="10.7" r="3.2" fill="#FF4E6C"/>
 </svg>;}

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
 return <div className="meta"><PublisherStack story={story}/><span className="m-src">{shortSource(story.headline.source)}</span>{n>1&&<span className="m-count">+{n-1} {t.sources}</span>}<span className="m-dot">·</span><time>{ago(story.lastAt,lang)}</time></div>;
}
function GlitchChip({story,lang}:{story:Story;lang:Lang}){
 const g=useMemo(()=>glitchScore(story),[story]);
 if(g.level==='none')return null;
 const tip=g.reasons.map(r=>lang==='el'?r.el:r.en).join(' · ')+(lang==='el'?' — ένδειξη προς έλεγχο, όχι απόδειξη.':' — a signal to review, not proof.');
 return <span className={'gchip gchip-'+g.level} title={tip} aria-label={'GLITCH '+g.score+'. '+tip}><i/>GLITCH <b>{g.score}</b></span>;
}
function Kind({story,t,lang}:{story:Story;t:Copy;lang:Lang}){
 const line=getStoryline(story.storylines[0]||'');
 const label=story.kind!=='other'?t.kinds[story.kind]:line?(lang==='el'?line.el:line.en):t[story.section as keyof Copy] as string;
 return <><span className={'kind k-'+story.kind}>{story.level==='top'&&<b className="pulse"/>}{label}</span><GlitchChip story={story} lang={lang}/></>;
}
function WarGlitch({stories,lang,title,onOpen}:{stories:Story[];lang:Lang;title:(s:Story)=>string;onOpen:(s:Story)=>void}){
 const el=lang==='el';
 const rows=useMemo(()=>stories.map(s=>({s,g:glitchScore(s)})).filter(x=>x.g.score>0||x.g.origin).sort((a,b)=>b.g.score-a.g.score||b.g.reasons.length-a.g.reasons.length).slice(0,4),[stories]);
 if(!rows.length)return null;
 const hhmm=(d:string)=>new Date(d).toLocaleTimeString(el?'el-GR':'en-GB',{hour:'2-digit',minute:'2-digit',hour12:false});
 return <section className="war-glitch" aria-label={el?'Glitch στον πόλεμο':'Glitch in this war'}>
  <header><span className="wg-eyebrow">◉ BLACK CAT / WAR</span><h3>{el?'Πού δεν συμφωνεί η αφήγηση':'Where the narrative does not add up'}<em>.</em></h3>
   <p>{el?'Αντίγραφα τίτλων, αντικρουόμενοι αριθμοί και ποιος το έβγαλε πρώτος — μόνο από τη ροή που παρακολουθούμε. Ενδείξεις, όχι αποδείξεις.':'Echoed headlines, conflicting figures and who reported first — from the monitored feed only. Signals, not proof.'}</p></header>
  <div className="wg-grid">{rows.map(({s,g})=><article key={s.id} className="wg-card">
   <div className="wg-top"><span className={'gchip gchip-'+(g.level==='none'?'watch':g.level)}><i/>GLITCH <b>{g.score}</b></span></div>
   <strong>{title(s)}</strong>
   {g.reasons.length>0&&<ul>{g.reasons.map((r,i)=><li key={i}>{el?r.el:r.en}</li>)}</ul>}
   {g.counts.length>1&&<div className="wg-counts">{g.counts.slice(0,4).map((c,i)=><a key={i} href={c.url} target="_blank" rel="noopener noreferrer"><b>{c.value}</b> {c.unit}<span>{c.source} ↗</span></a>)}</div>}
   {g.origin&&<small>{el?'Πρώτο στη ροή: ':'First in feed: '}<b>{g.origin.source}</b> · {hhmm(g.origin.at)} · {g.origin.followers} {el?'μέσα ακολούθησαν σε 2 ώρες':'outlets followed within 2h'}</small>}
   <button onClick={()=>onOpen(s)}>{el?'Σύγκριση ρεπορτάζ':'Compare coverage'} →</button>
  </article>)}</div>
 </section>;
}

/* ───────────── indicators ───────────── */
type Quote={symbol:string;price:number|null;prev:number|null;change:number|null;currency:string|null;time:string|null;spark:number[]};
const fmt=(q:Quote)=>{const i=indicatorBySymbol(q.symbol);if(q.price===null)return '—';const d=i?.digits??(q.price>=1000?0:2);
 const n=q.price.toLocaleString('el-GR',{minimumFractionDigits:d,maximumFractionDigits:d});return i?.unit==='%'?n+'%':i?.unit==='¢'?n+'¢':(i?.unit||'')+n};
const chg=(q:Quote)=>q.change===null?'':(q.change>0?'+':'')+q.change.toFixed(2)+'%';
function Spark({data,up}:{data:number[];up:boolean}){
 if(data.length<3)return null;const mn=Math.min(...data),mx=Math.max(...data),r=mx-mn||1;
 const pts=data.map((v,i)=>`${(i/(data.length-1)*100).toFixed(1)},${(30-(v-mn)/r*28-1).toFixed(1)}`).join(' ');
 return <svg className="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><polyline points={pts} fill="none" stroke={up?'var(--green)':'var(--red)'} strokeWidth="1.6" vectorEffect="non-scaling-stroke"/></svg>;
}
const GROUPS:{g:IndicatorGroup;el:string;en:string}[]=[{g:'indices',el:'Χρηματιστήρια',en:'Stock markets'},{g:'energy',el:'Ενέργεια',en:'Energy'},{g:'metals',el:'Μέταλλα & αγροτικά',en:'Metals & agri'},{g:'fx',el:'Νομίσματα & crypto',en:'FX & crypto'},{g:'risk',el:'Επιτόκια & φόβος',en:'Rates & fear'}];
function IndicatorCard({q,lang}:{q:Quote;lang:Lang}){
 const i=indicatorBySymbol(q.symbol);const up=(q.change??0)>=0;
 return <a className="ind" href={'https://finance.yahoo.com/quote/'+encodeURIComponent(q.symbol)} target="_blank" rel="noreferrer">
  <div className="ind-top"><span>{lang==='el'?i?.el:i?.en}</span><em className={up?'up':'down'}>{chg(q)}</em></div>
  <b>{fmt(q)}</b><Spark data={q.spark} up={(q.spark.at(-1)??0)>=(q.spark[0]??0)}/>
 </a>;
}
type PM={id:string;venue:string;question:string;probability:number;sourceUrl:string;volume24h:number|null};
function usePredictionMarkets(){
 const [m,setM]=useState<PM[]>([]);
 useEffect(()=>{let live=true;fetch('/api/markets').then(r=>r.ok?r.json():null).then(d=>{if(live&&d?.quotes)setM(d.quotes)}).catch(()=>{});return()=>{live=false}},[]);
 return m;
}
function PMList({items,lang}:{items:PM[];lang:Lang}){
 if(!items.length)return null;
 return <div className="pm">{items.map(x=><a key={x.id} href={x.sourceUrl} target="_blank" rel="noreferrer" className="pm-row">
  <span className="pm-q">{x.question}</span><span className="pm-p"><i style={{width:Math.round(x.probability*100)+'%'}}/><b>{Math.round(x.probability*100)}%</b></span><small>{x.venue==='polymarket'?'Polymarket':'Kalshi'}</small></a>)}
  <p className="note">{lang==='el'?'Τιμές συμβολαίων αγορών προβλέψεων — δείχνουν τι «στοιχηματίζουν» οι αγορές, όχι βεβαιότητα.':'Prediction-market prices — what traders are betting on, not certainty.'}</p></div>;
}
function MarketsView({quotes,stories,...ctx}:Ctx&{quotes:Quote[];stories:Story[]}){
 const {lang}=ctx;const pm=usePredictionMarkets();
 const econ=stories.filter(s=>s.section==='economy'||s.storylines.includes('energy')||s.storylines.includes('economy')).slice(0,40);
 return <div className="view">
  <div className="view-head"><h1>{ctx.t.markets}</h1><span>{lang==='el'?'Live δείκτες · καθυστέρηση ~15′':'Live indicators · ~15-min delay'}</span></div>
  {!quotes.length&&<div className="ax-wait"><i/><i/><i/><span>…</span></div>}
  {GROUPS.map(({g,el,en})=>{const qs=INDICATORS.filter(i=>i.group===g).map(i=>quotes.find(q=>q.symbol===i.symbol)).filter((q):q is Quote=>!!q&&q.price!==null);
   return qs.length?<section key={g} className="ind-group"><h2>{lang==='el'?el:en}</h2><div className="ind-grid">{qs.map(q=><IndicatorCard key={q.symbol} q={q} lang={lang}/>)}</div></section>:null})}
  {pm.length>0&&<section className="ind-group"><h2>{lang==='el'?'Τι προεξοφλούν οι αγορές προβλέψεων':'What prediction markets price in'}</h2><PMList items={pm.slice(0,10)} lang={lang}/></section>}
  <section className="ind-group"><h2>{lang==='el'?'Ειδήσεις αγορών & οικονομίας':'Markets & economy news'}</h2><Paged stories={econ} {...ctx}/></section>
 </div>;
}

/* ───────────── war room ───────────── */
type Brief={situation:string;keyIssues:{title:string;text:string}[];actors:{name:string;position:string}[];latest:string[];scenarios:{title:string;likelihood:'high'|'medium'|'low';text:string}[];watch:string[];economy:string;greece:string;caveat:string};
const BRIEF_CACHE=new Map<string,Brief|'off'|'err'>();
function WarsView({stories,quotes,...ctx}:Ctx&{stories:Story[];quotes:Quote[]}){
 const {lang,t,withImg,title}=ctx;const el=lang==='el';
 const list=useMemo(()=>conflictSummaries(stories),[stories]);
 const [sel,setSel]=useState<string|null>(null);
 const cur=list.find(x=>x.c.id===sel)||list[0];
 const pm=usePredictionMarkets();
 const [brief]=useState<Brief|'off'|'err'|'loading'>('off');
 if(!cur)return <div className="empty">{t.noResults}</div>;
 const c=cur.c;const timeline=[...cur.stories].sort((a,b)=>Date.parse(b.lastAt)-Date.parse(a.lastAt));
 const cover=cur.stories.find(s=>withImg(s));
 const qs=c.indicators.map(sym=>quotes.find(q=>q.symbol===sym)).filter((q):q is Quote=>!!q&&q.price!==null);
 const markets=pm.filter(m=>c.market.test(m.question)).slice(0,6);
 const signals=cur.stories.flatMap(x=>x.reports.map(r=>({r,story:x}))).filter(x=>!(/review|movie|game|video game|historical|world war ii|second world war|β' παγκοσμ|β΄ παγκοσμ/i.test(x.r.title))).sort((a,b)=>Date.parse(b.r.timestamp)-Date.parse(a.r.timestamp));
 const choose=(rx:RegExp)=>signals.filter(x=>rx.test(x.r.title)&&x.r.url).filter((x,i,a)=>a.findIndex(z=>z.r.url===x.r.url)===i).slice(0,5);
 const battleReports=choose(/\b(battles?|clashes?|fighting|offensive|assault|frontline|airstrikes?|shelling|missiles?|drone strikes?|attacks?|strike on)\b|μάχ|σύγκρουσ|επίθεσ|βομβαρδ|πλήγμα/iu);
 const lossReports=choose(/\b(killed|dead|deaths?|fatalit(?:y|ies)|casualt(?:y|ies)|wounded|injured|death toll|civilian deaths|displaced)\b|νεκρ|σκοτώθ|τραυματ|θύματ|απώλει|εκτοπισμ/iu);
 const landReports=choose(/\b(captur(?:e|ed|ing)|retak(?:e|en)|seiz(?:e|ed)|territor(?:y|ial)|control of|advanc(?:e|ed|ing)|withdr(?:aw|ew)|front lines?|occupied|liberat(?:e|ed))\b|κατέλαβ|ανακατέλαβ|εδαφ|προέλασ|αποσύρ|ελέγχ|κατοχ/iu);
 const reporting=[{key:'losses',label:el?'Απώλειες / ανθρωπιστικές συνέπειες':'Losses / humanitarian impact',items:lossReports,
 empty:el?'Δεν υπάρχει πρόσφατη τεκμηριωμένη αναφορά στη ροή. Δεν υπολογίζουμε αυθαίρετα συνολικά θύματα.':'No matching report in the current feed. We do not invent cumulative casualties.'},
 {key:'territory',label:el?'Εδαφικές μεταβολές / έλεγχος περιοχών':'Territorial changes / control',items:landReports,
 empty:el?'Χωρίς πρόσφατη επιβεβαιωμένη αναφορά για εδαφική μεταβολή. Δεν δηλώνουμε έλεγχο περιοχών χωρίς πηγή.':'No recent sourced territorial change in the feed. No unsourced control claims.'},
 {key:'battles',label:el?'Τελευταίες μάχες / επιθέσεις':'Latest battles / strikes',items:battleReports,
 empty:el?'Δεν βρέθηκαν σχετικές αναφορές στο τρέχον δείγμα ειδήσεων.':'No matching reports in the current news sample.'}];
 const b=typeof brief==='object'?brief:null;
 const like=(l:string)=>el?({high:'Πιθανό',medium:'Μέτρια πιθανό',low:'Λιγότερο πιθανό'} as Record<string,string>)[l]:({high:'Likely',medium:'Possible',low:'Less likely'} as Record<string,string>)[l];
 return <div className="view wars">
  <ConflictAtlas items={list} selected={c.id} onSelect={setSel} lang={lang} aiActors={b?.actors}/>

  <div className="line-hero war-hero">{cover&&<Pic src={withImg(cover)} alt="" story={cover} eager/>}<div className="line-shade"/>
   <div className="line-copy"><span className="war-live"><i/>{el?'WAR ROOM · ροή ειδήσεων':'WAR ROOM · recent reporting'}</span><h1>{el?c.el:c.en}</h1><p>{el?c.descEl:c.descEn}</p>
    <div className="war-stats"><span><b>{cur.last24}</b>{el?'ιστορίες 24ώρου':'stories / 24h'}</span><span><b>{cur.stories.length}</b>{el?'ιστορίες 4 ημερών':'stories / 4 days'}</span><span><b>{cur.sources}</b>{t.sources}</span></div></div></div>
  {qs.length>0&&<div className="ind-grid war-ind">{qs.map(q=><IndicatorCard key={q.symbol} q={q} lang={lang}/>)}</div>}
  <WarGlitch stories={cur.stories} lang={lang} title={title} onOpen={ctx.openStory}/>
  <section className="war-field-report" aria-label={el?'Ειδήσεις από το μέτωπο':'Frontline reporting'}>
    <header><strong>{el?'Απώλειες, έδαφος και μάχες':'Losses, territory and battles'}</strong>
      <p>{el?'Μόνο αναφορές με πηγή από το τελευταίο τετραήμερο. Ενδέχεται να είναι ισχυρισμοί εμπλεκομένων — άνοιξε το δημοσίευμα για έλεγχο. Δεν είναι επαληθευμένα αθροίσματα, χάρτης ελέγχου ή πλήρης πολεμική καταγραφή.':'Sourced news reports from the last four days. Claims may be disputed. These are not verified cumulative totals, a territorial-control map or an exhaustive conflict record.'}</p>
    </header>
    <div className="war-field-grid">{reporting.map(group=><article className="war-field-card" key={group.key}>
      <h3>{group.label}</h3>
      {group.items.length?<ul>{group.items.map(({r,story})=><li key={r.id}><a href={r.url} target="_blank" rel="noopener noreferrer"><strong>{ctx.rtitle(r)}</strong><span>{r.source} · {ago(r.timestamp,lang)} ↗</span></a></li>)}</ul>:<p>{group.empty}</p>}
    </article>)}</div>
    <div className="war-field-links"><span>{el?'Εξειδικευμένες πηγές:':'Specialist sources:'}</span>
      <a href="https://acleddata.com/conflict-data" target="_blank" rel="noopener noreferrer">ACLED · {el?'περιστατικά / απώλειες':'events / fatalities'} ↗</a>
      <a href="https://reliefweb.int/updates" target="_blank" rel="noopener noreferrer">ReliefWeb · {el?'ανθρωπιστικές αναφορές':'humanitarian reports'} ↗</a>
      <a href="https://www.cfr.org/global-conflict-tracker" target="_blank" rel="noopener noreferrer">CFR · {el?'εξελίξεις':'conflict profiles'} ↗</a>
    </div>
  </section>
  <section className="ax war-brief">
   <div className="ax-head"><span className="ax-mark">✦</span><h2>{el?'Τα βασικά ζητήματα τώρα':'The key issues right now'}</h2>{b&&<em>AI</em>}</div>
   {brief==='loading'&&<div className="ax-wait"><i/><i/><i/><span>{el?'Το GLITCH διαβάζει όλη την κάλυψη…':'GLITCH is reading all the coverage…'}</span></div>}
   {(brief==='off'||brief==='err')&&<p className="ax-off">{brief==='off'?(el?'Η ανάλυση AI δεν είναι ενεργή ακόμα — παρακάτω οι τελευταίες εξελίξεις από τις πηγές.':'No external AI required. The current reports and dated faction profiles are shown above and below.'):(el?'Η ανάλυση δεν είναι διαθέσιμη αυτή τη στιγμή.':'Briefing unavailable right now.')}</p>}
   {b&&<>
    <p className="ax-big">{b.situation}</p>
    <div className="issues">{b.keyIssues.map((k,i)=><div key={i} className="issue"><b>{String(i+1).padStart(2,'0')}</b><strong>{k.title}</strong><p>{k.text}</p></div>)}</div>
    <h3 className="ax-h3">{el?'Ποιος θέλει τι':'Who wants what'}</h3>
    <div className="actors">{b.actors.map((a,i)=><div key={i}><strong>{a.name}</strong><p>{a.position}</p></div>)}</div>
    <h3 className="ax-h3">{el?'Τι έρχεται':"What's next"}</h3>
    <ol className="ax-sc">{b.scenarios.map((sc,i)=><li key={i} className={'lk-'+sc.likelihood}><div className="sc-top"><strong>{sc.title}</strong><span className="lk"><i/><i/><i/>{like(sc.likelihood)}</span></div><p>{sc.text}</p></li>)}</ol>
    <div className="ax-callouts"><div><small>{el?'Τι να παρακολουθείς':'Signals to watch'}</small><ul>{b.watch.map((w,i)=><li key={i}>{w}</li>)}</ul></div><div><small>{el?'Αγορές & οικονομία':'Markets & economy'}</small><p>{b.economy}</p></div><div className="gr"><small>🇬🇷 {el?'Για την Ελλάδα':'For Greece'}</small><p>{b.greece}</p></div><div><small>{el?'Τελευταίες 72 ώρες':'Last 72 hours'}</small><ul>{b.latest.map((w,i)=><li key={i}>{w}</li>)}</ul></div></div>
    <p className="note">⚠ {b.caveat}</p>
   </>}
  </section>
  {markets.length>0&&<section className="ind-group"><h2>{el?'Τι στοιχηματίζουν οι αγορές':'What markets are betting on'}</h2><PMList items={markets} lang={lang}/></section>}
  <h2 className="tl-h">{t.timeline}</h2>
  <Paged stories={timeline} timeline {...ctx}/>
 </div>;
}

/* load-more list */
function Paged({stories,timeline,...ctx}:Ctx&{stories:Story[];timeline?:boolean}){
 const [n,setN]=useState(20);
 const resetKey=stories.length+':'+(stories[0]?.id||'');
 useEffect(()=>setN(20),[resetKey]);
 const shown=stories.slice(0,n);
 const {setExtraPool}=ctx;
 const ids=shown.map(s=>s.id).join(',');
 const shownRef=useRef(shown);shownRef.current=shown;
 useEffect(()=>{setExtraPool(shownRef.current)},[ids,setExtraPool]);
 return <>
  {timeline?<ol className="timeline">{shown.map(s=><li key={s.id}><time>{new Date(s.lastAt).toLocaleString(ctx.lang==='el'?'el-GR':'en-GB',{weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false})}</time><Row story={s} {...ctx}/></li>)}</ol>
   :<div className="rows">{shown.map(s=><Row key={s.id} story={s} {...ctx}/>)}</div>}
  {stories.length>n&&<button className="btn more" onClick={()=>setN(x=>x+20)}>{ctx.t.more} <em>{stories.length-n}</em></button>}
 </>;
}

/* ───────────── main ───────────── */
type TrendItem={id:string;name:string;traffic:string|null;url:string;relatedHeadlines:string[]};
export default function GlitchNews(){
 const [signals,setSignals]=useState<Signal[]>([]);
 const [state,setState]=useState<'loading'|'ready'|'error'>('loading');
 const [updated,setUpdated]=useState<string>('');
 const [section,setSection]=useState<Section>('top');
 const [line,setLine]=useState<string|null>(null);
 const [lang]=useState<Lang>('en');
 const [prefs,setPrefs]=useState<Prefs>(EMPTY);
 const [open,setOpen]=useState<Story|null>(null);
 const [q,setQ]=useState('');
 const tabsRef=useRef<HTMLElement>(null);
 const [quotes,setQuotes]=useState<Quote[]>([]);
 const [og,setOg]=useState<Record<string,string|null>>({});
 const [trends,setTrends]=useState<TrendItem[]>([]);
 const t=T.en;

 useEffect(()=>{setPrefs(load(PREFS_KEY,EMPTY));setOg(load(OG_KEY,{}));
  const h=new URLSearchParams(location.search);const s=h.get('s') as Section|null;if(s&&SECTIONS.includes(s))setSection(s);const l=h.get('topic');if(l&&getStoryline(l))setLine(l);},[]);
 // Preserve guest settings locally and sync signed-in settings only to their owner's row.
 const [cloudUser,setCloudUser]=useState<string|null>(null);
 const [cloudReadyFor,setCloudReadyFor]=useState<string|null>(null);
 useEffect(()=>{
  const sb=getGlitchClient();if(!sb)return;
  let active=true;
  void sb.auth.getUser().then(({data})=>{if(active)setCloudUser(data.user?.id||null)});
  const {data:{subscription}}=sb.auth.onAuthStateChange((_event,session)=>{
   if(active)setCloudUser(session?.user?.id||null);
  });
  return()=>{active=false;subscription.unsubscribe()};
 },[]);
 useEffect(()=>{
  const sb=getGlitchClient();if(!sb)return;
  let active=true;
  setCloudReadyFor(null);
  if(!cloudUser){setPrefs(load(PREFS_KEY,EMPTY));return}
  setPrefs(load(PREFS_KEY+'.'+cloudUser,EMPTY));
  void sb.from('user_profiles').select('prefs').eq('id',cloudUser).maybeSingle()
   .then(({data,error})=>{
    if(!active||error)return;
    setPrefs(cleanPrefs(data?.prefs));
    setCloudReadyFor(cloudUser);
   });
  return()=>{active=false};
 },[cloudUser]);
 useEffect(()=>{
  // Never copy a previous user's library into the next account.
  if(cloudUser){
   if(cloudReadyFor!==cloudUser)return;
   store(PREFS_KEY+'.'+cloudUser,prefs);
   const sb=getGlitchClient();if(!sb)return;
   const timer=setTimeout(()=>{
    void sb.from('user_profiles').update({prefs:cleanPrefs(prefs)}).eq('id',cloudUser);
   },700);
   return()=>clearTimeout(timer);
  }
  store(PREFS_KEY,prefs);
 },[prefs,cloudUser,cloudReadyFor]);

 const inflight=useRef<AbortController|null>(null);
 const latestStamp=useRef('');
 const fetchFeed=useCallback(async()=>{
  if(inflight.current||!navigator.onLine)return;
  const controller=new AbortController();inflight.current=controller;
  const timeout=setTimeout(()=>controller.abort(),12000);
  try{
   const r=await fetch('/api/feed',{cache:'no-store',signal:controller.signal});
   if(!r.ok)throw Error('feed');
   const d=await r.json() as {signals:Signal[];generatedAt:string};
   if(d.generatedAt!==latestStamp.current){latestStamp.current=d.generatedAt;setSignals(d.signals||[])}
   setUpdated(d.generatedAt);setState('ready');
  }catch{setState(s=>s==='ready'?'ready':'error')}
  finally{clearTimeout(timeout);if(inflight.current===controller)inflight.current=null}
 },[]);
 useEffect(()=>{
  const tick=()=>{if(document.visibilityState==='visible')void fetchFeed()};
  tick();
  const id=setInterval(tick,5*60*1000);
  document.addEventListener('visibilitychange',tick);
  window.addEventListener('online',tick);
  return()=>{clearInterval(id);document.removeEventListener('visibilitychange',tick);window.removeEventListener('online',tick);inflight.current?.abort()};
 },[fetchFeed]);
 useEffect(()=>{let live=true;fetch('/api/trends?region=WORLD').then(r=>r.ok?r.json():null).then(d=>{if(live&&d?.trends)setTrends(d.trends.slice(0,8))}).catch(()=>{});return()=>{live=false}},[]);

 useEffect(()=>{if(section!=='markets'&&section!=='wars')return;let live=true;const get=()=>fetch('/api/indicators').then(r=>r.ok?r.json():null).then(d=>{if(live&&d?.quotes)setQuotes(d.quotes)}).catch(()=>{});get();const id=setInterval(get,5*60000);return()=>{live=false;clearInterval(id)}},[section]);
 const stories=useMemo(()=>buildStories(signals),[signals]);
 // og:image enrichment for stories without a picture
 const withImg=useCallback((s:Story)=>s.image||og[s.id]||undefined,[og]);
 const ogBusy=useRef(false);
 useEffect(()=>{
  if(ogBusy.current||!stories.length)return;
  const need=stories.slice(0,40).filter(s=>!s.image&&!(s.id in og)).map(s=>({s,url:[s.headline,...s.reports].find(r=>!isGoogle(r))?.url})).slice(0,4);
  if(!need.length)return;ogBusy.current=true;
  Promise.all(need.map(async({s,url})=>{if(!url)return [s.id,null] as const;try{const r=await fetch('/api/og?url='+encodeURIComponent(url));const d=await r.json() as {image:string|null};return [s.id,d.image] as const}catch{return [s.id,null] as const}}))
   .then(rows=>setOg(o=>{const n={...o,...Object.fromEntries(rows)};store(OG_KEY,Object.fromEntries(Object.entries(n).slice(-400)));return n}))
   .finally(()=>{ogBusy.current=false});
 },[stories,og]);

 const title=useCallback((st:Story)=>cleanTitle(st.headline),[]);
 const sum=useCallback((st:Story)=>tidyNewsExcerpt(summaryOf(st),cleanTitle(st.headline)),[]);
 const rsum=useCallback((r:Signal)=>r.summary&&!GOOGLE_PLACEHOLDER.test(r.summary)?tidyNewsExcerpt(cleanSummary(r.summary),cleanTitle(r)).slice(0,320):'',[]);
 const rtitle=useCallback((r:Signal)=>cleanTitle(r),[]);

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
 const searchHits=useMemo(()=>{const n=q.trim().toLocaleLowerCase();if(n.length<2)return [];return stories.filter(s=>(s.headline.title+' '+s.reports.map(r=>r.title).join(' ')).toLocaleLowerCase().includes(n)).slice(0,40)},[q,stories]);
 const worldRail=useMemo(()=>diverseTop(visible.filter(s=>s.section==='world'),14,{exclude:shown,perLine:3}),[visible,shown]);
 const [,setExtraPool]=useState<Story[]>([]);

 /* prefs actions */
 const toggle=(k:keyof Prefs,v:string)=>setPrefs(p=>({...p,[k]:p[k].includes(v)?p[k].filter(x=>x!==v):[...p[k],v]}));
 const openStory=(s:Story)=>{setOpen(s);setPrefs(p=>p.read.includes(s.id)?p:{...p,read:[...p.read.slice(-300),s.id]})};
 const go=(sec:Section,l:string|null=null)=>{setSection(sec);setLine(l);setQ('');window.scrollTo({top:0,behavior:'smooth'});
  try{const u=new URL(location.href);u.searchParams.delete('s');u.searchParams.delete('topic');if(sec!=='top')u.searchParams.set('s',sec);if(l)u.searchParams.set('topic',l);history.replaceState(null,'',u)}catch{}};

 const ctx={t,lang,title,sum,rtitle,rsum,withImg,openStory,prefs,toggle,setExtraPool};

 return <div className="gn">
  <header className="gn-top">
   <div className="gn-bar">
    <button className="brand" onClick={()=>go('top')} aria-label="GLITCH"><Mark/><span><b className="g-glitch" data-t="GLITCH">GLITCH</b><small>{lang==='el'?'Δες τον κώδικα πίσω από τις ειδήσεις':'See the code behind the news'}</small></span></button>
    <label className="gn-search">{I.search}<input value={q} onChange={e=>setQ(e.target.value)} placeholder={t.search}/>{q&&<button onClick={()=>setQ('')} aria-label="clear">{I.x}</button>}</label>
    <div className="gn-tools">
     <span className="live"><i/>{t.live}{updated&&<em>{new Date(updated).toLocaleTimeString(lang==='el'?'el-GR':'en-GB',{hour:'2-digit',minute:'2-digit',hour12:false})}</em>}</span>
     <UserProfile/>
     <MobileAppControls/>
     <button className={'icon'+(section==='saved'?' on':'')} onClick={()=>go('saved')} aria-label={t.saved}>{I.bm(section==='saved')}{prefs.saved.length>0&&<sup>{prefs.saved.length}</sup>}</button>
     
    </div>
   </div>
   <div className="gn-nav-shell">
    <button className="gn-nav-arrow" aria-label={lang==='el'?'Προηγούμενες κατηγορίες':'Previous sections'} onClick={()=>tabsRef.current?.scrollBy({left:-330,behavior:'smooth'})}>‹</button>
    <nav className="gn-tabs" ref={tabsRef} aria-label="sections">
     {SECTIONS.filter(s=>s!=='latest').map(s=><button key={s} className={section===s&&!line?'on':''} onClick={()=>go(s)} aria-current={section===s&&!line?'page':undefined}>{s==='foryou'&&<span className="spark">✦</span>}{s==='wars'&&<i className="war-dot"/>}{t[s]}</button>)}
    </nav>
    <button className="gn-nav-arrow" aria-label={lang==='el'?'Επόμενες κατηγορίες':'Next sections'} onClick={()=>tabsRef.current?.scrollBy({left:330,behavior:'smooth'})}>›</button>
    <button className={'gn-latest-link'+(section==='latest'?' on':'')} onClick={()=>go('latest')}>◉ {t.latest}</button>
   </div>
     </header>

  <main className="gn-main">
   {state==='loading'&&<Skeleton t={t}/>}
   {state==='error'&&<div className="empty">{t.error}<button className="btn" onClick={()=>{setState('loading');fetchFeed()}}>{I.refresh}{t.retry}</button></div>}
   {state==='ready'&&(q.trim().length>=2?
    <SearchView hits={searchHits} q={q} {...ctx}/>:
    line?<StorylineView id={line} stories={visible.filter(s=>s.storylines.includes(line))} onBack={()=>go(section)} {...ctx}/>:
    section==='top'?<>
     <div className="manifesto"><span className="g-glitch big" data-t="GLITCH">GLITCH</span><p>{lang==='el'?<>Στο Matrix, το <b>glitch</b> είναι η στιγμή που βλέπεις τον κώδικα πίσω από την «πραγματικότητα». Εδώ βλέπεις <b>ποιος</b> γράφει κάθε είδηση, <b>πώς</b> την πλαισιώνει και <b>τι</b> αφήνει έξω.</>:<>In the Matrix, a <b>glitch</b> is the moment you see the code behind “reality”. Here you see <b>who</b> writes each story, <b>how</b> they frame it and <b>what</b> they leave out.</>}</p></div>
     <Hero slides={hero} {...ctx}/>
     <GlobalBriefing compact stories={visible} lang={lang} titleFor={title} onOpen={openStory} onWars={()=>go('wars')} updatedAt={updated}/>
     <BlackCatDetector signals={signals} stories={visible} lang={lang} titleFor={title} onOpen={openStory}/>
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
       <Side title={t.trends} icon={<span className="g-dot"/>} extra={<span className="gn-world-trends">WORLD</span>}>
        {trends.length?<ul className="trends">{trends.map((x,i)=><li key={x.id}><a href={x.url} target="_blank" rel="noreferrer"><b>{i+1}</b><span>{x.name}{x.relatedHeadlines[0]&&<small>{x.relatedHeadlines[0]}</small>}</span>{x.traffic&&<em>{x.traffic}</em>}</a></li>)}</ul>:<p className="muted small">…</p>}
       </Side>
       <Side title={t.latestNews} icon={<i className="live-dot"/>}><ul className="ticker">{latest.slice(0,8).map(s=><li key={s.id}><button onClick={()=>openStory(s)}><time>{new Date(s.lastAt).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false})}</time><span>{title(s)}</span></button></li>)}</ul></Side>
      </aside>
     </div>
     <Rail heading={t.world} stories={worldRail} onAll={()=>go('world')} {...ctx}/>
     <Rail heading={t.economy} stories={railOf('economy')} onAll={()=>go('economy')} {...ctx}/>
     <Rail heading={t.tech} stories={railOf('tech')} onAll={()=>go('tech')} {...ctx}/>
     <Rail heading={t.greece} stories={railOf('greece')} onAll={()=>go('greece')} {...ctx}/>
     <Rail heading={t.science} stories={railOf('science')} onAll={()=>go('science')} {...ctx}/>
     <Rail heading={t.climate} stories={railOf('climate')} onAll={()=>go('climate')} {...ctx}/>
    </>:
    section==='world'?<><GlobalBriefing stories={visible} lang={lang} titleFor={title} onOpen={openStory} onWars={()=>go('wars')} updatedAt={updated}/><SectionView heading={t.world} stories={bySection('world')} themes={themes.filter(x=>x.stories.some(s=>s.section==='world')).slice(0,8)} onPick={l=>go('world',l)} {...ctx}/></>:
    section==='wars'?<WarsView stories={visible} quotes={quotes} {...ctx}/>:
    section==='markets'?<MarketsView quotes={quotes} stories={visible} {...ctx}/>:
     section==='society'?<SocietyDashboard lang={lang}/>:
    section==='foryou'?<ForYouView stories={mine} onPickLine={l=>go('foryou',l)} {...ctx}/>:
    section==='latest'?<ListView heading={t.latest} stories={latest} {...ctx}/>:
    section==='saved'?<ListView heading={t.saved} stories={stories.filter(s=>prefs.saved.includes(s.id))} empty={t.emptySaved} {...ctx}/>:
    <SectionView heading={t[section]} stories={bySection(section)} themes={themes.filter(x=>x.stories.some(s=>s.section===section)).slice(0,8)} onPick={l=>go(section,l)} {...ctx}/>
   )}
  </main>
  <footer className="gn-foot"><Mark/><p>GLITCH · {lang==='el'?'Ειδήσεις από':'News from'} BBC, Guardian, NYT, Fox, Independent, CBS, NPR, DW, Al Jazeera, SCMP, Times of Israel, Sky, UN, France 24, Euronews, CBC, Washington Post, WSJ, Economist & Google News · {lang==='el'?'Δείκτες':'Indicators'}: Yahoo Finance, World Bank WDI/WGI · {lang==='el'?'Αγορές προβλέψεων':'Prediction markets'}: Polymarket, Kalshi. {lang==='el'?'Η κατάταξη είναι αλγοριθμική — άνοιγε πάντα την πηγή.':'Ranking is algorithmic — always check the source.'}</p></footer>
  {open&&<Sheet story={open} all={stories} onClose={()=>setOpen(null)} onPick={l=>{setOpen(null);go(section,l)}} {...ctx}/>}
 </div>;
}

type Ctx={t:Copy;lang:Lang;title:(s:Story)=>string;sum:(s:Story)=>string;rtitle:(r:Signal)=>string;rsum:(r:Signal)=>string;setExtraPool:(s:Story[])=>void;withImg:(s:Story)=>string|undefined;openStory:(s:Story)=>void;prefs:Prefs;toggle:(k:keyof Prefs,v:string)=>void};

function Skeleton({t}:{t:Copy}){return <div className="skel"><div className="sk-hero"><span>{t.loading}</span></div><div className="sk-row">{[0,1,2,3,4].map(i=><div key={i}/>)}</div></div>}
function SectionHead({title,sub,onAll,allLabel}:{title:string;sub?:string;onAll?:()=>void;allLabel?:string}){return <div className="sec-head"><div><h2>{title}</h2>{sub&&<p>{sub}</p>}</div>{onAll&&<button className="link" onClick={onAll}>{allLabel}{I.chevR}</button>}</div>}
function Side({title,icon,extra,children}:{title:string;icon?:React.ReactNode;extra?:React.ReactNode;children:React.ReactNode}){return <div className="side"><div className="side-h"><h3>{icon}{title}</h3>{extra}</div>{children}</div>}

/* ───────────── hero carousel ───────────── */
function Hero({slides,t,lang,title,sum,withImg,openStory}:Ctx&{slides:Story[]}){
 const [i,setI]=useState(0);const [paused,setPaused]=useState(false);const touch=useRef<number|null>(null);
 const n=slides.length;
 useEffect(()=>{if(i>=n)setI(0)},[n,i]);
 useEffect(()=>{if(paused||n<2)return;const id=setTimeout(()=>setI(x=>(x+1)%n),7500);return()=>clearTimeout(id)},[i,paused,n]);
 if(!n)return null;
 const s=slides[Math.min(i,n-1)];const sm=sum(s);
 return <section className="hero" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}
  onTouchStart={e=>{touch.current=e.touches[0].clientX}} onTouchEnd={e=>{if(touch.current===null)return;const dx=e.changedTouches[0].clientX-touch.current;if(Math.abs(dx)>40)setI(x=>(x+(dx<0?1:-1)+n)%n);touch.current=null}}>
  <div className="hero-stage">
   {slides.map((x,k)=><div key={x.id} className={'hero-img'+(k===i?' on':'')}><Pic src={withImg(x)} alt="" story={x} eager={k<2}/></div>)}
   <div className="hero-shade"/>
   <div className="hero-copy" key={s.id}>
    <div className="hero-tags"><Kind story={s} t={t} lang={lang}/>{s.storylines.slice(0,2).map(l=><span key={l} className="tag">{lang==='el'?getStoryline(l)?.el:getStoryline(l)?.en}</span>)}</div>
    <h1 onClick={()=>openStory(s)}>{title(s)}</h1>
    {sm&&<p>{sm}</p>}
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
function Feature({story,t,lang,title,sum,withImg,openStory,prefs,toggle}:Ctx&{story:Story}){
 const sm=sum(story);
 return <article className="feature" onClick={()=>openStory(story)}>
  <div className="f-img"><Pic src={withImg(story)} alt="" story={story}/></div>
  <div className="f-body"><Kind story={story} t={t} lang={lang}/><h3>{title(story)}</h3>{sm&&<p>{sm}</p>}
   <div className="f-foot"><Meta story={story} lang={lang} t={t}/><LeanBar story={story}/></div>
   <SaveBtn id={story.id} prefs={prefs} toggle={toggle}/>
  </div>
 </article>;
}
function SaveBtn({id,prefs,toggle}:{id:string;prefs:Prefs;toggle:Ctx['toggle']}){const on=prefs.saved.includes(id);return <button className={'save'+(on?' on':'')} onClick={e=>{e.stopPropagation();toggle('saved',id)}} aria-label="save">{I.bm(on)}</button>}
function Card({story,t,lang,title,sum,withImg,openStory,prefs,toggle}:Ctx&{story:Story}){
 const read=prefs.read.includes(story.id);const img=withImg(story);
 if(!img){const sm=sum(story);return <article className={'card text k-bg-'+story.kind+(read?' read':'')} onClick={()=>openStory(story)}>
  <div className="c-body"><div className="c-top"><Kind story={story} t={t} lang={lang}/>{story.sources.length>2&&<span className="c-n">{story.sources.length} {t.sources}</span>}</div><h3>{title(story)}</h3>{sm&&<p>{sm}</p>}<div className="c-foot"><Meta story={story} lang={lang} t={t}/></div><LeanBar story={story} compact/></div>
  <SaveBtn id={story.id} prefs={prefs} toggle={toggle}/>
 </article>}
 return <article className={'card'+(read?' read':'')} onClick={()=>openStory(story)}>
  <div className="c-img"><Pic src={withImg(story)} alt="" story={story}/>{story.sources.length>2&&<span className="c-badge">{story.sources.length} {t.sources}</span>}</div>
  <div className="c-body"><Kind story={story} t={t} lang={lang}/><h3>{title(story)}</h3><div className="c-foot"><Meta story={story} lang={lang} t={t}/></div><LeanBar story={story} compact/></div>
  <SaveBtn id={story.id} prefs={prefs} toggle={toggle}/>
 </article>;
}
function Row({story,t,lang,title,sum,withImg,openStory,prefs,toggle}:Ctx&{story:Story}){
 const sm=sum(story);
 return <article className={'row'+(prefs.read.includes(story.id)?' read':'')} onClick={()=>openStory(story)}>
  <div className="r-body"><Kind story={story} t={t} lang={lang}/><h3>{title(story)}</h3>{sm&&<p>{sm}</p>}<div className="r-foot"><Meta story={story} lang={lang} t={t}/><LeanBar story={story} compact/></div></div>
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
  <Paged stories={rest.slice(9)} {...ctx}/>
 </div>;
}
function ListView({heading,stories,empty,...ctx}:Ctx&{heading:string;stories:Story[];empty?:string}){
 return <div className="view"><div className="view-head"><h1>{heading}</h1><span>{stories.length} {ctx.t.stories}</span></div>
  {stories.length?<Paged stories={stories} {...ctx}/>:<div className="empty">{empty||ctx.t.noResults}</div>}</div>;
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
  <Paged stories={[...stories].sort((a,b)=>Date.parse(b.lastAt)-Date.parse(a.lastAt))} timeline {...ctx}/>
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
  <Paged stories={stories.slice(12)} {...ctx}/>
 </div>;
}

/* ───────────── GLITCH analysis (highlights · simple · other view · what next) ───────────── */
type Explain={highlights:string[];simple:{headline:string;summary:string;bullets:string[];whyItMatters:string;greece:string};
 perspectives:{mainstream:string;alternative:string;missing:string;winnersLosers:string};
 outlook:{scenarios:{title:string;likelihood:'high'|'medium'|'low';text:string}[];watch:string[];markets:string};caveat:string};
const NONWEST=/^(al jazeera|trt|press ?tv|rt\b|cgtn|xinhua|global times|anadolu|tass|times of india|hindustan times|dawn|arab news|middle east eye|tehran times|the national|south china morning post|scmp|china daily)/i;
const GREEK_SRC=/^(ΕΡΤ|Ναυτεμπορική|Πρώτο Θέμα|Καθημερινή|in\.gr)/u;
type FrameKey='left'|'center'|'right'|'nonwest'|'greek';
function frames(story:Story){
 const out:{key:FrameKey;r:Signal}[]=[];
 const bucket=(r:Signal):FrameKey|null=>GREEK_SRC.test(r.source)?'greek':NONWEST.test(r.source)?'nonwest':(()=>{const l=leanOf(r.source);return l==='unrated'?null:l})();
 for(const r of story.reports){const k=bucket(r);if(k&&!out.some(x=>x.key===k))out.push({key:k,r})}
 return out;
}
const EX_CACHE=new Map<string,Explain|'off'>();
function Analysis({story,lang,plainTitle,plainSummary}:{story:Story;lang:Lang;plainTitle:string;plainSummary:string}){
 const el=lang==='el';
 const L={hl:el?'Τα σημαντικότερα':'Key points',simple:el?'Με απλά λόγια':'In plain words',other:el?'Η άλλη ματιά':'Another view',next:el?'Τι έρχεται':"What's next"};
 const [tab,setTab]=useState<keyof typeof L>('simple');
 const key=story.id+'|'+lang;
 const [st,setSt]=useState<'loading'|'ok'|'off'|'err'>(()=>{const c=EX_CACHE.get(key);return c==='off'?'off':c?'ok':'loading'});
 const [data,setData]=useState<Explain|null>(()=>{const c=EX_CACHE.get(key);return c&&c!=='off'?c:null});
 useEffect(()=>{
  const c=EX_CACHE.get(key);if(c){if(c==='off')setSt('off');else{setData(c);setSt('ok')}return}
  let live=true;setSt('loading');setData(null);
  fetch('/api/explain?id='+encodeURIComponent(story.id)+'&lang='+lang).then(async r=>{
   if(!live)return;
   if(r.status===503){EX_CACHE.set(key,'off');setSt('off');return}
   const d=await r.json() as {explain?:Explain};
   if(r.ok&&d.explain){EX_CACHE.set(key,d.explain);setData(d.explain);setSt('ok')}else setSt('err');
  }).catch(()=>{if(live)setSt('err')});
  return()=>{live=false};
 },[key,story.id,lang]);
 const fr=frames(story);
 const frameLabel:Record<FrameKey,string>=el?{left:'Κεντροαριστερά μέσα',center:'Κεντρώα μέσα',right:'Δεξιά μέσα',nonwest:'Μη δυτικά μέσα',greek:'Ελληνικά μέσα'}:{left:'Left-leaning',center:'Center',right:'Right-leaning',nonwest:'Non-Western',greek:'Greek media'};
 const excerpts=[story.headline,...story.reports].filter((r,i,a)=>r.summary&&!GOOGLE_PLACEHOLDER.test(r.summary)&&r.summary.length>50&&a.findIndex(x=>x.summary===r.summary)===i).slice(0,5);
 const like=(l:string)=>el?({high:'Πιθανό',medium:'Μέτρια πιθανό',low:'Λιγότερο πιθανό'} as Record<string,string>)[l]:({high:'Likely',medium:'Possible',low:'Less likely'} as Record<string,string>)[l];
 const Wait=()=><div className="ax-wait"><i/><i/><i/><span>{el?'Το GLITCH διαβάζει τις πηγές…':'GLITCH is reading the sources…'}</span></div>;
 const Off=()=><p className="ax-off">{st==='off'?(el?'Η ανάλυση AI δεν είναι ενεργή ακόμα σε αυτό το site.':'AI analysis is not enabled on this site yet.'):(el?'Η ανάλυση δεν είναι διαθέσιμη για αυτή την ιστορία αυτή τη στιγμή.':'Analysis is unavailable for this story right now.')}</p>;
 return <section className="ax">
  <div className="ax-head"><span className="ax-mark">✦</span><h2>{el?'Ανάλυση GLITCH':'GLITCH analysis'}</h2>{st==='ok'&&<em>AI</em>}</div>
  <div className="ax-tabs" role="tablist">{(Object.keys(L) as (keyof typeof L)[]).map(k=><button key={k} role="tab" aria-selected={tab===k} className={tab===k?'on':''} onClick={()=>setTab(k)}>{L[k]}</button>)}</div>
  <div className="ax-body">
   {tab==='hl'&&(st==='ok'&&data?<ul className="ax-hl">{data.highlights.map((h,i)=><li key={i}><b>{i+1}</b><span>{h}</span></li>)}</ul>:
    st==='loading'?<Wait/>:excerpts.length?<><ul className="ax-hl">{excerpts.map((r,i)=><li key={r.id}><b>{i+1}</b><span>{r.summary.slice(0,240)}<small> — {shortSource(r.source)}</small></span></li>)}</ul></>:<Off/>)}
   {tab==='simple'&&(st==='ok'&&data?<div className="ax-simple">
     <h3>{data.simple.headline}</h3><p className="ax-big">{data.simple.summary}</p>
     <ul className="ax-know">{data.simple.bullets.map((b,i)=><li key={i}>{b}</li>)}</ul>
     <div className="ax-callouts"><div><small>{el?'Γιατί σε αφορά':'Why it matters'}</small><p>{data.simple.whyItMatters}</p></div><div className="gr"><small>{el?'🇬🇷 Για την Ελλάδα':'🇬🇷 For Greece'}</small><p>{data.simple.greece}</p></div></div>
    </div>:st==='loading'?<Wait/>:<div className="ax-simple"><h3>{plainTitle}</h3><p className="ax-big">{plainSummary||(el?'Δεν υπάρχει αρκετό κείμενο πηγής για ασφαλή περίληψη.':'Not enough source text for a reliable summary.')}</p><p className="note">{el?'Προβάλλεται το διαθέσιμο απόσπασμα, όχι ολοκληρωμένη ανάλυση AI.':'Showing the available source excerpt, not a full AI analysis.'}</p></div>)}
   {tab==='other'&&<div className="ax-other">
     {st==='ok'&&data&&<div className="ax-vs"><div><small>{el?'Η κυρίαρχη αφήγηση':'The dominant framing'}</small><p>{data.perspectives.mainstream}</p></div><div className="alt"><small>{el?'Η άλλη ανάγνωση':'The other reading'}</small><p>{data.perspectives.alternative}</p></div></div>}
     {st==='ok'&&data&&<div className="ax-callouts"><div><small>{el?'Τι δεν λέγεται':'What is missing'}</small><p>{data.perspectives.missing}</p></div><div><small>{el?'Ποιος κερδίζει / χάνει':'Who wins / loses'}</small><p>{data.perspectives.winnersLosers}</p></div></div>}
     {st==='loading'&&<Wait/>}
     {fr.length>1&&<div className="ax-frames"><small className="ax-sub">{el?'Πώς το γράφει ο καθένας — πραγματικοί τίτλοι':'How each side headlines it — real titles'}</small>
      {fr.map(({key:k,r})=><a key={k} href={r.url} target="_blank" rel="noreferrer" className={'fr fr-'+k}><span>{frameLabel[k]} · {shortSource(r.source)}</span><strong>{cleanTitle(r)}</strong></a>)}</div>}
     {st!=='ok'&&st!=='loading'&&fr.length<=1&&<Off/>}
    </div>}
   {tab==='next'&&(st==='ok'&&data?<div className="ax-next">
     <ol className="ax-sc">{data.outlook.scenarios.map((sc,i)=><li key={i} className={'lk-'+sc.likelihood}><div className="sc-top"><strong>{sc.title}</strong><span className="lk"><i/><i/><i/>{like(sc.likelihood)}</span></div><p>{sc.text}</p></li>)}</ol>
     <div className="ax-callouts"><div><small>{el?'Τι να παρακολουθείς':'Signals to watch'}</small><ul>{data.outlook.watch.map((w,i)=><li key={i}>{w}</li>)}</ul></div><div><small>{el?'Αγορές & οικονομία':'Markets & economy'}</small><p>{data.outlook.markets}</p></div></div>
    </div>:st==='loading'?<Wait/>:<Off/>)}
  </div>
  {st==='ok'&&data?.caveat&&<p className="note">⚠ {data.caveat} {el?'Τα σενάρια είναι εκτιμήσεις AI, όχι βεβαιότητες.':'Scenarios are AI estimates, not certainties.'}</p>}
 </section>;
}

/* ───────────── story sheet ───────────── */
function Sheet({story,all,onClose,onPick,...ctx}:Ctx&{story:Story;all:Story[];onClose:()=>void;onPick:(l:string)=>void}){
 const {t,lang,title,sum,rtitle,rsum,withImg,prefs,toggle}=ctx;
 useEffect(()=>{const k=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};document.addEventListener('keydown',k);const o=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',k);document.body.style.overflow=o}},[onClose]);
 const sm=sum(story);const mix=leanMix(story.sources);const total=story.sources.length;
 const related=all.filter(s=>s.id!==story.id&&(s.storylines.some(l=>story.storylines.includes(l))||s.actorIds.some(a=>story.actorIds.includes(a)))).map(s=>({s,sc:s.storylines.filter(l=>story.storylines.includes(l)).length*2+s.actorIds.filter(a=>story.actorIds.includes(a)).length})).sort((a,b)=>b.sc-a.sc||Date.parse(b.s.lastAt)-Date.parse(a.s.lastAt)).slice(0,8).map(x=>x.s);
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
    {sm&&<p className="lede">{sm}</p>}
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
    <NarrativeDNA story={story} lang={lang}/>
    <PublisherBubbles story={story} lang={lang} rtitle={rtitle} rsum={rsum}/>
    <Analysis story={story} lang={lang} plainTitle={title(story)} plainSummary={sum(story)}/>
    <section className="cov">
     <h2>{t.coverage}</h2>
     <div className="lean big">{(['left','center','right','unrated'] as Lean[]).filter(k=>mix[k]>0).map(k=><i key={k} className={'l-'+k} style={{flexGrow:mix[k]}}/>)}</div>
     <div className="cov-legend"><span><i className="l-left"/>{t.left} {pct(mix.left)}%</span><span><i className="l-center"/>{t.center} {pct(mix.center)}%</span><span><i className="l-right"/>{t.right} {pct(mix.right)}%</span><span><i className="l-unrated"/>{t.unrated} {pct(mix.unrated)}%</span></div>
     {oneSided&&<p className="warn">⚠ {t.blind}</p>}
     <p className="note">{t.leanNote}</p>
    </section>
    <StorySequence story={story} lang={lang} rtitle={rtitle} rsum={rsum}/>
    {related.length>0&&<section className="related"><h2>{lang==='el'?'Παρεμφερή άρθρα & συνέχεια της ιστορίας':'Related stories & follow-ups'}</h2><div className="rows">{related.map(s=><Row key={s.id} story={s} {...ctx}/>)}</div></section>}
    {lang==='el'&&translated&&<p className="note">{t.translatedNote}</p>}
   </div>
  </article>
 </div>;
}
