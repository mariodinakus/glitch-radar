import type {Signal} from './types';
import {eventKind} from './editorial';

/**
 * Event-specific extractive brief.
 * No invented "because", consequences, casualty counts, source corroboration,
 * or boilerplate category-level scenarios.
 */
export type BriefStep={
 id:'fact'|'cause'|'people'|'impact'|'watch';
 number:string;
 title:string;
 text:string;
 evidence:'source'|'context'|'scenario';
 evidenceLabel:string;
};

const missing=/^(?:συγκεντρωτική αναφορά|η πηγή δεν παρέχει|η σύνοψη μεταφράζεται|δεν υπάρχει διαθέσιμη ελληνική μετάφραση|δεν διατίθεται ελληνική μετάφραση|news headline from|no summary available)/iu;
const hasGreek=(s:string)=>/[\u0370-\u03ff\u1f00-\u1fff]/u.test(s);
const normalized=(s:string)=>s.replace(/<[^>]+>/g,' ').replace(/\bhttps?:\/\/\S+/gi,' ').replace(/\s+/g,' ').trim();
const trim=(s:string,max=240)=>s.length<=max?s:(s.slice(0,max).replace(/\s+\S*$/,'')+'…');
const unique=(values:string[])=>[...new Set(values)].slice(0,5);
const mentionEntries:[RegExp,string][]=[
 [/\bfrance\b|γαλλί/iu,'Γαλλία'],[/\balbania\b|αλβανί/iu,'Αλβανία'],[/\bparis\b|παρίσ/iu,'Παρίσι'],[/\btirana\b|τίραν/iu,'Τίρανα'],
 [/\bukraine\b|ουκρανί/iu,'Ουκρανία'],[/\brussia\b|ρωσί/iu,'Ρωσία'],[/\bgaza\b|γάζ/iu,'Γάζα'],[/\bisrael\b|ισραήλ/iu,'Ισραήλ'],
 [/\blebanon\b|λίβαν/iu,'Λίβανος'],[/\biran\b|ιράν/iu,'Ιράν'],[/\bturkey\b|τουρκί/iu,'Τουρκία'],[/\bchina\b|κίν/iu,'Κίνα'],
 [/\bgre(ece|ek)\b|ελλάδ|ελληνικ/iu,'Ελλάδα'],[/\bgermany\b|γερμανί/iu,'Γερμανία'],[/\bitaly\b|ιταλί/iu,'Ιταλία'],
 [/\bsudan\b|σουδάν/iu,'Σουδάν'],[/\bindia\b|ινδί/iu,'Ινδία'],[/\bserbia\b|σερβί/iu,'Σερβία'],
 [/\bpolice\b|αστυνομί/iu,'αστυνομία'],[/\bstudents?\b|φοιτητ|μαθητ/iu,'φοιτητές ή μαθητές'],
 [/\bfarmers?\b|αγρότ/iu,'αγρότες'],[/\bworkers?\b|εργαζομ|εργάτ/iu,'εργαζόμενοι'],
 [/\bteachers?\b|εκπαιδευτικ/iu,'εκπαιδευτικοί'],[/\bdoctors?\b|γιατρ/iu,'γιατροί'],
 [/\bprotesters?\b|διαδηλωτ/iu,'διαδηλωτές'],[/\bsoldiers?\b|στρατιώτ/iu,'στρατιώτες'],
 [/\bgovernment\b|κυβέρνησ/iu,'κυβέρνηση'],[/\bparliament\b|κοινοβούλ|βουλή/iu,'κοινοβούλιο']
];
const causeRules:{rx:RegExp;label:string}[]=[
 {rx:/(?:λόγω|εξαιτίας|με αφορμή)\s+([^.!?;:]{8,135})/iu,label:'Το δημοσίευμα αναφέρει ως αφορμή'},
 {rx:/(?:διαμαρτυρί(?:ες|α)|κινητοποιήσεις|διαδηλώσεις)\s+(?:για|κατά|ενάντια σε)\s+([^.!?;:]{8,135})/iu,label:'Το δηλωμένο αντικείμενο της κινητοποίησης είναι'},
 {rx:/(?:ζητ(?:ούν|ά)|απαιτ(?:ούν|εί))\s+([^.!?;:]{8,135})/iu,label:'Η πηγή περιγράφει το αίτημα'},
 {rx:/\b(?:protests?|demonstrations?|strike)\s+(?:over|against)\s+([^.!?;:]{8,115})/iu,label:'Το δημοσίευμα συνδέει την κινητοποίηση με'},
 {rx:/\b(?:because of|due to|sparked by|triggered by)\s+([^.!?;:]{8,115})/iu,label:'Ως εξήγηση στο δημοσίευμα αναφέρεται'}
];
const effectRules:{rx:RegExp;description:string;watch:string}[]=[
 {rx:/\b(arrests?|detained|custody)\b|συλλήψ|κρατήσ/iu,description:'συλλήψεις ή κρατήσεις',watch:'Τυχόν επίσημη επιβεβαίωση του αριθμού συλλήψεων και την εξέλιξη των προσαγωγών.'},
 {rx:/\b(injur(?:ed|ies)|wounded)\b|τραυματ/iu,description:'τραυματισμούς',watch:'Επιβεβαιωμένα στοιχεία για τον αριθμό και την κατάσταση των τραυματιών.'},
 {rx:/\b(road closures?|roads? closed|transport disruption|flights? cancel|rail disruptions?)\b|κλειστ(?:οί|ές) δρόμ|διακοπ[ήές] κυκλοφορ|ακυρώσ(?:εις|η) πτήσ/iu,description:'διακοπές μετακινήσεων ή κλειστούς δρόμους',watch:'Νεότερες επίσημες ανακοινώσεις για το πότε αποκαθίσταται η κυκλοφορία.'},
 {rx:/\b(evacuat(?:ed|ions?))\b|εκκενώσ/iu,description:'εκκενώσεις',watch:'Την έκταση των εκκενώσεων και τις επίσημες οδηγίες προστασίας.'},
 {rx:/\b(power outages?|blackouts?)\b|διακοπ[ήές] ρεύμ|μπλακάουτ/iu,description:'διακοπές ηλεκτροδότησης',watch:'Ανακοινώσεις για επαναφορά της ηλεκτροδότησης και λειτουργία βασικών υποδομών.'},
 {rx:/\b(sanctions? announced|sanctions? imposed|imposed sanctions?)\b|επιβολ[ήές] κυρώσ/iu,description:'νέες οικονομικές ή διπλωματικές κυρώσεις',watch:'Το ακριβές πεδίο εφαρμογής των κυρώσεων και τις επίσημες αντιδράσεις.'},
 {rx:/\b(ceasefire agreed|truce agreed|ceasefire signed)\b|συμφωνί(?:α|ες) εκεχειρί/iu,description:'αναφερόμενη συμφωνία εκεχειρίας',watch:'Την τήρηση των όρων και την ανεξάρτητη επιβεβαίωση εφαρμογής της εκεχειρίας.'},
 {rx:/\b(resigned|resignation announced)\b|ανακοίνωσ(?:ε|η) παραίτησ/iu,description:'ανακοινωμένη παραίτηση',watch:'Την επίσημη διαδικασία διαδοχής και τις θεσμικές ανακοινώσεις.'},
 {rx:/\b(shares? fell|stocks? plunged|markets? dropped)\b|πτώσ[ηεις] μετοχ|υποχώρησ(?:αν|ε) οι αγορ/iu,description:'πτώση χρηματιστηριακών τιμών',watch:'Αν η κίνηση συνεχίζεται σε επίσημα δεδομένα αγορών και με τι όγκο συναλλαγών.'}
];
const followUpRules:{rx:RegExp;text:string}[]=[
 {rx:/\b(peace talks|negotiations?|peace deal)\b|διαπραγματεύσ|ειρηνευτικ[έή] συνομιλί/iu,text:'Τις επόμενες επίσημες ανακοινώσεις για τις διαπραγματεύσεις, τα συμμετέχοντα μέρη και τυχόν συμφωνία.'},
 {rx:/\b(election|ballot|vote)\b|εκλογ|ψηφοφορ/iu,text:'Το χρονοδιάγραμμα της επόμενης ψηφοφορίας και τα δημοσιευμένα αποτελέσματα από την αρμόδια αρχή.'},
 {rx:/\b(strikes?|walkouts?)\b|απεργ/iu,text:'Αν θα συνεχιστεί η απεργία, ποιοι κλάδοι συμμετέχουν και αν έχει ανακοινωθεί συμφωνία.'},
 {rx:/\b(ceasefire|truce)\b|εκεχειρ/iu,text:'Τις επίσημες επιβεβαιώσεις για την εφαρμογή ή παραβίαση της εκεχειρίας.'},
 {rx:/\b(resignation|resign|step down)\b|παραίτησ/iu,text:'Αν υποβλήθηκε ή έγινε δεκτή επίσημη παραίτηση και ποια θεσμική διαδικασία θα ακολουθήσει.'},
 {rx:/\b(demands?|protesters call for)\b|αιτήμα|διεκδικ/iu,text:'Αν θα υπάρξει συγκεκριμένη απάντηση στα αιτήματα που καταγράφει η πηγή.'},
 {rx:/\b(tariffs?|trade deal)\b|δασμ|εμπορικ[ήής] συμφωνί/iu,text:'Τις τελικές διατάξεις, τον χρόνο εφαρμογής και επίσημα στοιχεία για τις εμπορικές συνέπειες.'},
 {rx:/\b(earthquake|aftershocks?)\b|σεισμ|μετασεισμ/iu,text:'Τυχόν νεότερες σεισμολογικές καταγραφές και επίσημες ανακοινώσεις για επιπτώσεις.'}
];

