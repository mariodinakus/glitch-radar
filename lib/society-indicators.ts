export type SocialGroup='governance'|'society';
export type SocialIndicator={code:string;group:SocialGroup;el:string;en:string;explainEl:string;explainEn:string;unit:'score'|'percent'|'index'|'years'|'per100k';digits:number};
export const SOCIAL_INDICATORS:SocialIndicator[]=[
 {code:'GOV_WGI_VA_SC',group:'governance',el:'Φωνή πολιτών & λογοδοσία',en:'Voice & accountability',explainEl:'Κατά πόσο οι πολίτες μπορούν να συμμετέχουν και να ελέγχουν την εξουσία, σύμφωνα με συνδυασμό ερευνών και εκτιμήσεων.',explainEn:'Perceptions of participation, freedom of expression and government accountability.',unit:'score',digits:1},
 {code:'GOV_WGI_PV_SC',group:'governance',el:'Πολιτική σταθερότητα',en:'Political stability',explainEl:'Εκτίμηση για το πόσο ασφαλής είναι η πολιτική λειτουργία από βίαιη ή αντισυνταγματική αποσταθεροποίηση. Δεν προβλέπει εκλογές.',explainEn:'Perceived risk of violent or unconstitutional destabilization; not an election forecast.',unit:'score',digits:1},
 {code:'GOV_WGI_GE_SC',group:'governance',el:'Αποτελεσματικότητα κράτους',en:'Government effectiveness',explainEl:'Αξιολόγηση της ποιότητας δημόσιων υπηρεσιών και της εφαρμογής πολιτικών.',explainEn:'Perceived public-service quality and policy implementation.',unit:'score',digits:1},
 {code:'GOV_WGI_RL_SC',group:'governance',el:'Κράτος δικαίου',en:'Rule of law',explainEl:'Εκτίμηση για την εφαρμογή νόμων, δικαστική λειτουργία και προστασία δικαιωμάτων.',explainEn:'Perceptions of law enforcement, justice and rights protection.',unit:'score',digits:1},
 {code:'GOV_WGI_CC_SC',group:'governance',el:'Έλεγχος διαφθοράς',en:'Control of corruption',explainEl:'Πόσο αποτελεσματικά περιορίζεται η χρήση δημόσιας εξουσίας για ιδιωτικό όφελος.',explainEn:'Perceived ability to limit misuse of public power for private gain.',unit:'score',digits:1},
 {code:'GOV_WGI_RQ_SC',group:'governance',el:'Ποιότητα κανονισμών',en:'Regulatory quality',explainEl:'Εκτίμηση για την ποιότητα των κανόνων και πολιτικών που διέπουν την οικονομική δραστηριότητα.',explainEn:'Perceived quality of regulation and market policy.',unit:'score',digits:1},
 {code:'SL.UEM.TOTL.ZS',group:'society',el:'Ανεργία',en:'Unemployment',explainEl:'Ποσοστό του εργατικού δυναμικού που δεν εργάζεται, αναζητά εργασία και είναι διαθέσιμο.',explainEn:'Share of the labor force unemployed, seeking and available for work.',unit:'percent',digits:1},
 {code:'SL.UEM.1524.ZS',group:'society',el:'Ανεργία νέων',en:'Youth unemployment',explainEl:'Ανεργία μεταξύ ατόμων 15–24 ετών που συμμετέχουν στο εργατικό δυναμικό, όχι σε όλους τους νέους.',explainEn:'Unemployment among labor force participants aged 15–24, not all young people.',unit:'percent',digits:1},
 {code:'SL.UEM.NEET.ZS',group:'society',el:'Νέοι εκτός εργασίας & εκπαίδευσης',en:'Youth NEET',explainEl:'Ποσοστό νέων που δεν εργάζονται ούτε συμμετέχουν σε εκπαίδευση ή κατάρτιση.',explainEn:'Young people not in employment, education or training.',unit:'percent',digits:1},
 {code:'SI.POV.GINI',group:'society',el:'Εισοδηματική ανισότητα (Gini)',en:'Income inequality (Gini)',explainEl:'Μετρά την ανισότητα κατανομής εισοδήματος: το 0 δηλώνει πλήρη ισότητα, το 100 απόλυτη ανισότητα.',explainEn:'Income inequality index: 0 means equal distribution, 100 means maximum inequality.',unit:'index',digits:1},
 {code:'SP.DYN.LE00.IN',group:'society',el:'Προσδόκιμο ζωής',en:'Life expectancy',explainEl:'Τα αναμενόμενα έτη ζωής κατά τη γέννηση με βάση τα πρότυπα θνησιμότητας.',explainEn:'Expected years of life at birth based on observed mortality rates.',unit:'years',digits:1},
 {code:'VC.IHR.PSRC.P5',group:'society',el:'Ανθρωποκτονίες ανά 100.000',en:'Homicides per 100,000',explainEl:'Καταγεγραμμένες ανθρωποκτονίες ανά 100.000 κατοίκους. Διαθεσιμότητα και έτη διαφέρουν ανά χώρα.',explainEn:'Recorded intentional homicides per 100,000 people. Coverage varies by country.',unit:'per100k',digits:1},
 {code:'SH.XPD.CHEX.GD.ZS',group:'society',el:'Δαπάνες υγείας / ΑΕΠ',en:'Health spending / GDP',explainEl:'Τρέχουσες δημόσιες και ιδιωτικές δαπάνες υγείας ως ποσοστό του ΑΕΠ.',explainEn:'Current public and private health spending as a share of GDP.',unit:'percent',digits:1},
 {code:'SE.XPD.TOTL.GD.ZS',group:'society',el:'Δημόσιες δαπάνες εκπαίδευσης / ΑΕΠ',en:'Public education spending / GDP',explainEl:'Δημόσιες δαπάνες για εκπαίδευση σε σχέση με το μέγεθος της οικονομίας.',explainEn:'Government education spending as a share of GDP.',unit:'percent',digits:1}
];
export const SOCIAL_COUNTRIES=[
 {id:'GR',el:'Ελλάδα',en:'Greece'},{id:'US',el:'ΗΠΑ',en:'United States'},
 {id:'DE',el:'Γερμανία',en:'Germany'},{id:'FR',el:'Γαλλία',en:'France'},
 {id:'IT',el:'Ιταλία',en:'Italy'},{id:'GB',el:'Ηνωμένο Βασίλειο',en:'United Kingdom'},
 {id:'TR',el:'Τουρκία',en:'Türkiye'}
] as const;
