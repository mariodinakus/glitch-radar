import test from 'node:test';
import assert from 'node:assert/strict';
import {majorEventSignal,rankMajorEvents,globeHotspots,countryPositions} from '../lib/major-events.ts';
import {discoverRank} from '../lib/discover-ranking.ts';
const now=Date.parse('2026-10-19T12:00:00Z');
function caseFor(id,title,topic,age=2,sources=['BBC','Reuters']){
 const timestamp=new Date(now-age*3600000).toISOString();
 return {id:'case:'+id,
  topic,actorIds:[],domains:[],firstAt:timestamp,lastAt:timestamp,
  sources,reports:sources.map((source,i)=>({source,id:id+':'+i,title,summary:'',timestamp,url:'https://example.org/'+id+'/'+i})),
  headline:{id,title,source:sources[0],summary:'',timestamp,url:'https://example.org/'+id,score:58,category:'world',confidence:'publisher'}
 };
}
test('major events rank above ordinary one-source lifestyle headlines',()=>{
 const major=caseFor('m','A major earthquake strikes a populated region','disaster',1,['Reuters','BBC','Guardian']);
 const ordinary=caseFor('o','A new office furniture collection opens this week','other',1,['BBC']);
 assert.ok(majorEventSignal(major,now).score>majorEventSignal(ordinary,now).score);
 assert.equal(rankMajorEvents([ordinary,major],2,now)[0].id,major.id);
});
test('Big Events discovery is separate from Popular',()=>{
 const significant=caseFor('a','General election results trigger coalition negotiations','politics',2,['Reuters','BBC','Guardian']);
 const minor=caseFor('b','A pop culture personality posts a funny picture','other',1,['BBC']);
 assert.equal(discoverRank([minor,significant],'big',[],{},now)[0].id,significant.id);
});
test('globe hotspots are restricted to known country-mention centroids',()=>{
 const article=caseFor('geo','Ukraine discusses new ceasefire proposal','conflict',1,['Reuters','BBC']);
 article.actorIds=['c:ua'];
 const pins=globeHotspots([article]);
 assert.ok(pins.length>0);
 assert.equal(pins[0].location.id,'c:ua');
 assert.equal(pins[0].location.lat,countryPositions['c:ua'].lat);
});
test('non-geographic worldwide AI news gets no invented location marker',()=>{
 const article=caseFor('ai','OpenAI announces an improved language model','technology');
 article.actorIds=['m:openai'];
 assert.equal(globeHotspots([article]).length,0);
});