function evidenceClause(text:string):string|undefined {
 for(const rule of causeRules){
  const match=rule.rx.exec(text);
  if(!match)continue;
  const clause=trim(normalized(match[1]).split(/[,;—–]/)[0],110);
  if(clause.length<9)continue;
  if(!hasGreek(clause))continue; // The public interface is Greek-only.
  return rule.label+': «'+clause+'». Αυτό αποτελεί αναφορά της πηγής, όχι ανεξάρτητη απόδειξη αιτιότητας.';
 }
}
function identifyActors(text:string):string[]{
 const names=mentionEntries.filter(([rx])=>rx.test(text)).map(x=>x[1]);
 // Do not mix places with implied victims. This is a list of mentioned parties/places.
 return unique(names);
}
function knownImpact(text:string):{description:string;watch:string}|undefined {
 const match=effectRules.find(rule=>rule.rx.test(text));
 return match?{description:match.description,watch:match.watch}:undefined;
}
export function getStackedBrief(signal:Signal,localizedSummary:string,_unusedCause?:string,_unusedImpact?:string,localizedTitle?:string):BriefStep[]{
 const original=normalized(signal.title+' '+signal.summary);
 const safeTitle=normalized(localizedTitle||signal.title);
 const safeSummary=normalized(localizedSummary);
 const validSummary=safeSummary.length>34&&!missing.test(safeSummary)&&safeSummary!==safeTitle;
 const localizedEvidence=hasGreek(safeSummary)?safeSummary:hasGreek(safeTitle)?safeTitle:'';
 const steps:Omit<BriefStep,'number'>[]=[];
 steps.push({
  id:'fact',title:'ΤΙ ΑΝΑΦΕΡΕΙ Η ΠΗΓΗ',
  text:validSummary?trim(safeSummary,390):trim(safeTitle,220),
  evidence:'source',evidenceLabel:'ΑΝΑΦΟΡΑ · '+signal.source.slice(0,46)
 });
 const reason=evidenceClause(localizedEvidence);
 if(reason)steps.push({id:'cause',title:'ΤΟ ΣΥΓΚΕΚΡΙΜΕΝΟ ΑΙΤΙΟ / ΑΙΤΗΜΑ',text:reason,evidence:'source',evidenceLabel:'ΑΝΑΦΕΡΕΤΑΙ ΣΤΟ ΔΗΜΟΣΙΕΥΜΑ'});
 const actors=identifyActors(original+' '+localizedEvidence);
 if(actors.length)steps.push({
  id:'people',title:'ΠΟΙΟΙ ΚΑΙ ΠΟΥ ΑΝΑΦΕΡΟΝΤΑΙ',
  text:'Στην είδηση κατονομάζονται: '+actors.join(', ')+'. Πρόκειται για αναφορές του κειμένου, όχι καταγραφή όλων των πληγέντων.',
  evidence:'source',evidenceLabel:'ΡΗΤΕΣ ΑΝΑΦΟΡΕΣ'});
 const impact=knownImpact(original+' '+localizedEvidence);
 if(impact)steps.push({
  id:'impact',title:'ΤΙ ΕΠΙΠΤΩΣΗ ΑΝΑΦΕΡΕΤΑΙ',
  text:'Στο διαθέσιμο κείμενο γίνεται αναφορά σε '+impact.description+'. Η έκταση και οι αριθμοί χρειάζονται έλεγχο στην αρχική πηγή.',
  evidence:'context',evidenceLabel:'ΕΝΔΕΙΞΗ · ΧΡΕΙΑΖΕΤΑΙ ΕΠΑΛΗΘΕΥΣΗ'});
 const next=impact?.watch||followUpRules.find(item=>item.rx.test(original+' '+localizedEvidence))?.text;
 if(next)steps.push({
  id:'watch',title:'ΠΟΙΟ ΣΥΓΚΕΚΡΙΜΕΝΟ ΣΤΟΙΧΕΙΟ ΕΛΕΓΧΟΥΜΕ',
  text:next,evidence:'context',evidenceLabel:'ΕΠΟΜΕΝΟΣ ΕΛΕΓΧΟΣ'});
 return steps.map((step,i)=>({...step,number:String(i+1).padStart(2,'0')}));
}
