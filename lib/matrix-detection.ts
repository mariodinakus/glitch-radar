import type {Signal} from './types';
import type {Story} from './stories';

/** No-key editorial anomaly detection. These checks NEVER establish censorship,
 * deception, coordinated amplification or verified changes to publisher pages. */
export type HeadlineRecord={url:string;source:string;title:string;seenAt:string};
export type HeadlineChange={id:string;url:string;source:string;before:string;after:string;firstSeen:string;lastSeen:string};
export type MatrixFinding={
 id:string;kind:'repeat'|'number'|'lonely';
 storyId:string;title:string;
 sources:string[];reports:{source:string;title:string;url:string}[];
 detailEl:string;detailEn:string;metric:number;
};
export const SNAPSHOT_KEY='glitch.matrix.headlines.v1';
export const CHANGES_KEY='glitch.matrix.changes.v1';
export type RevisionAssessment={level:'substantive'|'routine';reason:string;confidence:'medium'|'low'};
/** Heuristic on titles observed from the SAME RSS entry. Never a verified webpage edit. */
export function assessRevision(before:string,after:string):RevisionAssessment{
 const a=headlineFingerprint(before),b=headlineFingerprint(after);
 const words=(s:string)=>new Set(s.split(' ').filter(x=>x.length>=3&&!/^\\d+(?:[.,]\\d+)?$/.test(x)));
 const old=words(a),next=words(b);
 const union=new Set([...old,...next]);
 const overlap=[...old].filter(x=>next.has(x)).length;
 const shift=union.size?1-overlap/union.size:0;
 const nums=(s:string)=>(s.match(/\\d+(?:[.,]\\d+)?/g)||[]).map(x=>Number(x.replace(',','.')));
 const na=nums(a),nb=nums(b);
 const smallCorrection=na.length===1&&nb.length===1&&na[0]!==nb[0]&&Math.abs(na[0]-nb[0])<=0.5&&Math.max(na[0],nb[0])<=10;
 if(smallCorrection&&shift<.24)return {level:'routine',reason:'Small numeric or precision update',confidence:'low'};
 if(shift<.24&&a!==b)return {level:'routine',reason:'Limited wording or timing update',confidence:'low'};
 if(shift>=.3)return {level:'substantive',reason:'Substantial change in headline wording',confidence:'medium'};
 if(na.join('|')!==nb.join('|')&&na.length&&nb.length)return {level:'substantive',reason:'Numbers changed in headline (context unverified)',confidence:'low'};
 return {level:'routine',reason:'Minor update in feed headline',confidence:'low'};
}

