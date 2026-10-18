import type {Signal} from './types';
import type {StoryCase} from './world-pulse';
import {actorsMentioned,mentionedDomains} from './world-pulse';

export type Lang='el'|'en';
export type EditorialNote={angle:string;take:string;watch:string;coverage:string;specific:boolean};
type Pairs={angle:string;take:string;watch:string};
type Frame={pattern:RegExp;el:Pairs;en:Pairs};
const frames:Frame[]=[
 {pattern:/\b(ceasefire|truce|peace deal)\b|εκεχειρ/iu,
  el:{angle:'ΕΚΕΧΕΙΡΙΑ · ΕΦΑΡΜΟΓΗ',take:'Η ανακοίνωση εκεχειρίας και η εφαρμογή της είναι δύο διαφορετικές εξελίξεις. Το ουσιαστικό είναι αν αλλάζει η κατάσταση στο πεδίο.',watch:'Θα υπάρξουν ανεξάρτητες αναφορές για τήρηση της συμφωνίας και ανθρωπιστική πρόσβαση;'},
  en:{angle:'CEASEFIRE · IMPLEMENTATION',take:'Announcing a ceasefire and implementing one are different developments. What matters is whether the situation on the ground changes.',watch:'Will compliance and humanitarian access be independently verified?'}},
 {pattern:/\b(airstrike|missile strike|bombing|bombardment|shelling|drone strike|military offensive)\b|βομβαρδ|αεροπορικ[ήές] επίθεσ|πυραυλικ[ήές] επίθεσ/iu,
  el:{angle:'ΣΥΓΚΡΟΥΣΗ · ΑΛΛΑΓΗ ΙΣΟΡΡΟΠΙΑΣ;',take:'Μια αναφορά επίθεσης δείχνει δραστηριότητα, όχι απαραίτητα στρατηγική μεταβολή. Για να κριθεί η σημασία της χρειάζονται αποτελέσματα και όχι μόνο ισχυρισμοί.',watch:'Ποιοι στόχοι και συνέπειες έχουν επιβεβαιωθεί, και από ποιον;'},
  en:{angle:'CONFLICT · A REAL SHIFT?',take:'A reported strike indicates activity, not necessarily a strategic shift. Establishing significance requires outcomes, not only claims.',watch:'Which targets and outcomes have been independently confirmed?'}},
 {pattern:/\b(sanctions?|embargo|assets frozen)\b|κυρώσε|εμπάργκο/iu,
  el:{angle:'ΚΥΡΩΣΕΙΣ · ΠΡΑΓΜΑΤΙΚΗ ΙΣΧΥΣ',take:'Η σημασία μιας κύρωσης δεν βρίσκεται μόνο στην ανακοίνωσή της, αλλά στις συναλλαγές, επιχειρήσεις και χώρες που πράγματι καλύπτει.',watch:'Ποιες εξαιρέσεις, ημερομηνίες εφαρμογής και μηχανισμοί επιβολής προβλέπονται;'},
  en:{angle:'SANCTIONS · REAL REACH',take:'A sanction matters less as a headline than through the transactions, firms and countries actually covered by it.',watch:'What exemptions, effective dates and enforcement mechanisms apply?'}},
 {pattern:/\b(protests?|demonstrations?|strikes?|walkouts?|rallies|riots?)\b|διαδηλ|απεργ|κινητοποι|συλλαλητ/iu,
  el:{angle:'ΚΙΝΗΤΟΠΟΙΗΣΗ · ΠΟΛΙΤΙΚΗ ΑΝΤΑΠΟΚΡΙΣΗ',take:'Η μαζικότητα μιας κινητοποίησης δεν αρκεί για να δείξει πολιτική αλλαγή. Το κρίσιμο είναι τα αιτήματα και αν οι αρμόδιοι μετακινούνται από την αρχική θέση τους.',watch:'Ποια αιτήματα καταγράφονται και υπάρχει συγκεκριμένη απάντηση ή δέσμευση;'},
  en:{angle:'PROTEST · POLITICAL RESPONSE',take:'The size of a demonstration alone does not establish political change. Demands and the response from decision-makers matter more.',watch:'Which demands are documented, and has an authority given a concrete response?'}},
 {pattern:/\b(elections?|ballot|vote counting|runoff)\b|εκλογ|ψηφοφορ|κάλπε/iu,
  el:{angle:'ΕΚΛΟΓΕΣ · ΤΙ ΕΙΝΑΙ ΕΠΙΣΗΜΟ',take:'Οι δηλώσεις, οι δημοσκοπήσεις και τα πιστοποιημένα αποτελέσματα δεν είναι ισοδύναμα. Χρειάζεται διαχωρισμός πριν βγάλουμε συμπέρασμα για τις ισορροπίες.',watch:'Ποιο αποτέλεσμα ή στάδιο έχει ανακοινώσει η αρμόδια εκλογική αρχή;'},
  en:{angle:'ELECTION · WHAT IS OFFICIAL',take:'Claims, polls and certified outcomes are not equivalent. They must be separated before drawing conclusions about political change.',watch:'What outcome or process has the election authority officially confirmed?'}},
 {pattern:/\b(tariffs?|trade war|import duties|export bans?)\b|δασμ|εμπορικ[όός] πόλεμ/iu,
  el:{angle:'ΕΜΠΟΡΙΟ · ΠΟΙΟΣ ΑΠΟΡΡΟΦΑ ΤΟ ΚΟΣΤΟΣ',take:'Ο αντίκτυπος ενός δασμού εξαρτάται από τα αγαθά, τις εξαιρέσεις και το ποιος τελικά επιβαρύνεται. Δεν τεκμαίρεται αύξηση τιμών από έναν τίτλο.',watch:'Ποια προϊόντα καλύπτονται και τι δείχνουν οι μετρήσεις για εισαγωγές και τιμές;'},
  en:{angle:'TRADE · WHO BEARS THE COST',take:'Tariff impact depends on products, exemptions and who absorbs the cost. A headline does not establish consumer-price effects.',watch:'Which products are covered, and what do trade and price data show?'}},
 {pattern:/\b(interest rates?|rate cut|rate hike|central bank|federal reserve|ecb)\b|επιτόκ|κεντρικ[ήής] τράπεζ/iu,
  el:{angle:'ΕΠΙΤΟΚΙΑ · ΜΕΤΑΔΟΣΗ',take:'Μια απόφαση κεντρικής τράπεζας δεν περνά αμέσως στα δάνεια και στις καταθέσεις. Η μετάδοση στην πραγματική οικονομία είναι το κλειδί.',watch:'Τι λέει η επίσημη ανακοίνωση και πώς μεταβάλλονται οι αποδόσεις και το κόστος χρηματοδότησης;'},
  en:{angle:'INTEREST RATES · TRANSMISSION',take:'A central-bank decision does not instantly change credit and deposit rates. Transmission to the real economy matters.',watch:'What does the official statement say, and how do yields and financing conditions move?'}},
 {pattern:/\b(inflation|consumer prices?|cost of living|cpi)\b|πληθωρισμ|ακρίβεια/iu,
  el:{angle:'ΠΛΗΘΩΡΙΣΜΟΣ · ΤΙ ΚΡΥΒΕΙ Ο ΜΕΣΟΣ ΟΡΟΣ',take:'Ο συνολικός δείκτης δεν αποτυπώνει από μόνος του την εμπειρία των νοικοκυριών. Η σύνθεση της μεταβολής έχει μεγαλύτερη σημασία.',watch:'Ποιες κατηγορίες αγαθών οδήγησαν τη μεταβολή και πόσο διαρκεί η τάση;'},
  en:{angle:'INFLATION · BEYOND THE AVERAGE',take:'A headline inflation figure cannot describe every household. The composition and persistence of price changes matter.',watch:'Which goods drove the change and is the trend persistent?'}},
 {pattern:/\b(earnings|revenue|profits?|company guidance|quarterly results)\b|έσοδα|κέρδη|εταιρικ[άών] αποτελέσμα/iu,
  el:{angle:'ΕΤΑΙΡΙΚΑ ΜΕΓΕΘΗ · ΠΡΟΣΔΟΚΙΕΣ',take:'Το μέγεθος εσόδων ή κερδών είναι χρήσιμο μόνο δίπλα στις προσδοκίες, τα προηγούμενα αποτελέσματα και τις προβλέψεις της διοίκησης.',watch:'Υπάρχει σύγκριση με προβλέψεις και άλλαξε η καθοδήγηση για το επόμενο διάστημα;'},
  en:{angle:'EARNINGS · EXPECTATIONS',take:'Revenue and profit figures mean more when compared with expectations, prior periods and management guidance.',watch:'How did the company compare with forecasts, and did guidance change?'}},
 {pattern:/\b(earthquake|aftershock|seismic|magnitude)\b|σεισμ|μετασεισμ/iu,
  el:{angle:'ΣΕΙΣΜΟΣ · ΕΚΘΕΣΗ, ΟΧΙ ΜΟΝΟ ΜΕΓΕΘΟΣ',take:'Το μέγεθος του σεισμού δεν είναι κλίμακα ζημιών. Απόσταση, βάθος και έκθεση των οικισμών καθορίζουν την ανθρώπινη διάσταση.',watch:'Υπάρχει επίσημη ενημέρωση για τοπική ένταση, βλάβες ή μέτρα προστασίας;'},
  en:{angle:'EARTHQUAKE · EXPOSURE, NOT JUST MAGNITUDE',take:'Magnitude does not measure damage. Depth, location and exposed communities shape the consequences.',watch:'Have authorities confirmed local intensity, damage or safety measures?'}},
 {pattern:/\b(wildfires?|forest fire|bushfire)\b|πυρκαγι|δασικ[ήής] φωτιά/iu,
  el:{angle:'ΠΥΡΚΑΓΙΑ · ΕΞΑΠΛΩΣΗ ΚΑΙ ΚΙΝΔΥΝΟΣ',take:'Μια καταγεγραμμένη φωτιά δεν περιγράφει από μόνη της την έκταση ή τον κίνδυνο. Η περίμετρος και οι περιοχές έκθεσης έχουν προτεραιότητα.',watch:'Υπάρχει νεότερη περίμετρος, επίσημη προειδοποίηση ή επιβεβαιωμένη εκκένωση;'},
  en:{angle:'WILDFIRE · SPREAD AND EXPOSURE',take:'An active fire listing does not establish its severity. Perimeter and exposed communities matter.',watch:'Are there updated perimeters, warnings or confirmed evacuations?'}},
 {pattern:/\b(artificial intelligence|generative ai|chatgpt|llm|ai model|ai agent|openai|anthropic|deepmind)\b|τεχνητ[ήής] νοημοσύν/iu,
  el:{angle:'ΑΙ · ΔΟΚΙΜΕΣ ΑΝΤΙ ΓΙΑ ΔΙΑΦΗΜΙΣΗ',take:'Ο ισχυρισμός ενός κατασκευαστή AI δεν ισοδυναμεί με ανεξάρτητο πείραμα. Η χρησιμότητα κρίνεται από μετρήσεις, κόστος και περιορισμούς.',watch:'Υπάρχουν ανοικτά benchmarks και αναπαραγώγιμες δοκιμές από τρίτους;'},
  en:{angle:'AI · EVIDENCE OVER HYPE',take:'A model vendor claim is not an independent experiment. Real utility depends on tests, cost and limitations.',watch:'Are there public benchmarks and reproducible third-party evaluations?'}},
 {pattern:/\b(cyberattack|ransomware|data breach|hacked)\b|κυβερνοεπίθεσ|διαρρο[ήές] δεδομέν/iu,
  el:{angle:'ΚΥΒΕΡΝΟΑΣΦΑΛΕΙΑ · ΤΙ ΠΡΑΓΜΑΤΙΚΑ ΔΙΕΡΡΕΥΣΕ',take:'Η απόπειρα επίθεσης, η παραβίαση πρόσβασης και η αποδεδειγμένη διαρροή είναι διαφορετικά γεγονότα.',watch:'Τι επιβεβαίωσε ο οργανισμός, ποια συστήματα επηρεάστηκαν και ενημερώθηκαν χρήστες;'},
  en:{angle:'CYBERSECURITY · WHAT WAS EXPOSED',take:'An attempted attack, breached access and confirmed exfiltration are different facts.',watch:'What did the organization confirm, which systems were affected and were users notified?'}},
 {pattern:/\b(clinical trial|vaccine|cancer treatment|drug approval|medical study)\b|κλινικ[ήής] δοκιμ|εμβόλι|ογκολογ/iu,
  el:{angle:'ΥΓΕΙΑ · ΕΠΙΠΕΔΟ ΤΕΚΜΗΡΙΩΣΗΣ',take:'Ένα ερευνητικό εύρημα δεν είναι το ίδιο με εγκεκριμένη θεραπεία. Η φάση της δοκιμής και η αξιολόγηση από αρμόδια αρχή αλλάζουν την εικόνα.',watch:'Τι μέγεθος δείγματος και αποτελέσματα δημοσιεύτηκαν, και υπάρχει ρυθμιστική έγκριση;'},
  en:{angle:'HEALTH · LEVEL OF EVIDENCE',take:'A research finding is not an approved treatment. Trial phase, sample and regulatory review change the interpretation.',watch:'What sample and outcomes were published and is there regulatory approval?'}},
 {pattern:/\b(spacecraft|rocket launch|space mission|satellite|telescope)\b|δορυφόρ|διαστημικ[ήής] αποστολ/iu,
  el:{angle:'ΔΙΑΣΤΗΜΑ · ΑΠΟΤΕΛΕΣΜΑ ΑΠΟΣΤΟΛΗΣ',take:'Εκτόξευση και επιστημονική επιτυχία δεν είναι συνώνυμα. Η αξία βρίσκεται στα επόμενα τεχνικά ορόσημα και στα δεδομένα.',watch:'Τι ακριβώς επιβεβαιώθηκε και ποιο είναι το επόμενο μετρήσιμο βήμα;'},
  en:{angle:'SPACE · MISSION OUTCOME',take:'Launch is not synonymous with scientific success. Follow-up milestones and data matter.',watch:'What has been confirmed and what is the next measurable milestone?'}}
];
const substantive=(s:string)=>s.length>25&&!/^(?:Συγκεντρωτική αναφορά|Η πηγή δεν παρέχει|Δεν υπάρχει διαθέσιμη|The source does not)/iu.test(s);
function frameFor(s:Signal):Frame|undefined{
 if(s.category==='culture'||s.category==='sports')return;
 const source=s.title+' '+(substantive(s.summary)?s.summary:'');
 return frames.find(f=>f.pattern.test(source));
}
function actorNote(c:StoryCase,lang:Lang):string{
 const actorNames=[...new Set(c.reports.flatMap(story=>actorsMentioned(story).map(actor=>actor.name)))].slice(0,3);
 if(!actorNames.length)return '';
 const names=actorNames.join(' · ');
 return lang==='el'?' Στις αναφορές κατονομάζονται '+names+'· αυτό δεν αποτελεί απόδειξη ευθύνης ή εμπλοκής.':' Named actors include '+names+'; a mention is not evidence of responsibility.';
}
function coverage(c:StoryCase,lang:Lang):string{
 const n=c.sources.length;
 if(n===1)return lang==='el'?'Στο διαθέσιμο δείγμα εντοπίζεται ένας εκδότης για το συγκεκριμένο γεγονός· αυτό δεν αποκλείει κάλυψη αλλού.':'One publisher is represented in the current sample; other reporting may exist elsewhere.';
 const oldest=Math.min(...c.reports.map(v=>Date.parse(v.timestamp)));
 const newest=Math.max(...c.reports.map(v=>Date.parse(v.timestamp)));
 const mins=Math.max(0,Math.round((newest-oldest)/60000));
 return lang==='el'?'Βρέθηκαν '+n+' εκδότες με διαφορά '+mins+' λεπτών μεταξύ πρώτης και τελευταίας αναφοράς. Η πολλαπλή δημοσίευση δεν είναι αυτομάτως διασταύρωση.':n+' publishers covered this within a '+mins+'-minute window. Multiple reports do not automatically corroborate the claims.';
}
function fallback(c:StoryCase,lang:Lang):string{
 const domains=[...new Set(c.reports.flatMap(mentionedDomains))].slice(0,2);
 if(domains.length)return lang==='el'?'Στην είδηση υπάρχουν αναφορές σε '+domains.join(' και ')+'. Δεν αποδεικνύεται από αυτό συγκεκριμένη οικονομική ή κοινωνική επίπτωση.':'The source refers to '+domains.join(' and ')+', but this does not establish a measurable impact.';
 return lang==='el'?'Το διαθέσιμο κείμενο δεν αρκεί για ασφαλή ερμηνεία πέρα από το ίδιο το γεγονός. Προτιμάμε να μη μεταμφιέζουμε την υπόθεση σε ανάλυση.':'The supplied excerpt is too thin for a responsible interpretation beyond the headline. We will not present conjecture as analysis.';
}
export function getStoryCommentary(c:StoryCase,lang:Lang):EditorialNote{
 const frame=frameFor(c.headline);
 const local=frame?.[lang];
 const take=(local?.take||fallback(c,lang))+actorNote(c,lang);
 return {angle:local?.angle||(lang==='el'?'ΤΟ ΚΡΙΣΙΜΟ ΕΡΩΤΗΜΑ':'THE CENTRAL QUESTION'),take,
 watch:local?.watch||(lang==='el'?'Τι τεκμηριώνεται στην πλήρη πηγή και ποιο γεγονός μπορεί να επιβεβαιωθεί στη συνέχεια;':'What is established in the original report and which milestone can be verified next?'),
 coverage:coverage(c,lang),specific:!!local};
}
export function getArticleCommentary(s:Signal,lang:Lang):{angle:string;watch:string}{
 const frame=frameFor(s);
 if(frame)return {angle:frame[lang].angle,watch:frame[lang].watch};
 const topic=mentionedDomains(s)[0];
 if(topic)return {angle:lang==='el'?'ΤΙ ΝΑ ΕΛΕΓΞΟΥΜΕ':'WHAT TO CHECK',watch:lang==='el'?'Η αναφορά σχετίζεται με '+topic+', αλλά δεν πιστοποιεί πραγματική επίπτωση.':'This report mentions '+topic+', but does not establish a measurable effect.'};
 return {angle:lang==='el'?'ΕΛΕΓΧΟΣ ΠΗΓΗΣ':'SOURCE CHECK',watch:lang==='el'?'Χρειάζεται το πλήρες δημοσίευμα πριν εξαχθεί ξεχωριστό συμπέρασμα.':'The full report is needed before a separate interpretation is warranted.'};
}
