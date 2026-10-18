export type MediaProfile={
 name:string;ownerEl:string;ownerEn:string;biasEl?:string;biasEn?:string;biasSource?:string;biasConfidence?:'low'|'medium'|'high';
 ownershipSource:string;notesEl:string;notesEn:string;
};
/** Documented publisher background. U.S.-centric AllSides ideological ratings
 * do NOT measure support for a sitting government and are NOT ratings of story accuracy. */
const media:{test:RegExp;profile:MediaProfile}[]=[
 {test:/^the guardian$|^guardian\b/i,profile:{
  name:'The Guardian',ownerEl:'Guardian Media Group / Scott Trust',ownerEn:'Guardian Media Group / Scott Trust',
  ownershipSource:'https://www.theguardian.com/about/history',
  biasEl:'Αριστερό (AllSides, χαμηλή βεβαιότητα)',biasEn:'Left (AllSides, low confidence)',
  biasSource:'https://www.allsides.com/news-source/guardian-media-bias',biasConfidence:'low',
  notesEl:'Η αξιολόγηση αφορά κυρίως την πολιτική οπτική σε αμερικανικό πλαίσιο, όχι στάση απέναντι στην εκάστοτε κυβέρνηση.',
  notesEn:'The U.S.-centred AllSides rating is about ideological presentation, not allegiance to an incumbent government.'
 }},
 {test:/^reuters\b/i,profile:{
  name:'Reuters',ownerEl:'Thomson Reuters',ownerEn:'Thomson Reuters',
  ownershipSource:'https://www.thomsonreuters.com/en/about-us/trust-principles',
  biasEl:'Κέντρο (AllSides, υψηλή βεβαιότητα)',biasEn:'Center (AllSides, high confidence)',
  biasSource:'https://www.allsides.com/news-source/reuters-media-bias',biasConfidence:'high',
  notesEl:'Η ταξινόμηση περιγράφει την πολιτική οπτική, όχι την ακρίβεια ούτε την εύνοια προς κάποια κυβέρνηση.',
  notesEn:'This rating describes ideological presentation, not factual accuracy or closeness to a government.'
 }},
 {test:/^bbc\b/i,profile:{
  name:'BBC',ownerEl:'BBC / βρετανικός δημόσιος ραδιοτηλεοπτικός οργανισμός',ownerEn:'BBC / UK public-service broadcaster',
  ownershipSource:'https://www.bbc.com/aboutthebbc',
  notesEl:'Δημόσιος φορέας δεν σημαίνει αυτομάτως φιλοκυβερνητικό μέσο. Δεν διαθέτουμε εδώ συγκρίσιμη αξιολόγηση.',
  notesEn:'Public-service status does not itself establish a pro-government editorial line.'
 }},
 {test:/^al jazeera\b/i,profile:{
  name:'Al Jazeera',ownerEl:'Al Jazeera Media Network — μερική χρηματοδότηση από το κράτος του Κατάρ',ownerEn:'Al Jazeera Media Network — partly funded by the Qatari government',
  ownershipSource:'https://www.aljazeera.com/about-us',
  notesEl:'Η ίδια η Al Jazeera αναφέρει κρατική χρηματοδότηση εν μέρει. Δεν ταυτίζουμε χρηματοδότηση και πολιτική στάση ανά είδηση.',
  notesEn:'Al Jazeera publicly states partial government funding. Funding does not determine the stance of each report.'
 }},
 {test:/^associated press\b|^ap news\b|^the associated press\b/i,profile:{
  name:'Associated Press',ownerEl:'Ανεξάρτητος μη κερδοσκοπικός ειδησεογραφικός συνεταιρισμός',ownerEn:'Independent not-for-profit news cooperative',
  ownershipSource:'https://www.ap.org/about/our-people/',
  notesEl:'Ο συνεταιρισμός διοικείται από συμβούλιο που εκλέγεται από τα αμερικανικά μέλη του. Δεν αποδίδεται πολιτική βαθμολόγηση εδώ.',
  notesEn:'A cooperative governed by a board elected by U.S. news members; no political rating is assigned here.'
 }},
 {test:/^new york times\b|^the new york times\b|^nyt\b/i,profile:{
  name:'The New York Times',ownerEl:'The New York Times Company / έλεγχος από τον Ochs-Sulzberger Trust',ownerEn:'The New York Times Company / Ochs-Sulzberger Trust control',
  ownershipSource:'https://www.sec.gov/Archives/edgar/data/71691/000007169126000016/nyt-20260313.htm',
  notesEl:'Η οικογενειακή δομή ελέγχου τεκμηριώνεται στην ανακοίνωση προς την SEC το 2026. Δεν συναγάγουμε πολιτική ταύτιση.',
  notesEn:'Family control is documented in the company’s 2026 SEC proxy filing; no government alignment is inferred.'
 }},
 {test:/^france ?24\b/i,profile:{
  name:'France 24',ownerEl:'France Médias Monde / γαλλικός δημόσιος διεθνής ραδιοτηλεοπτικός όμιλος',ownerEn:'France Médias Monde / French public international broadcaster',
  ownershipSource:'https://www.francemediasmonde.com/fr/le-groupe/financement/',
  notesEl:'Δημόσια χρηματοδότηση, χωρίς αυτοματοποιημένη κρίση για πολιτική στάση ανά γεγονός.',
  notesEn:'Publicly funded; no automated inference about its stance on any story.'
 }},
 {test:/^un news\b/i,profile:{
  name:'UN News',ownerEl:'Οργανισμός Ηνωμένων Εθνών',ownerEn:'United Nations',
  ownershipSource:'https://news.un.org/en/',
  notesEl:'Θεσμική ενημερωτική υπηρεσία, όχι ανεξάρτητη εφημερίδα.',
  notesEn:'An institutional news service, not an independent news publisher.'
 }},
 {test:/^ert\b|^ερτ/i,profile:{
  name:'ΕΡΤ',ownerEl:'Ελληνική δημόσια ραδιοτηλεόραση',ownerEn:'Greek public-service broadcasting',
  ownershipSource:'https://www.ert.gr/',
  notesEl:'Δημόσιος χαρακτήρας, χωρίς αυθαίρετη αξιολόγηση σχέσης με την εκάστοτε κυβέρνηση.',
  notesEn:'Public broadcaster; no inferred allegiance to the sitting government.'
 }}
];
export function mediaProfile(name:string):MediaProfile|undefined{
 return media.find(x=>x.test.test(name))?.profile;
}
