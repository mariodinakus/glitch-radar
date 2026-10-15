import {test} from 'node:test';
import assert from 'node:assert/strict';
import {detectBlindspots,topicTokens} from '../lib/blindspots.ts';
const now=Date.parse('2026-10-15T20:00:00Z');
const t='2026-10-15T16:00:00Z';
const status=(names=['BBC World','Guardian World','Al Jazeera World','ΕΡΤ Ειδήσεις'])=>names.map(name=>({source:name,ok:true,count:10}));
const entry=(patch)=>({id:'un-1',title:'Sudan cholera outbreak threatens displaced families',summary:'UN News describes rising health needs and displacement',category:'world',source:'UN News',confidence:'publisher',timestamp:t,score:64,url:'https://news.un.org/a',level:'elevated',details:[],metricLabel:'',metricValue:'',reason:'',...patch});

test('important UN story without matching monitored outlet headlines is explicitly sample-limited',()=>{
 const r=detectBlindspots([entry({})],status(),now);assert.equal(r.candidates.length,1);
 assert.equal(r.candidates[0].coverage.available,4);assert.equal(r.candidates[0].coverage.matches,0);
 assert.equal(r.candidates[0].coverage.status,'limited');assert.ok(r.candidates[0].importance>=80);
});
test('fewer than 3 feeds is insufficient, never silently zero',()=>{
 const r=detectBlindspots([entry({})],status(['BBC World']),now);
 assert.equal(r.candidates[0].coverage.status,'insufficient');
});
test('matching headlines from two independent monitored outlets removes the limited tag',()=>{
 const pub=(id,source)=>entry({id,source,title:'Sudan cholera outbreak affects displaced families'});
 const r=detectBlindspots([entry({}),pub('bbc','BBC World'),pub('guard','Guardian World')],status(),now);
 assert.equal(r.candidates[0].coverage.matches,2);assert.equal(r.candidates[0].coverage.status,'broad');
});
test('BBC business and BBC world do not count as two independent publishers',()=>{
 const pub=(id,source)=>entry({id,source,title:'Sudan cholera outbreak affects displaced families'});
 const r=detectBlindspots([entry({}),pub('bbc1','BBC World'),pub('bbc2','BBC Business')],status(),now);
 assert.equal(r.candidates[0].coverage.matches,1);
});
test('routine news and small quakes cannot be promoted to important blindspots',()=>{
 const r=detectBlindspots([entry({title:'UN cultural event launches new campaign',summary:'A cultural project is held in a local museum.'}),entry({id:'q1',source:'USGS Earthquake Catalog',category:'earth',rawValue:3.2,title:'M 3.2 near California'})],status(),now);
 assert.equal(r.candidates.length,0);
});
test('6.8+ M earthquake is qualified by measurement, not by publisher editorial tone',()=>{
 const r=detectBlindspots([entry({id:'q1',source:'USGS Earthquake Catalog',category:'earth',rawValue:6.8,title:'M 6.8 Solomon Islands'})],status(),now);
 assert.equal(r.candidates.length,1);assert.equal(r.candidates[0].evidenceKind,'official-event');
 assert.ok(r.candidates[0].importance>80);
});
test('headline tokenization strips uninformative terms',()=>{
 const tokens=topicTokens('UN says Sudan cholera outbreak threatens displaced families');
 assert.ok(tokens.includes('sudan'));assert.ok(tokens.includes('cholera'));assert.ok(!tokens.includes('says'));
});
