import type {StoryCase} from './world-pulse';
import {publisherKey} from './publisher-key';

export type EventClass='conflict'|'protest'|'election'|'economy'|'disaster'|'ai'|'other';
export type ImpactLens='conflict'|'tension'|'energy'|'election'|'protest'|'economy'|'disaster'|'ai'|'health';
type SignalInfo={kind:EventClass;level:'top'|'major'|'watch';score:number;reasons:string[];eligible:boolean;lens:ImpactLens|null;publisherCount:number};
type Rule={kind:EventClass;lens:ImpactLens;rx:RegExp;weight:number;reason:string};
// These patterns are an editorial filter on actual publisher headlines, not proof of impact.
// A company's name or a feed category alone is deliberately insufficient.
const patterns:Rule[]=[
 {kind:'conflict',lens:'conflict',rx:/\b(invasions?|air\s?strikes?|bombardment|military offensive|missile (?:attacks?|strikes?)|drone (?:attacks?|strikes?)|ceasefires?|civil war|war|hostage release|peace agreements?|peace talks|nuclear strikes?|troop mobilization|armed clashes?|shelling)\b|εισβολ|βομβαρδ|εκεχειρ|πόλεμ|πυραυλικ|ομήρ/iu,weight:33,reason:'conflict or diplomacy in the headline'},
 {kind:'conflict',lens:'tension',rx:/\b(?:geopolitical|military|diplomatic|regional|border|nuclear) tensions?\b|\btensions? (?:rise|rises|rising|escalate|escalates|escalating|mount|mounts|mounting|flare|flares)\b|\b(?:border dispute|naval blockade|military escalation|nuclear threat|nuclear test|arms race)\b|γεωπολιτικ[ήής] έντασ|στρατιωτικ[ήής] έντασ/iu,weight:31,reason:'security or diplomatic tension in the headline'},
 {kind:'economy',lens:'energy',rx:/\b(?:opec|energy crisis|energy security|energy supply|oil supply|gas supply|fuel shortage|oil prices?|gas prices?|electricity prices?|power grid|power outages?|blackouts?|pipeline disruption|pipeline shutdown|refinery shutdown|nuclear power|lng exports?|oil embargo)\b|\b(?:oil|gas|energy|electricity|pipeline|power plant)\b.{0,55}\b(?:disruption|shortages?|supplies|supply|embargo|sanctions?|shut(?:s|down)?|clos(?:e|es|ed|ure)|outages?|blackout|prices?|production cuts?|export ban|attacks?)\b|ενεργειακ[ήής] κρίσ|εφοδιασμ[όού] ενέργει/iu,weight:32,reason:'energy supply, infrastructure or prices in the headline'},
 {kind:'election',lens:'election',rx:/\b(?:elections?|referendum|elected president|elected prime minister|government collapse|no.confidence vote|impeachment|coup d.etat|military coup)\b|εκλογ|δημοψήφισμ|πραξικόπημ/iu,weight:31,reason:'election or change of government in the headline'},
 {kind:'protest',lens:'protest',rx:/\b(?:mass protests?|protesters?|demonstrations?|general strike|riots?|nationwide strike|mass march|uprising)\b|διαδηλώσ|συλλαλητ|γενικ[ήής] απεργ|διαμαρτυρ/iu,weight:27,reason:'protest or social unrest in the headline'},
 {kind:'economy',lens:'economy',rx:/\b(?:interest rate decision|interest rates?|rate (?:cuts?|hikes?)|central bank|inflation|recession|financial crisis|bank collapse|market crash|economic sanctions|sanctions|tariffs?|debt default|sovereign debt|trade war|supply chain disruption|trade restrictions?)\b|ύφεσ|κραχ|χρεοκοπ|δασμ|οικονομικ[ήής] κρίσ|επιτόκ|κυρώσ/iu,weight:28,reason:'economic or trade policy in the headline'},
 {kind:'disaster',lens:'disaster',rx:/\b(?:earthquakes?|tsunami|flooding|flash floods?|wildfires?|major storm|hurricanes?|cyclones?|typhoons?|eruption|disaster|mass evacuations?|evacuation orders?|extreme heat|severe drought)\b|σεισμ|πλημμύρ|πυρκαγι|τυφών|εκκένωσ|καταστροφ/iu,weight:28,reason:'disaster or emergency in the headline'},
 {kind:'ai',lens:'ai',rx:/\b(?:new ai model|ai model release|semiconductor restrictions?|chip export restrictions?|ai breakthrough|ai regulation|ai law|major cyberattack|cyberattack on|artificial intelligence regulation|artificial intelligence breakthrough)\b|τεχνητ[ήής] νοημοσύν.*(?:νόμ|κανονισμ)|ημιαγωγ.*περιορισμ/iu,weight:23,reason:'major technology or regulation in the headline'},
 {kind:'other',lens:'health',rx:/\b(?:pandemic|public health emergency|disease outbreak|virus outbreak|epidemic|vaccine approval)\b|πανδημ|επιδημί/iu,weight:25,reason:'public health development in the headline'}
];
const noise=/^(?:opinion|column|editorial|podcast|review|analysis):|\b(?:reviews?|takeaways|celebrity|star signs|horoscope|streaming show|music video|sports scores|best \d+|top \d+)\b|\b(?:uefa|fifa|premier league|europa league)\b.{0,80}\b(?:match|game|tournament)\b|γνώμη|τηλεοπτικ[ήής] σειρά|ζώδι/iu;
const eventTypeFromTopic=(t:string):EventClass=>{
 if(t==='conflict')return 'conflict';if(t==='protest')return 'protest';if(t==='disaster')return 'disaster';if(t==='economy'||t==='energy')return 'economy';if(t==='technology')return 'ai';return 'other';
};
/** Headline-based editorial priority, not a verified measure of real-world impact. */
export function majorEventSignal(c:StoryCase,now=Date.now()):SignalInfo{
 const text=c.headline.title;
 const matched=patterns.find(p=>p.rx.test(text));
 const kind=matched?.kind||eventTypeFromTopic(c.topic);
 const sources=new Set(c.reports.map(r=>publisherKey(r.source)?.toLowerCase()).filter(Boolean)).size;
 const age=(now-Date.parse(c.lastAt))/3600000;
 const timely=Number.isFinite(age)&&age>=-1&&age<=96;
 const excluded=noise.test(text)||c.headline.category==='sports'||c.headline.category==='culture';
 const eligible=Boolean(matched)&&!excluded&&timely&&sources>0;
 const freshness=Number.isFinite(age)?Math.max(0,1-Math.max(0,age)/96)*14:0;
 const breadth=Math.min(4,sources)*3;
 const score=Math.max(0,Math.min(100,Math.round(12+(matched?.weight||0)+breadth+freshness-(excluded?25:0))));
 const level:SignalInfo['level']=score>=65?'top':score>=48?'major':'watch';
 const reasons=[...(matched?[matched.reason]:[]),sources+' named publisher'+(sources===1?'':'s')+' in the sample'];
 return {kind,level,score,reasons,eligible,lens:matched?.lens||null,publisherCount:sources};
}
export function rankMajorEvents<T extends StoryCase>(cases:T[],max=14,now=Date.now()):T[]{
 if(max<=0)return [];
 const sorted=[...cases].map(c=>({caseFile:c,signal:majorEventSignal(c,now)}))
  .filter(x=>x.signal.eligible)
  .sort((a,b)=>b.signal.score-a.signal.score||Date.parse(b.caseFile.lastAt)-Date.parse(a.caseFile.lastAt));
 const selected:T[]=[],counts=new Map<string,number>();
 const remaining=[...sorted];
 while(remaining.length&&selected.length<max){
  // Encourage a mix in the first six, without excluding other eligible events.
  let best=0,bestValue=-Infinity;
  for(let i=0;i<remaining.length;i++){
   const item=remaining[i],key=item.signal.lens||'other';
   const sameActors=selected.length<6&&selected.some(s=>s.actorIds.some(a=>a.startsWith('c:')&&item.caseFile.actorIds.includes(a))&&majorEventSignal(s,now).lens===item.signal.lens);
   const diversity=selected.length<6?((counts.get(key)||0)*6+(sameActors?3:0)):0;
   const value=item.signal.score-diversity;
   if(value>bestValue){best=i;bestValue=value}
  }
  const [item]=remaining.splice(best,1),key=item.signal.lens||'other';
  selected.push(item.caseFile);counts.set(key,(counts.get(key)||0)+1);
 }
 return selected;
}

