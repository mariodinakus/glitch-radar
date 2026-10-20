'use client';
import {useMemo,useState} from 'react';
import {Globe2,Search,Map,Radio,ChevronDown,ChevronUp,ExternalLink} from 'lucide-react';
import type {ConflictSummary} from '@/lib/conflicts';
import {conflictMeta} from '@/lib/conflicts';
import type {ConflictRegion,ConflictKind} from '@/lib/conflicts';
import type {Signal} from '@/lib/types';
import WorldGlobe from './WorldGlobe';

type Lang='el'|'en';
type Props={items:ConflictSummary[];selected:string;onSelect:(id:string)=>void;lang:Lang};
const regions:ConflictRegion[]=['europe','mena','africa','asia','americas'];
const labels:Record<ConflictRegion,[string,string]>={
 europe:['Ευρώπη','Europe'],mena:['Μέση Ανατολή','Middle East & North Africa'],
 africa:['Υποσαχάρια Αφρική','Sub-Saharan Africa'],asia:['Ασία','Asia'],
 americas:['Αμερική','Americas']
};
const kinds:Record<ConflictKind,[string,string]>={
 war:['Πόλεμος','War'],armed:['Ένοπλη σύγκρουση','Armed conflict'],
 instability:['Ένοπλη / πολιτική αστάθεια','Instability'],
 tension:['Στρατιωτική ένταση','Military tension']
};
export default function ConflictAtlas({items,selected,onSelect,lang}:Props){
 const el=lang==='el';
 const [region,setRegion]=useState<'all'|ConflictRegion>('all');
 const [kind,setKind]=useState<'all'|ConflictKind>('all');
 const [q,setQ]=useState('');
 const [expanded,setExpanded]=useState(false);
 const [showMap,setShowMap]=useState(false);
 const totalNews=items.filter(x=>x.last24>0).length;
 const filtered=useMemo(()=>items.filter(x=>{
  const meta=conflictMeta[x.c.id];
  return meta&&(region==='all'||meta.region===region)&&(kind==='all'||meta.kind===kind)&&
   (!q.trim()||(x.c.el+' '+x.c.en+' '+x.c.descEl).toLocaleLowerCase().includes(q.toLocaleLowerCase().trim()))
 }),[items,region,kind,q]);
 const visible=expanded||q||region!=='all'||kind!=='all'?filtered:filtered.slice(0,12);
 const pins=useMemo(()=>filtered.map(x=>{
  const m=conflictMeta[x.c.id];
  return {id:'wc:'+x.c.id,category:'world' as const,title:el?x.c.el:x.c.en,
   summary:el?x.c.descEl:x.c.descEn,lat:m.lat,lon:m.lon,
   source:'GLITCH · coverage directory',url:'https://www.cfr.org/global-conflict-tracker/dashboard',
   score:Math.min(100,x.heat),level:'elevated' as const,timestamp:'1970-01-01T00:00:00.000Z',
   details:[],metricLabel:'NEWS / 24H',metricValue:String(x.last24),
   reason:'Approximate regional marker, not a battlefield location or verified real-time severity.',
   confidence:'catalog' as const} satisfies Signal;
 }),[filtered,el]);
 return <section className="war-atlas" aria-label={el?'Παγκόσμιος κατάλογος συγκρούσεων':'Global conflict directory'}>
  <div className="war-atlas-top">
   <div>
    <span className="war-atlas-kicker"><Radio size={14}/>{el?'ΠΑΓΚΟΣΜΙΟ WAR ROOM':'GLOBAL WAR ROOM'}</span>
    <h2>{el?'Ο χάρτης των συγκρούσεων':'World conflict watch'}<em>.</em></h2>
    <p>{el?'Πόλεμοι, ένοπλες συγκρούσεις και εστίες έντασης. Ξεχωρίζουμε την ύπαρξη μιας σύγκρουσης από τον αριθμό άρθρων που βρήκαμε.':'Wars, armed conflicts and flashpoints. A conflict is not the same thing as the number of news articles we found.'}</p>
   </div>
   <div className="war-atlas-count"><strong>{items.length}</strong><span>{el?'εστίες υπό παρακολούθηση':'tracked situations'}</span><small>{totalNews} {el?'με ειδήσεις 24ώρου':'covered in last 24h'}</small></div>
  </div>
  <div className="war-atlas-controls">
   <div className="war-atlas-regions">
    <button className={region==='all'?'on':''} onClick={()=>{setRegion('all');setExpanded(false)}}>{el?'Όλος ο κόσμος':'All regions'}</button>
    {regions.map(r=><button key={r} className={region===r?'on':''} onClick={()=>setRegion(r)}>{labels[r][el?0:1]}</button>)}
   </div>
   <div className="war-atlas-tools">
    <label><Search size={15}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder={el?'Αναζήτηση χώρας / σύγκρουσης':'Find a country or conflict'}/></label>
    <select value={kind} onChange={e=>setKind(e.target.value as 'all'|ConflictKind)} aria-label={el?'Τύπος σύγκρουσης':'Conflict type'}>
     <option value="all">{el?'Όλοι οι τύποι':'All types'}</option>
     {(Object.keys(kinds) as ConflictKind[]).map(k=><option value={k} key={k}>{kinds[k][el?0:1]}</option>)}
    </select>
    <button className={showMap?'map on':'map'} onClick={()=>setShowMap(p=>!p)}><Map size={15}/>{showMap?(el?'Κλείσε χάρτη':'Hide map'):(el?'Υδρόγειος':'Globe')}</button>
   </div>
  </div>
  {showMap&&<div className="war-atlas-map"><WorldGlobe signals={pins} countryMentions language={lang} compact selected={'wc:'+selected} onChoose={s=>onSelect(s.id.replace(/^wc:/,''))}/>
   <p>{el?'Οι κουκκίδες είναι ενδεικτικά γεωγραφικά σημεία, όχι ζωντανά μέτωπα, ακριβείς επιθέσεις ή μετρήσεις κινδύνου.':'Pins are approximate geographic markers, not live front lines, precise attacks or risk measurements.'}</p></div>}
  <div className="war-atlas-grid">{visible.map(x=>{const m=conflictMeta[x.c.id];return <button key={x.c.id} className={'war-atlas-card'+(selected===x.c.id?' selected':'')} onClick={()=>onSelect(x.c.id)}>
   <div className="war-atlas-card-head"><span className={'war-atlas-kind kind-'+m.kind}>{kinds[m.kind][el?0:1]}</span><span>{labels[m.region][el?0:1]}</span></div>
   <strong>{el?x.c.el:x.c.en}</strong>
   <p>{el?x.c.descEl:x.c.descEn}</p>
   <div className="war-atlas-card-foot"><span className={x.last24?'has-news':''}><i/>{x.last24?x.last24+(el?' ιστορίες / 24ωρο':' stories / 24h'):(el?'Χωρίς νεότερα στη ροή':'No recent feed coverage')}</span><span aria-hidden="true">↗</span></div>
  </button>})}</div>
  {!filtered.length&&<p className="war-atlas-empty">{el?'Δεν βρέθηκε αντίστοιχη εστία.':'No matching situation.'}</p>}
  {!expanded&&!q&&region==='all'&&kind==='all'&&filtered.length>12&&<button className="war-atlas-expand" onClick={()=>setExpanded(true)}>{el?'Εμφάνιση και των '+items.length+' εστιών':'Show all '+items.length+' situations'}<ChevronDown size={16}/></button>}
  {expanded&&!q&&region==='all'&&kind==='all'&&<button className="war-atlas-expand" onClick={()=>setExpanded(false)}>{el?'Λιγότερα':'Show fewer'}<ChevronUp size={16}/></button>}
  <p className="war-atlas-source">{el?'Μεθοδολογία: επιμελημένος κατάλογος, όχι εξαντλητική απογραφή ενεργών πολέμων. Η κατηγορία είναι περιγραφική· δεν επαληθεύουμε κατάσταση μάχης σε πραγματικό χρόνο. Το 0 σημαίνει μηδέν σχετικά άρθρα στις πηγές μας, όχι ειρήνη.':'Method: curated watchlist, not a complete census of active wars. Classification is descriptive; no live battle-status verification. Zero means no matching articles in our sources, not peace.'}
   {' '}<a href="https://www.cfr.org/global-conflict-tracker/dashboard" target="_blank" rel="noopener noreferrer">CFR <ExternalLink size={12}/></a>
   {' · '}<a href="https://www.uu.se/en/department/peace-and-conflict-research/research/ucdp/ucdp-definitions/" target="_blank" rel="noopener noreferrer">UCDP <ExternalLink size={12}/></a>
  </p>
 </section>;
}
