import test from 'node:test';
import assert from 'node:assert/strict';
import {dedupeCases,discoverScore,discoverRank,eventSignature,similarEvent} from '../lib/discover-ranking.ts';
const at=new Date('2026-10-19T10:00:00Z').getTime();
const make=(id,title,topic='technology',hours=1,publishers=['BBC'])=>({
 id:'case:'+id,
 topic,actorIds:[],domains:[],
 firstAt:new Date(at-hours*3600000).toISOString(),
 lastAt:new Date(at-hours*3600000).toISOString(),
 sources:publishers,
 reports:publishers.map((source,i)=>({id:id+':'+i,source,title,summary:'',url:'https://publisher.example/'+id+'/'+i})),
 headline:{id,title,summary:'',score:45,source:publishers[0],url:'https://publisher.example/'+id,
  imageUrl:undefined,timestamp:new Date(at-hours*3600000).toISOString(),category:'tech'}
});
test('near-identical story titles are de-duplicated but different incidents remain separate',()=>{
 const a=make('1','Nvidia confirms new global AI datacenter investment');
 const b=make('2','Nvidia confirms major new global AI datacenter investment');
 const c=make('3','Microsoft confirms new product for office customers');
 assert.equal(similarEvent(a,b),true);
 assert.equal(similarEvent(a,c),false);
 assert.equal(dedupeCases([a,b,c]).length,2);
});
test('popular mode rewards independently named publishers over single-source headlines',()=>{
 const one=make('a','A single source event with new details','technology',1,['BBC']);
 const many=make('b','A different widely covered trade development','economy',1,['BBC','Reuters','Guardian']);
 assert.ok(discoverScore(many,'popular',[],{},at)>discoverScore(one,'popular',[],{},at));
});
test('popular mode penalizes yesterday and recently read content',()=>{
 const fresh=make('a','A completely new AI company investment today','technology',1,['Reuters','BBC']);
 const old=make('b','A completely different AI company investment yesterday','technology',36,['Reuters','BBC']);
 assert.ok(discoverScore(fresh,'popular',[],{},at)>discoverScore(old,'popular',[],{},at));
 const mark={[eventSignature(fresh)]:at-3600000};
 assert.ok(discoverScore(fresh,'popular',[],mark,at)<discoverScore(fresh,'popular',[],{},at));
});
test('latest mode excludes recently read events without deleting their popular listing',()=>{
 const story=make('a','New policy action on global AI chips');
 const seen={[eventSignature(story)]:at-3600000};
 assert.equal(discoverRank([story],'latest',[],seen,at).length,0);
 assert.equal(discoverRank([story],'popular',[],seen,at).length,1);
});
test('priority mixing places diverse topics in the first slots',()=>{
 const stories=[make('1','Unique headline about latest chip export restrictions','technology',1,['Reuters','BBC']),
 make('2','Important semiconductor wafer production decision','technology',1,['Reuters','BBC']),
 make('3','Company releases new artificial intelligence assistant','technology',1,['Reuters','BBC']),
 make('4','European monetary policy adjustment announced','economy',1,['Reuters','BBC'])];
 const top=discoverRank(stories,'popular',[],{},at).slice(0,4);
 assert.equal(new Set(top.map(x=>x.id)).size,4);
 assert.ok(top.slice(0,3).some(x=>x.topic==='economy'));
});
