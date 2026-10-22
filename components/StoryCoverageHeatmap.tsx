'use client';
import {useMemo,useState} from 'react';
import type {Story} from '@/lib/stories';
import {buildCoverageRows} from '@/lib/investigation';
import type {CoverageRow,LeanGroup} from '@/lib/investigation';

type Props={stories:Story[];lang:'en'|'el';story?:Story;onOpen?:(story:Story)=>void};
const groups:LeanGroup[]=['left','center','right','unrated'];
const labels:Record<LeanGroup,string>={left:'Left / lean left',center:'Centre',right:'Right / lean right',unrated:'Unrated'};
export default function StoryCoverageHeatmap({stories,story,lang,onOpen}:Props){
 const [gapsOnly,setGapsOnly]=useState(false);
 const [active,setActive]=useState<string|null>(null);
 const rows=useMemo(()=>buildCoverageRows(stories,story?stories.length:45),[stories,story]);
 const view=story?rows.filter(r=>r.id===story.id):rows.filter(r=>r.totalOutlets>=2&&(!gapsOnly||r.potentialGap)).slice(0,16);
 const el=lang==='el';
 const tr=(a:string,b:string)=>el?a:b;
 return <section className="ix-panel" aria-label="Coverage by publisher group">
  <div className="ix-header"><div><span className="ix-kicker">GLITCH / BLINDSPOT HEATMAP</span>
   <h2>{tr('Ποιοι καλύπτουν την ίδια είδηση;','Who covers the same story?')}</h2>
   <p>{tr('Σύγκριση συμμετοχής ομάδων εκδοτών μέσα στις διαθέσιμες ροές, όχι παγκόσμια μέτρηση πολιτικής μεροληψίας.','Coverage rates among outlets seen in the sampled feeds, not a global estimate of political bias.')}</p>
  </div>{!story&&<label className="ix-check"><input type="checkbox" checked={gapsOnly} onChange={e=>setGapsOnly(e.target.checked)}/>{tr('Μόνο πιθανά κενά','Potential gaps only')}</label>}</div>
  <div className="ix-legend">{groups.map(g=><span key={g}><i className={'ix-dot ix-'+g}/>{labels[g]}</span>)}</div>
  <div className="ix-scroll"><table className="ix-matrix">
   <thead><tr><th scope="col">{tr('Ιστορία','Story')}</th>{groups.map(g=><th key={g} scope="col">{labels[g]}</th>)}</tr></thead>
   <tbody>{view.map(row=><MatrixRow key={row.id} row={row} tr={tr} active={active===row.id} onSelect={()=>setActive(x=>x===row.id?null:row.id)} onOpen={onOpen?()=>{const x=stories.find(s=>s.id===row.id);if(x)onOpen(x)}:undefined}/>)}</tbody>
  </table></div>
  {!view.length&&<p className="ix-empty">{tr('Δεν προκύπτει υποψήφιο κενό από το τρέχον δείγμα.','No qualifying coverage gap in the current sample.')}</p>}
  <p className="ix-disclaimer">{tr('Κάθε κελί = εκδότες που καλύπτουν το γεγονός / εκδότες αυτής της ομάδας που εμφανίζονται σε ολόκληρο το διαθέσιμο δείγμα. Οι κατατάξεις είναι ενδεικτικές, με αμερικανοκεντρικούς ορισμούς, και πολλοί εκδότες παραμένουν αταξινόμητοι. Οι συγγενείς τίτλοι και τα αναδημοσιευμένα πρακτορειακά κείμενα δεν αποδεικνύουν ανεξάρτητη επιβεβαίωση.','Each cell = reporting publishers / all publishers of that group observed in our bounded feed sample. Labels are approximate and US-centric; many publishers are unrated. Similar headlines or syndicated wire reports are not independent verification.')}</p>
 </section>;
}
function MatrixRow({row,tr,active,onSelect,onOpen}:{row:CoverageRow;tr:(el:string,en:string)=>string;active:boolean;onSelect:()=>void;onOpen?:()=>void}){
 return <><tr><td className="ix-subject"><button onClick={onSelect} aria-expanded={active}><b>{row.title}</b><small>{row.totalOutlets} {tr('εκδότες','publishers')} · {row.potentialGap?tr('ανισορροπία στο δείγμα','sample gap candidate'):row.sampleAdequate?tr('χωρίς ισχυρή ένδειξη κενού','no strong gap signal'):tr('μικρό δείγμα','small sample')}</small></button></td>
  {row.cells.map(c=><td key={c.group}><button className="ix-cell" onClick={onSelect} title={`${c.covered} / ${c.sample} publishers`} aria-label={`${c.group}: ${c.covered} of ${c.sample}`}>
   <i className={'ix-cell-fill ix-'+c.group} style={{width:c.sample?c.percent+'%':'0%'}}/><b>{c.sample?c.percent+'%':'—'}</b><small>{c.covered}/{c.sample}</small>
  </button></td>)}</tr>
 {active&&<tr className="ix-detail"><td colSpan={5}><p>{tr('Πηγές ανά ομάδα (ανοίγουν τα πραγματικά άρθρα):','Sources by group (links to actual reports):')}</p>
  <div className="ix-detail-groups">{row.cells.map(c=><div key={c.group}><strong>{labels[c.group]}</strong>{c.reports.length?c.reports.map(r=><a key={r.url} target="_blank" rel="noopener noreferrer" href={r.url}>{r.source} ↗</a>):<small>{tr('Καμία καταγραφή στο δείγμα','No sampled report')}</small>}</div>)}</div>
  {onOpen&&<button className="ix-open" onClick={onOpen}>{tr('Άνοιγμα πλήρους ανάλυσης','Open full analysis')} ↗</button>}
 </td></tr>}</>;
}
