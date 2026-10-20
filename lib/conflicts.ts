import type {Story} from './stories';

/** Active wars / armed conflicts tracked by the GLITCH war room. Matching is on headlines only. */
export type Conflict={id:string;el:string;en:string;rx:RegExp;indicators:string[];market:RegExp;descEl:string;descEn:string};
export const conflicts:Conflict[]=[
 {id:'iran',el:'Πόλεμος με το Ιράν',en:'Iran war',rx:/\b(iran\w*|tehran|hormuz|irgc|khamenei|pezeshkian|isfahan|natanz|fordow)\b|ιράν|τεχεράν|ορμούζ|χαμενεΐ/iu,
  indicators:['BZ=F','CL=F','GC=F','^GSPC'],market:/iran|hormuz|khamenei|tehran/i,descEl:'Σύγκρουση με επίκεντρο το Ιράν, τον Περσικό Κόλπο και τα Στενά του Ορμούζ.',descEn:'Conflict centred on Iran, the Gulf and the Strait of Hormuz.'},
 {id:'gaza',el:'Ισραήλ – Γάζα',en:'Israel – Gaza',rx:/\b(gaza\w*|hamas|west bank|netanyahu|rafah|palestinian\w*)\b|γάζα|χαμάς|παλαιστιν|δυτική όχθη|νετανιάχου/iu,
  indicators:['BZ=F','GC=F','^TA125.TA'],market:/gaza|hamas|israel|netanyahu|hezbollah|lebanon/i,descEl:'Ο πόλεμος στη Γάζα και η σύγκρουση στη Δυτική Όχθη.',descEn:'The Gaza war and violence in the West Bank.'},
 {id:'ukraine',el:'Ουκρανία – Ρωσία',en:'Ukraine – Russia',rx:/\b(ukrain\w*|kyiv|kiev|zelensky\w*|kremlin|putin|donbas|donetsk|zaporizhzhia|kharkiv|crimea|russian (?:drone|missile|strike|forces|troops))\b|ουκραν|ζελένσκ|κίεβο|πούτιν|κρεμλίν|ντονμπάς/iu,
  indicators:['TTF=F','ZW=F','EURUSD=X','^STOXX50E'],market:/ukrain|russia|putin|zelensk|ceasefire/i,descEl:'Ο πόλεμος από τη ρωσική εισβολή του 2022 — μέτωπα, επιθέσεις, διαπραγματεύσεις.',descEn:'The war since Russia’s 2022 invasion — fronts, strikes, negotiations.'},
 {id:'sudan',el:'Εμφύλιος στο Σουδάν',en:'Sudan civil war',rx:/\b(sudan\w*|darfur|khartoum|el.?fasher|rsf|rapid support forces)\b|σουδάν|νταρφούρ/iu,
  indicators:['GC=F'],market:/sudan/i,descEl:'Ο πόλεμος στρατού και RSF — η μεγαλύτερη ανθρωπιστική κρίση στον κόσμο.',descEn:'Army vs RSF — the world’s largest humanitarian crisis.'},
 {id:'yemen',el:'Υεμένη & Ερυθρά Θάλασσα',en:'Yemen & Red Sea',rx:/\b(yemen\w*|houthis?|red sea|bab.el.mandeb|sanaa|aden)\b|υεμέν|χούθι|ερυθρά θάλασσα/iu,
  indicators:['BZ=F'],market:/houthi|yemen|red sea/i,descEl:'Οι Χούθι, οι επιθέσεις στη ναυσιπλοΐα και οι επιδρομές στην Υεμένη.',descEn:'The Houthis, shipping attacks and strikes on Yemen.'},
 {id:'congo',el:'Ανατολικό Κονγκό',en:'Eastern Congo',rx:/\b(congo\w*|drc|m23|goma|kinshasa|bukavu)\b|κονγκό/iu,
  indicators:['HG=F'],market:/congo|m23/i,descEl:'Η σύγκρουση με τους αντάρτες M23 και την εμπλοκή της Ρουάντα.',descEn:'The M23 rebellion and Rwanda’s role.'},
 {id:'myanmar',el:'Μιανμάρ',en:'Myanmar',rx:/\b(myanmar|burma\w*|rohingya|junta)\b|μιανμάρ|ροχίνγκια/iu,indicators:[],market:/myanmar/i,descEl:'Ο εμφύλιος μετά το πραξικόπημα του 2021.',descEn:'The civil war after the 2021 coup.'},
 {id:'kashmir',el:'Ινδία – Πακιστάν',en:'India – Pakistan',rx:/\b(kashmir\w*|india.{0,40}pakistan|pakistan.{0,40}india|line of control)\b|κασμίρ/iu,indicators:[],market:/india|pakistan|kashmir/i,descEl:'Η ένταση γύρω από το Κασμίρ.',descEn:'Tensions over Kashmir.'},
 {id:'venezuela',el:'ΗΠΑ – Βενεζουέλα',en:'US – Venezuela',rx:/\b(venezuel\w*|maduro|caracas)\b|βενεζουέλ|μαδούρο/iu,indicators:['CL=F'],market:/venezuela|maduro/i,descEl:'Η αμερικανική πίεση και οι στρατιωτικές κινήσεις γύρω από τη Βενεζουέλα.',descEn:'US pressure and military moves around Venezuela.'},
 {id:'lebanon',el:'Λίβανος – Χεζμπολάχ',en:'Lebanon – Hezbollah',rx:/(?:\b(?:hezbollah|lebanon|lebanese|beirut|southern lebanon|litani)\b|λιβάν|χεζμπολάχ|βηρυτός)/iu,indicators:[],market:/(?:lebanon|hezbollah)/i,descEl:'Λιβανική μεθόριος, επιθέσεις και διαπραγματεύσεις.',descEn:'Border fighting, strikes and negotiations.'},
 {id:'ethiopia',el:'Αιθιοπία – Τιγκράι',en:'Ethiopia – Tigray',rx:/(?:\b(?:ethiopia|ethiopian|tigray|amhara|oromia|eritrea|eritrean|addis ababa|zalambessa)\b|αιθιοπ|τιγκρά|ερυθραία|ερίτρεα)/iu,indicators:[],market:/(?:ethiopia)/i,descEl:'Ένοπλες συγκρούσεις και περιφερειακή αστάθεια στην Αιθιοπία και γύρω από την Τιγκράι.',descEn:'Armed clashes and regional instability in Ethiopia and Tigray.'},
 {id:'somalia',el:'Σομαλία – Αλ Σαμπάμπ',en:'Somalia – Al-Shabaab',rx:/(?:\b(?:somalia|somali|al.shabaab|mogadishu|puntland|jubaland)\b|σομαλί|σαμπάμπ)/iu,indicators:[],market:/(?:somalia)/i,descEl:'Συγκρούσεις με την Αλ Σαμπάμπ και άλλες ένοπλες ομάδες.',descEn:'Clashes involving al-Shabaab and other armed groups.'},
 {id:'southsudan',el:'Νότιο Σουδάν',en:'South Sudan',rx:/(?:\b(?:south sudan|juba|unity state|jonglei|malakal)\b|νότιο σουδάν|τζούμπα)/iu,indicators:[],market:/(?:southsudan)/i,descEl:'Ένοπλες συγκρούσεις και εύθραυστη πολιτική μετάβαση.',descEn:'Armed clashes and a fragile political transition.'},
 {id:'mali',el:'Μάλι – Σαχέλ',en:'Mali – Sahel',rx:/(?:\b(?:mali|malian|bamako|timbuktu|jnim|azawad)\b|μάλι|σαχέλ|μπαμακό)/iu,indicators:[],market:/(?:mali)/i,descEl:'Εξεγέρσεις και τζιχαντιστική βία στο Μάλι.',descEn:'Insurgencies and jihadist violence in Mali.'},
 {id:'burkina',el:'Μπουρκίνα Φάσο',en:'Burkina Faso',rx:/(?:\b(?:burkina faso|burkinabe|ouagadougou)\b|μπουρκίνα)/iu,indicators:[],market:/(?:burkina)/i,descEl:'Ένοπλη βία και εκτοπισμός πληθυσμών στην περιοχή του Σαχέλ.',descEn:'Armed violence and displacement in the Sahel.'},
 {id:'niger',el:'Νίγηρας – Σαχέλ',en:'Niger – Sahel',rx:/(?:\b(?:niger(?:ien)?|niamey|tillaberi|agadez)\b|νίγηρας|νιγηρικός|νιαμέι)/iu,indicators:[],market:/(?:niger)/i,descEl:'Συγκρούσεις με ένοπλες οργανώσεις και πολιτική αστάθεια.',descEn:'Armed-group violence and political instability.'},
 {id:'car',el:'Κεντροαφρικανική Δημοκρατία',en:'Central African Republic',rx:/(?:\b(?:central african republic|bangui|bria|bossangoa)\b|κεντροαφρικανικ)/iu,indicators:[],market:/(?:car)/i,descEl:'Τοπικές συγκρούσεις ένοπλων ομάδων και κρατικών δυνάμεων.',descEn:'Localized clashes between armed groups and state forces.'},
 {id:'nigeria',el:'Νιγηρία – Μπόκο Χαράμ',en:'Nigeria – Boko Haram',rx:/(?:\b(?:nigeria|nigerian|boko haram|iswap|maiduguri|borno state)\b|νιγηρί|μπόκο χαράμ)/iu,indicators:[],market:/(?:nigeria)/i,descEl:'Ένοπλες οργανώσεις και επιθέσεις κυρίως στη βορειοανατολική Νιγηρία.',descEn:'Militant violence, especially in northeastern Nigeria.'},
 {id:'cameroon',el:'Καμερούν – Αγγλόφωνες περιοχές',en:'Cameroon – Anglophone regions',rx:/(?:\b(?:cameroon|cameroonian|ambazonia|bamenda|buea)\b|καμερούν|αμπαζονία)/iu,indicators:[],market:/(?:cameroon)/i,descEl:'Παρατεταμένη ένοπλη διαμάχη σε αγγλόφωνες περιοχές.',descEn:'Long-running armed conflict in Anglophone regions.'},
 {id:'mozambique',el:'Μοζαμβίκη – Κάμπο Ντελγκάντο',en:'Mozambique – Cabo Delgado',rx:/(?:\b(?:mozambique|mozambican|cabo delgado|pemba|mocimboa)\b|μοζαμβίκ|κάμπο ντελγκάντο)/iu,indicators:[],market:/(?:mozambique)/i,descEl:'Ένοπλη εξέγερση στη βόρεια Μοζαμβίκη.',descEn:'Insurgency in northern Mozambique.'},
 {id:'syria',el:'Συρία',en:'Syria',rx:/(?:\b(?:syria|syrian|damascus|aleppo|idlib|sdf|raqqa|al.sharaa)\b|συρί|δαμασκός|χαλέπι)/iu,indicators:[],market:/(?:syria)/i,descEl:'Εύθραυστη μετάβαση και κατά τόπους ένοπλες συγκρούσεις.',descEn:'Fragile transition and localized armed clashes.'},
 {id:'iraq',el:'Ιράκ – ένοπλες ομάδες',en:'Iraq – armed groups',rx:/(?:\b(?:iraq|iraqi|baghdad|mosul|erbil|kirkuk|peshmerga)\b|ιράκ|βαγδάτη|κουρδιστάν)/iu,indicators:[],market:/(?:iraq)/i,descEl:'Παραστρατιωτικές οργανώσεις, ασφάλεια και περιφερειακή ένταση.',descEn:'Militias, security and regional tensions.'},
 {id:'libya',el:'Λιβύη',en:'Libya',rx:/(?:\b(?:libya|libyan|tripoli|benghazi|haftar)\b|λιβύ|τρίπολη λιβύης|μπεγγάζη)/iu,indicators:[],market:/(?:libya)/i,descEl:'Αντίπαλες αρχές, ένοπλες ομάδες και πολιτική αστάθεια.',descEn:'Rival authorities, militias and political instability.'},
 {id:'haiti',el:'Αϊτή – ένοπλες συμμορίες',en:'Haiti – armed gangs',rx:/(?:\b(?:haiti|haitian|port.au.prince|viv ansanm)\b|αϊτή|πόρτ ο πρενς)/iu,indicators:[],market:/(?:haiti)/i,descEl:'Βία ένοπλων συμμοριών και ανθρωπιστική κρίση.',descEn:'Armed gang violence and a humanitarian crisis.'},
 {id:'afghanpak',el:'Αφγανιστάν – Πακιστάν',en:'Afghanistan – Pakistan',rx:/(?:\b(?:afghanistan|afghan|taliban|kabul|pakistan|pakistani|peshawar|durand line|ttp)\b|αφγανιστάν|πακιστάν|ταλιμπάν|καμπούλ)/iu,indicators:[],market:/(?:afghanpak)/i,descEl:'Διασυνοριακά επεισόδια και επιθέσεις ένοπλων ομάδων.',descEn:'Cross-border clashes and militant attacks.'},
 {id:'balochistan',el:'Μπαλουχιστάν',en:'Balochistan',rx:/(?:\b(?:balochistan|baloch|quetta|baloch liberation army)\b|μπαλουχιστάν|μπαλούχ)/iu,indicators:[],market:/(?:balochistan)/i,descEl:'Αυτονομιστικές επιθέσεις και συγκρούσεις στη νοτιοδυτική Ασία.',descEn:'Separatist attacks and clashes in southwest Asia.'},
 {id:'colombia',el:'Κολομβία – ένοπλες οργανώσεις',en:'Colombia – armed groups',rx:/(?:\b(?:colombia|colombian|eln\b|farc|catatumbo|cauca)\b|κολομβία|κολομβιαν)/iu,indicators:[],market:/(?:colombia)/i,descEl:'Συγκρούσεις ένοπλων ομάδων και δυσκολίες της ειρηνευτικής διαδικασίας.',descEn:'Armed-group clashes and difficulties in the peace process.'},
 {id:'mexico',el:'Μεξικό – οργανωμένο έγκλημα',en:'Mexico – organized crime',rx:/(?:\b(?:mexico|mexican|sinaloa|jalisco cartel|cjng|culiacan)\b|μεξικ|σιναλόα)/iu,indicators:[],market:/(?:mexico)/i,descEl:'Σοβαρή ένοπλη εγκληματική βία, όχι διακρατικός πόλεμος.',descEn:'Severe organized criminal violence, not an interstate war.'},
 {id:'armenia',el:'Αρμενία – Αζερμπαϊτζάν',en:'Armenia – Azerbaijan',rx:/(?:\b(?:armenia|armenian|azerbaijan|azerbaijani|nagorno.karabakh|baku|yerevan)\b|αρμενία|αζερμπαϊτζάν|ναγκόρνο)/iu,indicators:[],market:/(?:armenia)/i,descEl:'Περιφερειακή ένταση και ειρηνευτική διαδικασία.',descEn:'Regional tensions and a peace process.'},
 {id:'taiwan',el:'Ταϊβάν – Στενό της Ταϊβάν',en:'Taiwan Strait',rx:/(?:\b(?:taiwan|taiwanese|taipei|taiwan strait|cross.strait)\b|ταϊβάν|ταϊπέι)/iu,indicators:[],market:/(?:taiwan)/i,descEl:'Στρατιωτική ένταση, όχι επιβεβαιωμένος εν εξελίξει πόλεμος.',descEn:'Military tensions, not a confirmed ongoing war.'},
 {id:'southchina',el:'Νότια Σινική Θάλασσα',en:'South China Sea',rx:/(?:\b(?:south china sea|spratly|scarborough shoal|second thomas shoal)\b|νότια σινική θάλασσα)/iu,indicators:[],market:/(?:southchina)/i,descEl:'Θαλάσσιες διεκδικήσεις και επεισόδια χωρίς γενικευμένο πόλεμο.',descEn:'Maritime disputes and incidents, not a generalized war.'},
 {id:'korea',el:'Κορεατική χερσόνησος',en:'Korean Peninsula',rx:/(?:\b(?:north korea|south korea|pyongyang|kim jong un|korean peninsula)\b|βόρεια κορέα|νότια κορέα|πιονγκγιάνγκ)/iu,indicators:[],market:/(?:korea)/i,descEl:'Στρατιωτική ένταση και αποτροπή.',descEn:'Military tension and deterrence.'},
 {id:'philippines',el:'Φιλιππίνες – ένοπλες ομάδες',en:'Philippines – armed groups',rx:/(?:\b(?:philippines|philippine|mindanao|bangsamoro|abu sayyaf)\b|φιλιππίν|μιντανάο)/iu,indicators:[],market:/(?:philippines)/i,descEl:'Ένοπλες οργανώσεις και τοπικές συγκρούσεις.',descEn:'Militant groups and localized clashes.'}
];

