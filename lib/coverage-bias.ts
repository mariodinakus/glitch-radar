import type {StoryCase} from './world-pulse';
import {mediaProfile} from './media-profiles';

export type Orientation='left'|'center'|'right'|'unrated';
export type CoverageBreakdown={left:number;center:number;right:number;unrated:number;total:number;rated:number;ratedPct:{left:number;center:number;right:number};sources:{name:string;orientation:Orientation;url?:string}[]};
export function mediaOrientation(name:string):Orientation{
 const p=mediaProfile(name);
 if(!p?.biasSource||!p.biasEn)return 'unrated';
 const s=p.biasEn.trim().toLowerCase();
 if(s.startsWith('left')||s.startsWith('lean left'))return 'left';
 if(s.startsWith('center'))return 'center';
 if(s.startsWith('right')||s.startsWith('lean right'))return 'right';
 return 'unrated';
}
export function coverageBreakdown(c:StoryCase):CoverageBreakdown{
 const by=new Map<string,{name:string;orientation:Orientation;url?:string}>();
 for(const r of c.reports){
  const k=r.source.toLowerCase();
  if(!by.has(k))by.set(k,{name:r.source,orientation:mediaOrientation(r.source),url:r.url});
 }
 const sources=[...by.values()];
 const left=sources.filter(x=>x.orientation==='left').length;
 const center=sources.filter(x=>x.orientation==='center').length;
 const right=sources.filter(x=>x.orientation==='right').length;
 const rated=left+center+right;
 const total=sources.length;
 return {left,center,right,unrated:total-rated,rated,total,
  ratedPct:{left:rated?Math.round(100*left/rated):0,center:rated?Math.round(100*center/rated):0,right:rated?Math.round(100*right/rated):0},sources};
}