export type CountryPosition={id:string;el:string;en:string;lat:number;lon:number};
// Approximate CENTROIDS for countries referenced in reporting, not asserted event sites.
export const countryPositions:Record<string,CountryPosition>=Object.fromEntries((
 [
 ['gr','Ελλάδα','Greece',39,22],['tr','Τουρκία','Türkiye',39,35],['us','ΗΠΑ','United States',39,-98],['uk','Ηνωμένο Βασίλειο','United Kingdom',54,-2],
 ['fr','Γαλλία','France',46,2],['de','Γερμανία','Germany',51,10],['it','Ιταλία','Italy',42.5,12.5],['ru','Ρωσία','Russia',61,95],
 ['ua','Ουκρανία','Ukraine',49,32],['il','Ισραήλ','Israel',31.5,35],['ps','Παλαιστινιακά εδάφη','Palestinian territories',31.6,35.2],
 ['ir','Ιράν','Iran',32,54],['lb','Λίβανος','Lebanon',33.9,35.8],['sy','Συρία','Syria',35,38],['cn','Κίνα','China',35,104],
 ['tw','Ταϊβάν','Taiwan',23.7,121],['in','Ινδία','India',22,79],['pk','Πακιστάν','Pakistan',30,69],
 ['jp','Ιαπωνία','Japan',36,138],['kr','Νότια Κορέα','South Korea',36,128],['kp','Βόρεια Κορέα','North Korea',40,127],
 ['sd','Σουδάν','Sudan',15,30],['al','Αλβανία','Albania',41,20],['rs','Σερβία','Serbia',44,21],['br','Βραζιλία','Brazil',-10,-52],
 ['sa','Σαουδική Αραβία','Saudi Arabia',24,45],['ae','ΗΑΕ','United Arab Emirates',24,54],['eg','Αίγυπτος','Egypt',27,30]
 ] as [string,string,string,number,number][]
).map(([id,el,en,lat,lon])=>['c:'+id,{id:'c:'+id,el,en,lat,lon}]));
export type GlobeHotspot={key:string;location:CountryPosition;story:StoryCase;score:number;kind:EventClass};
export function globeHotspots(cases:StoryCase[],max=18,now=Date.now()):GlobeHotspot[]{
 const pins:GlobeHotspot[]=[];
 for(const c of rankMajorEvents(cases,28,now)){
  // Actor mentions in TITLE only; mentioning a country does not locate an incident precisely.
  const matches=c.actorIds.filter(id=>!!countryPositions[id]);
  const title=c.headline.title.toLowerCase();
  const eligible=matches.map(id=>countryPositions[id]).filter(p=>
   title.includes(p.en.toLowerCase())||title.includes(p.el.toLowerCase())||
   // A city/leader alias may match in the source lexicon even if the country is not spelled out.
   matches.length===1
  );
  const position=eligible[0];
  if(!position)continue;
  const signal=majorEventSignal(c,now);
  if(pins.some(p=>p.location.id===position.id&&p.kind===signal.kind))continue;
  pins.push({key:c.id,location:position,story:c,score:signal.score,kind:signal.kind});
  if(pins.length>=max)break;
 }
 return pins;
}