/** Static editorial coverage directory, not a real-time conflict census or battle monitor.
 *  Kind is descriptive only. A news count of zero means no matching reports in our feed. */
export type ConflictRegion='europe'|'mena'|'africa'|'asia'|'americas';
export type ConflictKind='war'|'armed'|'instability'|'tension';
export const conflictMeta:Record<string,{region:ConflictRegion;kind:ConflictKind;lat:number;lon:number}>={
 ukraine:{region:'europe',kind:'war',lat:49,lon:32},iran:{region:'mena',kind:'war',lat:32,lon:53},
 gaza:{region:'mena',kind:'war',lat:31.4,lon:34.4},lebanon:{region:'mena',kind:'armed',lat:33.8,lon:35.8},
 yemen:{region:'mena',kind:'war',lat:15.5,lon:47},sudan:{region:'africa',kind:'war',lat:15,lon:30},
 congo:{region:'africa',kind:'armed',lat:-1.7,lon:29.2},myanmar:{region:'asia',kind:'war',lat:21.6,lon:96},
 kashmir:{region:'asia',kind:'tension',lat:34.2,lon:74.5},venezuela:{region:'americas',kind:'instability',lat:8,lon:-66},
 ethiopia:{region:'africa',kind:'armed',lat:13.5,lon:39.5},somalia:{region:'africa',kind:'armed',lat:5,lon:46},
 southsudan:{region:'africa',kind:'armed',lat:7.7,lon:30.5},mali:{region:'africa',kind:'armed',lat:17,lon:-3},
 burkina:{region:'africa',kind:'armed',lat:12.3,lon:-1.6},niger:{region:'africa',kind:'armed',lat:17,lon:8},
 car:{region:'africa',kind:'armed',lat:6.5,lon:20.8},nigeria:{region:'africa',kind:'armed',lat:11.5,lon:13.5},
 cameroon:{region:'africa',kind:'armed',lat:5.9,lon:10},mozambique:{region:'africa',kind:'armed',lat:-12.7,lon:40.5},
 syria:{region:'mena',kind:'instability',lat:35,lon:38},iraq:{region:'mena',kind:'instability',lat:33,lon:43},
 libya:{region:'mena',kind:'instability',lat:28,lon:18},haiti:{region:'americas',kind:'armed',lat:18.55,lon:-72.3},
 afghanpak:{region:'asia',kind:'armed',lat:33,lon:69.5},balochistan:{region:'asia',kind:'armed',lat:29,lon:66},
 colombia:{region:'americas',kind:'armed',lat:4,lon:-73.5},mexico:{region:'americas',kind:'armed',lat:25,lon:-107},
 armenia:{region:'asia',kind:'tension',lat:40.5,lon:46},taiwan:{region:'asia',kind:'tension',lat:24,lon:121},
 southchina:{region:'asia',kind:'tension',lat:12,lon:114},korea:{region:'asia',kind:'tension',lat:38,lon:127},
 philippines:{region:'asia',kind:'armed',lat:7.5,lon:124}
};

