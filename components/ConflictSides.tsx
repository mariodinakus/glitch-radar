'use client';
import {Shield,Handshake,BookOpen,AlertTriangle,Users} from 'lucide-react';
import {conflictProfiles} from '@/lib/conflict-sides';
import type {ConflictLink} from '@/lib/conflict-sides';

type Lang='el'|'en';
type Props={conflictId:string;lang:Lang;heading?:string;aiActors?:{name:string;position:string}[]};
const label=(l:Lang,el:string,en:string)=>l==='el'?el:en;
const role:Record<ConflictLink['basis'],{el:string;en:string}>={
 documented:{el:'Καταγεγραμμένη σχέση',en:'Documented relationship'},
 reported:{el:'Αναφερόμενη / αμφισβητούμενη',en:'Reported / disputed'},
 historical:{el:'Ιστορική σχέση',en:'Historical relationship'}
};
export default function ConflictSides({conflictId,lang,aiActors}:Props){
 const p=conflictProfiles[conflictId];
 const el=lang==='el';
 return <section className="war-actors" aria-label={label(lang,'Εμπλεκόμενοι και υποστηρικτές','Combatants and external supporters')}>
  <div className="war-actors-heading">
   <span><Users size={16}/>{el?'ΠΟΙΟΣ ΕΙΝΑΙ ΠΟΙΟΣ':'WHO IS WHO'}</span>
   <h2>{el?'Πλευρές & υποστηρικτές':'Factions & supporters'}<em>.</em></h2>
   <p>{el?'Ξεχωρίζουμε ποιος πολεμά από ποιος προσφέρει όπλα, χρήματα, διπλωματική ή ιστορική υποστήριξη. Το ένα δεν συνεπάγεται το άλλο.':
    'Combatants are distinct from external providers of weapons, funding, diplomacy or historical support. One does not automatically imply the other.'}</p>
  </div>
  {p?<><div className="war-actor-matchup">
   {p.camps.map((c,i)=><article key={i} className="war-actor-camp">
     <span className="war-actor-camp-code">{el?'ΠΛΕΥΡΑ':'SIDE'} {i===0?'A':'B'}</span>
     <h3><Shield size={17}/>{el?c.nameEl:c.nameEn}</h3>
     <p className="war-actor-description">{el?c.roleEl:c.roleEn}</p>
     <div className="war-actor-support-head"><Handshake size={15}/>{el?'Εξωτερική υποστήριξη / συνδέσεις':'Outside support / ties'}</div>
     {c.support.length?<div className="war-support-list">{c.support.map((s,j)=><div key={j} className="war-support-line">
       <div><strong>{el?s.el:s.en}</strong><span className={'war-evidence e-'+s.basis}>{role[s.basis][el?'el':'en']}</span></div>
       <p>{el?s.howEl:s.howEn}</p>
      </div>)}</div>:<p className="war-support-none">{el?'Δεν καταγράφεται επαρκώς τεκμηριωμένη εξωτερική υποστήριξη στο διαθέσιμο προφίλ. Αυτό δεν σημαίνει ότι δεν υπάρχει.':'No sufficiently documented external backer in this profile. This does not imply none exists.'}</p>}
   </article>)}
  </div>
   <p className="war-actor-caveat"><AlertTriangle size={16}/>{el?p.contextEl:p.contextEn}</p>
   <div className="war-actors-sources"><BookOpen size={14}/><span>{el?'Πηγές και τελευταία τεκμηρίωση:':'Sources and last review:'} {p.updated}</span>
    {p.sources.map(x=><a key={x.url} href={x.url} target="_blank" rel="noopener noreferrer">{x.name} ↗</a>)}
   </div>
  </>:<div className="war-actors-pending">
    <strong>{el?'Δεν έχει ολοκληρωθεί τεκμηριωμένη χαρτογράφηση παρατάξεων για αυτή την εστία.':'Source-backed faction mapping is not yet available for this situation.'}</strong>
    <p>{el?'Δεν θα εμφανίσουμε επινοημένα ονόματα «συμμάχων». Η τρέχουσα κάλυψη και οι πηγές παραμένουν παρακάτω.':'We will not invent allies. Recent reporting and source articles are available below.'}</p>
    {!!aiActors?.length&&<div className="war-ai-actors"><small>{el?'Προσωρινή εξαγωγή από AI βάσει πρόσφατων τίτλων · δεν έχει επαληθευτεί ανεξάρτητα':'Provisional AI extraction from recent news · not independently checked'}</small>
      <ul>{aiActors.slice(0,6).map((a,i)=><li key={i}><strong>{a.name}</strong><span>{a.position}</span></li>)}</ul>
    </div>}
    <a href="https://www.cfr.org/global-conflict-tracker/dashboard" target="_blank" rel="noopener noreferrer">CFR · Global Conflict Tracker ↗</a>
   </div>}
 </section>;
}
