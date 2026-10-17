import type {Signal} from './types';

/**
 * Editorial signal detection, not a fact-checker or a casualty/severity estimator.
 * Returns explanatory scenarios explicitly labeled as conditional.
 */
export type EventKind='conflict'|'protest'|'politics'|'disaster'|'economy'|'other';
export type EditorialContext={kind:EventKind;label:string;why:string;impact:string;limits:string};

const protest=/\b(protests?|protesters?|demonstrat(?:ion|ions|ors|or)|march(?:es|ers)?|rall(?:y|ies)|riots?|unrest|general strike|anti-government|sit-in)\b|διαδηλ|διαμαρτυρ|συλλαλητ|απεργ|επεισόδια|επεισοδια|ταραχ|κινητοποι|συγκέντρωση διαμαρτυρίας|πορεία διαμαρτυρίας/iu;
const conflict=/\b(wars?|invasion|airstrikes?|missiles?|shelling|bombings?|ceasefire|armed conflict|troops|military offensives?|frontline|drone strikes?|hostages?|battlefield|fighting|killed in attack)\b|πόλεμ|εισβολ|πυραυλ|βομβαρδ|εκεχειρ|στρατιωτικ|μάχες|όμηροι|επίθεση με drone/iu;
const politics=/\b(coups?|resignations?|impeachment|snap election|government collapses?|political crisis|parliament dissolv|presidential election|constitutional crisis)\b|πραξικόπημ|παραίτησ|εκλογ|κυβερνητικ[ήη] κρίσ|πρόωρ[εέ]ς κάλπες/iu;
const disaster=/\b(earthquakes?|tsunamis?|hurricanes?|wildfires?|floods?|disaster|evacuation|eruption)\b|σεισμ|πυρκαγι|πλημμύρ|εκκένωσ|ηφαίστ/iu;
const economy=/\b(financial crisis|bank failure|recession|debt crisis|market crash|inflation shock)\b|οικονομικ[ήη] κρίσ|χρεοκοπ|ύφεσ|τραπεζικ[ήη] κρίσ/iu;
const evidenceCause=/\b(because of|following|after|over|against|amid|sparked by|triggered by|in response to|due to|demanding|opposing)\b|λόγω|εξαιτίας|με αφορμή|μετά από|κατά της|ενάντια|διαμαρτυρόμεν|εναντίον/iu;

export function eventKind(s:Pick<Signal,'title'|'summary'|'category'>):EventKind {
 const headline=s.title;
 if(protest.test(headline))return 'protest';
 if(conflict.test(headline))return 'conflict';
 if(politics.test(headline))return 'politics';
 if(disaster.test(headline) || (s.category==='earth' && /\bM\s*[6-9](?:\.\d)?\b/i.test(headline)))return 'disaster';
 if(economy.test(headline))return 'economy';
 return 'other';
}
export const isMajorEvent=(s:Signal)=>eventKind(s)!=='other' && (s.confidence==='publisher'||s.confidence==='reported') && Date.now()-Date.parse(s.timestamp)<72*3600000;

export function editorialPriority(s:Signal):number {
 const hrs=Math.max(0,(Date.now()-Date.parse(s.timestamp))/3600000);
 const age=Math.max(0,42-Math.min(90,hrs)*1.1);
 const kind=eventKind(s);
 const weight:Record<EventKind,number>={conflict:58,protest:55,politics:43,disaster:35,economy:35,other:0};
 const reliable=(s.confidence==='publisher'||s.confidence==='reported')?10:0;
 // Community hype, generic RSS adjectives and non-news catalogs never trump timely reporting.
 return age+weight[kind]+reliable+s.score*.23-(hrs>96?100:0);
}

