import type {StoryCase} from './world-pulse';
import type {Signal} from './types';

export type CoverageAxis='policy'|'finance'|'people'|'technology'|'conflict'|'other';
type Axis={key:CoverageAxis;el:string;en:string;pattern:RegExp};
const axes:Axis[]=[
 {key:'policy',el:'Θεσμοί & αποφάσεις',en:'Policy & decisions',pattern:/\b(government|president|congress|parliament|election|lawmakers?|minister|regulator|sanctions?|policy|legislation|court|vote|eu commission)\b|κυβέρνησ|βουλ|εκλογ|υπουργ|απόφασ|νομοσχέδ|δικαστ/iu},
 {key:'finance',el:'Αγορές & κόστος',en:'Markets & costs',pattern:/\b(inflation|shares?|stock|market|gdp|revenue|profits?|economy|investment|billion|million|earnings|price|tariff|business)\b|αγορ|κόστος|δασμ|πληθωρισμ|επένδυσ|τιμ[ήές]|κέρδ|έσοδ/iu},
 {key:'people',el:'Άνθρωποι & κοινωνία',en:'People & society',pattern:/\b(protests?|workers?|families|students?|voters?|civilians?|refugees?|patients?|residents?|community|schools?|public health)\b|διαδηλ|εργαζόμεν|πολίτ|άμαχ|πρόσφυγ|ασθεν|οικογένει/iu},
 {key:'technology',el:'Τεχνολογία',en:'Technology',pattern:/\b(artificial intelligence|ai model|openai|anthropic|nvidia|chips?|semiconductors?|robotics?|cyber|software|data center|satellite|tech industry)\b|τεχνητ[ήής] νοημοσύν|τεχνολογ|ρομποτικ|δορυφορ/iu},
 {key:'conflict',el:'Ασφάλεια & σύγκρουση',en:'Conflict & security',pattern:/\b(attack|warfare|troops?|military|missile|ceasefire|fighting|hostages?|security|invasion|drone strike|airstrike)\b|επίθεσ|πυραυλ|πολέμ|στρατιωτικ|εισβολ|εκεχειρ/iu}
];
export function coverageAxes(story:Pick<Signal,'title'>):CoverageAxis[]{
 const hits=axes.filter(a=>a.pattern.test(story.title)).map(a=>a.key);
 return hits.length?hits:['other'];
}
export function axisTitle(k:CoverageAxis,lang:'el'|'en'):string{
 const found=axes.find(a=>a.key===k);
 return found?found[lang]:lang==='el'?'Γενική αναφορά':'General report';
}
export type FrameShare={key:CoverageAxis;count:number;sources:string[]};
export function coverageFrames(c:StoryCase):FrameShare[]{
 const dedup=new Map<string,Signal>();
 for(const r of [...c.reports].sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp))){
  const key=r.source.toLowerCase();if(!dedup.has(key))dedup.set(key,r);
 }
 const groups=new Map<CoverageAxis,Set<string>>();
 for(const r of dedup.values())for(const key of coverageAxes(r)){
  const s=groups.get(key)||new Set<string>();s.add(r.source);groups.set(key,s);
 }
 return [...groups].map(([key,sources])=>({key,count:sources.size,sources:[...sources]})).sort((a,b)=>b.count-a.count);
}
export function sourceEdition(c:StoryCase):Signal[]{
 const groups=new Map<string,Signal>();
 for(const s of [...c.reports].sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp))){
  const id=s.source.toLowerCase();if(!groups.has(id))groups.set(id,s);
 }
 return [...groups.values()].sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp));
}
export function sourcesChronologically(c:StoryCase):Signal[]{
 return [...c.reports].sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp));
}
