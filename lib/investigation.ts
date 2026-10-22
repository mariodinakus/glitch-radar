import type {Story} from './stories';
import {leanOf} from './stories';
import {canonicalArticle} from './matrix-detection';
import type {HeadlineChange} from './matrix-detection';

export type LeanGroup='left'|'center'|'right'|'unrated';
export type EvidenceReport={source:string;title:string;url:string;timestamp:string};
export type CoverageCell={group:LeanGroup;covered:number;sample:number;percent:number;reports:EvidenceReport[]};
export type CoverageRow={id:string;title:string;importance:number;totalOutlets:number;cells:CoverageCell[];potentialGap:boolean;sampleAdequate:boolean};
export type TimelineEvidence={id:string;type:'reported'|'revision';timestamp:string;source:string;title:string;url:string;before?:string;after?:string;status:'reported'|'revision_observed'};
const GROUPS:LeanGroup[]=['left','center','right','unrated'];

/** One publisher should count once, even when present via several RSS categories. */
export function publisherKey(name:string):string|null{
 const raw=name.trim();
 if(!raw||/^Google News\s*\//i.test(raw))return null;
 const named:[RegExp,string][]=[
  [/^(bbc)\b/i,'BBC'],[/^(the )?guardian\b/i,'Guardian'],
  [/^(the )?new york times\b|^nyt\b/i,'New York Times'],
  [/^(reuters)\b/i,'Reuters'],[/^(associated press|ap news)\b/i,'Associated Press'],
  [/^(npr)\b/i,'NPR'],[/^(cbs news)\b/i,'CBS News'],
  [/^(fox news)\b/i,'Fox News'],[/^(bloomberg)\b/i,'Bloomberg'],
  [/^(dw|deutsche welle)\b/i,'DW'],[/^france\s*24\b/i,'France 24'],
  [/^al jazeera\b/i,'Al Jazeera'],[/^euronews\b/i,'Euronews'],
  [/^un news\b/i,'UN News'],[/^spaceflight news\b/i,'Spaceflight News'],
  [/^(the )?independent\b/i,'The Independent'],[/^wall street journal\b|^wsj\b/i,'WSJ']
 ];
 return named.find(([rx])=>rx.test(raw))?.[1]||raw;
}
function validReport(r:EvidenceReport):boolean{
 return Boolean(publisherKey(r.source)&&canonicalArticle(r.url)&&Number.isFinite(Date.parse(r.timestamp)));
}
/** Coverage is among outlets actually seen in the current, bounded feed sample.
 * This is neither a census of media nor a bias or intentional-suppression detector.
 */
export function buildCoverageRows(stories:Story[],limit=24):CoverageRow[]{
 const universe=new Map<LeanGroup,Set<string>>(GROUPS.map(g=>[g,new Set()]));
 for(const story of stories)for(const r of story.reports){
  const p=publisherKey(r.source);
  if(p&&canonicalArticle(r.url))universe.get(leanOf(p))?.add(p);
 }
 return stories.slice(0,limit).map(story=>{
  const byOutlet=new Map<string,EvidenceReport>();
  for(const r of [...story.reports].sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp))){
   const key=publisherKey(r.source);
   if(key&&validReport(r)&&!byOutlet.has(key))byOutlet.set(key,r);
  }
  const cells:CoverageCell[]=GROUPS.map(group=>{
   const reports=[...byOutlet].filter(([name])=>leanOf(name)===group).map(([,r])=>r);
   const sample=universe.get(group)?.size||0;
   return {group,covered:reports.length,sample,percent:sample?Math.round(100*reports.length/sample):0,reports};
  });
  // Conservative attention-gap *candidate*: two sampled groups >=3 outlets each,
  // leader >=2 reporting, >=40% sample participation and >=30 pp spread.
  const comparable=cells.filter(c=>c.group!=='unrated'&&c.sample>=3);
  const high=[...comparable].sort((a,b)=>b.percent-a.percent)[0];
  const low=[...comparable].sort((a,b)=>a.percent-b.percent)[0];
  const sampleAdequate=comparable.length>=2&&byOutlet.size>=3;
  const potentialGap=Boolean(sampleAdequate&&high&&low&&high.covered>=2&&high.percent>=40&&high.percent-low.percent>=30);
  return {id:story.id,title:story.headline.title,importance:story.importance,totalOutlets:byOutlet.size,cells,potentialGap,sampleAdequate};
 });
}
export function storyRevisions(story:Pick<Story,'reports'>,changes:HeadlineChange[]):HeadlineChange[]{
 const keys=new Set(story.reports.filter(r=>publisherKey(r.source)).map(r=>publisherKey(r.source)+'|'+canonicalArticle(r.url)));
 const seen=new Map<string,HeadlineChange>();
 for(const c of changes){
  if(!c||typeof c.before!=='string'||typeof c.after!=='string'||!c.url||!c.source)continue;
  const key=publisherKey(c.source)+'|'+canonicalArticle(c.url);
  const stamp=Date.parse(c.lastSeen);
  if(keys.has(key)&&Number.isFinite(stamp)){
   seen.set(key+'|'+c.after+'|'+c.lastSeen,c);
  }
 }
 return [...seen.values()].sort((a,b)=>Date.parse(a.lastSeen)-Date.parse(b.lastSeen)).slice(-40);
}
/** RSS article timestamps are NOT our first-observed fetch times; don't label them as such. */
export function storyTimeline(story:Pick<Story,'reports'>,changes:HeadlineChange[]):TimelineEvidence[]{
 const byPublisher=new Map<string,EvidenceReport>();
 for(const r of story.reports){
  const publisher=publisherKey(r.source);
  if(!publisher||!validReport(r))continue;
  const old=byPublisher.get(publisher);
  if(!old||Date.parse(r.timestamp)<Date.parse(old.timestamp))byPublisher.set(publisher,r);
 }
 const reports:TimelineEvidence[]=[...byPublisher.entries()].map(([key,r])=>({
  id:'report:'+key+':'+r.url,type:'reported',timestamp:r.timestamp,source:r.source,title:r.title,url:r.url,status:'reported'
 }));
 const revisions:TimelineEvidence[]=storyRevisions(story,changes).map((c,i)=>({
  id:'revision:'+i+':'+c.id,type:'revision',timestamp:c.lastSeen,source:c.source,
  title:c.after,url:c.url,before:c.before,after:c.after,status:'revision_observed'
 }));
 return [...reports,...revisions].sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp));
}
