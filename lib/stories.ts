import type {Signal} from './types';
import {newsTopic} from './now-topics';
import {actorsMentioned,mentionedDomains} from './world-pulse';
import type {StoryCase} from './world-pulse';
import {majorEventSignal} from './major-events';
import type {EventClass} from './major-events';

/**
 * GLITCH v11 story model: groups publisher reports into "stories" (Ground News style),
 * attaches storylines (big world themes) and an editorial importance score.
 * Importance is a heuristic (wording, publisher breadth, recency) — not measured impact.
 */
export type Storyline={id:string;el:string;en:string;emoji:string;rx:RegExp};
export const storylines:Storyline[]=[
 {id:'mideast',el:'Μέση Ανατολή',en:'Middle East',emoji:'🕊️',rx:/\b(israel\w*|gaza|hamas|hezbollah|lebanon|west bank|iran\w*|tehran|houthis?|yemen|syria\w*|netanyahu|idf|strait of hormuz|hormuz)\b|ισραήλ|γάζα|χαμάς|ιράν|λίβαν|χεζμπολά|συρί|ορμούζ/iu},
 {id:'ukraine',el:'Ουκρανία – Ρωσία',en:'Ukraine – Russia',emoji:'⚔️',rx:/\b(ukrain\w*|kyiv|zelensky\w*|russia\w*|kremlin|putin|moscow)\b|ουκραν|ρωσ|πούτιν|ζελένσκ|κίεβο|κρεμλίν/iu},
 {id:'usa',el:'ΗΠΑ & Λευκός Οίκος',en:'US politics',emoji:'🇺🇸',rx:/\b(trump|white house|congress|senate|republicans?|democrats?|vance|pentagon|supreme court|washington)\b|τραμπ|λευκ[όο]ς οίκος|γερουσί|κογκρέσο/iu},
 {id:'space',el:'Διάστημα',en:'Space',emoji:'🚀',rx:/\b(nasa|spacex|esa|moon|lunar|mars|orbit\w*|telescope|astronaut\w*|asteroid|starship|artemis|phobos|spacecraft)\b|διάστημ|σελήν|αστροναύτ|διαστημόπλοι/iu},
 {id:'china',el:'Κίνα & Ασία',en:'China & Asia',emoji:'🐉',rx:/\b(china|chinese|beijing|xi jinping|taiwan\w*|hong kong|japan\w*|tokyo|korea\w*|pyongyang|india\w*|modi|pakistan\w*)\b|κίνα|κινέζ|ταϊβάν|ιαπωνί|κορέα|ινδί|πακιστ/iu},
 {id:'ai',el:'Τεχνητή νοημοσύνη',en:'Artificial intelligence',emoji:'🤖',rx:/\b(ai|a\.i\.|artificial intelligence|openai|anthropic|chatgpt|gemini|deepmind|llms?|nvidia|chips?|semiconductors?|data cent(?:er|re)s?|robot\w*)\b|τεχνητ[ήής] νοημοσύν|ημιαγωγ|ρομπότ/iu},
 {id:'bigtech',el:'Big Tech',en:'Big Tech',emoji:'💻',rx:/\b(apple|google|alphabet|microsoft|meta|facebook|instagram|amazon|tesla|musk|spacex|tiktok|samsung|tsmc|netflix)\b/iu},
 {id:'economy',el:'Παγκόσμια οικονομία',en:'Global economy',emoji:'📈',rx:/\b(tariffs?|inflation|interest rates?|central bank|federal reserve|the fed|ecb|recession|stocks?|markets?|shares|bonds?|gdp|trade war|imf|economy|earnings|wall street|dollar|euro)\b|δασμ|πληθωρισμ|επιτόκι|ύφεσ|χρηματιστήρ|μετοχ|οικονομ|ΑΕΠ/iu},
 {id:'energy',el:'Ενέργεια & πετρέλαιο',en:'Energy & oil',emoji:'🛢️',rx:/\b(oil|opec|crude|natural gas|lng|energy|brent|pipelines?|nuclear power|renewables?|solar|electricity)\b|πετρέλαι|φυσικ[όο] αέρι|ενέργει|ρεύμα|ηλεκτρικ/iu},
 {id:'climate',el:'Κλίμα & καταστροφές',en:'Climate & disasters',emoji:'🌪️',rx:/\b(climate|wildfires?|floods?|flooding|hurricanes?|typhoons?|cyclones?|earthquakes?|tsunami|heatwave|drought|emissions|cop3\d|storm|landslide|volcano|eruption)\b|κλιματ|πυρκαγι|πλημμύρ|σεισμ|καύσων|ξηρασί|κακοκαιρί|καταιγίδ/iu},
 {id:'europe',el:'Ευρώπη & ΕΕ',en:'Europe & EU',emoji:'🇪🇺',rx:/\b(european union|eu|brussels|european commission|von der leyen|macron|france|french|germany|german|merz|starmer|britain|british|uk|italy|meloni|spain|poland|nato|hungary|orban)\b|ευρωπ|ΕΕ|βρυξέλλ|γαλλί|γερμανί|βρετανί|ιταλί|ισπανί|ΝΑΤΟ/u},
 {id:'protests',el:'Διαδηλώσεις & αναταραχή',en:'Protests & unrest',emoji:'✊',rx:/\b(protests?|protesters?|demonstrat\w+|strikes?|riots?|unrest|uprising|coup)\b|διαδηλ|απεργ|συλλαλητ|επεισόδι|πραξικόπ/iu},
 {id:'greece',el:'Ελλάδα',en:'Greece',emoji:'🇬🇷',rx:/\b(greece|greek|athens|mitsotakis|thessaloniki|crete|aegean)\b|ελλάδ|ελλην|αθήν|μητσοτάκ|θεσσαλονίκ|κρήτ|αιγαί|κυβέρνησ|βουλ[ήη]|ΝΔ|ΠΑΣΟΚ|ΣΥΡΙΖΑ/u},
 {id:'africa',el:'Αφρική',en:'Africa',emoji:'🌍',rx:/\b(africa\w*|sudan\w*|congo\w*|ethiopia\w*|nigeria\w*|sahel|somalia|kenya|south africa|mali|niger|libya|egypt\w*|madagascar|cameroon)\b|αφρικ|σουδάν|κονγκό|αιθιοπ|νιγηρ|λιβύ|αίγυπτ/iu},
 {id:'latam',el:'Λατινική Αμερική',en:'Latin America',emoji:'🌎',rx:/\b(venezuela\w*|maduro|brazil\w*|lula|mexico|mexican|argentin\w*|milei|colombia\w*|cuba\w*|chile\w*|peru\w*|bolivia\w*|ecuador|haiti)\b|βενεζουέλ|βραζιλ|μεξικ|αργεντιν|κολομβ|κούβα/iu},
 {id:'health',el:'Υγεία',en:'Health',emoji:'🩺',rx:/\b(health|virus|outbreak|vaccines?|cancer|hospitals?|world health organization|pandemic|disease|measles|cholera|mpox|ebola|nhs)\b|υγεί|ιό[ςσ]|εμβόλι|καρκίν|νοσοκομ|πανδημ/iu}
];
const storylineById=Object.fromEntries(storylines.map(s=>[s.id,s]));
export const getStoryline=(id:string)=>storylineById[id] as Storyline|undefined;

