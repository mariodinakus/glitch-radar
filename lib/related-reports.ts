import type {Signal} from './types';
import {eventKind} from './editorial';

const stop=new Set(("the and with from this that over into after before against under amid says said new latest world news live today " +
 "their there about more will have has had are was were what when where who says review report reports breaking update updates " +
 "all for how why its his her our it its but not first crisis world conflict global today year week major strong " +
 "στη στην στον στο στα των τον την της της και από για που με πως τις ένα μία μία νέα νέες νέος τώρα είδηση " +
 "πολέμου πόλεμος πόλεμο διαδηλώσεις πρόεδρος κυβέρνηση έκτακτο οικονομία").split(/\s+/));
function words(title:string):Set<string>{
 const cleaned=title.replace(/\s+[-|]\s+(BBC|Reuters|Guardian|Al Jazeera|AP News|Newsweek).*$/i,'');
 return new Set((cleaned.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu)||[]).filter(t=>t.length>=4&&!stop.has(t)&&!(/^\d+$/.test(t)&&t.length<4)));
}
export function relatedReports(story:Signal,all:Signal[],max=4):Signal[]{
 const a=words(story.title),category=eventKind(story);
 if(a.size<3)return [];
 const window=Date.parse(story.timestamp);
 if(!Number.isFinite(window))return [];
 return all.filter(v=>v.id!==story.id&&v.url!==story.url&&v.source!==story.source&&Math.abs(Date.parse(v.timestamp)-window)<=48*3600000)
  .map(v=>{
   const b=words(v.title),overlap=[...a].filter(x=>b.has(x));
   const sameKind=category!=='other'&&category===eventKind(v);
   const jaccard=overlap.length/Math.max(1,new Set([...a,...b]).size);
   return {v,shared:overlap.length,weight:jaccard+(sameKind?.10:0)};
  })
  .filter(x=>x.shared>=3&&(x.weight>=.24))
  .sort((a,b)=>b.weight-a.weight||Date.parse(b.v.timestamp)-Date.parse(a.v.timestamp))
  .slice(0,max).map(x=>x.v);
}
