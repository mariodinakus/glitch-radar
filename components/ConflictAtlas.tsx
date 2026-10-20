'use client';
import {useMemo,useRef,useState} from 'react';
import {Search,Radio,ChevronDown,ChevronUp,ExternalLink} from 'lucide-react';
import type {ConflictSummary} from '@/lib/conflicts';
import {conflictMeta} from '@/lib/conflicts';
import type {ConflictRegion,ConflictKind} from '@/lib/conflicts';
import ConflictSides from './ConflictSides';

type Lang='el'|'en';
type Props={items:ConflictSummary[];selected:string;onSelect:(id:string)=>void;lang:Lang;aiActors?:{name:string;position:string}[]};
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
export default function ConflictAtlas({items,selected,onSelect,lang,aiActors}:Props){
 const el=lang==='el';
 const [region,setRegion]=useState<'all'|ConflictRegion>('all');
 const [kind,setKind]=useState<'all'|ConflictKind>('all');
 const [q,setQ]=useState('');
 const [expanded,setExpanded]=useState(false);
 const actorRef=useRef<HTMLDivElement>(null);
 const totalNews=items.filter(x=>x.last24>0).length;
 const pick=(id:string)=>{onSelect(id);actorRef.current?.scrollIntoView({behavior:'smooth',block:'start'})};
 const filtered=useMemo(()=>items.filter(x=>{
  const meta=conflictMeta[x.c.id];
  return meta&&(region==='all'||meta.region===region)&&(kind==='all'||meta.kind===kind)&&
   (!q.trim()||(x.c.el+' '+x.c.en+' '+x.c.descEl).toLocaleLowerCase().includes(q.toLocaleLowerCase().trim()))
 }),[items,region,kind,q]);
 const visible=expanded||q||region!=='all'||kind!=='all'?filtered:filtered.slice(0,12);
 return <section className="war-atlas" aria-label={el?'Παγκόσμιος κατάλογος συγκρούσεων':'Global conflict directory'}>
  <div className="war-atlas-top">
   <div>
    <span className="war-atlas-kicker"><Radio size={14}/>{el?'ΠΑΓΚΟΣΜΙΟ WAR ROOM':'GLOBAL WAR ROOM'}</span>
    <h2>{el?'Οι συγκρούσεις & οι πλευρές τους':'Conflicts & their sides'}<em>.</em></h2>
    <p>{el?'Ποιος συγκρούεται με ποιον και ποιοι προσφέρουν εξωτερική στήριξη. Οι διπλωματικοί σύμμαχοι δεν είναι αυτομάτως εμπόλεμοι.':'Who fights whom and who provides outside backing. Political allies are not automatically combatants.'}</p>
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

   </div>
  </div>
  <div ref={actorRef} className="war-actor-anchor"><ConflictSides conflictId={selected} lang={lang} aiActors={aiActors}/></div>
  <div className="war-atlas-grid">{visible.map(x=>{const m=conflictMeta[x.c.id];return <button key={x.c.id} className={'war-atlas-card'+(selected===x.c.id?' selected':'')} onClick={()=>pick(x.c.id)}>
   <div className="war-atlas-card-head"><span className={'war-atlas-kind kind-'+m.kind}>{kinds[m.kind][el?0:1]}</span><span>{labels[m.region][el?0:1]}</span></div>
   <strong>{el?x.c.el:x.c.en}</strong>
   <p>{el?x.c.descEl:x.c.descEn}</p>
   <div className="war-atlas-card-foot"><span className={x.last24?'has-news':''}><i/>{x.last24?x.last24+(el?' ιστορίες / 24ωρο':' stories / 24h'):(el?'Χωρίς νεότερα στη ροή':'No recent feed coverage')}</span><span aria-hidden="true">↗</span></div>
  </button>})}</div>
  {!filtered.length&&<p className="war-atlas-empty">{el?'Δεν βρέθηκε αντίστοιχη εστία.':'No matching situation.'}</p>}
  {!expanded&&!q&&region==='all'&&kind==='all'&&filtered.length>12&&<button className="war-atlas-expand" onClick={()=>setExpanded(true)}>{el?'Εμφάνιση και των '+items.length+' εστιών':'Show all '+items.length+' situations'}<ChevronDown size={16}/></button>}
  {expanded&&!q&&region==='all'&&kind==='all'&&<button className="war-atlas-expand" onClick={()=>setExpanded(false)}>{el?'Λιγότερα':'Show fewer'}<ChevronUp size={16}/></button>}
  <p className="war-atlas-source">{el?'Μεθοδολογία: επιμελημένος κατάλογος, όχι εξαντλητική απογραφή πολέμων. Η εξωτερική στήριξη καταγράφεται ανά είδος και πηγή· το 0 στις ειδήσεις δεν σημαίνει ειρήνη.':'Method: a curated watchlist, not a complete war census. Support ties are source-linked and qualified; zero recent articles does not mean peace.'}
   {' '}<a href="https://www.cfr.org/global-conflict-tracker/dashboard" target="_blank" rel="noopener noreferrer">CFR <ExternalLink size={12}/></a>
   {' · '}<a href="https://www.uu.se/en/department/peace-and-conflict-research/research/ucdp/ucdp-definitions/" target="_blank" rel="noopener noreferrer">UCDP <ExternalLink size={12}/></a>
  </p>
 </section>;
}
