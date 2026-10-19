import type {StoryCase} from './world-pulse';

export type EventClass='conflict'|'protest'|'election'|'economy'|'disaster'|'ai'|'other';
type SignalInfo={kind:EventClass;level:'top'|'major'|'watch';score:number;reasons:string[]};
const patterns:{kind:Exclude<EventClass,'other'>;rx:RegExp;weight:number}[]=[
 {kind:'conflict',rx:/\b(invasion|airstrike|airstrikes|bombardment|military offensive|missile attack|drone strike|ceasefire|civil war|war in |hostage release|peace agreement|peace talks|nuclear strike)\b|εισβολ|βομβαρδ|εκεχειρ|πόλεμ|πυραυλικ|ομήρ/iu,weight:31},
 {kind:'protest',rx:/\b(mass protests?|protesters?|demonstrations?|general strike|riots?|nationwide strike|mass march)\b|διαδηλώσ|συλλαλητ|γενικ[ήής] απεργ|διαμαρτυρ/iu,weight:23},
 {kind:'election',rx:/\b(election results?|general election|presidential election|snap election|referendum|resignation of|impeachment|coup d.etat)\b|εκλογ|δημοψήφισμ|παραίτησ|πραξικόπημ/iu,weight:27},
 {kind:'economy',rx:/\b(interest rate decision|rate (?:cut|hike)|recession|financial crisis|bank collapse|market crash|economic sanctions|tariffs? (?:imposed|announced)|oil supply shock|debt default|sovereign debt|trade war|opec cuts?)\b|ύφεσ|κραχ|χρεοκοπ|δασμ|οικονομικ[ήής] κρίσ|επιτόκ|κυρώσ/iu,weight:26},
 {kind:'disaster',rx:/\b(earthquake|tsunami|flooding|flash floods?|wildfire|major storm|hurricane|cyclone|eruption|disaster|evacuat(?:ion|ions|ed))\b|σεισμ|πλημμύρ|πυρκαγι|τυφών|εκκένωσ|καταστροφ/iu,weight:28},
 {kind:'ai',rx:/\b(openai|anthropic|nvidia|deepmind|gemini|chatgpt|new ai model|ai model release|semiconductor restrictions?|ai breakthrough|robotics?|humanoid robot|artificial intelligence|ai regulation|data centers?)\b|τεχνητ[ήής] νοημοσύν|ημιαγωγ|ρομποτικ/iu,weight:19}
];
const noise=/\b(opinion|column|editorial|podcast|reviews?|watch:|preview|live blog|roundup|explainer|weekly|what to know|what we know|five things|how to|top \d+|best \d+|celebrity|star signs|horoscope|streaming show|music video)\b|γνώμη|κριτική|τηλεοπτικ[ήής] σειρά|ζώδι/iu;
const eventTypeFromTopic=(t:string):EventClass=>{
 if(t==='conflict')return 'conflict';if(t==='protest')return 'protest';if(t==='disaster')return 'disaster';if(t==='economy'||t==='energy')return 'economy';if(t==='technology')return 'ai';return 'other';
};
/** Editorial PRIORITY heuristic based on published headline wording and limited RSS coverage.
    Does not claim to measure fatalities, destruction, national exposure or societal impact. */
export function majorEventSignal(c:StoryCase,now=Date.now()):SignalInfo{
 const text=c.headline.title;
 const matched=patterns.find(p=>p.rx.test(text));
 const kind=matched?.kind||eventTypeFromTopic(c.topic);
 const thematic=matched?.weight||({conflict:14,protest:12,disaster:12,economy:10,ai:8,election:9,other:0}[kind]);
 const sources=new Set(c.reports.map(r=>r.source.toLowerCase())).size;
 const published=Math.max(0,(now-Date.parse(c.lastAt))/3600000);
 const freshness=Math.max(0,1-published/72)*17;
 const breadth=Math.min(5,sources)*6;
 const depth=Math.min(9,c.reports.length)*1.5;
 const mentions=Math.min(4,c.actorIds.filter(id=>id.startsWith('c:')).length)*1.5;
 const noisePenalty=noise.test(text)?20:0;
 const score=Math.max(0,Math.min(100,Math.round(10+thematic+breadth+depth+mentions+freshness-noisePenalty)));
 const level:SignalInfo['level']=score>=67?'top':score>=46?'major':'watch';
 const reasons=[sources+' named publisher'+(sources===1?'':'s')];
 if(matched)reasons.push(matched.kind+' headline wording');
 if(published<12)reasons.push('published recently');
 return {kind,level,score,reasons};
}
const sector=(c:StoryCase)=>{
 const kind=majorEventSignal(c).kind;
 return kind==='conflict'||kind==='protest'||kind==='election'?'politics':kind==='economy'?'economy':kind==='ai'?'ai':kind==='disaster'?'disaster':'other';
};
export function rankMajorEvents(cases:StoryCase[],max=14,now=Date.now()):StoryCase[]{
 const sorted=[...cases].map(c=>({caseFile:c,signal:majorEventSignal(c,now)}))
  .sort((a,b)=>b.signal.score-a.signal.score||Date.parse(b.caseFile.lastAt)-Date.parse(a.caseFile.lastAt));
 const selected:StoryCase[]=[],counts=new Map<string,number>();
 for(const item of sorted){
  if(item.signal.score<38)continue;
  const key=sector(item.caseFile);
  if((counts.get(key)||0)>=3)continue;
  selected.push(item.caseFile);counts.set(key,(counts.get(key)||0)+1);
  if(selected.length>=max)return selected;
 }
 for(const x of sorted){
  if(selected.length>=max)break;
  if(!selected.some(s=>s.id===x.caseFile.id))selected.push(x.caseFile);
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
export function globeHotspots(cases:StoryCase[],max=18):GlobeHotspot[]{
 const pins:GlobeHotspot[]=[];
 for(const c of rankMajorEvents(cases,28)){
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
  const score=majorEventSignal(c).score;
  if(pins.some(p=>p.location.id===position.id&&p.kind===majorEventSignal(c).kind))continue;
  pins.push({key:c.id,location:position,story:c,score,kind:majorEventSignal(c).kind});
  if(pins.length>=max)break;
 }
 return pins;
}
