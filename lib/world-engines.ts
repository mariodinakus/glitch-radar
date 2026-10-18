import type {Signal} from './types';
import type {StoryCase,PulseTrack} from './world-pulse';
import {actorsMentioned,mentionedDomains} from './world-pulse';

export type EngineLang='el'|'en';
export type WorldDelta={caseId:string;headline:Signal;kind:'new'|'followup'|'recent';previous?:Signal;reportsSince:number;distinctSources:number;firstAt:string;lastAt:string};
export function worldDiff(cases:StoryCase[],lastVisit:string|null,limit=7):WorldDelta[]{
 const since=lastVisit?Date.parse(lastVisit):NaN;
 const valid=Number.isFinite(since);
 return cases.map(c=>{
  const ordered=[...c.reports].sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp));
  const later=valid?ordered.filter(x=>Date.parse(x.timestamp)>since):ordered;
  if(!later.length)return null;
  const before=valid?ordered.filter(x=>Date.parse(x.timestamp)<=since):[];
  const kind:WorldDelta['kind']=valid?(before.length?'followup':'new'):'recent';
  return {caseId:c.id,headline:c.headline,kind,
   previous:before.length?before[before.length-1]:ordered.length>1?ordered[0]:undefined,
   reportsSince:later.length,distinctSources:c.sources.length,firstAt:c.firstAt,lastAt:c.lastAt};
 }).filter((d):d is WorldDelta=>!!d).sort((a,b)=>Date.parse(b.lastAt)-Date.parse(a.lastAt)).slice(0,limit);
}

