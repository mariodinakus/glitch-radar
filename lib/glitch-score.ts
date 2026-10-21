import type {Story} from './stories';
import {detectMatrixPatterns} from './matrix-detection';

/**
 * GLITCH SCORE — a transparent 0-100 "worth a second look" indicator per story.
 * It is built only from observable patterns in the monitored feed sample
 * (repeated headlines, conflicting figures, single-publisher coverage).
 * It is NOT a truth, bias, censorship or manipulation score.
 */
export type GlitchReason={kind:'repeat'|'number'|'counts'|'lonely';points:number;el:string;en:string};
export type GlitchOrigin={source:string;at:string;followers:number;windowMin:number};
export type GlitchScore={score:number;level:'none'|'watch'|'high';reasons:GlitchReason[];origin:GlitchOrigin|null;counts:CountRow[]};
export type CountRow={source:string;unit:string;value:string;title:string;url:string};

const UNIT:Record<string,string>={
 killed:'killed',dead:'killed',deaths:'killed',death:'killed',fatalities:'killed',casualties:'casualties',wounded:'wounded',injured:'wounded',
 drones:'drones',missiles:'missiles',soldiers:'soldiers',troops:'soldiers',νεκροί:'killed',τραυματίες:'wounded',drones_el:'drones'
};
const NUM='(\\d{1,3}(?:[,.]\\d{3})+|\\d{1,6})';
const WORDS='(killed|dead|deaths?|fatalities|casualties|wounded|injured|drones|missiles|soldiers|troops|νεκροί|τραυματίες)';
const before=new RegExp(NUM+'\\s+(?:[\\p{L}-]+\\s+){0,2}?'+WORDS+'\\b','iu');
const after=new RegExp('\\b(?:killed|kills|killing|death toll (?:rises to|of|at))\\s+(?:at least\\s+|more than\\s+|over\\s+)?'+NUM,'iu');

/** Figures about losses/weapons in headlines. Different values may describe different incidents or periods. */
export function countEvidence(reports:{source:string;title:string;url:string}[]):CountRow[]{
 const rows:CountRow[]=[];
 for(const r of reports){
  const a=r.title.match(before);
  const b=a?null:r.title.match(after);
  const raw=a?a[1]:b?b[1]:null;
  if(!raw)continue;
  const unit=a?(UNIT[a[2].toLowerCase()]||a[2].toLowerCase()):'killed';
  const value=raw.replace(/[,.](?=\d{3}\b)/g,'');
  if(Number(value)<2)continue;
  rows.push({source:r.source,unit,value,title:r.title,url:r.url});
 }
 return rows;
}

export function originTrace(story:Story):GlitchOrigin|null{
 const firstBySource=new Map<string,number>();
 for(const r of story.reports){
  const t=Date.parse(r.timestamp);
  if(!Number.isFinite(t)||!r.source)continue;
  const old=firstBySource.get(r.source);
  if(old===undefined||t<old)firstBySource.set(r.source,t);
 }
 if(firstBySource.size<3)return null;
 const sorted=[...firstBySource.entries()].sort((a,b)=>a[1]-b[1]);
 const [source,at]=sorted[0];
 const windowMin=120;
 const followers=sorted.slice(1).filter(([,t])=>t-at<=windowMin*60_000).length;
 return {source,at:new Date(at).toISOString(),followers,windowMin};
}

export function glitchScore(story:Story):GlitchScore{
 const reasons:GlitchReason[]=[];
 for(const f of detectMatrixPatterns([story])){
  if(f.kind==='repeat')reasons.push({kind:'repeat',points:Math.min(40,20+f.metric*6),
   el:`Ίδιος τίτλος σε ${f.metric} μέσα`,en:`Same headline in ${f.metric} outlets`});
  else if(f.kind==='number')reasons.push({kind:'number',points:Math.min(40,20+f.metric*8),
   el:`${f.metric} διαφορετικά ποσοστά στο ίδιο θέμα`,en:`${f.metric} different percentages on one topic`});
  else reasons.push({kind:'lonely',points:15,el:'Μόνο ένας εκδότης στο δείγμα',en:'Only one publisher in the sample'});
 }
 const counts=countEvidence(story.reports);
 const byUnit=new Map<string,Set<string>>();
 const outletsByUnit=new Map<string,Set<string>>();
 for(const c of counts){
  (byUnit.get(c.unit)||byUnit.set(c.unit,new Set()).get(c.unit)!).add(c.value);
  (outletsByUnit.get(c.unit)||outletsByUnit.set(c.unit,new Set()).get(c.unit)!).add(c.source);
 }
 for(const [unit,values] of byUnit){
  if(values.size>=2&&(outletsByUnit.get(unit)?.size||0)>=2){
   reasons.push({kind:'counts',points:Math.min(45,25+values.size*8),
    el:`Διαφορετικοί αριθμοί (${unit}): ${[...values].slice(0,4).join(' / ')}`,
    en:`Conflicting figures (${unit}): ${[...values].slice(0,4).join(' / ')}`});
   break;
  }
 }
 const score=Math.min(100,reasons.reduce((n,r)=>n+r.points,0));
 return {score,level:score>=45?'high':score>=20?'watch':'none',reasons,origin:originTrace(story),counts};
}
