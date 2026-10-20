import type {Story} from './stories';

/** Active wars / armed conflicts tracked by the GLITCH war room. Matching is on headlines only. */
export type Conflict={id:string;el:string;en:string;rx:RegExp;indicators:string[];market:RegExp;descEl:string;descEn:string};
export const conflicts:Conflict[]=[
 {id:'iran',el:'Πόλεμος με το Ιράν',en:'Iran war',rx:/\b(iran\w*|tehran|hormuz|irgc|khamenei|pezeshkian|isfahan|natanz|fordow)\b|ιράν|τεχεράν|ορμούζ|χαμενεΐ/iu,
  indicators:['BZ=F','CL=F','GC=F','^GSPC'],market:/iran|hormuz|khamenei|tehran/i,descEl:'Σύγκρουση με επίκεντρο το Ιράν, τον Περσικό Κόλπο και τα Στενά του Ορμούζ.',descEn:'Conflict centred on Iran, the Gulf and the Strait of Hormuz.'},
 {id:'gaza',el:'Ισραήλ – Γάζα – Λίβανος',en:'Israel – Gaza – Lebanon',rx:/\b(gaza\w*|hamas|hezbollah|lebanon\w*|beirut|west bank|idf|netanyahu|rafah|houthis?)\b|γάζα|χαμάς|χεζμπολάχ|λίβαν|δυτική όχθη|νετανιάχου/iu,
  indicators:['BZ=F','GC=F','^TA125.TA'],market:/gaza|hamas|israel|netanyahu|hezbollah|lebanon/i,descEl:'Ο πόλεμος στη Γάζα και τα μέτωπα σε Λίβανο, Δυτική Όχθη και Ερυθρά Θάλασσα.',descEn:'The Gaza war and the fronts in Lebanon, the West Bank and the Red Sea.'},
 {id:'ukraine',el:'Ουκρανία – Ρωσία',en:'Ukraine – Russia',rx:/\b(ukrain\w*|kyiv|kiev|zelensky\w*|kremlin|putin|donbas|donetsk|zaporizhzhia|kharkiv|crimea|russian (?:drone|missile|strike|forces|troops))\b|ουκραν|ζελένσκ|κίεβο|πούτιν|κρεμλίν|ντονμπάς/iu,
  indicators:['TTF=F','ZW=F','EURUSD=X','^STOXX50E'],market:/ukrain|russia|putin|zelensk|ceasefire/i,descEl:'Ο πόλεμος από τη ρωσική εισβολή του 2022 — μέτωπα, επιθέσεις, διαπραγματεύσεις.',descEn:'The war since Russia’s 2022 invasion — fronts, strikes, negotiations.'},
 {id:'sudan',el:'Εμφύλιος στο Σουδάν',en:'Sudan civil war',rx:/\b(sudan\w*|darfur|khartoum|el.?fasher|rsf|rapid support forces)\b|σουδάν|νταρφούρ/iu,
  indicators:['GC=F'],market:/sudan/i,descEl:'Ο πόλεμος στρατού και RSF — η μεγαλύτερη ανθρωπιστική κρίση στον κόσμο.',descEn:'Army vs RSF — the world’s largest humanitarian crisis.'},
 {id:'yemen',el:'Υεμένη & Ερυθρά Θάλασσα',en:'Yemen & Red Sea',rx:/\b(yemen\w*|houthis?|red sea|bab.el.mandeb|sanaa|aden)\b|υεμέν|χούθι|ερυθρά θάλασσα/iu,
  indicators:['BZ=F'],market:/houthi|yemen|red sea/i,descEl:'Οι Χούθι, οι επιθέσεις στη ναυσιπλοΐα και οι επιδρομές στην Υεμένη.',descEn:'The Houthis, shipping attacks and strikes on Yemen.'},
 {id:'congo',el:'Ανατολικό Κονγκό',en:'Eastern Congo',rx:/\b(congo\w*|drc|m23|goma|kinshasa|bukavu)\b|κονγκό/iu,
  indicators:['HG=F'],market:/congo|m23/i,descEl:'Η σύγκρουση με τους αντάρτες M23 και την εμπλοκή της Ρουάντα.',descEn:'The M23 rebellion and Rwanda’s role.'},
 {id:'myanmar',el:'Μιανμάρ',en:'Myanmar',rx:/\b(myanmar|burma\w*|rohingya|junta)\b|μιανμάρ|ροχίνγκια/iu,indicators:[],market:/myanmar/i,descEl:'Ο εμφύλιος μετά το πραξικόπημα του 2021.',descEn:'The civil war after the 2021 coup.'},
 {id:'kashmir',el:'Ινδία – Πακιστάν',en:'India – Pakistan',rx:/\b(kashmir\w*|india.{0,40}pakistan|pakistan.{0,40}india|line of control)\b|κασμίρ/iu,indicators:[],market:/india|pakistan|kashmir/i,descEl:'Η ένταση γύρω από το Κασμίρ.',descEn:'Tensions over Kashmir.'},
 {id:'venezuela',el:'ΗΠΑ – Βενεζουέλα',en:'US – Venezuela',rx:/\b(venezuel\w*|maduro|caracas)\b|βενεζουέλ|μαδούρο/iu,indicators:['CL=F'],market:/venezuela|maduro/i,descEl:'Η αμερικανική πίεση και οι στρατιωτικές κινήσεις γύρω από τη Βενεζουέλα.',descEn:'US pressure and military moves around Venezuela.'}
];
export const conflictById=(id:string)=>conflicts.find(c=>c.id===id);

const titlesOf=(s:Story)=>[s.headline.title,...s.reports.slice(0,8).map(r=>r.title)];
export function storiesForConflict(stories:Story[],c:Conflict):Story[]{
 return stories.filter(s=>{const t=titlesOf(s);return c.rx.test(s.headline.title)||t.filter(x=>c.rx.test(x)).length>=2});
}
export type ConflictSummary={c:Conflict;stories:Story[];last24:number;sources:number;image?:string;heat:number};
export function conflictSummaries(stories:Story[],now=Date.now()):ConflictSummary[]{
 return conflicts.map(c=>{
  const list=storiesForConflict(stories,c);
  const last24=list.filter(s=>now-Date.parse(s.lastAt)<24*3600000).length;
  const sources=new Set(list.flatMap(s=>s.sources)).size;
  return {c,stories:list,last24,sources,image:list.find(s=>s.image)?.image,heat:last24*3+sources+list.length};
 }).filter(x=>x.stories.length>0).sort((a,b)=>b.heat-a.heat);
}
