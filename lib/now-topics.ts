import type {Signal} from './types';
import {eventKind} from './editorial';

export type NowTopic='all'|'conflict'|'protest'|'politics'|'economy'|'disaster'|'energy'|'technology'|'science'|'society'|'other';
export const nowTopics:{key:NowTopic;label:string;short:string}[]=[
 {key:'all',label:'Όλες οι ειδήσεις',short:'ΟΛΕΣ'},
 {key:'conflict',label:'Πόλεμοι & συγκρούσεις',short:'ΠΟΛΕΜΟΙ'},
 {key:'protest',label:'Διαδηλώσεις',short:'ΔΙΑΔΗΛΩΣΕΙΣ'},
 {key:'politics',label:'Πολιτική & διπλωματία',short:'ΠΟΛΙΤΙΚΗ'},
 {key:'economy',label:'Οικονομία & αγορές',short:'ΟΙΚΟΝΟΜΙΑ'},
 {key:'disaster',label:'Έκτακτα & φυσικά φαινόμενα',short:'ΕΚΤΑΚΤΑ'},
 {key:'energy',label:'Ενέργεια & κλίμα',short:'ΕΝΕΡΓΕΙΑ'},
 {key:'technology',label:'Τεχνολογία & AI',short:'ΤΕΧΝΟΛΟΓΙΑ'},
 {key:'science',label:'Επιστήμη & διάστημα',short:'ΕΠΙΣΤΗΜΗ'},
 {key:'society',label:'Κοινωνία & υγεία',short:'ΚΟΙΝΩΝΙΑ'},
 {key:'other',label:'Άλλες εξελίξεις',short:'ΛΟΙΠΑ'}
];
const diplomacy=/\b(diplomat|summit|prime minister|president|parliament|minister|election|cabinet|sanction|treaty|negotiat|united nations)\b|κυβέρνησ|υπουργ|βουλ|σύνοδ|διαπραγματευ|κυρώσε/iu;
const financial=/\b(financial|inflation|stocks?|economy|central bank|interest rates?|tariff|trade|employment|gdp|debt|recession|exchange rate)\b|οικονομ|πληθωρισμ|επιτοκ|δασμ|χρεοκ|ανεργ/iu;
const energy=/\b(oil|gas|lng|energy|nuclear reactor|solar|renewable|electricity|fuel|climate|emissions|heatwave)\b|ενέργει|πετρέλαι|φυσικ[όου] αέρι|πυρηνικ|κλιματ/iu;
const science=/\b(research|astronom|science|scientists|discovery|mission to mars|spacecraft|telescope|satellite)\b|έρευν|επιστήμ|δορυφόρ|διάστημ|ανακάλυψ/iu;
const society=/\b(hospital|education|health|patients?|schools?|migration|housing|poverty|labor|workers?|students?)\b|νοσοκομ|υγεί|παιδε|μεταναστ|στέγασ|εργαζομ|μαθητ/iu;

export function newsTopic(s:Pick<Signal,'title'|'summary'|'category'>):Exclude<NowTopic,'all'>{
 const ev=eventKind(s);
 if(ev!=='other')return ev==='conflict'?'conflict':ev==='protest'?'protest':ev==='politics'?'politics':ev==='disaster'?'disaster':'economy';
 if(s.category==='economy')return 'economy';
 if(s.category==='energy'||s.category==='climate')return 'energy';
 if(s.category==='tech'||s.category==='ai')return 'technology';
 if(s.category==='science'||s.category==='space')return 'science';
 if(s.category==='nature'||s.category==='earth')return 'disaster';
 if(s.category==='health')return 'society';
 const title=s.title;
 if(diplomacy.test(title))return 'politics';
 if(financial.test(title))return 'economy';
 if(energy.test(title))return 'energy';
 if(science.test(title))return 'science';
 if(society.test(title))return 'society';
 return 'other';
}
export function withinNewsWindow(s:Pick<Signal,'timestamp'>,hours:number,now=Date.now()):boolean {
 const t=Date.parse(s.timestamp);
 return Number.isFinite(t)&&t<=now+300000&&t>=now-hours*3600000;
}
export function nowTopicCounts(signals:Signal[],hours:number):Record<NowTopic,number>{
 const counts=Object.fromEntries(nowTopics.map(t=>[t.key,0])) as Record<NowTopic,number>;
 for(const s of signals){
  if(!withinNewsWindow(s,hours))continue;
  counts.all++;
  counts[newsTopic(s)]++;
 }
 return counts;
}
