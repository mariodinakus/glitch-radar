'use client';
import {useEffect,useMemo,useState} from 'react';
import {ArrowUpRight,Cat,Clock3,CopyCheck,Eye,ScanLine,ShieldAlert,Info} from 'lucide-react';
import type {Signal} from '@/lib/types';
import type {Story} from '@/lib/stories';
import {CHANGES_KEY,SNAPSHOT_KEY,assessRevision,detectMatrixPatterns,updateHeadlineHistory} from '@/lib/matrix-detection';
import type {HeadlineRecord,HeadlineChange,MatrixFinding} from '@/lib/matrix-detection';

type Lang='el'|'en';
type Props={signals:Signal[];stories:Story[];lang:Lang;onOpen:(s:Story)=>void;titleFor:(s:Story)=>string;compact?:boolean;onAll?:()=>void};
type Mode='all'|'changed'|'repeat'|'number'|'lonely';
const cache=<T,>(key:string,initial:T):T=>{try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw) as T:initial}catch{return initial}};
const written=(key:string,value:unknown)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};

export default function BlackCatDetector({signals,stories,lang,onOpen,titleFor,compact=false,onAll}:Props){
 const el=lang==='el';
 const [changes,setChanges]=useState<HeadlineChange[]>([]);
 const [archive,setArchive]=useState<HeadlineChange[]>([]);
 const [auditAt,setAuditAt]=useState<string|null>(null);
 const [mode,setMode]=useState<Mode>('all');
 const [expanded,setExpanded]=useState(false);
 const findings=useMemo(()=>detectMatrixPatterns(stories),[stories]);
 useEffect(()=>{
  let alive=true;
  fetch('/api/archive',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(data=>{
   if(!alive||!data?.available)return;
   setArchive(Array.isArray(data.events)?data.events:[]);
   setAuditAt(typeof data.auditedAt==='string'?data.auditedAt:null);
  }).catch(()=>{});
  return ()=>{alive=false};
 },[]);
 useEffect(()=>{
  if(!signals.length)return;
  // Only changes we have personally observed in this browser are recorded.
  const before=cache<HeadlineRecord[]>(SNAPSHOT_KEY,[]);
  const past=cache<HeadlineChange[]>(CHANGES_KEY,[]);
  const next=updateHeadlineHistory(before,signals);
  const seen=new Map(past.map(c=>[c.id+'|'+c.after,c]));
  for(const c of next.changes)seen.set(c.id+'|'+c.after,c);
  const merged=[...seen.values()].slice(-75);
  written(SNAPSHOT_KEY,next.records);
  written(CHANGES_KEY,merged);
  setChanges(merged);
 },[signals]);
 const materialChanges=useMemo(()=>{
  const merged=new Map<string,HeadlineChange>();
  for(const c of [...archive,...changes])if(c&&c.before&&c.after&&assessRevision(c.before,c.after).level==='substantive')merged.set(c.id+'|'+c.after,c);
  return [...merged.values()].sort((a,b)=>Date.parse(a.lastSeen)-Date.parse(b.lastSeen));
 },[archive,changes]);
 const routineCount=changes.filter(c=>assessRevision(c.before,c.after).level!=='substantive').length;
 const byId=useMemo(()=>new Map(stories.map(s=>[s.id,s])),[stories]);
 const all=[...materialChanges.slice().reverse().map(c=>({type:'changed' as const,id:c.id+'|'+c.after,change:c})),
   ...findings.map(f=>({type:f.kind as 'repeat'|'number'|'lonely',id:f.id,finding:f}))];
 const sorted=mode==='all'?all:all.filter(x=>x.type===mode);
 const shown=expanded?sorted.slice(0,18):sorted.slice(0,compact?3:6);
 const cnt=(k:Mode)=>k==='changed'?materialChanges.length:findings.filter(f=>f.kind===k).length;
 const label=(elText:string,enText:string)=>el?elText:enText;
 const date=(dateStr:string)=>new Date(dateStr).toLocaleString(el?'el-GR':'en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
 const modes:[Mode,string,string][]=[['all','Όλα','All'],['changed','Μαύρη γάτα','Black cat'],['repeat','Αντίγραφα','Echoes'],['number','Αριθμοί','Numbers'],['lonely','Μοναχικές ειδήσεις','Single source']];
 return <section className="bc" aria-label={label('Ανίχνευση Matrix','Matrix anomaly detection')}>
  <header className="bc-top">
   <div className="bc-heading">
    <span className="bc-eyebrow"><ScanLine size={14}/> BLACK CAT / REALITY DIFF</span>
    <h2>{label('Υπάρχει glitch στην αφήγηση;','Is there a glitch in the story?')}<em>.</em></h2>
    <p>{label('Το σύστημα συγκρίνει επαναλαμβανόμενους τίτλους, αριθμούς και προηγούμενα στιγμιότυπα της ειδησεογραφικής ροής. Χωρίς AI και χωρίς API key.',
    'The detector compares recurring headlines, numbers and earlier snapshots of the feed. No AI and no API key.')}</p>
   </div>
   <div className="bc-counter"><Cat size={25}/><strong>{materialChanges.length+findings.length}</strong><span>{label('ενδείξεις προς εξέταση','signals to review')}</span></div>
  </header>
  {auditAt&&<p className="bc-routine">SERVER ARCHIVE · {label('Τελευταίο κοινό στιγμιότυπο','Latest shared snapshot')}: {date(auditAt)} · {label('η παρακολούθηση γίνεται στην προγραμματισμένη εκτέλεση, όχι συνεχώς','scheduled sampling, not continuous monitoring')}</p>}
  <div className="bc-filterbar" role="group" aria-label={label('Φίλτρα ενδείξεων','Finding filters')}>
   {modes.map(([k,a,b])=><button key={k} className={mode===k?'on':''} onClick={()=>{setMode(k);setExpanded(false)}}>{el?a:b}<span>{k==='all'?materialChanges.length+findings.length:cnt(k)}</span></button>)}
  </div>
  {shown.length?<div className="bc-grid">{shown.map(item=>item.type==='changed'?(<article key={item.id} className="bc-card bc-change">
    <div className="bc-card-tag"><Cat size={14}/>{label('Η ΜΑΥΡΗ ΓΑΤΑ — ΤΙΤΛΟΣ ΑΛΛΑΞΕ','BLACK CAT — HEADLINE CHANGED')}</div>
    <strong>{item.change.source}</strong>
    <p className="bc-assessment">{assessRevision(item.change.before,item.change.after).reason} · {label('Σύγκριση RSS, όχι επιβεβαιωμένη αλλαγή άρθρου','Feed-level evidence; publisher webpage not independently checked')}</p>
    <div className="bc-diff"><span>{label('ΠΡΙΝ','BEFORE')}</span><p>{item.change.before}</p><span>{label('ΜΕΤΑ','AFTER')}</span><p>{item.change.after}</p></div>
    <small><Clock3 size={12}/>{date(item.change.firstSeen)} → {date(item.change.lastSeen)}</small>
    <a href={item.change.url} target="_blank" rel="noopener noreferrer">{label('Πρωτότυπη διεύθυνση άρθρου','Original article URL')} <ArrowUpRight size={13}/></a>
   </article>):(<article key={item.id} className={'bc-card bc-'+item.type}>
    <div className="bc-card-tag">{item.type==='repeat'?<CopyCheck size={14}/>:item.type==='number'?<ShieldAlert size={14}/>:<Eye size={14}/>}
     {item.type==='repeat'?'NARRATIVE ECHO':item.type==='number'?'NUMBER DIFF':'LOW COVERAGE'}
    </div>
    <strong>{byId.get(item.finding.storyId)?titleFor(byId.get(item.finding.storyId)!):item.finding.title}</strong>
    <p>{el?item.finding.detailEl:item.finding.detailEn}</p>
    <div className="bc-outlets">{item.finding.sources.slice(0,6).map((name,i)=><span key={i}>{name}</span>)}</div>
    <div className="bc-links">{byId.has(item.finding.storyId)&&<button onClick={()=>onOpen(byId.get(item.finding.storyId)!)}>{label('Σύγκριση ρεπορτάζ','Compare coverage')} <ArrowUpRight size={13}/></button>}
     {item.finding.reports.slice(0,2).map((r,i)=><a key={i} href={r.url} target="_blank" rel="noopener noreferrer">{r.source} ↗</a>)}
    </div>
   </article>))}</div>:
   <p className="bc-empty">{mode==='changed'?
    label('Δεν έχουμε εντοπίσει ακόμη αλλαγή στον ίδιο τίτλο/URL σε αυτή τη συσκευή. Η σύγκριση αρχίζει αφού το GLITCH αποθηκεύσει το πρώτο στιγμιότυπο και ξαναφορτώσει τη ροή.',
    'No same-URL headline revision has been observed on this device. First a snapshot must be saved, then the feed must be fetched again.'):
    label('Δεν υπάρχουν ενδείξεις αυτής της κατηγορίας στο διαθέσιμο δείγμα.','No matching finding in the monitored sample.')}</p>}
  {!expanded&&sorted.length>(compact?3:6)&&<button className="bc-more" onClick={()=>setExpanded(true)}>{label('Περισσότερα ευρήματα','More findings')} ({sorted.length-6}) ↓</button>}
  {expanded&&<button className="bc-more" onClick={()=>setExpanded(false)}>{label('Λιγότερα','Show fewer')} ↑</button>}
  {compact&&onAll&&<button className="bc-explore" onClick={onAll}>{label('Άνοιξε όλο το ραντάρ & τα κενά κάλυψης','Open the full investigation & coverage radar')} ↗</button>}
  {routineCount>0&&<p className="bc-routine">{routineCount} {label('αλλαγές χαμηλής σημασίας δεν μετρήθηκαν ως σημαντικά ευρήματα.','low-significance updates excluded from notable findings.')}</p>}
  <footer className="bc-foot"><Info size={16}/>
   <span>{label('Σημαντικό: η «μαύρη γάτα» δείχνει διαφορά ανάμεσα σε δύο εκδόσεις της ροής που αποθηκεύτηκαν σε αυτόν τον browser — όχι επαληθευμένη αλλαγή στην ιστοσελίδα του εκδότη. Αντίγραφα και διαφορετικά ποσοστά μπορεί να έχουν απολύτως αθώες εξηγήσεις. Δεν υπάρχει παρακολούθηση στο παρασκήνιο ή καθολική βάση ιστορικού.',
   'Important: Black Cat compares two feed versions saved in this browser, not independently verified publisher-page revisions. Similar headlines and different percentages may have innocent explanations. There is no background monitoring or globally shared archive.')}</span>
  </footer>
 </section>;
}
