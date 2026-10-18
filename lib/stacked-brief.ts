import type {Signal} from './types';
import {eventKind} from './editorial';

/**
 * Source-aware editorial scaffold. Not a fact-checker, automated investigation
 * or verified impact forecast.
 */
export type BriefStep={
 id:'fact'|'cause'|'people'|'impact'|'watch';
 number:string;
 title:string;
 text:string;
 evidence:'source'|'context'|'scenario';
 evidenceLabel:string;
};

type AudienceGuide={people:string;watch:string};
const guides:Record<ReturnType<typeof eventKind>,AudienceGuide>={
 protest:{
  people:'Άμεσα ενδιαφέρονται όσοι συμμετέχουν στις κινητοποιήσεις, οι κάτοικοι και οι εργαζόμενοι στην περιοχή. Η επίδραση σε επιχειρήσεις και υπηρεσίες εξαρτάται από την πραγματική έκταση των διαδηλώσεων.',
  watch:'Αιτήματα και επίσημες απαντήσεις, έκταση των νέων κινητοποιήσεων, τεκμηριωμένα περιστατικά βίας, αλλαγές στις μετακινήσεις και πιθανές διαπραγματεύσεις.'
 },
 conflict:{
  people:'Πρώτα επηρεάζονται οι άμαχοι, οι κοινότητες και οι υποδομές κοντά στη σύγκρουση. Αν υπάρξει μεγαλύτερη κλιμάκωση, μπορεί να υπάρξουν επιπτώσεις σε γειτονικές χώρες και διεθνείς εφοδιαστικές αλυσίδες.',
  watch:'Νέες ανεξάρτητα επιβεβαιωμένες στρατιωτικές εξελίξεις, ανθρωπιστική πρόσβαση, επίσημες δηλώσεις, διπλωματικές πρωτοβουλίες και πιθανή κατάπαυση πυρός.'
 },
 politics:{
  people:'Ενδέχεται να επηρεαστούν πολίτες, δημόσιες υπηρεσίες, θεσμοί και οικονομικοί φορείς. Η πραγματική σημασία εξαρτάται από την εξέλιξη των θεσμικών διαδικασιών.',
  watch:'Ανακοινώσεις αρμόδιων θεσμών, κοινοβουλευτικές αποφάσεις, ενδεχόμενες εκλογές, αντιδράσεις των κομμάτων και το χρονοδιάγραμμα των επόμενων βημάτων.'
 },
 disaster:{
  people:'Πιθανώς επηρεάζονται οι κάτοικοι και οι βασικές υποδομές της περιοχής του φαινομένου. Δεν μπορεί να εκτιμηθεί αριθμός πληγέντων ή μέγεθος ζημιών χωρίς επίσημες αναφορές.',
  watch:'Νέα δεδομένα παρακολούθησης, προειδοποιήσεις των αρμόδιων υπηρεσιών, ανακοινώσεις πολιτικής προστασίας και επιβεβαιωμένες επιπτώσεις.'
 },
 economy:{
  people:'Ανάλογα με την έκταση του γεγονότος, μπορεί να επηρεαστούν νοικοκυριά, επιχειρήσεις, εργαζόμενοι και επενδυτές. Το συγκεκριμένο αποτέλεσμα απαιτεί ποσοτικά δεδομένα.',
  watch:'Νεότερα οικονομικά στοιχεία, αποφάσεις κυβερνήσεων ή κεντρικών τραπεζών, μεταβολές σε επιτόκια και τιμές, και ανεξάρτητες εκτιμήσεις.'
 },
 other:{
  people:'Οι ομάδες που ενδέχεται να επηρεαστούν δεν μπορούν να προσδιοριστούν αξιόπιστα μόνο από τον τίτλο και την περίληψη.',
  watch:'Νεότερη τεκμηρίωση από αξιόπιστες πηγές, επίσημα στοιχεία και διευκρινίσεις ή διορθώσεις του αρχικού δημοσιεύματος.'
 }
};

export function getStackedBrief(signal:Signal, localizedSummary:string, cause:string, impact:string):BriefStep[]{
 const guide=guides[eventKind(signal)];
 const summary=localizedSummary.trim()||'Η διαθέσιμη πηγή δεν παρέχει αναλυτική περιγραφή. Δες την πρωτότυπη δημοσίευση.';
 const sourceType=signal.confidence==='publisher'?'ΔΗΜΟΣΙΕΥΜΑ':'ΚΑΤΑΓΡΑΦΗ ΠΗΓΗΣ';
 return [
  {id:'fact',number:'01',title:'ΤΙ ΕΓΙΝΕ',text:summary,evidence:'source',evidenceLabel:sourceType},
  {id:'cause',number:'02',title:'ΓΙΑΤΙ ΣΥΜΒΑΙΝΕΙ',text:cause,evidence:'context',evidenceLabel:'ΠΛΑΙΣΙΟ · ΟΧΙ ΑΠΟΔΕΔΕΙΓΜΕΝΗ ΑΙΤΙΑ'},
  {id:'people',number:'03',title:'ΠΟΙΟΥΣ ΕΠΗΡΕΑΖΕΙ',text:guide.people,evidence:'scenario',evidenceLabel:'ΟΜΑΔΕΣ ΠΙΘΑΝΗΣ ΕΠΙΔΡΑΣΗΣ'},
  {id:'impact',number:'04',title:'ΤΙ ΜΠΟΡΕΙ ΝΑ ΑΛΛΑΞΕΙ',text:impact,evidence:'scenario',evidenceLabel:'ΠΙΘΑΝΟ ΣΕΝΑΡΙΟ'},
  {id:'watch',number:'05',title:'ΤΙ ΠΑΡΑΚΟΛΟΥΘΟΥΜΕ',text:guide.watch,evidence:'context',evidenceLabel:'ΕΝΔΕΙΞΕΙΣ ΓΙΑ ΕΠΟΜΕΝΟ ΕΛΕΓΧΟ'}
 ];
}
