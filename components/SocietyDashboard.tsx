'use client';
import {useEffect,useMemo,useState} from 'react';
import {SOCIAL_COUNTRIES,SOCIAL_INDICATORS} from '@/lib/society-indicators';
type Lang='el'|'en';
type Observation={year:number;value:number};
type Series={code:string;current:Observation|null;previous:Observation|null};
type Payload={country:string;updatedAt:string;source:string;series:Series[]};
const tr=(lang:Lang,el:string,en:string)=>lang==='el'?el:en;
export function SocietyDashboard({lang}:{lang:Lang}){
 const [country,setCountry]=useState('GR');
 const [group,setGroup]=useState<'governance'|'society'>('governance');
 const [data,setData]=useState<Payload|null>(null);
 const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
 useEffect(()=>{
  let active=true;const controller=new AbortController();
  setStatus('loading');setData(null);
  fetch('/api/society?country='+country,{signal:controller.signal})
   .then(async r=>{if(!r.ok)throw Error('Source unavailable');return await r.json() as Payload})
   .then(d=>{if(active){setData(d);setStatus('ready')}})
   .catch(()=>{if(active)setStatus('error')});
  return()=>{active=false;controller.abort()};
 },[country]);
 const values=useMemo(()=>SOCIAL_INDICATORS.filter(i=>i.group===group),[group]);
 const locale=lang==='el'?'el-GR':'en-US';
 return <section className="soc-dashboard" aria-label={tr(lang,'Κοινωνικοί και πολιτικοί δείκτες','Social and political indicators')}>
  <div className="soc-heading">
   <span className="soc-kicker">GLITCH / WORLD BANK DATA</span>
   <h1>{tr(lang,'Κοινωνία & Πολιτική','Society & Politics')}</h1>
   <p>{tr(lang,'14 επαληθεύσιμοι δείκτες. Δες τι μετράμε, τι σημαίνει κάθε αριθμός και από ποιο έτος προέρχεται — όχι αυθαίρετες βαθμολογίες και «live» εικασίες.',
    '14 source-backed indicators. Understand each measure, its year and its limitations — no fabricated live scores.')}</p>
  </div>
  <div className="soc-toolbar">
   <label>{tr(lang,'Χώρα','Country')} <select value={country} onChange={e=>setCountry(e.target.value)}>{SOCIAL_COUNTRIES.map(c=><option key={c.id} value={c.id}>{lang==='el'?c.el:c.en}</option>)}</select></label>
   <div className="soc-switch">
    <button className={group==='governance'?'active':''} onClick={()=>setGroup('governance')}>{tr(lang,'Πολιτική & θεσμοί','Politics & institutions')}</button>
    <button className={group==='society'?'active':''} onClick={()=>setGroup('society')}>{tr(lang,'Κοινωνία & ευημερία','Society & well-being')}</button>
   </div>
  </div>
  {status==='loading'&&<div className="soc-state">{tr(lang,'Ανάκτηση επίσημων στοιχείων…','Loading official data…')}</div>}
  {status==='error'&&<div className="soc-state">{tr(lang,'Η πηγή δεν ανταποκρίνεται. Δεν εμφανίζουμε εκτιμήσεις στη θέση των στοιχείων.','Data source unavailable. No substitute or estimated values are displayed.')}</div>}
  {status==='ready'&&<div className="soc-grid">{values.map(i=>{
   const item=data?.series.find(s=>s.code===i.code);
   const current=item?.current,previous=item?.previous;
   const delta=current&&previous?current.value-previous.value:null;
   const unit=i.unit==='score'?'/100':i.unit==='percent'?'%':i.unit==='years'?tr(lang,' έτη',' years'):i.unit==='per100k'?tr(lang,' /100 χιλ.',' /100k'):'';
   const display=current?current.value.toLocaleString(locale,{minimumFractionDigits:i.digits,maximumFractionDigits:i.digits})+unit:'—';
   return <article className="soc-card" key={i.code}>
    <div className="soc-card-top"><span>{lang==='el'?i.el:i.en}</span><span>{current?.year||'—'}</span></div>
    <strong>{display}</strong>
    <p>{lang==='el'?i.explainEl:i.explainEn}</p>
    <div className="soc-card-bottom">{current&&previous&&delta!==null?<small>{tr(lang,'Σε σχέση με το '+previous.year,'Compared with '+previous.year)}: {delta>0?'+':''}{delta.toLocaleString(locale,{maximumFractionDigits:1})}{i.unit==='percent'?' π.μ.':''}</small>:<small>{tr(lang,'Χωρίς συγκρίσιμη προηγούμενη τιμή','No earlier comparable value')}</small>}
     <a href={'https://data.worldbank.org/indicator/'+encodeURIComponent(i.code)+'?locations='+country} target="_blank" rel="noopener noreferrer">{tr(lang,'Πηγή ↗','Source ↗')}</a>
    </div>
   </article>;
  })}</div>}
  <p className="soc-method">{group==='governance'
   ?tr(lang,'Οι έξι δείκτες διακυβέρνησης WGI είναι σύνθετες εκτιμήσεις βασισμένες σε αντιλήψεις πολιτών, επιχειρήσεων και ειδικών (κλίμακα 0–100). Δεν είναι μετρήσεις σε πραγματικό χρόνο, δεν προβλέπουν εκλογές και δεν ισοδυναμούν με αντικειμενική κατάταξη κυβερνήσεων.',
     'The six WGI governance scores are composite perception-based estimates (0–100), not real-time readings, election predictions or definitive government rankings.')
   :tr(lang,'Οι κοινωνικοί δείκτες είναι ετήσιες ή αραιότερες δημοσιεύσεις διεθνών πηγών μέσω της Παγκόσμιας Τράπεζας. Κάθε κάρτα δείχνει το δικό της έτος· η μεταβολή μπορεί να αφορά περισσότερα από ένα έτη.',
     'Social series are annual or less frequent World Bank-published data. Every card shows its own observation year; changes may span multiple years.')}
   {' '}<a href="https://data.worldbank.org/" target="_blank" rel="noopener noreferrer">World Bank Open Data ↗</a></p>
 </section>;
}