export type Section='foryou'|'top'|'world'|'economy'|'tech'|'greece'|'science'|'climate'|'sports'|'latest'|'saved';

export type Story=StoryCase & {
 image?:string;kind:EventClass;importance:number;level:'top'|'major'|'watch';
 storylines:string[];greek:boolean;section:Exclude<Section,'foryou'|'top'|'latest'|'saved'>;
};

const GREEK_SOURCES=/^(ΕΡΤ|Ναυτεμπορική|Πρώτο Θέμα|Καθημερινή|in\.gr)/u;
const hasGreek=(s:string)=>/[Ͱ-Ͽἀ-῿]/.test(s);
const isGoogle=(s:Signal)=>s.url.includes('news.google.')||s.details?.some(d=>d.includes('Google News'));

/** Upgrade small publisher thumbnails to large renditions where the CDN supports it. */
export function bigImage(url?:string):string|undefined {
 if(!url)return undefined;
 try{
  const u=new URL(url);
  if(u.hostname.endsWith('bbci.co.uk'))return url.replace(/\/(?:ace\/)?(standard|branded_news|branded_sport)\/\d+\//,(_m,kind)=>`/ace/${kind}/976/`).replace(/\/news\/\d+\/cpsprodpb\//,'/news/976/cpsprodpb/');
  if(u.hostname==='i1.prth.gr')return url.replace(/\/w\d+\//,'/w1280/');
  return url;
 }catch{return url}
}

const STOP=new Set(('the a an and or for with from after before amid says said about against while this that those these are was were have has had been being its into over under than then they them their there here what when where which who whom why how will would could should can may might more most much many some such only also just like new news latest live update updates report reports official officials major thousands dozens hundreds today tomorrow yesterday week year years government countries country international world global people first last says amid video watch analysis opinion '+
 'στη στην στο στον στους στις από και για των την τον τους της του μια ένα ενός νέο νέα νέες τώρα σύμφωνα λέει έχουν λόγω είπε μετά πριν κατά προς είναι ήταν όπως αλλά όταν όλα όλοι').split(/\s+/));
function tokens(title:string):string[]{
 const words=(title.normalize('NFKD').replace(/[̀-ͯ]/g,'').toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu)||[])
  .filter(w=>w.length>=4&&!STOP.has(w)&&!/^\d+$/.test(w));
 // light stemming so "strikes"/"strike", "Iranian"/"Iran" collapse
 return [...new Set(words.map(w=>w.length>6?w.slice(0,6):w.replace(/(ies|es|s)$/,'')))];
}
type Group={reports:Signal[];keys:Set<string>;actors:Set<string>;t:number};
function similar(g:Group,keys:string[],actors:string[],t:number):boolean{
 if(Math.abs(g.t-t)>48*3600000)return false;
 const common=keys.filter(k=>g.keys.has(k)).length;
 if(common<2)return false;
 const jac=common/new Set([...g.keys,...keys]).size;
 const sharedActor=actors.length===0||g.actors.size===0||actors.some(a=>g.actors.has(a));
 if(!sharedActor)return false;
 return jac>=.22||common>=4;
}

function sectionFor(lead:Signal,lines:string[],greek:boolean):Story['section']{
 const c=lead.category;
 if(c==='sports')return 'sports';
 if(greek&&!lines.some(l=>['mideast','ukraine','usa','china','africa','latam'].includes(l)))return 'greece';
 if(c==='ai'||c==='tech')return 'tech';
 if(c==='science'||c==='space'||c==='health')return 'science';
 if(c==='climate'||c==='energy'||c==='nature'||c==='earth')return 'climate';
 if(c==='economy')return 'economy';
 return 'world';
}

const KIND_RX:[EventClass,RegExp][]=[
 ['protest',/\b(protests?|protesters?|demonstrat\w+|riots?|unrest|uprising|general strike|nationwide strike|on strike|strike action|walkouts?|mass rally)\b|διαδηλ|απεργ|συλλαλητ|επεισόδι/iu],
 ['disaster',/\b(earthquakes?|tsunami|floods?|flooding|hurricanes?|typhoons?|cyclones?|wildfires?|storms?|eruption|landslides?|evacuat\w+|heatwave|tornado\w*|crash kills|plane crash|derail\w*)\b|σεισμ|πλημμ|πυρκαγ|κακοκαιρ|καύσων|εκκέν/iu],
 ['conflict',/\b(wars?|attacks?|airstrikes?|air strikes?|drones?|missiles?|shelling|bomb\w*|troops|military|ceasefire|truce|invasion|hostages?|offensive|frontline|artillery|gunmen|militants?|killed|strikes? (?:on|targets|hit\w*))\b|πόλεμ|επίθεσ|βομβαρδ|πύραυλ|στρατ|εκεχειρ|νεκρ|μάχ/iu],
 ['election',/\b(elections?|vote|voters|referendum|coup|resign\w*|impeach\w*|parliament|prime minister|chancellor|president-elect|candidate|polls?|government collapse|no-confidence)\b|εκλογ|δημοψήφ|παραίτ|βουλ[ήη]|πρωθυπουργ|δημοσκόπ/iu],
 ['economy',/\b(tariffs?|inflation|interest rates?|rates|stocks?|markets?|oil prices?|economy|economic|gdp|recession|shares|earnings|banks?|trade|budget|debt|jobs|unemployment|prices|investors?|ipo|merger|deal)\b|δασμ|επιτόκ|οικονομ|χρηματιστ|μετοχ|πληθωρισμ|τράπεζ|προϋπολογ|ακρίβ/iu],
 ['ai',/\b(ai|artificial intelligence|openai|anthropic|chatgpt|nvidia|chips?|semiconductors?|robots?|software|tech|google|apple|microsoft|meta|amazon|tesla|cyber\w*|startup)\b|τεχνητ|ψηφιακ|κυβερνο/iu]
];
function kindOf(title:string,fallback:EventClass):EventClass{
 for(const [k,rx] of KIND_RX)if(rx.test(title))return k;
 return fallback;
}

const EXCLUDED_CONFIDENCE=new Set(['community','catalog']);
export function buildStories(signals:Signal[],now=Date.now()):Story[]{
 const eligible=signals.filter(s=>!EXCLUDED_CONFIDENCE.has(s.confidence)&&s.category!=='earth'&&s.category!=='nature'&&now-Date.parse(s.timestamp)<96*3600000)
  .sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp));
 const groups:Group[]=[];
 const seen=new Set<string>();
 for(const s of eligible){
  const norm=s.title.toLocaleLowerCase().replace(/\s+-\s+[^-]+$/,'').trim();
  if(seen.has(s.source+'|'+norm))continue;seen.add(s.source+'|'+norm);
  const keys=tokens(s.title.replace(/\s+-\s+[^-]{2,60}$/,''));
  const actors=actorsMentioned(s).map(a=>a.id);
  const t=Date.parse(s.timestamp);
  const g=groups.find(x=>similar(x,keys,actors,t));
  if(g){if(g.reports.length<30){g.reports.push(s);if(g.reports.length<=4)keys.forEach(k=>g.keys.add(k));actors.forEach(a=>g.actors.add(a));}}
  else groups.push({reports:[s],keys:new Set(keys),actors:new Set(actors),t});
 }
 return groups.map(g=>{
  const reports=g.reports;
  // Lead: prefer a report with an image and real excerpt from a direct publisher feed.
  const lead=[...reports].sort((a,b)=>rankLead(b)-rankLead(a))[0];
  const image=bigImage(lead.imageUrl||reports.find(r=>r.imageUrl)?.imageUrl);
  const times=reports.map(r=>Date.parse(r.timestamp));
  // Storylines from TITLES only: lead title, or at least two other report titles.
  const titles=reports.slice(0,12).map(r=>r.title.replace(/\s+-\s+[^-]{2,60}$/,''));
  const lines=storylines.map(l=>({id:l.id,lead:l.rx.test(lead.title),n:titles.filter(x=>l.rx.test(x)).length}))
   .filter(x=>x.lead||x.n>=2).sort((a,b)=>Number(b.lead)-Number(a.lead)||b.n-a.n).map(x=>x.id).slice(0,3);
  const greek=reports.some(r=>GREEK_SOURCES.test(r.source)||hasGreek(r.title));
  const sources=[...new Set(reports.map(r=>r.source))];
  const base:StoryCase={id:'s:'+lead.id,headline:lead,reports,sources,topic:newsTopic(lead),
   firstAt:new Date(Math.min(...times)).toISOString(),lastAt:new Date(Math.max(...times)).toISOString(),
   actorIds:[...g.actors],domains:[...new Set(reports.flatMap(mentionedDomains))]};
  const sig=majorEventSignal(base,now);
  const kind=kindOf(lead.title,sig.kind);
  // Breadth matters more than in v10: a story covered by many outlets is a big story.
  const breadth=Math.min(10,sources.length);
  let importance=sig.score+breadth*4+(image?3:0)+(lines.length?2:0)+(kind==='conflict'||kind==='disaster'||kind==='election'?6:0);
  if(lead.category==='sports'||lead.category==='culture')importance-=18;
  if(greek&&sources.length<2)importance-=6;
  importance=Math.max(0,Math.min(140,Math.round(importance)));
  return {...base,image,kind,importance,level:importance>=82?'top':importance>=58?'major':'watch',storylines:lines,greek,section:sectionFor(lead,lines,greek)} as Story;
 }).sort((a,b)=>b.importance-a.importance||Date.parse(b.lastAt)-Date.parse(a.lastAt));
}
function rankLead(s:Signal):number{
 return (s.imageUrl?10:0)+(isGoogle(s)?0:6)+(s.summary&&!s.summary.startsWith('Συγκεντρωτική')?3:0)+Date.parse(s.timestamp)/1e13;
}

