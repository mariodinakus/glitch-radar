'use client';
import {useMemo,useState} from 'react';
import type {Story} from '@/lib/stories';
import type {HeadlineChange} from '@/lib/matrix-detection';
import {storyTimeline} from '@/lib/investigation';
type Props={story:Story;lang:'el'|'en';revisions:HeadlineChange[];archiveAvailable:boolean};
type Period='all'|'24h'|'72h';
export default function GlitchTimeline({story,lang,revisions,archiveAvailable}:Props){
 const [period,setPeriod]=useState<Period>('all');
 const [focus,setFocus]=useState<string|null>(null);
 const el=lang==='el';const tr=(a:string,b:string)=>el?a:b;
 const all=useMemo(()=>storyTimeline(story,revisions),[story,revisions]);
 const latest=all.length?Date.parse(all[all.length-1].timestamp):0;
 const shown=all.filter(e=>period==='all'||Date.parse(e.timestamp)>=latest-(period==='24h'?24:72)*3600000);
 const first=shown.length?Date.parse(shown[0].timestamp):0;
 const last=shown.length?Date.parse(shown[shown.length-1].timestamp):first;
 const revisionCount=all.filter(e=>e.type==='revision').length;
 const selected=shown.find(x=>x.id===focus)||shown[0];
 const fmt=(date:string)=>new Date(date).toLocaleString(el?'el-GR':'en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
 return <section className="ix-panel gt" aria-label="Glitch Timeline">
  <div className="ix-header"><div><span className="ix-kicker">GLITCH / TIMELINE</span>
   <h2>{tr('Η εξέλιξη της ιστορίας','How the story developed')}</h2>
   <p>{tr('Χρονική ακολουθία δημοσιεύσεων από RSS και καταγεγραμμένων αλλαγών τίτλου, με παραπομπές.','Article feed timestamps and observed headline revisions in chronological order, linked to sources.')}</p>
  </div><div className="gt-tabs" role="group" aria-label="Timeline range">
   {(['all','24h','72h'] as Period[]).map(p=><button key={p} className={period===p?'active':''} onClick={()=>{setPeriod(p);setFocus(null)}} aria-pressed={period===p}>{p==='all'?tr('Όλα','All'):p}</button>)}
  </div></div>
  <div className="gt-statline"><span><b>{all.filter(e=>e.type==='reported').length}</b> {tr('εκδότες','outlets')}</span><span><b>{revisionCount}</b> {tr('καταγεγραμμένες αναθεωρήσεις','observed revisions')}</span><span>{archiveAvailable?tr('Κοινό αρχείο διαθέσιμο','Shared archive available'):tr('Μόνο RSS / τοπική ιστορία','RSS / local history only')}</span></div>
  {shown.length>0?<><div className="gt-chart" role="list" aria-label="Chronology">
   {shown.map(e=>{const time=Date.parse(e.timestamp);const pct=last>first?(time-first)/(last-first)*100:50;
    return <button key={e.id} role="listitem" className={'gt-point '+(e.type==='revision'?'revision ':'')+(selected?.id===e.id?'selected':'')} style={{left:Math.max(3,Math.min(97,pct))+'%'}} onClick={()=>setFocus(e.id)} aria-label={e.source+' — '+fmt(e.timestamp)} title={e.source+' · '+fmt(e.timestamp)}/>;
   })}
  </div>
  <div className="gt-axis"><span>{fmt(shown[0].timestamp)}</span><span>{fmt(shown[shown.length-1].timestamp)}</span></div>
  {selected&&<article className="gt-inspect">
   <div><span className="gt-status">{selected.type==='revision'?tr('Αλλαγή τίτλου στη ροή','Feed headline changed'):tr('Δημοσίευση στη ροή','Article listed in feed')}</span><time dateTime={selected.timestamp}>{fmt(selected.timestamp)}</time></div>
   <strong>{selected.source}</strong>
   {selected.before&&<p><small>{tr('Πριν','Before')}</small>{selected.before}</p>}
   <p><small>{selected.before?tr('Μετά','After'):tr('Τίτλος','Headline')}</small>{selected.title}</p>
   <a href={selected.url} target="_blank" rel="noopener noreferrer">{tr('Άνοιγμα πρωτογενούς συνδέσμου','Open source link')} ↗</a>
  </article>}
  <div className="gt-list">{shown.map(e=><button key={e.id} className={selected?.id===e.id?'active':''} onClick={()=>setFocus(e.id)}>
   <time>{fmt(e.timestamp)}</time><span className={'gt-symbol '+e.type}>{e.type==='revision'?'↺':'●'}</span><span><b>{e.source}</b><small>{e.type==='revision'?tr('Αναθεώρηση τίτλου','Headline revision'):tr('Δημοσίευση','Report')}</small></span>
  </button>)}</div></>:<p className="ix-empty">{tr('Δεν υπάρχουν στοιχεία μέσα στο επιλεγμένο διάστημα','No timeline entries in selected window.')}</p>}
  <div className="gt-verdict"><strong>{tr('Έλεγχος ισχυρισμών','Claim verification')}</strong>
   <p>{tr('Η διασταύρωση πολλών τίτλων δεν αρκεί για να χαρακτηριστεί γεγονός «επιβεβαιωμένο» ή «διαψευσμένο». Δεν υπάρχουν τεκμηριωμένες αποφάσεις fact-check σε αυτά τα δεδομένα· η κατάσταση παραμένει «μη επαληθευμένη εδώ».','Multiple headlines alone cannot establish a fact as confirmed or disproven. This feed contains no authoritative claim-level fact-check verdicts; verification is not established here.')}</p>
  </div>
  <p className="ix-disclaimer">{tr('Οι χρονικές σημάνσεις είναι αυτές που παρέχουν οι ροές των εκδοτών και δεν αποδεικνύουν ποιος δημοσίευσε πρώτος παγκοσμίως. Οι αναθεωρήσεις προέρχονται από συγκρίσεις αποθηκευμένων RSS στιγμιοτύπων, όχι από επιθεώρηση της ιστοσελίδας του εκδότη.','Feed timestamps are publisher supplied and do not prove who first published worldwide. Revisions compare saved RSS versions, not independently verified changes to live publisher pages.')}</p>
 </section>;
}
