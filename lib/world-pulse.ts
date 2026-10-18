import type {Signal} from './types';
import {newsTopic} from './now-topics';
import type {NowTopic} from './now-topics';

/**
 * Transparent read-only world pulse derived from publisher headlines and RSS excerpts.
 * Actors and domains are TEXT MENTIONS, NOT evidence of alliances, responsibility,
 * direct business exposure, economic impact or independent corroboration.
 */
export type PulseActorType='country'|'company'|'institution';
export type PulseActor={id:string;name:string;type:PulseActorType;mentions:number;caseCount:number;storyIds:string[]};
export type PulseTrack={id:string;name:string;type:PulseActorType};
export type StoryCase={
 id:string;headline:Signal;reports:Signal[];sources:string[];
 topic:Exclude<NowTopic,'all'>;firstAt:string;lastAt:string;
 actorIds:string[];domains:string[];
};
type Lex={id:string;name:string;type:PulseActorType;pattern:RegExp};
const countries:Lex[]=[
 ['gr','Ελλάδα',/\b(greece|greek)\b|ελλάδ|ελληνικ/iu],['tr','Τουρκία',/\b(turkey|turkish|erdogan)\b|τουρκί|ερντογάν/iu],
 ['us','ΗΠΑ',/\b(usa|u\.s\.|united states|american|washington|white house)\b|ηνωμέν(?:ες|ων) πολιτεί|αμερικαν|λευκ[όό]ς οίκος/iu],
 ['uk','Ηνωμένο Βασίλειο',/\b(uk|britain|british|united kingdom|downing street)\b|βρετανί|βρετανικ/iu],
 ['fr','Γαλλία',/\b(france|french|macron)\b|γαλλί|μακρόν/iu],
 ['de','Γερμανία',/\b(germany|german|berlin)\b|γερμανί|βερολίνο/iu],
 ['it','Ιταλία',/\b(italy|italian|rome)\b|ιταλί/iu],
 ['ru','Ρωσία',/\b(russia|russian|moscow|putin|kremlin)\b|ρωσί|μόσχα|πούτιν|κρεμλίνο/iu],
 ['ua','Ουκρανία',/\b(ukraine|ukrainian|kyiv|zelensky)\b|ουκρανί|κίεβο|ζελένσκι/iu],
 ['il','Ισραήλ',/\b(israel|israeli|netanyahu)\b|ισραήλ|ισραηλιν|νετανιάχου/iu],
 ['ps','Παλαιστινιακά εδάφη',/\b(palestine|palestinian|gaza|west bank)\b|παλαιστιν|γάζα|δυτικ[ήής] όχθ/iu],
 ['ir','Ιράν',/\b(iran|iranian|tehran)\b|ιράν|τεχεράν/iu],
 ['lb','Λίβανος',/\b(lebanon|lebanese|beirut)\b|λίβαν|βηρυτό/iu],
 ['sy','Συρία',/\b(syria|syrian|damascus)\b|συρί|δαμασκ/iu],
 ['cn','Κίνα',/\b(china|chinese|beijing|xi jinping)\b|κίνα|κινεζ|πεκίνο/iu],
 ['tw','Ταϊβάν',/\b(taiwan|taiwanese|taipei)\b|ταϊβάν|ταϊπέι/iu],
 ['in','Ινδία',/\b(india|indian|new delhi|modi)\b|ινδί|μόντι/iu],
 ['pk','Πακιστάν',/\b(pakistan|pakistani|islamabad)\b|πακιστ/iu],
 ['jp','Ιαπωνία',/\b(japan|japanese|tokyo)\b|ιαπωνί|τόκιο/iu],
 ['kr','Νότια Κορέα',/\b(south korea|south korean|seoul)\b|νότια κορέα|σεούλ/iu],
 ['kp','Βόρεια Κορέα',/\b(north korea|north korean|pyongyang|kim jong)\b|βόρεια κορέα|πιονγιάνγκ/iu],
 ['sd','Σουδάν',/\b(sudan|sudanese|khartoum)\b|σουδάν|χαρτούμ/iu],
 ['al','Αλβανία',/\b(albania|albanian|tirana)\b|αλβανί|τίρανα/iu],
 ['rs','Σερβία',/\b(serbia|serbian|belgrade)\b|σερβί|βελιγράδι/iu],
 ['br','Βραζιλία',/\b(brazil|brazilian|brasilia)\b|βραζιλ/iu],
 ['sa','Σαουδική Αραβία',/\b(saudi arabia|saudi|riyadh)\b|σαουδικ/iu],
 ['ae','ΗΑΕ',/\b(uae|emirates|abu dhabi)\b|εμιράτ/iu],
 ['eg','Αίγυπτος',/\b(egypt|egyptian|cairo)\b|αίγυπτ|κάιρο/iu]
].map(([id,name,pattern])=>({id:'c:'+id,name:String(name),type:'country' as const,pattern:pattern as RegExp}));
const companies:Lex[]=[
 ['apple','Apple',/\bapple\b(?!\s+(?:pie|tree))/i],['microsoft','Microsoft',/\bmicrosoft\b/i],
 ['google','Google',/\bgoogle\b/i],['meta','Meta',/\bmeta\b(?=\s+(?:platforms|ai|announc|reports?|shares?|stock|employees?|ceo|revenue|profits?))|\bfacebook\b/i],
 ['amazon','Amazon',/\bamazon\b(?!\s+(?:river|forest|rainforest))/i],['nvidia','NVIDIA',/\bnvidia\b/i],
 ['openai','OpenAI',/\bopenai\b/i],['anthropic','Anthropic',/\banthropic\b/i],
 ['tesla','Tesla',/\btesla\b/i],['spacex','SpaceX',/\bspacex\b/i],
 ['samsung','Samsung',/\bsamsung\b/i],['tsmc','TSMC',/\btsmc\b/i],
 ['byd','BYD',/\bbyd\b/i],['toyota','Toyota',/\btoyota\b/i],
 ['shell','Shell',/\bshell\b(?=\s+(?:energy|oil|gas|shares?|stock|ceo|profits?|production|plc))/i],
 ['bp','BP',/\bbp\b(?=\s+(?:shares?|stock|oil|gas|energy|plc|profits?))/i],
 ['exxon','ExxonMobil',/\b(exxonmobil|exxon)\b/i],
 ['chevron','Chevron',/\bchevron\b/i],
 ['aramco','Saudi Aramco',/\baramco\b/i],
 ['blackrock','BlackRock',/\bblackrock\b/i],['jpm','JPMorgan Chase',/\b(jpmorgan|jp morgan)\b/i],
 ['goldman','Goldman Sachs',/\bgoldman sachs\b/i],['boeing','Boeing',/\bboeing\b/i],
 ['airbus','Airbus',/\bairbus\b/i],['maersk','Maersk',/\bmaersk\b/i],
 ['cma','CMA CGM',/\bcma cgm\b/i],['novo','Novo Nordisk',/\bnovo nordisk\b/i],
 ['pfizer','Pfizer',/\bpfizer\b/i],['eli','Eli Lilly',/\beli lilly\b/i]
].map(([id,name,pattern])=>({id:'m:'+id,name:String(name),type:'company' as const,pattern:pattern as RegExp}));
const institutions:Lex[]=[
 ['eu','Ευρωπαϊκή Ένωση',/\b(european union|eu commission|european commission|eu leaders|eu council)\b|ευρωπαϊκ[ήής] ένωση|ευρωπαϊκ[ήής] επιτροπ/iu],
 ['nato','ΝΑΤΟ',/\bnato\b|νατο/iu],['un','ΟΗΕ',/\b(united nations|un security council|un general assembly)\b|οηε|ηνωμέν[αων] έθνη/iu],
 ['imf','ΔΝΤ',/\b(imf|international monetary fund)\b|διεθν[έές] νομισματικ[όού] ταμεί/iu],
 ['ecb','ΕΚΤ',/\b(ecb|european central bank)\b|ευρωπαϊκ[ήής] κεντρικ[ήής] τράπεζ/iu],
 ['fed','Federal Reserve',/\b(federal reserve|fed chair|fed officials)\b/i],
 ['who','ΠΟΥ',/\b(world health organization|who director|who chief)\b|παγκόσμι[οου] οργανισμ[οού] υγεί/iu],
 ['opec','OPEC',/\bopec\b/i]
].map(([id,name,pattern])=>({id:'i:'+id,name:String(name),type:'institution' as const,pattern:pattern as RegExp}));
export const actorLexicon=[...countries,...companies,...institutions];
export function actorsMentioned(story:Pick<Signal,'title'|'summary'>):PulseTrack[]{
 // Prefer title, then source-supplied excerpt; count as a mention only.
 const content=story.title+' '+story.summary;
 return actorLexicon.filter(actor=>actor.pattern.test(content)).map(({id,name,type})=>({id,name,type}));
}
const domainTests:[string,RegExp][]=[
 ['Ενέργεια',/\b(oil|gas|fuel|energy|lng|crude|pipeline|electricity|grid)\b|πετρέλαι|ενέργει|καύσιμ|ηλεκτρ/iu],
 ['Εμπόριο',/\b(tariffs?|trade|exports?|imports?|customs)\b|δασμ|εμπόρι|εξαγωγ|εισαγωγ/iu],
 ['Μεταφορές',/\b(flights?|airport|shipping|container ships?|port closures?|railway|traffic)\b|πτήσ|αεροδρόμ|λιμάν|ναυτιλί|μεταφορ/iu],
 ['Αγορές',/\b(stocks?|bonds?|investors?|markets?|interest rates?|shares?|currency)\b|μετοχ|ομόλογ|χρηματιστη|επιτοκ|αγορ/iu],
 ['Ασφάλεια',/\b(airstrikes?|missiles?|attack|troops|warfare|fighting|shooting|hostages?)\b|επίθεσ|στρατιωτ|πυραυλ|όμηρ/iu],
 ['Ανθρωπιστικό',/\b(civilians?|refugees?|displaced|aid convoy|casualties|hospitals?)\b|πρόσφυγ|άμαχ|τραυματ|νοσοκομ|εκτοπισ/iu],
 ['Τεχνολογία',/\b(artificial intelligence|semiconductor|chips?|data center|robot|cyberattack)\b|τεχνητ[ήής] νοημοσύν|ημιαγωγ|κυβερνοεπίθεσ/iu]
];
export function mentionedDomains(story:Pick<Signal,'title'|'summary'>):string[]{
 const text=story.title+' '+story.summary;
 return domainTests.filter(([,rx])=>rx.test(text)).map(([name])=>name);
}
const stop=new Set(('the for with from after before amid says said about against while this that those these are was were have has news latest '+
'live report reports official officials major thousands dozens hundreds today tomorrow government countries international world global '+
'στη στην στους στους από και για των την τον τους μια ένα νέο νέα νέες τώρα σύμφωνα λέει έχουν λόγω είπε').split(/\s+/));
function keys(title:string):string[]{
 return [...new Set((title.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu)||[])
   .filter(v=>v.length>=4&&!stop.has(v)&&!(/^\d+$/.test(v))&&v.length<32))];
}
function likelySameCase(a:Signal,b:Signal):boolean{
 if(newsTopic(a)!==newsTopic(b)||Math.abs(Date.parse(a.timestamp)-Date.parse(b.timestamp))>50*3600000)return false;
 const ak=keys(a.title),bk=keys(b.title),common=ak.filter(w=>bk.includes(w));
 if(common.length<3)return false;
 const ratio=common.length/Math.max(1,new Set([...ak,...bk]).size);
 // Avoid grouping generic country/topic headlines sharing only common descriptors.
 const entitiesA=actorsMentioned(a).map(x=>x.id),entitiesB=actorsMentioned(b).map(x=>x.id);
 return ratio>=.36 && (entitiesA.length===0||entitiesB.length===0||entitiesA.some(x=>entitiesB.includes(x)));
}
export function buildWorldCases(signals:Signal[],hours=72,limit=100):StoryCase[]{
 const eligible=signals.filter(s=>withinNewsWindow(s,hours)&&s.confidence!=='community')
  .sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp)).slice(0,650);
 const groups:Signal[][]=[];
 for(const signal of eligible){
  const ix=groups.findIndex(g=>likelySameCase(g[0],signal));
  if(ix<0)groups.push([signal]);else if(groups[ix].length<18)groups[ix].push(signal);
 }
 const result=groups.map(reports=>{
  const newest=reports[0],s=reports.reduce((m,v)=>Date.parse(v.timestamp)<Date.parse(m.timestamp)?v:m,newest);
  const actors=[...new Set(reports.flatMap(v=>actorsMentioned(v).map(a=>a.id)))];
  const domains=[...new Set(reports.flatMap(mentionedDomains))];
  return {id:'case:'+newest.id,headline:newest,reports,
   sources:[...new Set(reports.map(v=>v.source))],
   topic:newsTopic(newest),firstAt:s.timestamp,lastAt:newest.timestamp,actorIds:actors,domains};
 }).sort((a,b)=>Date.parse(b.lastAt)-Date.parse(a.lastAt));
 return result.slice(0,limit);
}
export function buildActorRadar(cases:StoryCase[]):PulseActor[]{
 const byId=new Map<string,{actor:PulseTrack;caseIds:Set<string>;storyIds:Set<string>}>();
 for(const item of cases)for(const rep of item.reports)for(const actor of actorsMentioned(rep)){
  const old=byId.get(actor.id)||{actor,caseIds:new Set<string>(),storyIds:new Set<string>()};
  old.caseIds.add(item.id);old.storyIds.add(rep.id);byId.set(actor.id,old);
 }
 return [...byId.values()].map(({actor,caseIds,storyIds})=>({
  ...actor,mentions:storyIds.size,caseCount:caseIds.size,storyIds:[...storyIds]
 })).sort((a,b)=>b.caseCount-a.caseCount||b.mentions-a.mentions||a.name.localeCompare(b.name,'el'));
}
export function availableTrackedCases(cases:StoryCase[],tracks:string[]):StoryCase[]{
 return cases.filter(g=>g.actorIds.some(a=>tracks.includes(a)));
}
/** HEADLINE-ONLY opposing-party extraction. This is a mention of opposition, not a verified 'bloc'. */
export function opposingSides(story:Signal):[PulseTrack,PulseTrack]|null {
 const title=story.title;
 const separator=/\s+(?:vs\.?|versus|against)\s+|\s+εναντίον\s+|\s+κατά\s+της\s+/iu;
 const parts=title.split(separator);
 if(parts.length!==2)return null;
 const left=actorsMentioned({title:parts[0],summary:''}),right=actorsMentioned({title:parts[1],summary:''});
 const a=left[0],b=right[0];
 return a&&b&&a.id!==b.id?[a,b]:null;
}