/** Pick diverse top stories: no more than `perLine` from the same storyline. */
export function diverseTop(stories:Story[],max:number,opts:{needImage?:boolean;perLine?:number;exclude?:Set<string>}={}):Story[]{
 const out:Story[]=[];const count=new Map<string,number>();const per=opts.perLine??2;
 for(const s of stories){
  if(opts.exclude?.has(s.id))continue;
  if(opts.needImage&&!s.image)continue;
  const key=s.storylines[0]||s.section;
  if((count.get(key)||0)>=per)continue;
  out.push(s);count.set(key,(count.get(key)||0)+1);
  if(out.length>=max)break;
 }
 return out;
}

export type StorylineSummary={line:Storyline;stories:Story[];sources:number;image?:string;heat:number};
export function storylineSummaries(stories:Story[]):StorylineSummary[]{
 return storylines.map(line=>{
  const list=stories.filter(s=>s.storylines.includes(line.id));
  const sources=new Set(list.flatMap(s=>s.sources)).size;
  const heat=list.slice(0,12).reduce((a,s)=>a+s.importance,0)/10+sources*2;
  const image=list.find(s=>s.image)?.image;
  return {line,stories:list,sources,image,heat};
 }).filter(x=>x.stories.length>=2).sort((a,b)=>b.heat-a.heat);
}

