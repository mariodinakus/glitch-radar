export type SocialGroup='governance'|'society';
export type SocialIndicator={
 code:string;group:SocialGroup;el:string;en:string;explainEl:string;explainEn:string;
 unit:'score'|'percent'|'index'|'years'|'per100k'|'people'|'usd'|'usdpercapita'|'tonnes';
 digits:number
};
/** All measures have a worldwide scope: World Bank WLD aggregates where available,
 * and explicitly labelled, unweighted cross-country WGI means (NOT a World Bank world governance index). */
export const SOCIAL_INDICATORS:SocialIndicator[]=[
 {code:'GOV_WGI_VA_SC',group:'governance',el:'Συμμετοχή & λογοδοσία',en:'Voice & accountability',explainEl:'Μέσος όρος δημοσιευμένων εθνικών βαθμολογιών: δυνατότητα συμμετοχής πολιτών και δημόσιας λογοδοσίας.',explainEn:'Mean of published national scores: civic voice and public accountability.',unit:'score',digits:1},
 {code:'GOV_WGI_PV_SC',group:'governance',el:'Πολιτική σταθερότητα',en:'Political stability',explainEl:'Μέσος όρος χωρών για την εκτιμώμενη προστασία από πολιτική βία και αποσταθεροποίηση.',explainEn:'Mean country score for perceived risks of political violence and destabilization.',unit:'score',digits:1},
 {code:'GOV_WGI_GE_SC',group:'governance',el:'Κρατική αποτελεσματικότητα',en:'Government effectiveness',explainEl:'Μέσος όρος βαθμολογιών χωρών για την ποιότητα δημόσιων υπηρεσιών και πολιτικών.',explainEn:'Mean country score for perceived public-service quality and policy implementation.',unit:'score',digits:1},
 {code:'GOV_WGI_RL_SC',group:'governance',el:'Κράτος δικαίου',en:'Rule of law',explainEl:'Μέσος όρος χωρών σε ζητήματα εφαρμογής νόμων και λειτουργίας θεσμών.',explainEn:'Mean country score for perceived enforcement of laws and institutions.',unit:'score',digits:1},
 {code:'GOV_WGI_CC_SC',group:'governance',el:'Έλεγχος διαφθοράς',en:'Control of corruption',explainEl:'Μέσος όρος χωρών για την αντιλαμβανόμενη αντιμετώπιση κατάχρησης δημόσιας εξουσίας.',explainEn:'Mean country score for perceived control of abuse of public power.',unit:'score',digits:1},
 {code:'GOV_WGI_RQ_SC',group:'governance',el:'Ποιότητα ρυθμιστικού πλαισίου',en:'Regulatory quality',explainEl:'Μέσος όρος χωρών για την ποιότητα οικονομικών κανονισμών.',explainEn:'Mean country score for perceived regulatory quality.',unit:'score',digits:1},
 {code:'SP.POP.TOTL',group:'society',el:'Παγκόσμιος πληθυσμός',en:'World population',explainEl:'Συνολικοί κάτοικοι του πλανήτη κατά την Παγκόσμια Τράπεζα.',explainEn:'Total world population reported by the World Bank.',unit:'people',digits:2},
 {code:'NY.GDP.MKTP.CD',group:'society',el:'Παγκόσμιο ΑΕΠ',en:'World GDP',explainEl:'Συνολική οικονομική παραγωγή του κόσμου σε τρέχοντα δολάρια.',explainEn:'World economic output in current U.S. dollars.',unit:'usd',digits:1},
 {code:'NY.GDP.MKTP.KD.ZG',group:'society',el:'Παγκόσμια ανάπτυξη',en:'Global GDP growth',explainEl:'Ετήσια πραγματική μεταβολή του παγκόσμιου ΑΕΠ.',explainEn:'Annual real change in total world GDP.',unit:'percent',digits:1},
 {code:'SL.UEM.TOTL.ZS',group:'society',el:'Παγκόσμια ανεργία',en:'Global unemployment',explainEl:'Μερίδιο ανέργων στο εργατικό δυναμικό παγκοσμίως, όχι στο σύνολο του πληθυσμού.',explainEn:'Unemployed as a share of the world labor force, not all residents.',unit:'percent',digits:1},
 {code:'SL.UEM.1524.ZS',group:'society',el:'Ανεργία νέων παγκοσμίως',en:'Global youth unemployment',explainEl:'Ανεργία στο εργατικό δυναμικό ηλικίας 15–24 ετών.',explainEn:'Unemployment in the worldwide labor force aged 15–24.',unit:'percent',digits:1},
 {code:'SL.UEM.NEET.ZS',group:'society',el:'Νέοι εκτός εργασίας & εκπαίδευσης',en:'Young people outside work and education',explainEl:'Παγκόσμιο μερίδιο νέων χωρίς εργασία, εκπαίδευση ή κατάρτιση, όπου υπάρχει συγκρίσιμο άθροισμα.',explainEn:'Global share of youth not in employment, education or training where the global aggregate exists.',unit:'percent',digits:1},
 {code:'SP.DYN.LE00.IN',group:'society',el:'Παγκόσμιο προσδόκιμο ζωής',en:'Global life expectancy',explainEl:'Προσδόκιμο ζωής κατά τη γέννηση για ολόκληρο τον παγκόσμιο πληθυσμό.',explainEn:'Life expectancy at birth for the world population.',unit:'years',digits:1},
 {code:'IT.NET.USER.ZS',group:'society',el:'Πρόσβαση στο διαδίκτυο',en:'Internet access',explainEl:'Ποσοστό του παγκόσμιου πληθυσμού που χρησιμοποιεί το διαδίκτυο.',explainEn:'Percentage of world residents using the internet.',unit:'percent',digits:1},
 {code:'EN.ATM.CO2E.PC',group:'society',el:'Εκπομπές CO₂ ανά κάτοικο',en:'CO₂ emissions per person',explainEl:'Παγκόσμια ανθρακικά αέρια από ορυκτά καύσιμα και βιομηχανία ανά κάτοικο, σε τόνους.',explainEn:'Worldwide fossil and industrial CO₂ emissions per person in tonnes.',unit:'tonnes',digits:2},
 {code:'SH.XPD.CHEX.GD.ZS',group:'society',el:'Παγκόσμιες δαπάνες υγείας',en:'Global health expenditure',explainEl:'Τρέχουσες δαπάνες υγείας ως μερίδιο του παγκόσμιου ΑΕΠ.',explainEn:'Current healthcare expenditure as a share of world GDP.',unit:'percent',digits:1}
];