export function canonicalArticle(url:string):string|null{
 try{
  const u=new URL(url);
  if(u.protocol!=='https:'&&u.protocol!=='http:')return null;
  const path=u.pathname.replace(/\/+$/,'')||'/';
  return u.hostname.toLowerCase()+path;
 }catch{return null}
}
export function headlineFingerprint(title:string):string{
 return title.normalize('NFKC').toLocaleLowerCase().replace(/\s+[-–—|]\s+[^–—|]{1,36}$/u,'')
  .replace(/[^\p{L}\p{N}%]+/gu,' ').replace(/\s+/g,' ').trim();
}
export function updateHeadlineHistory(previous:HeadlineRecord[],now:Signal[],date=new Date().toISOString()):
 {records:HeadlineRecord[];changes:HeadlineChange[]}{
 const indexed=new Map<string,HeadlineRecord>();
 for(const r of previous){
  const u=canonicalArticle(r.url);
  if(u&&r.source&&r.title)indexed.set(r.source+'|'+u,r);
 }
 const changes:HeadlineChange[]=[];
 for(const s of now){
  const u=canonicalArticle(s.url);
  if(!u||!s.source||!s.title||s.title.length<12||u.includes('news.google.com'))continue;
  const id=s.source+'|'+u;
  const was=indexed.get(id);
  const old=was?headlineFingerprint(was.title):'';
  const next=headlineFingerprint(s.title);
  if(was&&old&&next&&old!==next){
   // Use the same publisher + URL as baseline. No claims about original web page.
   changes.push({id,url:s.url,source:s.source,before:was.title,after:s.title,firstSeen:was.seenAt,lastSeen:date});
  }
  // Preserve the first-seen observation on repeat; update only when changed.
  if(!was||old!==next)indexed.set(id,{url:s.url,source:s.source,title:s.title,seenAt:date});
 }
 return {records:[...indexed.values()].slice(-1800),changes:changes.slice(0,60)};
}
const genericStop=new Set('the for and from that with about after before over under into will would could said says amid news latest report reports breaking exclusive live update new this these εκεί στην στην από και για των της του τους της ότι είναι τώρα μετά πριν πρώτη σήμερα λέει δήλωσε'.split(/\s+/));
function semanticWords(text:string){
 return [...new Set((headlineFingerprint(text).match(/[\p{L}]{4,}/gu)||[]).filter(x=>!genericStop.has(x)))];
}
function numericEvidence(reports:Signal[]):{source:string;value:string;title:string;url:string}[]{
 const rows:{source:string;value:string;title:string;url:string}[]=[];
 // Numeric comparison only for explicitly percentage-labelled headlines.
 // Units, baselines and reporting periods can differ, so always a REVIEW hint.
 for(const r of reports){
  const match=r.title.match(/(?:\d{1,3}(?:[.,]\d{1,2})?\s*%)/u);
  if(match)rows.push({source:r.source,value:match[0].replace(/\s/g,''),title:r.title,url:r.url});
 }
 return rows;
}
export function detectMatrixPatterns(stories:Story[]):MatrixFinding[]{
 const out:MatrixFinding[]=[];
 for(const story of stories.slice(0,180)){
  const reports=story.reports.filter(x=>x.title&&x.url&&x.source);
  if(!reports.length)continue;
  const byLine=new Map<string,Signal[]>();
  for(const r of reports){
   const key=headlineFingerprint(r.title);
   if(key.length<36||semanticWords(key).length<5)continue;
   const group=byLine.get(key)||[];group.push(r);byLine.set(key,group);
  }
  for(const [line,group] of byLine){
   const outlets=new Set(group.map(x=>x.source));
   if(outlets.size<2)continue;
   out.push({
    id:'repeat:'+story.id+':'+line.slice(0,20),kind:'repeat',storyId:story.id,title:story.headline.title,
    sources:[...outlets],
    reports:group.filter((x,i,a)=>a.findIndex(y=>y.source===x.source)===i).slice(0,8).map(x=>({source:x.source,title:x.title,url:x.url})),
    detailEl:'Ο ίδιος τίτλος εμφανίζεται σχεδόν αυτούσιος σε διαφορετικά μέσα. Αυτό δεν αποδεικνύει αντιγραφή ή κοινό αρχικό ρεπορτάζ.',
    detailEn:'The same headline appears verbatim in different outlets. This does not prove copying or a shared original report.',
    metric:outlets.size
   });
   break;
  }
  const rows=numericEvidence(reports);
  const values=new Set(rows.map(x=>x.value.replace(',','.')));
  const numericOutlets=new Set(rows.map(x=>x.source));
  if(values.size>=2&&numericOutlets.size>=2){
   out.push({
    id:'number:'+story.id,kind:'number',storyId:story.id,title:story.headline.title,
    sources:[...numericOutlets],
    reports:rows.slice(0,7).map(x=>({source:x.source,title:x.title,url:x.url})),
    detailEl:'Εμφανίζονται διαφορετικά ποσοστά σε τίτλους του ίδιου θέματος. Ενδέχεται να αναφέρονται σε διαφορετικές περιόδους ή μεταβλητές — χρειάζεται έλεγχος.',
    detailEn:'Different percentages appear in reports about the same topic. They may refer to different periods or measures — manual review required.',
    metric:values.size
   });
  }
  // A single publisher covering a high-priority story is an observation about
  // our bounded feed sample, not about the media ecosystem at large.
  if(story.importance>=72&&story.sources.length===1&&reports.length===1){
   out.push({
    id:'lonely:'+story.id,kind:'lonely',storyId:story.id,title:story.headline.title,
    sources:story.sources,reports:reports.slice(0,1).map(x=>({source:x.source,title:x.title,url:x.url})),
    detailEl:'Στο τρέχον δείγμα ροών αυτή η σημαντική ιστορία εμφανίζεται από έναν μόνο εκδότη. Δεν σημαίνει αποσιώπηση ή ελλιπή παγκόσμια κάλυψη.',
    detailEn:'Only one publisher in the monitored feed sample covers this high-priority story. This does not imply suppression or global undercoverage.',
    metric:story.importance
   });
  }
 }
 const priority:Record<MatrixFinding['kind'],number>={repeat:3,number:2,lonely:1};
 return out.sort((a,b)=>priority[b.kind]-priority[a.kind]||b.metric-a.metric).slice(0,45);
}
