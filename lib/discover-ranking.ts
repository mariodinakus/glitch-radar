import type {StoryCase} from './world-pulse';

export type DiscoverMode='popular'|'latest'|'foryou';
export type RankedStory={story:StoryCase;score:number;publisherCount:number;time:number;kind:string};
const common=new Set('the this that with from into over after before amid says said will have their there about under above more than during against report reports warns warning latest breaking update updates new today yesterday tomorrow world global international government ministers president country countries crisis companies company amid says says not one two first last now says told more being amid major says news ελληνική ελληνικά ανακοίνωσε σύμφωνα όπως από στην στον στους στις της του των και για είναι μετά πριν νέο νέος νέα στην ως με στις ενώ'.split(/\s+/));
function terms(text:string):string[]{
 return [...new Set((text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').match(/[\p{L}\p{N}]+/gu)||[]).filter(x=>x.length>3&&!common.has(x)&&!(/^\d+$/.test(x))))];
}
function jaccard(a:Set<string>,b:Set<string>):number{
 const shared=[...a].filter(x=>b.has(x)).length;
 return shared/Math.max(1,a.size+b.size-shared);
}
export function similarEvent(a:StoryCase,b:StoryCase):boolean{
 if(a.id===b.id)return true;
 if(a.topic!==b.topic)return false;
 const aTerms=new Set(terms(a.headline.title)),bTerms=new Set(terms(b.headline.title));
 const commonWords=[...aTerms].filter(x=>bTerms.has(x)).length;
 if(commonWords<3)return false;
 const j=jaccard(aTerms,bTerms);
 const actors=a.actorIds.some(id=>b.actorIds.includes(id));
 return j>=.72||(actors&&j>=.47);
}
export function dedupeCases(cases:StoryCase[]):StoryCase[]{
 const result:StoryCase[]=[];
 const seenUrls=new Set<string>();
 for(const c of cases){
  const url=c.headline.url.split('#')[0].replace(/[?&](utm_[^=&]+|fbclid|gclid)=[^&]*/gi,'');
  if(seenUrls.has(url))continue;
  if(result.some(x=>similarEvent(x,c)))continue;
  result.push(c);seenUrls.add(url);
 }
 return result;
}
const groups=(c:StoryCase)=>{
 if(c.topic==='technology'||c.topic==='science')return 'innovation';
 if(c.topic==='economy'||c.topic==='energy')return 'money';
 if(c.topic==='conflict'||c.topic==='politics'||c.topic==='protest')return 'geopolitics';
 return 'society';
};
export const eventSignature=(c:StoryCase)=>{
 const tokens=terms(c.headline.title).slice(0,7).sort().join(':');
 return c.topic+':'+(c.actorIds.slice(0,2).sort().join(':')||'general')+':'+tokens;
};
export function discoverScore(c:StoryCase,mode:DiscoverMode,interest:string[],seen:Record<string,number>,now=Date.now()):number{
 const age=Math.max(0,(now-Date.parse(c.lastAt))/3600000);
 const publishers=c.sources.length;
 const freshness=Math.max(0,1-age/72);
 const sources=Math.min(6,publishers);
 const score=Math.min(100,c.headline.score);
 if(mode==='latest')return freshness*120+Math.min(sources,4)*3-age*.04;
 if(mode==='foryou'){
  const actors=c.actorIds.filter(x=>interest.includes(x)).length;
  const subjects=interest.includes(groups(c))?1:0;
  return freshness*40+sources*9+actors*22+subjects*27+(seen[eventSignature(c)]?0:18)+score*.12;
 }
 const viewedAt=seen[eventSignature(c)]||0;
 const recentlyViewed=viewedAt>0&&(now-viewedAt)<24*3600000;
 return sources*24+Math.min(c.reports.length,8)*3+Math.max(0,1-age/48)*38-age*1.05+score*.13-(recentlyViewed?42:0);
}
export function discoverRank(cases:StoryCase[],mode:DiscoverMode,interest:string[],seen:Record<string,number>,now=Date.now()):StoryCase[]{
 const ranked=dedupeCases([...cases].sort((a,b)=>Date.parse(b.lastAt)-Date.parse(a.lastAt)))
  .filter(x=>mode!=='latest'||!seen[eventSignature(x)]||(now-seen[eventSignature(x)])>48*3600000)
  .map(x=>({story:x,score:discoverScore(x,mode,interest,seen,now)}))
  .sort((a,b)=>b.score-a.score||Date.parse(b.story.lastAt)-Date.parse(a.story.lastAt));
 const result:StoryCase[]=[],counts=new Map<string,number>();
 for(const {story} of ranked){
  const key=groups(story);
  if((counts.get(key)||0)<2){result.push(story);counts.set(key,(counts.get(key)||0)+1);}
 }
 for(const {story} of ranked)if(!result.some(x=>x.id===story.id))result.push(story);
 return result;
}
export function publisherCount(c:StoryCase):number{
 return new Set(c.reports.map(x=>x.source.toLowerCase())).size;
}