export function getEditorialContext(s:Signal):EditorialContext {
 const kind=eventKind(s);
 const causeMentioned=evidenceCause.test(s.title+' '+s.summary);
 const sourceText=(s.title+' · '+s.summary).replace(/\s+/g,' ').trim();
 const causeExcerpt=sourceText.match(/(?:\b(?:over|against|following|amid|after|due to|because of|in response to|sparked by|demanding|opposing)\b|(?:λόγω|εξαιτίας|με αφορμή|διαμαρτυρόμεν(?:οι|ες)? για|κατά της|εναντίον της))\s+([^.!?;:·]{8,155})/iu);
 const excerpt=causeExcerpt?.[1]?.trim().split(/[,—–]/)[0]?.split(/\s+/).slice(0,16).join(' ').trim();
 const sourceContext=excerpt&&excerpt.length>8
  ? 'Στο διαθέσιμο απόσπασμα αναφέρεται ως πλαίσιο: «'+excerpt+'». Αυτό δεν αποδεικνύει από μόνο του αιτιακή σχέση.'
  : 'Ο τίτλος και η σύντομη περίληψη δεν επιβεβαιώνουν το ακριβές αίτιο. Χρειάζεται έλεγχος του πλήρους ρεπορτάζ.';
 const reasonPrefix=causeMentioned?sourceContext:'Δεν υπάρχει επαρκής τεκμηρίωση του αιτίου στο απόσπασμα της είδησης.';
 const limits='Πιθανό σενάριο — όχι βεβαιωμένη εξέλιξη ή πρόβλεψη. Η διαθέσιμη ροή δεν υποκαθιστά το πλήρες άρθρο.';
 const configurations:Record<EventKind,{label:string;why:string;impact:string}>={
  protest:{
   label:'ΔΙΑΔΗΛΩΣΕΙΣ',
   why:causeMentioned?reasonPrefix:'Δεν τεκμηριώνεται ακόμη ποιος είναι ο οργανωτής, ποια τα αιτήματα και ποια η άμεση αφορμή των κινητοποιήσεων.',
   impact:'Αν οι κινητοποιήσεις συνεχιστούν ή κλιμακωθούν, ενδέχεται να επηρεαστούν μετακινήσεις, δημόσιες υπηρεσίες και πολιτικές αποφάσεις. Η έκταση των επιπτώσεων δεν έχει επιβεβαιωθεί.'
  },
  conflict:{
   label:'ΠΟΛΕΜΟΙ / ΣΥΓΚΡΟΥΣΕΙΣ',
   why:causeMentioned?reasonPrefix:'Το διαθέσιμο απόσπασμα δεν αρκεί για να καθορίσουμε τις αιτίες ή την ευθύνη της σύγκρουσης.',
   impact:'Εφόσον υπάρξει περαιτέρω κλιμάκωση, μπορεί να προκύψουν ανθρωπιστικές, διπλωματικές και οικονομικές συνέπειες. Απαιτούνται ανεξάρτητες ενημερώσεις για την πραγματική έκταση.'
  },
  politics:{
   label:'ΠΟΛΙΤΙΚΗ ΚΡΙΣΗ',
   why:causeMentioned?reasonPrefix:'Η σύντομη αναφορά δεν αρκεί για να αποδώσουμε τα αίτια της πολιτικής εξέλιξης.',
   impact:'Ανάλογα με τις θεσμικές αποφάσεις που θα ακολουθήσουν, ενδέχεται να υπάρξουν αλλαγές στη διακυβέρνηση ή στην οικονομική πολιτική.'
  },
  disaster:{
   label:'ΕΚΤΑΚΤΟ ΦΑΙΝΟΜΕΝΟ',
   why:'Το γεγονός καταγράφηκε από την αναφερόμενη πηγή. Το φαινόμενο και η αιτία του πρέπει να αξιολογούνται ξεχωριστά από την έκτασή του.',
   impact:'Οι επιπτώσεις εξαρτώνται από την τοποθεσία, την ένταση, την έκθεση του πληθυσμού και τις επίσημες ανακοινώσεις. Δεν τεκμαίρονται από έναν τίτλο.'
  },
  economy:{
   label:'ΟΙΚΟΝΟΜΙΚΗ ΕΞΕΛΙΞΗ',
   why:causeMentioned?reasonPrefix:'Το σύντομο απόσπασμα δεν επαρκεί για αξιόπιστη αιτιολόγηση της εξέλιξης.',
   impact:'Αν η εξέλιξη αποδειχθεί διαρκής ή συστημική, θα μπορούσε να μεταβάλει τη χρηματοδότηση, τις τιμές ή τις προσδοκίες. Δεν αποτελεί επενδυτική πρόβλεψη.'
  },
  other:{
   label:'ΤΡΕΧΟΥΣΑ ΕΞΕΛΙΞΗ',
   why:'Η είδηση αντλήθηκε από την επώνυμη πηγή. Χωρίς πρόσθετο τεκμηριωμένο πλαίσιο δεν αποδίδουμε αυθαίρετη αιτιότητα.',
   impact:'Ο πραγματικός αντίκτυπος εξαρτάται από στοιχεία που ενδέχεται να μην περιλαμβάνονται στη σύντομη αναφορά. Απαιτείται έλεγχος της πρωτότυπης πηγής.'
  }
 };
 return {kind,...configurations[kind],limits};
}