export const conflictById=(id:string)=>conflicts.find(c=>c.id===id);

const titlesOf=(s:Story)=>[s.headline.title,...s.reports.slice(0,8).map(r=>r.title)];
// Country mentions alone (e.g. a sports or economic headline) are not proof of conflict.
// Require concrete security/armed-conflict context for broadly named regions.
const securityContext=/\b(war|wars|battle|battles|fighting|clash|clashes|armed|militan\w*|insurgen\w*|rebel\w*|terror\w*|jihad\w*|troops|military|attack\w*|strike\w*|missile\w*|bomb\w*|shooting\w*|dead|killed|wounded|casualt\w*|civilian|ceasefire|truce|peace talks|frontline|occupation|captur\w*|territor\w*|humanitarian crisis|coup|security crisis|gang violence)\b|πόλεμ|μάχ|ένοπλ|συγκρούσ|αντάρτ|τρομοκρατ|στρατ|επίθεσ|βομβαρδ|νεκρ|θύματ|τραυματ|εκεχειρ|εδαφ|κατοχ|πραξικόπ/iu;
const requireSecurity=new Set(['ethiopia','somalia','southsudan','mali','burkina','niger','car','nigeria','cameroon','mozambique','syria','iraq','libya','haiti','afghanpak','colombia','mexico','armenia','taiwan','korea','philippines','venezuela','lebanon']);
export function storiesForConflict(stories:Story[],c:Conflict):Story[]{
 return stories.filter(s=>{const t=titlesOf(s);const matched=c.rx.test(s.headline.title)||t.filter(x=>c.rx.test(x)).length>=2;
  return matched&&(!requireSecurity.has(c.id)||t.some(x=>securityContext.test(x)));
 });
}
export type ConflictSummary={c:Conflict;stories:Story[];last24:number;sources:number;image?:string;heat:number};
export function conflictSummaries(stories:Story[],now=Date.now()):ConflictSummary[]{
 return conflicts.map(c=>{
  const list=storiesForConflict(stories,c);
  const last24=list.filter(s=>now-Date.parse(s.lastAt)<24*3600000).length;
  const sources=new Set(list.flatMap(s=>s.sources)).size;
  return {c,stories:list,last24,sources,image:list.find(s=>s.image)?.image,heat:last24*3+sources+list.length};
 }).sort((a,b)=>b.heat-a.heat);
}