export type RippleStep={id:string;el:string;en:string;mechanismEl:string;mechanismEn:string;verifyEl:string;verifyEn:string};
export type RippleModel={key:string;labelEl:string;labelEn:string;trigger:Signal;steps:RippleStep[];mentionedCompanies:PulseTrack[];sourceUrl:string};
type Path={id:string;rx:RegExp;el:string;en:string;steps:RippleStep[]};
const model=(id:string,el:string,en:string,mechanismEl:string,mechanismEn:string,verifyEl:string,verifyEn:string):RippleStep=>({id,el,en,mechanismEl,mechanismEn,verifyEl,verifyEn});
const paths:Path[]=[
 {id:'shipping',rx:/\b(shipping|shipping lanes?|red sea|suez|strait of hormuz|port closure|container ships?|freight)\b|ναυτιλί|διώρυγα|θαλάσσιες μεταφορ|λιμέν/iu,el:'Διαδρομές εμπορίου',en:'Shipping routes',steps:[
  model('delay','Χρόνος μεταφοράς','Transit time','Μια διακοπή διαδρομής μπορεί να οδηγήσει σε παρακάμψεις.','A route disruption can require detours.','Στοιχεία για αλλαγή διαδρομής και πραγματικές ημέρες καθυστέρησης.','Verified rerouting and transit-day data.'),
  model('freight','Ναύλοι & ασφάλιστρα','Freight & insurance','Μεγαλύτερη διαδρομή ενδέχεται να επηρεάσει το κόστος πλοίων και ασφάλισης.','Longer routes may affect shipping and insurance costs.','Δημοσιευμένοι δείκτες ναύλων, ασφάλιστρα και συμβόλαια.','Published freight indices, insurance rates and contracts.'),
  model('supply','Εισαγωγές & επιχειρήσεις','Imports & companies','Η διάρκεια μιας διαταραχής μπορεί να επηρεάσει αποθέματα, όχι κατ’ ανάγκη τις τελικές τιμές.','Persistent disruptions could affect inventories, but not automatically retail prices.','Εταιρικές ενημερώσεις για προμηθευτές, χρόνους παράδοσης και κόστος.','Company disclosures on suppliers, delivery times and costs.')
 ]},
 {id:'energy',rx:/\b(oil|gas|lng|pipeline|opec|energy supply|electricity price|crude|refinery)\b|πετρέλαι|φυσικ[όού] αέρι|αγωγ|διυλιστήρι|ενέργει/iu,el:'Ενεργειακό σύστημα',en:'Energy system',steps:[
  model('physical','Φυσική προσφορά','Physical supply','Χρειάζεται να ξεχωρίσουμε ανακοινώσεις από πραγματικές αλλαγές παραγωγής.','Statements must be distinguished from actual output changes.','Μετρήσεις παραγωγής, αποθεμάτων και μεταφοράς.','Production, stock and shipment figures.'),
  model('wholesale','Χονδρικές τιμές','Wholesale prices','Μια αποδεδειγμένη διαταραχή προσφοράς μπορεί να επηρεάσει τις αγορές ενέργειας.','Verified supply changes may affect energy markets.','Δείκτες χονδρικής, όχι μόνο δημοσιεύματα.','Wholesale price series, not headlines alone.'),
  model('business','Ενεργοβόρες επιχειρήσεις','Energy-intensive firms','Το κόστος μπορεί να μεταδοθεί άνισα ανάλογα με συμβόλαια και αντιστάθμιση κινδύνου.','Costs may transmit unevenly depending on hedges and contracts.','Οικονομικές καταστάσεις και πραγματική έκθεση.','Filings, contract details and exposure data.')
 ]},
 {id:'trade',rx:/\b(tariffs?|embargo|trade restrictions?|export controls?|sanctions?|customs duties?)\b|δασμ|εμπάργκο|κυρώσε|εξαγωγικ[οή] περιορισμ/iu,el:'Εμπόριο & κυρώσεις',en:'Trade & sanctions',steps:[
  model('scope','Πεδίο εφαρμογής','Legal scope','Ο περιορισμός χρειάζεται συγκεκριμένους κωδικούς προϊόντων και εξαιρέσεις.','A restriction needs exact product scope and exemptions.','Επίσημο νομικό κείμενο και ημερομηνία ισχύος.','Official legal text and effective date.'),
  model('flow','Εμπορικές ροές','Trade flows','Επιχειρήσεις μπορεί να αναζητήσουν άλλους προμηθευτές ή αγορές.','Companies may seek alternative suppliers or markets.','Δεδομένα εξαγωγών και εισαγωγών ανά προϊόν.','Product-level import and export data.'),
  model('cost','Κόστος & περιθώρια','Costs & margins','Το κόστος δεν μετακυλίεται ομοιόμορφα στους καταναλωτές.','Costs do not pass to consumers uniformly.','Εταιρικά στοιχεία κόστους και πραγματικές τιμές.','Company cost disclosures and measured prices.')
 ]},
 {id:'rates',rx:/\b(interest rates?|rate cut|rate hike|central bank|bond yields?|inflation|monetary policy)\b|επιτοκ|πληθωρισμ|κεντρικ[ήής] τράπεζ|ομόλογ/iu,el:'Νομισματική μετάδοση',en:'Monetary transmission',steps:[
  model('policy','Πολιτική & προσδοκίες','Policy & expectations','Μια απόφαση μεταβάλλει πρώτα τις προσδοκίες και τις αποδόσεις.','Decisions can first affect expectations and yields.','Κείμενο απόφασης και στοιχεία καμπύλης αποδόσεων.','Official statement and yield-curve observations.'),
  model('credit','Κόστος δανεισμού','Borrowing conditions','Τα επιτόκια στα δάνεια προσαρμόζονται με χρονική υστέρηση.','Lending rates can adjust with a lag.','Τραπεζικές τιμές και στοιχεία χορηγήσεων.','Bank lending and pricing data.'),
  model('demand','Ζήτηση & επενδύσεις','Demand & investment','Μεταβολές χρηματοδότησης ενδέχεται να αλλάξουν σχέδια επιχειρήσεων και νοικοκυριών.','Financing conditions may influence spending and investment.','Μετρήσεις πιστώσεων, επενδύσεων και κατανάλωσης.','Credit, investment and consumption data.')
 ]},
 {id:'cyber',rx:/\b(cyberattack|ransomware|data breach|security breach|hacked)\b|κυβερνοεπίθεσ|διαρρο[ήές] δεδομέν|παραβίασ/iu,el:'Ψηφιακή ανθεκτικότητα',en:'Digital resilience',steps:[
  model('systems','Επηρεασμένα συστήματα','Affected systems','Πρέπει να αποδειχθεί τι ακριβώς τέθηκε εκτός λειτουργίας.','The actual affected systems need confirmation.','Επίσημη ενημέρωση υπηρεσίας ή οργανισμού.','Official incident report.'),
  model('operations','Διακοπή λειτουργιών','Operational disruption','Η επίπτωση εξαρτάται από τη διάρκεια, τις εναλλακτικές και την έκθεση δεδομένων.','Impact depends on duration, workarounds and data exposure.','Χρόνος αποκατάστασης και τεκμηριωμένες απώλειες.','Recovery times and verified losses.'),
  model('users','Χρήστες & πελάτες','Users & customers','Μόνο επιβεβαιωμένη διαρροή τεκμηριώνει έκθεση προσωπικών δεδομένων.','Only confirmed data loss establishes user exposure.','Ανακοινώσεις προς επηρεαζόμενους χρήστες.','Notices to affected users.')
 ]},
 {id:'conflict',rx:/\b(airstrike|missile attack|drone strike|warfare|military offensive|invasion|ceasefire|armed clash)\b|βομβαρδ|εισβολ|εκεχειρ|πυραυλικ[ήές] επίθεσ/iu,el:'Περιφερειακή ασφάλεια',en:'Regional security',steps:[
  model('verified','Επιβεβαίωση συμβάντος','Incident verification','Οι αναφορές από εμπλεκόμενα μέρη μπορεί να διαφέρουν.','Claims from parties to a conflict may differ.','Ανεξάρτητες πηγές και πρωτογενής τεκμηρίωση.','Independent reports and primary evidence.'),
  model('spillover','Γειτονικές περιοχές','Neighboring areas','Πιθανή διάχυση δεν ισοδυναμεί με επιβεβαιωμένη επέκταση.','Possible spillover is not confirmed expansion.','Ανακοινώσεις γειτονικών αρχών και στοιχεία πεδίου.','Neighboring authorities and field reporting.'),
  model('supply','Ανθρωπιστικές & εμπορικές ροές','Humanitarian & trade flows','Η διαταραχή πρόσβασης μπορεί να επηρεάσει αμάχους και διαδρομές.','Access disruptions can affect civilians and transport routes.','Εκθέσεις ΟΗΕ, μεταφορικά στοιχεία και πρόσβαση.','UN reporting, logistics data and access checks.')
 ]},
 {id:'technology',rx:/\b(artificial intelligence|generative ai|semiconductor|chips? supply|data centers?|robotics|large language model)\b|τεχνητ[ήής] νοημοσύν|ημιαγωγ|ρομποτικ/iu,el:'Τεχνολογική διάχυση',en:'Technology diffusion',steps:[
  model('technical','Πραγματική επίδοση','Measured performance','Οι ανακοινώσεις δεν υποκαθιστούν ανεξάρτητες δοκιμές.','Announcements are no substitute for independent tests.','Αναπαραγώγιμα benchmarks και μεθοδολογία.','Reproducible benchmarks and methods.'),
  model('adoption','Εταιρική υιοθέτηση','Company adoption','Το κόστος ενσωμάτωσης επηρεάζει τη χρήση σε πραγματικές επιχειρήσεις.','Integration cost influences real-world adoption.','Μελέτες χρήσης, κόστη και ποσοστά υιοθέτησης.','Usage studies, cost and adoption data.'),
  model('labor','Εργασία & παραγωγικότητα','Labor & productivity','Οι εργασιακές επιδράσεις διαφέρουν ανά εργασία και κλάδο.','Labor effects vary by task and sector.','Συγκριτικά στοιχεία παραγωγικότητας και απασχόλησης.','Comparative productivity and employment data.')
 ]}
];
export function rippleForCase(c:StoryCase):RippleModel|null{
 const input=c.reports.map(s=>s.title).join(' | ').slice(0,3200);
 const match=paths.find(p=>p.rx.test(input)) ||
  (mentionedDomains(c.headline).includes('Μεταφορές')?paths[0]:undefined);
 if(!match)return null;
 const companies=[...new Map(c.reports.flatMap(s=>actorsMentioned(s)).filter(a=>a.type==='company').map(a=>[a.id,a])).values()].slice(0,6);
 return {key:match.id,labelEl:match.el,labelEn:match.en,trigger:c.headline,
  steps:match.steps,mentionedCompanies:companies,sourceUrl:c.headline.url};
}

