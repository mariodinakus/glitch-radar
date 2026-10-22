import {test} from 'node:test';
import assert from 'node:assert/strict';
import {publisherKey,buildCoverageRows,storyRevisions,storyTimeline} from '../lib/investigation.ts';
const at='2026-10-22T12:00:00Z';
function r(source,title,id,time=at){return {source,title,url:'https://example.com/story/'+id,timestamp:time};}
const focus=[r('The Guardian','Leaders attend talks',1),r('NPR World','Leaders discuss talks',2),r('BBC World','Officials begin talks',3)];
const corpus=[...focus,r('New York Times World','Other report',4),r('Fox News World','Other report',5),r('The Telegraph','Other report',6),r('Daily Mail','Other report',7),r('Reuters','Other report',8),r('Bloomberg','Other report',9)];
const story=(id,reports)=>({id,headline:reports[0],reports,importance:82});
test('Normalizes feed channels to one publisher and excludes Google aggregator feeds',()=>{
 assert.equal(publisherKey('BBC World'),'BBC');
 assert.equal(publisherKey('BBC Technology'),'BBC');
 assert.equal(publisherKey('Google News / World'),null);
 assert.equal(publisherKey('NPR World'),'NPR');
});
test('Coverage matrix compares against the observed publisher universe and flags sample gaps only',()=>{
 const rows=buildCoverageRows([story('focus',focus),...corpus.map((x,i)=>story('b'+i,[x]))],10);
 const found=rows[0];
 assert.equal(found.totalOutlets,3);
 const left=found.cells.find(c=>c.group==='left');
 const right=found.cells.find(c=>c.group==='right');
 assert.equal(left.covered,2);assert.equal(left.sample,3);assert.equal(right.covered,0);
 assert.equal(right.sample,3);assert.equal(found.potentialGap,true);
 assert.equal(buildCoverageRows([story('one',[r('BBC News','Only one source',25)])])[0].potentialGap,false);
});
test('Revision matching requires same original article URL and source publisher',()=>{
 const s=story('a',[r('BBC World','Officials confirm initial ceasefire',10)]);
 const changes=[
  {id:'BBC World|key',source:'BBC Business',url:'https://example.com/story/10?utm_source=rss',before:'Officials confirm initial ceasefire',after:'Leaders deny ceasefire amid violence',firstSeen:at,lastSeen:'2026-10-22T13:00:00Z'},
  {id:'CNN|other',source:'CNN',url:'https://example.com/story/10',before:'A',after:'B',firstSeen:at,lastSeen:'2026-10-22T13:00:00Z'}
 ];
 const result=storyRevisions(s,changes);
 assert.equal(result.length,1);
 assert.equal(result[0].source,'BBC Business');
 const events=storyTimeline(s,changes);
 assert.equal(events.length,2);
 assert.equal(events[0].type,'reported');assert.equal(events[1].type,'revision');
});
test('Timeline deduplicates categories from the same publisher',()=>{
 const storyInstance=story('repeat',[r('BBC World','Opening report',1,at),r('BBC Technology','Reposted',2,'2026-10-22T13:00:00Z')]);
 const events=storyTimeline(storyInstance,[]);
 assert.equal(events.length,1);
});
