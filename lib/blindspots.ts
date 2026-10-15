import type {Category, Signal, SourceStatus} from './types';

/**
 * A blind spot is a possible mismatch between a high-impact source signal and
 * headline coverage in a defined, observable sample. It NEVER proves silence,
 * censorship, factual accuracy or global news volume.
 */
export type Blindspot={
 id:string;signalId:string;title:string;summary:string;category:Category;source:string;url:string;
 importance:number;importanceRationale:{el:string;en:string};
 coverage:{matches:number;available:number;sample:string[];matchedOutlets:string[];windowHours:number;status:'limited'|'broad'|'insufficient'};
 topicQuery:string;timestamp:string;evidenceKind:'official-bulletin'|'official-event'|'source-report';
 caveat:{el:string;en:string};
};
export type BlindspotReport={generatedAt:string;sampleStatus:{monitored:number;online:number;eligible:number};candidates:Blindspot[];methodology:{el:string;en:string}};

export const GENERAL_FEEDS:Record<string,string>={
 'BBC World':'BBC','Guardian World':'The Guardian','Al Jazeera World':'Al Jazeera','ΕΡΤ Ειδήσεις':'ΕΡΤ'
};

const generic=new Set('world global today latest news report reports says said warns warning crisis urgent update live amid highlights explained a an the of to and for from in on at with over due new after before by as are was were is how what why who that has have it we they their more people community north south east west some remains future across towards this into emergency severe major just new year 2026 2025 un united nations nation nations humanitarian rights officials millions thousand thousands region concerns launched warns growing says report united called calls urge urged say aid'.split(' '));
const genericGreek=new Set('για και των της το τη την στον στο στην στα μια ένα από με που πως των έχουν είναι μετά τώρα αύξηση μεγάλες θέμα νέα νέες νέο κατά σημαντική σημαντικό παγκόσμιο κόσμο στις στη ως λόγω'.split(' '));
export function topicTokens(title:string):string[]{
 const clean=title.replace(/\bM\s*[3-9](?:\.\d+)?\b/gi,' ').toLocaleLowerCase();
 return [...new Set((clean.match(/[\p{L}]{4,}/gu)||[]).filter(x=>!generic.has(x)&&!genericGreek.has(x)))].slice(0,5);
}
const impactful:Array<{re:RegExp;weight:number;el:string;en:string}>=[
 {re:/\b(famine|starvation|food insecurity|λιμο[ύυ]|επισιτιστικ)/i,weight:88,el:'Επισιτιστική ασφάλεια / λιμός',en:'Food security / famine'},
 {re:/\b(cholera|ebola|mpox|measles|outbreak|επιδημ|χολέρα|έμπολα)/i,weight:83,el:'Υγειονομικό συμβάν',en:'Public-health event'},
 {re:/\b(displaced|displacement|refugees?|evacuat|εκτοπισ|πρόσφυγ|εκκένωσ)/i,weight:81,el:'Εκτοπισμός ή ανθρωπιστική κρίση',en:'Displacement / humanitarian crisis'},
 {re:/\b(civilian deaths|civilian casualties|killed|deaths|atrocities|massacre|νεκροί|άμαχ)/i,weight:83,el:'Αναφορές ανθρώπινων απωλειών',en:'Reported loss of life'},
 {re:/\b(drought|water shortage|drinking water|floods?|wildfires?|ξηρασί|πλημμύρ)/i,weight:74,el:'Νερό και φυσικοί κίνδυνοι',en:'Water and natural hazards'},
 {re:/\b(funding cuts|aid cuts|funding shortfall|humanitarian funding|χρηματοδότησ)/i,weight:76,el:'Κενό ανθρωπιστικής χρηματοδότησης',en:'Humanitarian funding gap'},
 {re:/\b(debt default|sovereign debt|bank failure|systemic banking|χρεοκοπ|δημοσιονομικ)/i,weight:76,el:'Χρηματοοικονομικός συστημικός κίνδυνος',en:'Financial systemic risk'},
 {re:/\b(grid failure|power outage|energy shortage|critical infrastructure|κυβερνοεπίθεσ)/i,weight:74,el:'Κρίσιμες υποδομές',en:'Critical infrastructure'},
 {re:/\b(conflict|ceasefire|airstrike|attacks|sanctions|σύγκρουσ|επίθεσ|κατάπαυσ)/i,weight:70,el:'Σύγκρουση / γεωπολιτική',en:'Conflict / geopolitics'}
];
function distinctBrand(source:string){if(source.startsWith('BBC'))return 'BBC';if(source.startsWith('Guardian'))return 'The Guardian';if(source.startsWith('Al Jazeera'))return 'Al Jazeera';if(source.startsWith('ΕΡΤ'))return 'ΕΡΤ';return source}
function isOfficial(signal:Signal){return signal.source.startsWith('UN News')||signal.source.includes('USGS')||signal.source.includes('NOAA')||signal.source.includes('NASA EONET')}
function candidateImportance(s:Signal):{score:number;kind:Blindspot['evidenceKind'];el:string;en:string}|null{
 if(s.category==='earth'&&s.source.includes('USGS')&&Number(s.rawValue)>=6){const m=s.rawValue!;return{score:m>=7?96:m>=6.5?88:78,kind:'official-event',el:`Σεισμικό μέγεθος M${m.toFixed(1)} κατά USGS. Το μέγεθος δεν αποδεικνύει ζημιές ή θύματα.`,en:`USGS-recorded M${m.toFixed(1)} earthquake. Magnitude alone does not establish damage or casualties.`};}
 if(s.source.includes('NOAA')&&s.score>=88)return{score:77,kind:'official-bulletin',el:'Δελτίο διαστημικού καιρού της NOAA με υψηλό ευρετικό δείκτη· ελέγξτε το επίσημο επίπεδο.',en:'NOAA space-weather bulletin flagged by a heuristic; check the official alert level.'};
 // Only the UN/official humanitarian source plus explicitly consequential keywords qualify.
 if(s.source.startsWith('UN News')){const match=impactful.find(x=>x.re.test(s.title+' '+s.summary));if(!match)return null;return{score:match.weight,kind:'source-report',el:`Θεματικός κανόνας: ${match.el}. Πρόκειται για υποψήφιο συμβάν προς αξιολόγηση, όχι αντικειμενική μέτρηση επιπτώσεων.`,en:`Topic rule: ${match.en}. This is a candidate for review, not an objective measurement of impact.`};}
 return null;
}
function matchesTopic(a:Signal,b:Signal){
 if(a.id===b.id)return false;
 if(a.category==='earth'&&a.source.includes('USGS'))return b.category==='earth'&&topicTokens(a.title).slice(0,3).filter(x=>topicTokens(b.title).includes(x)).length>=2;
 const aa=topicTokens(a.title);const bb=new Set(topicTokens(b.title+' '+b.summary));const common=aa.filter(x=>bb.has(x)).length;
 return aa.length>=2&&common>=2&&(common/aa.length>=.40);
}
export function detectBlindspots(signals:Signal[],sources:SourceStatus[],now=Date.now()):BlindspotReport{
 const statuses=Object.keys(GENERAL_FEEDS).filter(name=>sources.some(s=>s.source===name));
 const online=statuses.filter(name=>sources.some(s=>s.source===name&&s.ok));
 const sample=[...new Set(online.map(x=>GENERAL_FEEDS[x]))];
 const stories=signals.filter(s=>s.confidence==='publisher'&&now-Date.parse(s.timestamp)<=72*3600000&&now>=Date.parse(s.timestamp));
 const candidates:Blindspot[]=[];
 for(const s of signals){if(!isOfficial(s))continue;
  if(!Number.isFinite(Date.parse(s.timestamp))||Date.parse(s.timestamp)>now||now-Date.parse(s.timestamp)>72*3600000)continue;
  const significance=candidateImportance(s);if(!significance)continue;
  // For publisher-supplied UN headlines use publisher comparisons; for quakes additionally scan all retrieved headlines.
  const coverageStories=stories.filter(x=>Object.prototype.hasOwnProperty.call(GENERAL_FEEDS,x.source));
  const matches=coverageStories.filter(x=>matchesTopic(s,x));
  const brands=[...new Set(matches.map(x=>distinctBrand(x.source)))];
  const limited=sample.length>=3&&brands.length<=1;
  const coverageStatus:Blindspot['coverage']['status']=sample.length<3?'insufficient':limited?'limited':'broad';
  const tokens=topicTokens(s.title);
  candidates.push({id:`gap-${s.id}`,signalId:s.id,title:s.title,summary:s.summary,source:s.source,url:s.url,category:s.category,
   importance:significance.score,importanceRationale:{el:significance.el,en:significance.en},
   evidenceKind:significance.kind,topicQuery:tokens.slice(0,3).join(' '),timestamp:s.timestamp,
   coverage:{matches:brands.length,available:sample.length,sample,matchedOutlets:brands,windowHours:72,status:coverageStatus},
   caveat:{el:'Μετρά μόνο τίτλους πρόσφατων άρθρων σε συγκεκριμένα RSS, όχι όλα τα δημοσιεύματα ή τις τηλεοπτικές μεταδόσεις. Η αυτόματη ομοιότητα λέξεων μπορεί να χάσει συνώνυμα, άλλες γλώσσες και συναφή γεγονότα. Δεν τεκμηριώνει αποσιώπηση.',en:'Measures recent RSS headline matches in a limited sample, not full publisher coverage. Keyword matching misses synonyms, other languages and related stories. This is not evidence of suppression.'}
  });
 }
 const rank=(a:Blindspot)=>a.importance+(a.coverage.status==='limited'?20:a.coverage.status==='insufficient'?-22:-8)-a.coverage.matches*4;
 // Surface limited sample findings first; never present an insufficient sample as proven low coverage.
 candidates.sort((a,b)=>rank(b)-rank(a)||Date.parse(b.timestamp)-Date.parse(a.timestamp));
 return{generatedAt:new Date(now).toISOString(),sampleStatus:{monitored:statuses.length,online:online.length,eligible:sample.length},candidates:candidates.slice(0,16),methodology:{el:'Υποψήφια συμβάντα από επώνυμες πρωτογενείς πηγές (ΟΗΕ, USGS, NOAA). Η θεματική σοβαρότητα εκτιμάται με δημοσιευμένους κανόνες· η κάλυψη υπολογίζεται με αντιστοίχιση λέξεων σε ενεργές γενικές RSS ροές των τελευταίων 72 ωρών. Λιγότερες από 3 διαθέσιμες ροές => ανεπαρκή δεδομένα. Όχι παγκόσμιος μετρητής κάλυψης ή έλεγχος αλήθειας.',en:'Candidates come from named primary sources (UN News, USGS, NOAA). Impact is a disclosed topic-based estimate; attention uses headline keyword overlap among live general-news RSS feeds from the last 72 hours. Fewer than three available feeds => insufficient coverage data. Not a global coverage measure or fact check.'}};
}