export type ActorLink={id:string;from:PulseTrack;to:PulseTrack;type:'explicit'|'co-mention';
 labelEl:string;labelEn:string;report:Signal;caseId:string};
const explicit=[
 {rx:/\b(agrees? with|signed.*(?:with|and)|deal with|joint statement|meeting with|meets? with|talks? with|summit with)\b|συμφωνί[αες] με|συναντ[άά]τ|κοιν[ήός] δήλωσ/iu,el:'ΣΥΜΦΩΝΙΑ Ή ΕΠΑΦΗ ΣΤΟΝ ΤΙΤΛΟ',en:'DEAL OR CONTACT IN HEADLINE'},
 {rx:/\b(sanctions? against|imposes sanctions?|tariffs? on|accuses?|condemns?|criticizes?|opposes?|rejects?)\b|επιβάλλει κυρώσε|καταδικάζ|κατηγορε[ίι]|αντιτίθεται/iu,el:'ΑΝΤΙΠΑΡΑΘΕΣΗ ΣΤΟΝ ΤΙΤΛΟ',en:'OPPOSITION CLAIM IN HEADLINE'},
 {rx:/\b(vs\.?|versus|against)\b|εναντίον|κατά της/iu,el:'ΡΗΤΗ ΑΝΤΙΠΑΡΑΘΕΣΗ',en:'EXPLICIT OPPOSITION'}
];
export function actorArena(cases:StoryCase[],limit=32):ActorLink[]{
 const results:ActorLink[]=[];
 const unique=new Set<string>();
 for(const c of cases){
  for(const report of c.reports){
   const mentioned=actorsMentioned({title:report.title,summary:''}).slice(0,7);
   if(mentioned.length<2)continue;
   const marker=explicit.find(m=>m.rx.test(report.title));
   for(let i=0;i<mentioned.length;i++)for(let j=i+1;j<mentioned.length;j++){
    if(results.length>=limit)return results;
    const a=mentioned[i],b=mentioned[j];
    const key=[a.id,b.id].sort().join('|');
    if(unique.has(key))continue;
    unique.add(key);
    results.push({id:key,from:a,to:b,type:marker?'explicit':'co-mention',report,
     caseId:c.id,labelEl:marker?.el||'ΣΤΟΝ ΙΔΙΟ ΤΙΤΛΟ',labelEn:marker?.en||'SAME HEADLINE'});
   }
  }
 }
 return results.sort((a,b)=>Number(b.type==='explicit')-Number(a.type==='explicit'));
}
