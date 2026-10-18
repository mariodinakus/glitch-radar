'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Activity,ArrowLeft,ArrowRight,ArrowUpRight,BookOpen,Building2,CheckCircle2,ChevronRight,Clock3,ExternalLink,Globe2,Info,Landmark,Languages,Newspaper,Radio,RefreshCw,Search,ShieldAlert,Sparkles,TrendingUp,X} from 'lucide-react';
import type {Feed,Signal} from '@/lib/types';
import type {MarketQuote,VenueState} from '@/lib/markets';
import {buildWorldCases} from '@/lib/world-pulse';
import type {StoryCase} from '@/lib/world-pulse';
import {mediaProfile} from '@/lib/media-profiles';
import {GlitchMark} from '@/components/GlitchMark';

type Lang='el'|'en';
type Page='today'|'companies'|'markets'|'sources';
type Translation={title:string;summary:string;translated:boolean};
type Analysis={analysis:string;importance:string;next:string;uncertainty:string};
type MarketsData={updatedAt:string;quotes:MarketQuote[];venues:VenueState[]};
const copy={
 el:{
  today:'Σήμερα',companies:'Τεχνητή νοημοσύνη & εταιρείες',markets:'Αγορές προβλέψεων',sources:'Τα μέσα ενημέρωσης',
  intro:'Τα σημαντικά, με ουσία.',introText:'Όχι εκατοντάδες τίτλοι. Επιλεγμένα γεγονότα, τα στοιχεία που γνωρίζουμε, ποιοι τα καλύπτουν και τι αξίζει να εξετάσουμε.',
  todayTitle:'Η εικόνα του κόσμου',read:'Διάβασε την ανάλυση',all:'Όλα',world:'Διεθνή',economy:'Οικονομία',tech:'Τεχνολογία',science:'Επιστήμη',
  sourcesLabel:'Εκδότες',events:'Γεγονότα',time:'Τελευταίες 72 ώρες',more:'Περισσότερα γεγονότα',
  corpTitle:'Τεχνολογία και πολυεθνικές',corpDesc:'Ανακοινώσεις, επενδύσεις, προϊόντα και ανταγωνισμός. Όχι απλή κατάταξη εταιρικών ονομάτων.',
  marketTitle:'Τι προεξοφλούν οι αγορές;',marketDesc:'Τιμές συμβολαίων Kalshi και Polymarket για οικονομία, τεχνολογία και διεθνείς εξελίξεις. Όχι αθλητικά.',
  mediaTitle:'Ποιος βρίσκεται πίσω από τις ειδήσεις;',mediaDesc:'Ιδιοκτησία, χρηματοδότηση και πολιτική οπτική μόνο όπου υπάρχει τεκμηρίωση.',
  loading:'Φορτώνονται οι πηγές…',empty:'Δεν υπάρχουν επαρκείς σχετικές δημοσιεύσεις στο τρέχον δείγμα.',
  readSource:'Αρχική δημοσίευση',published:'Δημοσιεύτηκε',coverage:'Ποιοι καλύπτουν το θέμα',report:'Από τις πηγές',
  sourceCaveat:'Το ότι δύο μέσα δημοσιεύουν το ίδιο θέμα δεν αποτελεί ανεξάρτητη επιβεβαίωση.',
  analysis:'Η ανάλυση του GLITCH',analysisSoon:'Αυθεντικός σχολιασμός AI δεν έχει ενεργοποιηθεί ακόμα.',
  analysisExplanation:'Για πραγματική εξατομικευμένη ανάλυση κάθε γεγονότος, ο διακομιστής χρειάζεται ξεχωριστό κλειδί OpenAI API. Δεν θα παρουσιάσουμε γενικά κείμενα ως πρωτότυπη ανάλυση.',
  analysisLoading:'Γράφεται τεκμηριωμένη ανάλυση…',importance:'Γιατί έχει σημασία',next:'Τι παρακολουθούμε',unknown:'Τι δεν γνωρίζουμε',opinionDisclaimer:'Η ανάλυση συντάσσεται από AI με βάση τις διαθέσιμες περιλήψεις. Δεν υποκαθιστά πρωτότυπο ρεπορτάζ.',
  orientation:'Πολιτική οπτική',ownership:'Ιδιοκτησία / χρηματοδότηση',notRated:'Δεν υπάρχει τεκμηριωμένη αξιολόγηση',ownershipNote:'Η ιδιοκτησία ή η δημόσια χρηματοδότηση δεν αποδεικνύει φιλοκυβερνητική στάση.',
  crossBorder:'Οι ταξινομήσεις του AllSides χρησιμοποιούν κυρίως το πολιτικό πλαίσιο των ΗΠΑ και δεν μεταφέρονται αυτομάτως σε άλλες χώρες.',
  explore:'Δες τη μεθοδολογία',find:'Αναζήτηση ειδήσεων',companyCase:'Σχετική εξέλιξη',marketPrice:'Τιμή YES',volume:'Όγκος 24ώρου',
  marketCaveat:'Οι τιμές YES δεν είναι βαθμονομημένες πιθανότητες ούτε πρόβλεψη του GLITCH. Πρόκειται για διαθέσιμες τιμές συμβολαίων, χωρίς συναλλαγές από την εφαρμογή.',
  unknownMedia:'Ο εκδότης δεν έχει ακόμη επαληθευμένο προφίλ στη βάση μας.',translating:'Μεταφράζεται…',translationMiss:'Πρωτότυπος τίτλος — δεν ήταν διαθέσιμη μετάφραση.',
  tryAgain:'Ανανέωση',noSports:'Χωρίς αθλητικά',fromSource:'Από το δημοσίευμα',method:'Μεθοδολογία',close:'Κλείσιμο'
 },
 en:{
  today:'Today',companies:'AI & companies',markets:'Prediction markets',sources:'News publishers',
  intro:'The stories, with context.',introText:'Not hundreds of headlines. Selected events, what is known, who covered them and what is worth examining.',
  todayTitle:'The world at a glance',read:'Explore the analysis',all:'All',world:'World',economy:'Economy',tech:'Technology',science:'Science',
  sourcesLabel:'Publishers',events:'Events',time:'Past 72 hours',more:'More events',
  corpTitle:'Technology and multinational companies',corpDesc:'Announcements, investments, products and competition — beyond a list of company names.',
  marketTitle:'What are markets pricing?',marketDesc:'Kalshi and Polymarket contract prices on economics, technology and international affairs. No sports.',
  mediaTitle:'Who is behind the news?',mediaDesc:'Ownership, funding and political orientation only when supported by documented sources.',
  loading:'Loading source reports…',empty:'Not enough relevant published reports in the current sample.',
  readSource:'Original report',published:'Published',coverage:'Who covered this event',report:'Reported evidence',
  sourceCaveat:'Multiple publishers covering an event does not establish independent corroboration.',
  analysis:'GLITCH analysis',analysisSoon:'Original AI editorial commentary is not yet enabled.',
  analysisExplanation:'Genuine event-specific AI analysis needs an OpenAI API key configured on the server. We will not present reusable stock text as original commentary.',
  analysisLoading:'Writing a source-grounded analysis…',importance:'Why it matters',next:'What to watch next',unknown:'What remains unknown',opinionDisclaimer:'This AI analysis is based on available excerpts. It is not a substitute for original reporting.',
  orientation:'Political orientation',ownership:'Ownership / funding',notRated:'No documented rating available',ownershipNote:'Ownership or public funding alone does not establish support for a government.',
  crossBorder:'AllSides evaluations use primarily the U.S. ideological spectrum and cannot be projected automatically onto other countries.',
  explore:'Read methodology',find:'Search published events',companyCase:'Relevant event',marketPrice:'YES quote',volume:'24-hour volume',
  marketCaveat:'YES quotes are not calibrated probabilities or GLITCH predictions. They are market contract prices, and this application does not trade.',
  unknownMedia:'This publisher does not yet have a verified profile in our database.',translating:'Translating…',translationMiss:'Original headline — translation was unavailable.',
  tryAgain:'Refresh',noSports:'No sports',fromSource:'Source excerpt',method:'Methodology',close:'Close'
 }
};
const topicKeys=['all','world','economy','tech','science'] as const;
type Topic=typeof topicKeys[number];
const matches=(c:StoryCase,topic:Topic)=>{
 if(topic==='all')return true;
 if(topic==='world')return ['conflict','politics','protest','society','disaster'].includes(c.topic);
 if(topic==='economy')return ['economy','energy'].includes(c.topic);
 if(topic==='tech')return c.topic==='technology';
 return c.topic==='science';
};
const getTopicLabel=(topic:Topic,lang:Lang)=>{
 const vals={all:['Όλα','All'],world:['Διεθνή','World'],economy:['Οικονομία','Economy'],tech:['Τεχνολογία','Technology'],science:['Επιστήμη','Science']};
 return vals[topic][lang==='el'?0:1];
};
const readLocal=<T,>(k:string,initial:T):T=>{try{const value=localStorage.getItem(k);return value?JSON.parse(value) as T:initial}catch{return initial}};
const greek=(text:string)=>/[\u0370-\u03ff\u1f00-\u1fff]/u.test(text);
const abbrev=(text:string,n=150)=>text.length>n?text.slice(0,n).replace(/\s+\S*$/,'')+'…':text;
const when=(s:string,lang:Lang)=>new Date(s).toLocaleString(lang==='el'?'el-GR':'en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const rank=(c:StoryCase)=>c.headline.score+c.sources.length*7+Math.min(c.reports.length,6)*3+(c.headline.imageUrl?5:0);
const curate=(cases:StoryCase[]):StoryCase[]=>{
 const sorted=[...cases].sort((a,b)=>rank(b)-rank(a)||Date.parse(b.lastAt)-Date.parse(a.lastAt));
 const result:StoryCase[]=[],count:Record<string,number>={};
 for(const c of sorted){
  const bucket=['economy','energy'].includes(c.topic)?'economy':c.topic==='technology'?'technology':c.topic==='science'?'science':'world';
  if((count[bucket]||0)>=6)continue;
  count[bucket]=(count[bucket]||0)+1;result.push(c);
 }
 return result;
};
const uniqueSources=(c:StoryCase)=>[...new Map(c.reports.map(r=>[r.source.toLocaleLowerCase(),r])).values()];
const companyStory=(c:StoryCase)=>c.actorIds.some(a=>a.startsWith('m:'))||c.topic==='technology';
export default function EditorialDesk(){
 const [lang,setLang]=useState<Lang>('el');
 const [page,setPage]=useState<Page>('today');
 const [topic,setTopic]=useState<Topic>('all');
 const [query,setQuery]=useState('');
 const [feed,setFeed]=useState<Feed|null>(null);
 const [error,setError]=useState('');
 const [loading,setLoading]=useState(true);
 const [selected,setSelected]=useState<StoryCase|null>(null);
 const [translations,setTranslations]=useState<Record<string,Translation>>({});
 const [ready,setReady]=useState(false);
 const [cycle,setCycle]=useState(0);
 const [more,setMore]=useState(false);
 const [aiEnabled,setAiEnabled]=useState(false);
 const [analysis,setAnalysis]=useState<Analysis|null>(null);
 const [analysisBusy,setAnalysisBusy]=useState(false);
 const [analysisError,setAnalysisError]=useState('');
 const [markets,setMarkets]=useState<MarketsData|null>(null);
 const [marketError,setMarketError]=useState('');
 const [marketBusy,setMarketBusy]=useState(false);
 const translating=useRef(false);
 const t=copy[lang];
 useEffect(()=>{setLang(readLocal('glitch-language','el'));setTranslations(readLocal('glitch-editor-translations',{}));setReady(true)},[]);
 useEffect(()=>{if(ready){localStorage.setItem('glitch-language',JSON.stringify(lang));document.documentElement.lang=lang}},[lang,ready]);
 useEffect(()=>{if(ready)localStorage.setItem('glitch-editor-translations',JSON.stringify(Object.fromEntries(Object.entries(translations).slice(-160))))},[translations,ready]);
 const load=useCallback(async()=>{setLoading(true);setError('');try{const r=await fetch('/api/feed',{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);setFeed(await r.json() as Feed)}catch(e){setError(e instanceof Error?e.message:'Feed unavailable')}finally{setLoading(false)}},[]);
 useEffect(()=>{void load();fetch('/api/editorial').then(r=>r.json()).then(x=>setAiEnabled(x.available===true)).catch(()=>{});const id=setInterval(()=>{if(document.visibilityState==='visible')void load()},240000);return()=>clearInterval(id)},[load]);
 useEffect(()=>{if(page!=='markets'&&page!=='companies'&&page!=='today')return;if(markets||marketBusy||marketError)return;setMarketBusy(true);fetch('/api/market-intelligence').then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(x=>setMarkets(x as MarketsData)).catch(e=>setMarketError(e instanceof Error?e.message:'Unavailable')).finally(()=>setMarketBusy(false))},[page,markets,marketBusy,marketError]);
 const cases=useMemo(()=>curate(buildWorldCases((feed?.signals||[]).filter(s=>s.confidence==='publisher'&&!['sports','culture'].includes(s.category)),72,150)),[feed]);
 const allVisible=useMemo(()=>page==='companies'?cases.filter(companyStory):cases.filter(c=>matches(c,topic)),[cases,page,topic]);
 const filtered=useMemo(()=>allVisible.filter(c=>!query||c.reports.some(r=>(r.title+' '+r.source).toLocaleLowerCase().includes(query.toLocaleLowerCase()))),[allVisible,query]);
 const shown=more?filtered.slice(0,24):filtered.slice(0,8);
 const lookup=useMemo(()=>{
  const stories=[...shown.map(c=>c.headline),...(selected?.reports||[]).slice(0,6)];
  const contracts=(page==='markets'?(markets?.quotes||[]).slice(0,14):[]).map(q=>({id:'market:'+q.id,title:q.question,summary:''}));
  return [...new Map([...stories,...contracts].map(r=>[r.id,r])).values()];
 },[shown,selected,markets,page]);
 useEffect(()=>{
  if(!ready||translating.current)return;
  const batch=lookup.filter(s=>!translations[lang+':'+s.id]&&(lang==='el'?!greek(s.title):greek(s.title))).slice(0,4);
  if(!batch.length)return;
  translating.current=true;
  void fetch('/api/translate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({target:lang,items:batch.map(r=>({id:r.id,title:r.title,summary:r.summary.slice(0,340)}))})})
  .then(r=>r.ok?r.json():Promise.reject()).then(data=>{setTranslations(old=>({...old,...Object.fromEntries((data.items||[]).map((v:Translation&{id:string})=>[lang+':'+v.id,v]))}))})
  .catch(()=>setTranslations(old=>({...old,...Object.fromEntries(batch.map(r=>[lang+':'+r.id,{title:r.title,summary:r.summary,translated:false}]))})))
  .finally(()=>{translating.current=false;setCycle(n=>n+1)});
 },[ready,lookup,lang,translations,cycle]);
 const titleFor=(s:Signal)=>{
  const mismatch=lang==='el'?!greek(s.title):greek(s.title);
  const tr=translations[lang+':'+s.id];
  if(tr?.translated)return tr.title;
  return mismatch&&!tr?t.translating:s.title;
 };
 const sourceText=(s:Signal)=>{
  const tr=translations[lang+':'+s.id];
  if(tr?.translated&&tr.summary)return tr.summary;
  if(lang==='el'&&!greek(s.summary))return 'Η πρωτότυπη περίληψη είναι στα αγγλικά. Χρησιμοποίησε τον σύνδεσμο του εκδότη όταν η μετάφραση δεν είναι διαθέσιμη.';
  if(lang==='en'&&greek(s.summary))return 'The source excerpt is in Greek. Open the original article if translation is unavailable.';
  return s.summary;
 };
 const marketTitle=(q:MarketQuote)=>{
  const tr=translations[lang+':market:'+q.id];
  if(tr?.translated)return tr.title;
  return lang==='el'?tr?.title||t.translating:q.question;
 };
 const open=(c:StoryCase)=>{setSelected(c);setAnalysis(null);setAnalysisError('');setAnalysisBusy(false)};
 useEffect(()=>{
  if(!selected||!aiEnabled)return;
  let active=true;setAnalysisBusy(true);setAnalysis(null);
  void fetch('/api/editorial',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({caseId:selected.id,lang})})
    .then(async r=>{const data=await r.json();if(!r.ok)throw Error(data.error||'Unavailable');return data})
    .then(data=>{if(active)setAnalysis(data.editorial as Analysis)})
    .catch(e=>{if(active)setAnalysisError(e instanceof Error?e.message:'Unavailable')})
    .finally(()=>{if(active)setAnalysisBusy(false)});
  return()=>{active=false};
 },[selected?.id,lang,aiEnabled]);
 const knownMedia=useMemo(()=>[...new Map((feed?.signals||[]).filter(r=>r.confidence==='publisher').map(r=>[r.source.toLocaleLowerCase(),r.source])).values()].sort((a,b)=>Number(!!mediaProfile(b))-Number(!!mediaProfile(a))||a.localeCompare(b)),[feed]);
 const tabs:{id:Page;label:string;icon:typeof Globe2}[]=[
  {id:'today',label:t.today,icon:Newspaper},{id:'companies',label:t.companies,icon:Building2},{id:'markets',label:t.markets,icon:TrendingUp},{id:'sources',label:t.sources,icon:BookOpen}
 ];
 const newsCard=(c:StoryCase,featured=false)=><article className={'ed-card'+(featured?' ed-featured':'')} key={c.id}>
  {c.headline.imageUrl&&<img src={c.headline.imageUrl} alt="" loading="lazy" onError={e=>{e.currentTarget.style.display='none'}}/>}
  <div className="ed-card-content"><div className="ed-card-meta"><span>{getTopicLabel(c.topic==='technology'?'tech':c.topic==='economy'?'economy':c.topic==='science'?'science':'world',lang)}</span><small>{when(c.lastAt,lang)}</small></div>
   <button className="ed-card-title" onClick={()=>open(c)}>{titleFor(c.headline)}<ArrowUpRight size={17}/></button>
   {translations[lang+':'+c.headline.id]?.translated===false&&(lang==='el'?!greek(c.headline.title):greek(c.headline.title))&&<small className="ed-translation-warning">{t.translationMiss}</small>}
   <p>{abbrev(sourceText(c.headline),175)}</p>
   <div className="ed-card-publishers"><span>{t.coverage}:</span>{uniqueSources(c).slice(0,3).map(r=><strong key={r.source}>{r.source}</strong>)}</div>
   <button className="ed-card-link" onClick={()=>open(c)}>{t.read} <ChevronRight size={15}/></button>
  </div>
 </article>;
 const Top=()=> <div className="ed-features">
  <header className="ed-section-title"><div><span>{t.time}</span><h2>{t.todayTitle}</h2></div><strong>{cases.length} {t.events.toLowerCase()}</strong></header>
  {cases.length>0&&<div className="ed-carousel">{cases.slice(0,5).map((c,i)=><button key={c.id} className="ed-carousel-slide" onClick={()=>open(c)}>{c.headline.imageUrl&&<img src={c.headline.imageUrl} alt="" loading="lazy" onError={e=>{e.currentTarget.style.display='none'}}/>}<div><small>{String(i+1).padStart(2,'0')} / 05 · {uniqueSources(c).length} {t.sourcesLabel.toLowerCase()}</small><h3>{titleFor(c.headline)}</h3><span>{uniqueSources(c).slice(0,2).map(x=>x.source).join(' · ')}</span></div></button>)}</div>}
 </div>;
 const storyPane=()=><div className="ed-story-content">
  <div className="ed-controls"><div className="ed-filter-row">{(page==='today'?topicKeys:['all'] as const).map(k=><button key={k} className={topic===k?'active':''} onClick={()=>{setTopic(k);setMore(false)}}>{getTopicLabel(k,lang)}</button>)}</div><label className="ed-search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.find}/></label></div>
  {shown.length?<div className="ed-news-grid">{shown.map((c,i)=>newsCard(c,i===0))}</div>:<p className="ed-empty">{t.empty}</p>}
  {!more&&filtered.length>shown.length&&<button className="ed-more" onClick={()=>setMore(true)}>{t.more}<ArrowRight size={15}/></button>}
 </div>;
 const marketsPane=()=> <section className="ed-pane"><header className="ed-section-title"><div><span>Kalshi · Polymarket</span><h2>{t.marketTitle}</h2><p>{t.marketDesc}</p></div><span className="ed-smallpill">{t.noSports}</span></header>{marketError&&<p className="ed-empty">{marketError}</p>}{marketBusy&&!markets&&<p className="ed-empty">{t.loading}</p>}<div className="ed-markets">
  {(markets?.quotes||[]).slice(0,16).map(q=><a key={q.id} className="ed-market" href={q.sourceUrl} target="_blank" rel="noopener noreferrer"><div><small>{q.venue.toUpperCase()} · {t.volume}: {q.volume24h===null?'—':new Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(q.volume24h)}</small><strong>{marketTitle(q)}</strong></div><span>{(q.probability*100).toFixed(1)}%<small>{t.marketPrice}</small></span><ExternalLink size={15}/></a>)}
 </div>{markets&&markets.quotes.length===0&&<p className="ed-empty">{t.empty}</p>}<p className="ed-footnote">{t.marketCaveat}</p></section>;
 const sourceRow=(name:string,articleUrl?:string)=>{
  const meta=mediaProfile(name);
  return <div className="ed-source-row" key={name}><div className="ed-source-logo">{name.slice(0,2).toUpperCase()}</div><div><strong>{name}</strong><p>{meta?(lang==='el'?meta.ownerEl:meta.ownerEn):t.unknownMedia}</p>
   <small>{meta?.biasSource?(lang==='el'?meta.biasEl:meta.biasEn):t.notRated}</small>{meta&&<p className="ed-source-note">{lang==='el'?meta.notesEl:meta.notesEn}</p>}</div>
   <div className="ed-source-links">{meta&&<a href={meta.ownershipSource} target="_blank" rel="noopener noreferrer" title={t.ownership}><Landmark size={16}/></a>}{meta?.biasSource&&<a href={meta.biasSource} target="_blank" rel="noopener noreferrer" title={t.orientation}><Info size={16}/></a>}{articleUrl&&<a href={articleUrl} target="_blank" rel="noopener noreferrer" title={t.readSource}><ExternalLink size={16}/></a>}</div></div>;
 };
 const modal=selected&&<div className="ed-modal-back" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><section className="ed-modal" role="dialog" aria-modal="true" aria-label={titleFor(selected.headline)}>
  <header><span><GlitchMark size={27}/> {t.read}</span><button onClick={()=>setSelected(null)} aria-label={t.close}><X size={20}/></button></header>
  <div className="ed-modal-body"><span className="ed-eyebrow">{t.published} · {when(selected.lastAt,lang)}</span><h2>{titleFor(selected.headline)}</h2>
   <section className="ed-evidence"><div className="ed-block-heading"><CheckCircle2 size={17}/><h3>{t.report}</h3></div><p>{sourceText(selected.headline)}</p><a href={selected.headline.url} target="_blank" rel="noopener noreferrer">{t.readSource}<ExternalLink size={14}/></a></section>
   <section className="ed-coverage"><div className="ed-block-heading"><BookOpen size={17}/><h3>{t.coverage} · {uniqueSources(selected).length}</h3></div><p className="ed-disclaimer">{t.sourceCaveat}</p>{uniqueSources(selected).map(r=>sourceRow(r.source,r.url))}</section>
   <section className="ed-analysis"><div className="ed-block-heading"><Sparkles size={18}/><h3>{t.analysis}</h3></div>
    {analysisBusy&&<p className="ed-ai-status"><Activity size={16}/>{t.analysisLoading}</p>}
    {analysis&&<div className="ed-analysis-text"><p>{analysis.analysis}</p><h4>{t.importance}</h4><p>{analysis.importance}</p><h4>{t.next}</h4><p>{analysis.next}</p><h4>{t.unknown}</h4><p>{analysis.uncertainty}</p><small>{t.opinionDisclaimer}</small></div>}
    {(!aiEnabled||!!analysisError)&&<div className="ed-analysis-unavailable"><strong>{t.analysisSoon}</strong><p>{t.analysisExplanation}</p>{analysisError&&<small>{analysisError}</small>}</div>}
   </section>
   <p className="ed-footnote">{t.sourceCaveat} {t.ownershipNote}</p>
  </div>
 </section></div>;
 return <div className="ed-shell">
  <header className="ed-header"><button onClick={()=>{setPage('today');setSelected(null)}} className="ed-logo"><GlitchMark size={40}/><span>GLITCH<small>{lang==='el'?'ΚΟΣΜΟΣ & ΑΝΑΛΥΣΗ':'WORLD & ANALYSIS'}</small></span></button>
   <div className="ed-lang" role="group" aria-label={lang==='el'?'Γλώσσα':'Language'}><button className={lang==='el'?'active':''} onClick={()=>setLang('el')}>Ελληνικά</button><button className={lang==='en'?'active':''} onClick={()=>setLang('en')}>English</button></div>
  </header>
  <div className="ed-frame"><nav className="ed-navigation">{tabs.map(x=>{const Icon=x.icon;return <button key={x.id} className={page===x.id?'active':''} onClick={()=>{setPage(x.id);setQuery('');setTopic('all');setMore(false);setSelected(null)}}><Icon size={17}/>{x.label}</button>})}</nav>
  <main><section className="ed-hero"><div className="ed-eyebrow"><span className="ed-live"/> {t.time}</div><h1>{t.intro}</h1><p>{t.introText}</p><div className="ed-mini-stats"><span>{cases.length} {t.events.toLowerCase()}</span><span>{feed?.sources?.filter(s=>s.ok).length||0} {t.sourcesLabel.toLowerCase()}</span><button onClick={()=>void load()}><RefreshCw size={14}/>{t.tryAgain}</button></div></section>
   {error&&<div className="ed-empty">{error}</div>}{loading&&!feed&&<p className="ed-empty">{t.loading}</p>}
   {page==='today'&&<>{cases.length>0&&Top()}{storyPane()}</>}
   {page==='companies'&&<section className="ed-pane"><header className="ed-section-title"><div><span>{t.companies}</span><h2>{t.corpTitle}</h2><p>{t.corpDesc}</p></div></header>{storyPane()}</section>}
   {page==='markets'&&marketsPane()}
   {page==='sources'&&<section className="ed-pane"><header className="ed-section-title"><div><span>{t.sourcesLabel}</span><h2>{t.mediaTitle}</h2><p>{t.mediaDesc}</p></div></header><div className="ed-media-list">{knownMedia.slice(0,35).map(name=>sourceRow(name))}</div><p className="ed-footnote">{t.ownershipNote} {t.crossBorder}</p></section>}
   <footer className="ed-footer"><GlitchMark size={24}/> GLITCH <span>{t.sourceCaveat}</span></footer>
  </main></div>{modal}
 </div>;
}
