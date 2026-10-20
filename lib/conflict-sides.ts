/** Editorial, source-linked actor snapshots. Not a real-time belligerent database.
 * Every backer is individually qualified: political, material, reported or historic.
 * The list is deliberately incomplete; omission is not a claim of neutrality. */
export type ConflictLink={el:string;en:string;howEl:string;howEn:string;basis:'documented'|'reported'|'historical'};
export type ConflictCamp={
 nameEl:string;nameEn:string;roleEl:string;roleEn:string;
 support:ConflictLink[];
};
export type ConflictProfile={
 updated:string;kind:'armed'|'tension';camps:[ConflictCamp,ConflictCamp];
 contextEl:string;contextEn:string;
 sources:{name:string;url:string}[];
};
const back=(el:string,en:string,howEl:string,howEn:string,basis:ConflictLink['basis']='documented'):ConflictLink=>({el,en,howEl,howEn,basis});
const camp=(nameEl:string,nameEn:string,roleEl:string,roleEn:string,support:ConflictLink[]):ConflictCamp=>({nameEl,nameEn,roleEl,roleEn,support});
export const conflictProfiles:Record<string,ConflictProfile>={
 ukraine:{updated:'2026-10-15',kind:'armed',
  camps:[
   camp('Ουκρανικές ένοπλες δυνάμεις','Ukrainian armed forces','Υπερασπίζονται την ουκρανική κυριαρχία','Defending Ukrainian sovereignty',[
    back('Ευρωπαϊκή Ένωση / ευρωπαϊκές χώρες','European Union / European states','Χρηματοδότηση, όπλα, εκπαίδευση και κυρώσεις στη Ρωσία','Financial assistance, military materiel, training and sanctions'),
    back('ΗΠΑ','United States','Μεταβαλλόμενη στρατιωτική, πληροφοριακή και διπλωματική στήριξη· δεν αποτελούν εμπόλεμη πλευρά','Military, intelligence and diplomatic role has changed; not a belligerent')
   ]),
   camp('Ρωσικές ένοπλες δυνάμεις','Russian armed forces','Δυνάμεις εισβολής και κατοχής εδαφών','Invading and occupying forces',[
    back('Λευκορωσία','Belarus','Έδαφος, υλικοτεχνικές δυνατότητες και στρατηγική συνεργασία','Territory, logistical access and strategic cooperation'),
    back('Βόρεια Κορέα','North Korea','Πυρομαχικά και, σύμφωνα με CFR, στρατεύματα','Ammunition and, per CFR, troops'),
    back('Ιράν','Iran','Τεχνολογία και προηγούμενες προμήθειες μη επανδρωμένων αεροσκαφών','Drone technology and earlier supplies'),
    back('Κίνα','China','Οικονομικοί δεσμοί και αγαθά διπλής χρήσης· όχι τεκμηριωμένη άμεση εμπλοκή στον πόλεμο','Economic ties and dual-use goods, not a claim of direct combat participation','reported')
   ])
  ],
  contextEl:'Η υποστήριξη στην Ουκρανία διαφέρει ανά χώρα και χρονική περίοδο. Η ιδιότητα μέλους του ΝΑΤΟ δεν σημαίνει αυτομάτως ότι το ΝΑΤΟ πολεμά ως οργανισμός.',
  contextEn:'Support for Ukraine varies by country and over time. NATO membership does not mean NATO itself is a belligerent.',
  sources:[{name:'CFR · War in Ukraine (15 Oct 2026)',url:'https://www.cfr.org/global-conflict-tracker/conflict/conflict-ukraine'}]
 },
 sudan:{updated:'2026-08-17',kind:'armed',
  camps:[
   camp('Σουδανικές ένοπλες δυνάμεις (SAF)','Sudanese Armed Forces (SAF)','Κρατικός στρατός υπό τον Μπουρχάν','State military under al-Burhan',[
    back('Αίγυπτος','Egypt','Στρατιωτικές σχέσεις και, σύμφωνα με ACLED, υλική στήριξη','Military links and materiel support reported by ACLED','reported'),
    back('Τουρκία, Ιράν και Ρωσία','Türkiye, Iran and Russia','Αναφερόμενες προμήθειες στρατιωτικής τεχνολογίας· διαφέρουν ανά προμηθευτή','Reported military-technology supplies, varying by supplier','reported')
   ]),
   camp('Δυνάμεις Ταχείας Υποστήριξης (RSF)','Rapid Support Forces (RSF)','Παραστρατιωτική οργάνωση υπό τον Χεμεντί','Paramilitary forces under Hemedti',[
    back('Ηνωμένα Αραβικά Εμιράτα','United Arab Emirates','Η ACLED καταγράφει αναφορές όπλων/μη επανδρωμένων μέσω περιφερειακών διαδρομών· αμφισβητούμενη εμπλοκή','ACLED reports weapons and drones via regional routes; involvement is disputed','reported')
   ])
  ],
  contextEl:'Οι ισχυρισμοί για εξωτερική στήριξη προέρχονται από ερευνητικές αναφορές. Δεν σημαίνει ότι τα αναφερόμενα κράτη συμμετέχουν επισήμως στις μάχες.',
  contextEn:'External-backing claims come from research reporting. They do not automatically mean these states are formally participating in combat.',
  sources:[{name:'CFR · Sudan (17 Aug 2026)',url:'https://www.cfr.org/global-conflict-tracker/conflict/power-struggle-sudan'},{name:'ACLED · External support (10 Apr 2026)',url:'https://acleddata.com/qa/qa-how-do-escalating-tensions-middle-east-affect-sudan-conflict'}]
 },
 iran:{updated:'2026-09-11',kind:'armed',
  camps:[
   camp('Ιράν / Φρουροί της Επανάστασης','Iran / Revolutionary Guards','Κρατικές και παραστρατιωτικές δυνάμεις του Ιράν','Iranian state and IRGC forces',[
    back('Περιφερειακές συμμαχικές οργανώσεις','Regional aligned armed groups','Ιστορικά δίκτυα Χεζμπολάχ, Χούθι και ένοπλων ομάδων — όχι όλες άμεσα ενεργές στο ίδιο μέτωπο','Historic links to Hezbollah, Houthis and militias; not all are direct combatants on this front','historical')
   ]),
   camp('ΗΠΑ & Ισραήλ','United States & Israel','Κράτη που συμμετείχαν σε αεροπορικές επιθέσεις το 2026','States involved in military strikes in 2026',[])
  ],
  contextEl:'Η σύγκρουση έχει περιόδους εκεχειρίας και αναζωπύρωσης. Συμμετοχή σε επίθεση, πολιτική υποστήριξη και διαμεσολάβηση είναι διαφορετικά πράγματα.',
  contextEn:'The conflict alternates between ceasefires and renewed strikes. Combat, political support and mediation must not be conflated.',
  sources:[{name:'CFR · Conflict With Iran (11 Sep 2026)',url:'https://www.cfr.org/global-conflict-tracker/conflict/confrontation-between-united-states-and-iran'}]
 },
 gaza:{updated:'2026-10-19',kind:'armed',
  camps:[
   camp('Ισραηλινές ένοπλες δυνάμεις (IDF)','Israel Defense Forces (IDF)','Κρατικές στρατιωτικές επιχειρήσεις στη Γάζα','Israeli state military operations in Gaza',[
    back('ΗΠΑ','United States','Μακροχρόνιοι αμυντικοί δεσμοί, οπλική και διπλωματική βοήθεια· όχι ισοδύναμο με άμεση συμμετοχή','Longstanding arms and diplomatic support; not equivalent to direct combat participation')
   ]),
   camp('Χαμάς και άλλες παλαιστινιακές ένοπλες οργανώσεις','Hamas and other Palestinian armed factions','Διαφορετικές οργανώσεις· όχι όλος ο παλαιστινιακός πληθυσμός','Distinct armed organizations, not the Palestinian population',[
    back('Ιράν','Iran','Ιστορική χρηματοδότηση και στρατιωτική υποστήριξη προς τη Χαμάς· δεν περιγράφει κατ’ ανάγκη την παρούσα επιχειρησιακή σχέση','Historic funding and military assistance to Hamas; not necessarily current operational command','historical')
   ])
  ],
  contextEl:'Η εκεχειρία του 2025 και οι μεταγενέστερες παραβιάσεις σημαίνουν ότι η ένταση μεταβάλλεται. Οι άμαχοι δεν είναι εμπόλεμη πλευρά.',
  contextEn:'The 2025 ceasefire and subsequent reported violations mean the intensity changes. Civilians are not a belligerent side.',
  sources:[{name:'CFR · Israel–Palestine (19 Oct 2026)',url:'https://www.cfr.org/global-conflict-tracker/conflict/israeli-palestinian-conflict'},{name:'CFR · Iran regional networks',url:'https://www.cfr.org/global-conflict-tracker/region/middle-east-and-north-africa'}]
 },
 congo:{updated:'2026-08-03',kind:'armed',
  camps:[
   camp('Στρατός ΛΔ Κονγκό (FARDC) & τοπικές ομάδες Wazalendo','DR Congo military (FARDC) & Wazalendo militias','Κρατικές δυνάμεις και ανομοιογενείς σύμμαχοι','State forces and loosely allied local groups',[
    back('Μπουρούντι','Burundi','Στρατιωτική συνδρομή προς τη ΛΔ Κονγκό','Military assistance to DR Congo')
   ]),
   camp('M23 / AFC','M23 / AFC','Ένοπλο κίνημα ανταρτών και συμμαχικές δομές','Rebel movement and associated coalition',[
    back('Ρουάντα','Rwanda','Το CFR καταγράφει σημαντική στρατιωτική στήριξη στο M23· ζήτημα διεθνούς αντιπαράθεσης','CFR documents significant military support for M23; politically disputed','reported')
   ])
  ],
  contextEl:'Η εξωτερική διπλωματική διαμεσολάβηση δεν είναι αυτόματα στρατιωτική στήριξη. Το Μ23 και άλλες οργανώσεις δεν είναι ενιαίο μέτωπο.',
  contextEn:'Diplomatic mediation is not the same as military backing. M23 and other armed actors do not form a single unified side.',
  sources:[{name:'CFR · DR Congo (3 Aug 2026)',url:'https://www.cfr.org/global-conflict-tracker/conflict/violence-democratic-republic-congo'}]
 },
 yemen:{updated:'2026-10-12',kind:'armed',
  camps:[
   camp('Χούθι / Ανσαρουλάχ','Houthis / Ansar Allah','Ένοπλο κίνημα που ελέγχει μεγάλο μέρος της βόρειας Υεμένης','Armed movement controlling much of northern Yemen',[
    back('Ιράν','Iran','Οπλικά συστήματα και τεχνολογική ενίσχυση σύμφωνα με CFR','Weapons and technical support reported by CFR')
   ]),
   camp('Διεθνώς αναγνωρισμένη κυβέρνηση & αντίπαλες δυνάμεις','Internationally recognized government & rival forces','Διαφορετικές παρατάξεις με συχνά αποκλίνουσες επιδιώξεις','Separate factions with sometimes divergent aims',[
    back('Σαουδική Αραβία','Saudi Arabia','Ιστορική στρατιωτική και πολιτική στήριξη της αναγνωρισμένης κυβέρνησης','Longstanding military and political support for internationally recognized government','historical')
   ])
  ],
  contextEl:'Δεν υπάρχουν μόνο δύο συμπαγείς παρατάξεις στην Υεμένη. Οι επιθέσεις στην Ερυθρά Θάλασσα αποτελούν πρόσθετη περιφερειακή διάσταση.',
  contextEn:'Yemen has more than two unified camps. Red Sea attacks form a distinct regional dimension.',
  sources:[{name:'CFR · Yemen (12 Oct 2026)',url:'https://www.cfr.org/global-conflict-tracker/conflict/war-yemen'}]
 },
 myanmar:{updated:'2026-08-27',kind:'armed',
  camps:[
   camp('Στρατός / χούντα της Μιανμάρ','Myanmar military / junta','Ένοπλες δυνάμεις που κατέλαβαν την εξουσία το 2021','Military that seized power in 2021',[]),
   camp('Δυνάμεις αντίστασης & εθνοτικές ένοπλες οργανώσεις','Resistance & ethnic armed organizations','Πολλές ξεχωριστές οργανώσεις· δεν αποτελούν έναν ενιαίο στρατό','Multiple separate groups, not a unified army',[])
  ],
  contextEl:'Οι σχέσεις περιφερειακών κρατών με τις πολλές οργανώσεις είναι σύνθετες. Δεν παρουσιάζουμε ατεκμηρίωτο κατάλογο «χορηγών».',
  contextEn:'Regional external relationships are complex. We do not present unsupported lists of sponsors.',
  sources:[{name:'CFR · Myanmar (27 Aug 2026)',url:'https://www.cfr.org/global-conflict-tracker/conflict/rohingya-crisis-myanmar'}]
 },
 taiwan:{updated:'2026-09-29',kind:'tension',
  camps:[
   camp('Κίνα / Λαϊκός Απελευθερωτικός Στρατός','China / People’s Liberation Army','Στρατιωτική πίεση και αξιώσεις κυριαρχίας','Military pressure and sovereignty claims',[]),
   camp('Ταϊβάν','Taiwan','Αυτοδιοικούμενη δημοκρατία με δικές της ένοπλες δυνάμεις','Self-governing democracy with its own armed forces',[
    back('ΗΠΑ','United States','Αμυντικές πωλήσεις και υποστήριξη αποτροπής· όχι πολεμική συμμετοχή','Arms sales and deterrence support, not a claim of wartime participation')
   ])
  ],
  contextEl:'Στρατιωτική αντιπαράθεση και διεκδίκηση δεν σημαίνουν ενεργό διακρατικό πόλεμο.',
  contextEn:'Military pressure and territorial claims do not amount to an ongoing interstate war.',
  sources:[{name:'CFR · East Asia conflict tracker',url:'https://www.cfr.org/global-conflict-tracker/region/asia'}]
 }
};
