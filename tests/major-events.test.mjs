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
 const pins=globeHotspots([article],18,now);
 assert.ok(pins.length>0);
 assert.equal(pins[0].location.id,'c:ua');
 assert.equal(pins[0].location.lat,countryPositions['c:ua'].lat);
});
test('non-geographic worldwide AI news gets no invented location marker',()=>{
 const article=caseFor('ai','OpenAI announces an improved language model','technology');
 article.actorIds=['m:openai'];
 assert.equal(globeHotspots([article],18,now).length,0);
});

test('front page includes conflict, energy, elections and diplomatic tensions',()=>{
 const stories=[
  caseFor('war','Airstrikes hit border towns as ceasefire talks continue','conflict'),
  caseFor('energy','Oil supply disrupted after pipeline shutdown','economy'),
  caseFor('vote','Historic gains in Israeli election as parties form a coalition','politics'),
  caseFor('tension','Military tensions rise on the border','politics')
 ];
 const ranked=rankMajorEvents(stories,12,now);
 assert.equal(ranked.length,4);
 assert.deepEqual(new Set(ranked.map(s=>majorEventSignal(s,now).lens)),new Set(['conflict','energy','election','tension']));
});

test('recent lifestyle, company and opinion headlines cannot fill the major-events list',()=>{
 const ordinary=[
  caseFor('furniture','A new office furniture collection opens this week','other',1,['BBC','Reuters','Guardian','CNN']),
  caseFor('tech','OpenAI launches a new emoji for office workers','technology',1,['BBC','Reuters','Guardian']),
  caseFor('review','Review: a new novel about war and politics','other',1,['BBC','Reuters','Guardian']),
  caseFor('historic','World War I bombs and grenades uncovered by melting glaciers','conflict',1,['BBC']),
  caseFor('figurative','OpenAI launches election war room to track interference','technology',1,['BBC'])
 ];
 const significant=caseFor('rate','Central bank cuts interest rates','economy');
 assert.deepEqual(rankMajorEvents([...ordinary,significant],12,now).map(x=>x.id),[significant.id]);
 assert.deepEqual(rankMajorEvents(ordinary,12,now),[]);
});

test('stale, invalid or future dates cannot masquerade as current developments',()=>{
 const old=caseFor('old','A ceasefire agreement is announced','conflict',97);
 const future=caseFor('future','A ceasefire agreement is announced','conflict',-3);
 const invalid=caseFor('bad','A ceasefire agreement is announced','conflict');invalid.lastAt='unknown';
 assert.deepEqual(rankMajorEvents([old,future,invalid],10,now),[]);
});

test('multiple feed names from the same publisher count once',()=>{
 const article=caseFor('same','Election results announced after nationwide vote','politics',1,['BBC World','BBC Europe','Reuters']);
 assert.equal(majorEventSignal(article,now).publisherCount,2);
});

test('the first developments mix event types without adding unrelated headlines',()=>{
 const stories=[
  caseFor('e1','Election results announced in France','politics',1,['BBC','Reuters']),
  caseFor('e2','Election results announced in Brazil','politics',1,['BBC','Reuters']),
  caseFor('e3','Election results announced in Canada','politics',1,['BBC','Reuters']),
  caseFor('war','Airstrikes hit border town','conflict',1,['BBC']),
  caseFor('power','Oil supply disrupted after pipeline shutdown','economy',1,['BBC'])
 ];
 const first=rankMajorEvents(stories,5,now).slice(0,3).map(s=>majorEventSignal(s,now).lens);
 assert.ok(first.includes('conflict'));
 assert.ok(first.includes('energy'));
});
