'use client';
import {ArrowUpRight,Clock3,SlidersHorizontal} from 'lucide-react';
import {nowTopics} from '@/lib/now-topics';
import type {NowTopic} from '@/lib/now-topics';

const featured:NowTopic[]=['all','conflict','protest','politics','economy','disaster','technology','energy','science','society','other'];
export function NewsroomNav({active,onChoose,hours,onHours,counts}:{
 active:NowTopic;
 onChoose:(value:NowTopic)=>void;
 hours:24|72;
 onHours:(value:24|72)=>void;
 counts:Record<NowTopic,number>;
}){
 return <section className="nr-nav" aria-label="Ειδησεογραφικές κατηγορίες">
   <div className="nr-nav-top">
    <div className="nr-nav-title"><span className="nr-nav-eyebrow"><span className="nr-nav-pulse"/> GLITCH / NEWS DESK</span><h2>ΤΙ ΣΥΜΒΑΙΝΕΙ <em>ΤΩΡΑ</em></h2></div>
    <div className="nr-nav-fresh"><Clock3 size={13}/> ΡΟΗ <strong>{counts.all}</strong> ΑΝΑΦΟΡΩΝ</div>
   </div>
   <div className="nr-nav-line">
    <div className="nr-nav-scroll" role="group" aria-label="Φίλτρα ειδήσεων">
     {featured.map(key=>{
      const item=nowTopics.find(x=>x.key===key);
      if(!item)return null;
      return <button key={key} onClick={()=>onChoose(key)} aria-pressed={active===key} className={'nr-nav-chip'+(active===key?' is-active':'')}>
       <span>{item.short}</span>{counts[key]>0&&<span className="nr-nav-count">{counts[key]}</span>}
      </button>;
     })}
    </div>
   </div>
   <div className="nr-nav-bottom">
    <div className="nr-nav-context"><SlidersHorizontal size={14}/> <span>{nowTopics.find(t=>t.key===active)?.label||'Όλες οι ειδήσεις'}</span><ArrowUpRight size={13}/></div>
    <div className="nr-period" role="group" aria-label="Χρονικό παράθυρο">
      <button className={hours===24?'selected':''} onClick={()=>onHours(24)} aria-pressed={hours===24}>24Ω</button>
      <button className={hours===72?'selected':''} onClick={()=>onHours(72)} aria-pressed={hours===72}>72Ω</button>
    </div>
   </div>
 </section>;
}