export type Prefs={follow:string[];mute:string[];read:string[];saved:string[]};
export function forYou(stories:Story[],prefs:Prefs):Story[]{
 const follow=new Set(prefs.follow),mute=new Set(prefs.mute),read=new Set(prefs.read);
 return stories.filter(s=>!s.storylines.some(l=>mute.has(l))&&!mute.has('sec:'+s.section))
  .map(s=>{
   const hits=s.storylines.filter(l=>follow.has(l)).length+(follow.has('sec:'+s.section)?1:0);
   return {s,score:s.importance+hits*38-(read.has(s.id)?45:0)};
  }).sort((a,b)=>b.score-a.score).map(x=>x.s);
}

export type Lean='left'|'center'|'right'|'unrated';
const leanTable:[RegExp,Lean][]=[
 [/^(reuters|associated press|ap news|bbc|financial times|the hill|bloomberg|axios|the wall street journal|wsj|forbes|cnbc|un news|euronews|dw|deutsche welle)\b/i,'center'],
 [/^(the guardian|guardian|the new york times|new york times|nyt|cnn|nbc|abc news|cbs|msnbc|the washington post|washington post|politico|al jazeera|the independent|npr|vox|huffpost|time|the atlantic)\b/i,'left'],
 [/^(fox|the telegraph|telegraph|new york post|daily mail|the daily wire|washington examiner|breitbart|the times|gb news|national review|the spectator|newsmax)\b/i,'right']
];
/** Approximate AllSides-style lean of the publisher brand (US-centric, publisher level, not per article). */
export function leanOf(source:string):Lean{
 for(const [rx,l] of leanTable)if(rx.test(source.trim()))return l;
 return 'unrated';
}
export function leanMix(sources:string[]):Record<Lean,number>{
 const r:Record<Lean,number>={left:0,center:0,right:0,unrated:0};
 for(const s of sources)r[leanOf(s)]++;
 return r;
}
