'use client';
import {useEffect,useMemo,useState} from 'react';
import {SOCIAL_INDICATORS} from '@/lib/society-indicators';
type Lang='el'|'en';
type Observation={year:number;value:number;coverage?:number};
type Series={code:string;current:Observation|null;previous:Observation|null;scope:'world'|'country-mean'};
type Payload={country:string;updatedAt:string;source:string;available:number;series:Series[]};
const tr=(lang:Lang,el:string,en:string)=>lang==='el'?el:en;
export function SocietyDashboard({lang}:{lang:Lang}){
 const [group,setGroup]=useState<'governance'|'society'>('society');
 const [data,setData]=useState<Payload|null>(null);
 const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
 useEffect(()=>{
  let active=true;const controller=new AbortController();
  fetch('/api/society',{signal:controller.signal}).then(async r=>{
   if(!r.ok)throw Error('Source unavailable');return await r.json() as Payload;
  }).then(d=>{if(active){setData(d);setStatus('ready')}})
   .catch(()=>{if(active)setStatus('error')});
  return()=>{active=false;controller.abort()};
 },[]);
 const values=useMemo(()=>SOCIAL_INDICATORS.filter(i=>i.group===group),[group]);
 const locale=lang==='el'?'el-GR':'en-US';
 const fmt=(v:number,n:number)=>v.toLocaleString(locale,{minimumFractionDigits:n,maximumFractionDigits:n});
 const display=(code:string,n:Observation,unit:string,digits:number)=>{
  if(unit==='people')return fmt(n.value/1e9,2)+(lang==='el'?' δισ.':' bn');
  if(unit==='usd')return '$'+fmt(n.value/1e12,1)+(lang==='el'?' τρισ.':' tn');
  if(unit==='score')return fmt(n.value,digits)+'/100';
  if(unit==='percent')return fmt(n.value,digits)+'%';
  if(unit==='years')return fmt(n.value,digits)+(lang==='el'?' έτη':' years');
  if(unit==='tonnes')return fmt(n.value,digits)+(lang==='el'?' τόνοι':' tonnes');
  if(unit==='usdpercapita')return '$'+fmt(n.value,0);
  if(unit==='per100k')return fmt(n.value,digits)+'/100k';
  return fmt(n.value,digits);
 };
 return <section className="soc-dashboard" aria-label={tr(lang,'Παγκόσμιοι κοινωνικοί και πολιτικοί δείκτες','Global social and political indicators')}>
  <div className="soc-heading">
   <span className="soc-kicker">GLITCH / GLOBAL INDICATORS · WORLD BANK</span>
   <h1>{tr(lang,'Ο κόσμος σε αριθμούς','The world in numbers')}<span className="soc-earth"> ◎</span></h1>
   <p>{tr(lang,'Δείκτες για ολόκληρο τον πλανήτη, όχι για μία επιλεγμένη χώρα. Πραγματικά στοιχεία της Παγκόσμιας Τράπεζας με έτος αναφοράς και σαφή εξήγηση. Για τη διακυβέρνηση εμφανίζεται ο μη σταθμισμένος μέσος όρος χωρών, όχι επίσημος «παγκόσμιος βαθμός».',
    'Indicators covering the planet, not a selected country. World Bank measures with observation years and explanations. For governance we show an unweighted mean of national scores, not an official world governance index.')}</p>
  </div>
  <div className="soc-toolbar">
   <span className="soc-global-tag">◎ {tr(lang,'ΠΑΓΚΟΣΜΙΑ ΕΙΚΟΝΑ · WLD','WORLDWIDE · WLD')}</span>
   <div className="soc-switch">
    <button className={group==='society'?'active':''} onClick={()=>setGroup('society')}>{tr(lang,'Παγκόσμια κοινωνία & οικονομία','Global society & economy')}</button>
    <button className={group==='governance'?'active':''} onClick={()=>setGroup('governance')}>{tr(lang,'Πολιτική & θεσμοί παγκοσμίως','Politics & institutions worldwide')}</button>
   </div>
  </div>
  {status==='loading'&&<div className="soc-state">{tr(lang,'Συγκεντρώνονται τα παγκόσμια δεδομένα της Παγκόσμιας Τράπεζας…','Retrieving worldwide World Bank data…')}</div>}
  {status==='error'&&<div className="soc-state">{tr(lang,'Η πηγή δεν απαντά αυτή τη στιγμή. Δεν εμφανίζουμε επινοημένα δεδομένα.','Data source currently unavailable. No fabricated values are displayed.')}</div>}
  {status==='ready'&&<>
   <p className="soc-world-context">{group==='governance'?
    tr(lang,'Προσοχή στη σύγκριση: οι τιμές /100 είναι απλοί αριθμητικοί μέσοι χωρών με διαθέσιμα στοιχεία. Μια μικρή χώρα έχει το ίδιο βάρος με μια μεγάλη. Δεν είναι βαθμολογία της ανθρωπότητας ούτε μέτρηση «live».',
     'Comparison note: values /100 are arithmetic means across countries with data. Small and large countries have equal weight. These are neither world-population-weighted scores nor live measures.'):
    tr(lang,'Όπου ο διεθνής οργανισμός δημοσιεύει παγκόσμιο άθροισμα ή μέσο όρο (WLD), το παρουσιάζουμε απευθείας. Αν δεν υπάρχει διαθέσιμος παγκόσμιος αριθμός, δείχνουμε — αντί να τον επινοούμε.',
     'We use the official World Bank world (WLD) aggregation where available. Missing global series are shown as unavailable, never approximated.')}
   </p>
   <div className="soc-grid">{values.map(i=>{
    const item=data?.series.find(s=>s.code===i.code);
    const current=item?.current,previous=item?.previous;
    const delta=current&&previous?current.value-previous.value:null;
    const difference=delta===null?null:i.unit==='people'?fmt(delta/1e6,1)+(lang==='el'?' εκατ.':' M'):
     i.unit==='usd'?'$'+fmt(delta/1e12,2)+(lang==='el'?' τρισ.':' tn'):
     fmt(delta,i.digits)+(i.unit==='percent'?' pp':'');
    return <article className="soc-card" key={i.code}>
     <div className="soc-card-top"><span>{lang==='el'?i.el:i.en}</span><span>{current?.year||'—'}</span></div>
     <strong>{current?display(i.code,current,i.unit,i.digits):'—'}</strong>
     <p>{lang==='el'?i.explainEl:i.explainEn}</p>
     {group==='governance'&&current?.coverage&&<small className="soc-coverage">{tr(lang,'Χώρες με στοιχεία: ','Economies reporting: ')}{current.coverage}</small>}
     <div className="soc-card-bottom">{current&&previous&&difference!==null?
      <small>{tr(lang,'Μεταβολή από '+previous.year,'Change since '+previous.year)}: {delta!==null&&delta>0?'+':''}{difference}</small>:
      <small>{current?tr(lang,'Χωρίς συγκρίσιμη προηγούμενη τιμή','No earlier comparable value'):tr(lang,'Μη διαθέσιμο παγκόσμιο στοιχείο','World figure unavailable')}</small>}
      <a href={'https://data.worldbank.org/indicator/'+encodeURIComponent(i.code)+(group==='society'?'?locations=1W':'')} target="_blank" rel="noopener noreferrer">{tr(lang,'Πηγή ↗','Source ↗')}</a>
     </div>
    </article>;
   })}</div>
  </>}
  <p className="soc-method">{tr(lang,'Πηγή: World Bank Open Data (WDI/WGI). Τα έτη διαφέρουν ανά δείκτη. Ο παγκόσμιος μέσος θεσμικών δεικτών εδώ είναι δικός μας απλός μέσος όρος των δημοσιευμένων εθνικών βαθμών ανά κοινό έτος, χωρίς πληθυσμιακή στάθμιση και χωρίς αβεβαιότητες εκτιμήσεων.',
    'Source: World Bank Open Data (WDI/WGI). Observation years vary. The governance world overview is our simple unweighted mean of published country scores for the same year, not an official World Bank aggregate and without uncertainty intervals.')}
   {' '}<a href="https://data.worldbank.org/" target="_blank" rel="noopener noreferrer">World Bank ↗</a></p>
 </section>;
}
