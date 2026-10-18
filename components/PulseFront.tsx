'use client';
import {useEffect,useMemo,useState} from 'react';
import {ArrowRight,ArrowUpRight,Globe2,Layers3,Radio,ScanEye} from 'lucide-react';
import type {Signal} from '@/lib/types';
import type {StoryCase} from '@/lib/world-pulse';
import {coverageFrames,axisTitle,sourceEdition} from '@/lib/coverage-signals';
type Lang='el'|'en';
type Props={cases:StoryCase[];lang:Lang;titleFor:(s:Signal)=>string;open:(c:StoryCase)=>void};
const tx=(l:Lang,el:string,en:string)=>l==='el'?el:en;
export function PulseFront({cases,lang,titleFor,open}:Props){
 const [active,setActive]=useState(0);
 const choices=useMemo(()=>cases.slice(0,6),[cases]);
 useEffect(()=>{if(active>=choices.length)setActive(0)},[active,choices.length]);
 if(!choices.length)return null;
 const current=choices[active]||choices[0];
 const sources=sourceEdition(current);
 const frames=coverageFrames(current);
 return <section className="shiftboard" aria-label="GLITCH newsroom">
  <div className="shiftboard-head"><div><span><Radio size={14}/> {tx(lang,'Ο ΚΟΣΜΟΣ ΤΩΡΑ','THE WORLD NOW')}</span><h2>{tx(lang,'Έξι εξελίξεις. Όχι εξήντα τίτλοι.','Six developments. Not sixty headlines.')}</h2></div><small>{tx(lang,'GLITCH / ΣΗΜΕΡΙΝΗ ΕΚΔΟΣΗ','GLITCH / LIVE EDITION')}</small></div>
  <div className="shiftboard-stage">
   <div className="shiftboard-feature">
    {current.headline.imageUrl?<img src={current.headline.imageUrl} alt="" onError={e=>{e.currentTarget.style.display='none'}}/>:<div className="shiftboard-graphic"><Globe2 size={110} strokeWidth={.55}/></div>}
    <div className="shiftboard-gradient"/>
    <div className="shiftboard-feature-copy">
     <div className="shiftboard-story-top"><span>{tx(lang,'ΠΡΩΤΗ ΕΙΔΗΣΗ','LEAD STORY')} · {String(active+1).padStart(2,'0')}/{String(choices.length).padStart(2,'0')}</span><span>{sources.length} {tx(lang,'εκδότες','publishers')}</span></div>
     <h3>{titleFor(current.headline)}</h3>
     <div className="shiftboard-source-line">{sources.slice(0,4).map(r=><span key={r.source}>{r.source}</span>)}</div>
     <button onClick={()=>open(current)}>{tx(lang,'Άνοιξε τον φάκελο','Open event dossier')}<ArrowUpRight size={18}/></button>
    </div>
   </div>
   <aside className="shiftboard-selector">
    <div className="shiftboard-selector-title"><ScanEye size={17}/>{tx(lang,'ΕΠΙΛΟΓΗ GLITCH','GLITCH EDITION')}</div>
    {choices.map((c,i)=><button key={c.id} onClick={()=>setActive(i)} className={i===active?'active':''} aria-pressed={i===active}>
     <span>{String(i+1).padStart(2,'0')}</span>
     <div><strong>{titleFor(c.headline)}</strong><small>{sourceEdition(c).length} {tx(lang,'πηγές','sources')}</small></div>
     <ArrowRight size={15}/>
    </button>)}
   </aside>
  </div>
  <div className="shiftboard-bar">
   <span><Layers3 size={15}/>{tx(lang,'ΑΠΟΤΥΠΩΜΑ ΚΑΛΥΨΗΣ','COVERAGE FINGERPRINT')}</span>
   <div>{frames.slice(0,3).map(f=><span key={f.key}>{axisTitle(f.key,lang)} <b>{f.count}</b></span>)}</div>
   <small>{tx(lang,'Κατηγορίες τίτλων · όχι πολιτικές βαθμολογίες','Headline subjects, not political scores')}</small>
  </div>
 </section>;
}
