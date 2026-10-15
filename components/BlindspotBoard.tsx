'use client';
import {useState} from 'react';
import {AlertCircle,ArrowUpRight,BarChart3,EyeOff,Globe2,Info,LoaderCircle,ShieldCheck,Signal,TrendingDown} from 'lucide-react';
import type {BlindspotReport,Blindspot} from '@/lib/blindspots';

type Language='el'|'en';
type CoverageResult={provider:string;query:string;window:string;matchedArticles:number;coveragePercent:number|null;sourceUrl:string};

function Card({s,lang,translated}:{s:Blindspot;lang:Language;translated?:{title:string;summary:string}}){
 const [expanded,setExpanded]=useState(false);
 const [checked,setChecked]=useState<CoverageResult|null>(null);
 const [checking,setChecking]=useState(false);
 const [coverageError,setCoverageError]=useState(false);
 const t=(el:string,en:string)=>lang==='el'?el:en;
 const isLimited=s.coverage.status==='limited';const noSample=s.coverage.status==='insufficient';
 const check=async()=>{setCoverageError(false);setChecking(true);try{const res=await fetch('/api/coverage?title='+encodeURIComponent(s.title));if(!res.ok)throw Error('upstream');setChecked(await res.json() as CoverageResult)}catch{setCoverageError(true)}finally{setChecking(false)}};
 return <article className="blindspot-card">
  <div className="blindspot-header"><span className="blindspot-kicker"><EyeOff size={15}/>{isLimited?t('ΠΙΘΑΝΟ ΚΕΝΟ ΠΡΟΣΟΧΗΣ','POSSIBLE ATTENTION GAP'):noSample?t('ΕΛΛΙΠΕΣ ΔΕΙΓΜΑ','INSUFFICIENT SAMPLE'):t('ΕΞΕΤΑΣΤΗΚΕ Η ΚΑΛΥΨΗ','COVERAGE EXAMINED')}</span><b className="blindspot-importance">{t('Κρισιμότητα*','Importance*')} {s.importance}/100</b></div>
  <div className="blindspot-body"><h3>{lang==='el'&&translated?.title||s.title}</h3><p>{lang==='el'&&translated?.summary||s.summary}</p></div>
  <div className="blindspot-stat"><div><strong>{s.coverage.matches}<small> / {s.coverage.available}</small></strong><span>{t('γενικές ειδησεογραφικές πηγές με συναφή τίτλο','general publisher feeds with related headline')}</span></div><div className="coverage-mini" title={t('Ποσοστό ανάμεσα στις ενεργές παρακολουθούμενες γενικές ροές. Δεν είναι παγκόσμια κάλυψη.','Share of monitored live general RSS feeds only, not all global news.')}><span style={{width:`${s.coverage.available?100*s.coverage.matches/s.coverage.available:0}%`}}/></div></div>
  <div className="blindspot-sample"><ShieldCheck size={13}/><span>{s.source} · {new Date(s.timestamp).toLocaleDateString(lang==='el'?'el-GR':'en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</span></div>
  <div className="blindspot-actions"><button onClick={()=>setExpanded(x=>!x)}><Info size={15}/>{expanded?t('Λιγότερα','Less'):t('Γιατί το προτείνει','Why flagged')}</button><a href={s.url} target="_blank" rel="noreferrer noopener">{t('Πρωτότυπη πηγή','Original source')} <ArrowUpRight size={15}/></a></div>
  {expanded&&<div className="blindspot-expanded"><p><b>{t('Εκτίμηση σημασίας','Impact rationale')}:</b> {lang==='el'?s.importanceRationale.el:s.importanceRationale.en}</p>
   <p><b>{t('Δείγμα','Monitored sample')}:</b> {s.coverage.sample.join(' · ')||t('Καμία διαθέσιμη ροή','No feeds available')}</p>
   <p><b>{t('Συναφείς πηγές','Matching sources')}:</b> {s.coverage.matchedOutlets.join(', ')||t('Δεν βρέθηκαν αντίστοιχοι τίτλοι στο δείγμα','No related headlines in the sample')}</p>
   <p className="blindspot-caveat">{lang==='el'?s.caveat.el:s.caveat.en}</p>
   <div className="blindspot-gdelt"><button disabled={checking||s.topicQuery.split(' ').length<2} onClick={check}>{checking?<LoaderCircle className="spin" size={15}/>:<Globe2 size={15}/>} {t('Έλεγξε ευρύτερη κάλυψη (GDELT)','Check broader coverage (GDELT)')}</button>
    {checked&&<div className="gdelt-result"><BarChart3 size={16}/><div><strong>{checked.matchedArticles.toLocaleString(lang==='el'?'el-GR':'en-GB')} {t('αντιστοιχίσεις άρθρων / 48ωρο','matched article records / 48h')}</strong><small>{t('Ερώτημα','Query')}: {checked.query}. {t('Δεν ισούται με συνολική κάλυψη ή ανεξάρτητες πηγές.','Not a count of unique publishers or complete global coverage.')}</small><a href={checked.sourceUrl} rel="noreferrer noopener" target="_blank">GDELT <ArrowUpRight size={12}/></a></div></div>}
    {coverageError&&<span className="gdelt-warning"><AlertCircle size={13}/>{t('Η GDELT δεν απάντησε ή δεν κατάλαβε το ερώτημα. Δεν συμπεραίνουμε μηδενική κάλυψη.','GDELT unavailable or query failed. Do not infer zero coverage.')}</span>}</div>
  </div>}
 </article>
}
export function BlindspotBoard({report,language,translations={},compact=false}:{report?:BlindspotReport;language:Language;translations?:Record<string,{title:string;summary:string}>;compact?:boolean}){
 const t=(el:string,en:string)=>language==='el'?el:en;
 if(!report)return <div className="blindspot-empty">{t('Συλλογή δεδομένων από τις πηγές…','Collecting source data…')}</div>;
 const top=compact?report.candidates.slice(0,3):report.candidates;
 return <section className="blindspot-board"><div className="blindspot-intro"><div className="blindspot-eyebrow"><Signal size={14}/>{t('GLITCH / COVERAGE GAP RADAR','GLITCH / COVERAGE GAP RADAR')}</div><div className="blindspot-heading"><div><h2>{t('Σημαντικά. Αλλά πόσο τα προσέξαμε;','Important. But how much attention did they get?')}</h2><p>{t('Σαρώνουμε πρωτογενείς καταγραφές και τις συγκρίνουμε με τίτλους από μεγάλες ειδησεογραφικές ροές. Όχι θεωρίες αποσιώπησης — μετρήσιμο, οριοθετημένο δείγμα.','We compare primary-source signals against headlines from a defined sample of major news feeds. Observable gaps, not claims of suppression.')}</p></div><div className="blindspot-count"><strong>{report.candidates.filter(x=>x.coverage.status==='limited').length}</strong><span>{t('πιθανά κενά στο δείγμα','possible sample gaps')}</span></div></div></div>
 <div className="blindspot-list">{top.length?top.map(s=><Card key={s.id} s={s} lang={language} translated={translations[s.signalId]}/>):<div className="blindspot-empty"><TrendingDown size={23}/><b>{t('Δεν τεκμηριώθηκαν υποψήφια συμβάντα αυτή τη στιγμή','No qualifying candidate events right now')}</b><p>{t('Αυτό δεν σημαίνει ότι όλα καλύπτονται. Περιμένουμε επαρκή πρόσφατα δεδομένα από τις πρωτογενείς πηγές.','This does not imply complete news coverage. The system needs fresh qualifying source records.')}</p></div>}</div>
 <p className="blindspot-method"><Info size={15}/>{language==='el'?report.methodology.el:report.methodology.en} <b>{t('Δεν αποτελεί απόδειξη σκόπιμης αποσιώπησης.','Not evidence of deliberate suppression.')}</b></p></section>
}
