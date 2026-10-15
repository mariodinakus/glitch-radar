import assert from 'node:assert/strict';
import test from 'node:test';
import {detectDiscoveries} from '../lib/intelligence.ts';
const stamp=new Date().toISOString();
const make=(id,title,source,category='world')=>({id,title,source,category,timestamp:stamp,url:`https://example.org/${id}`,score:75,confidence:'publisher',summary:'',rawValue:0});
test('repeated publisher headlines are marked only as coverage overlap',()=>{
 const signals=[make('1','Scientists warn about dangerous solar storm disruption','BBC World'),make('2','Dangerous solar storm disruption prompts scientists warning','Guardian World'),make('3','A football club wins latest final match','BBC Sport','sports')];
 const output=detectDiscoveries(signals,null,3,3);
 const overlap=output.discoveries.find(x=>x.kind==='coverage');
 assert.ok(overlap,'Expected a coverage card');assert.equal(overlap.evidence.length,2);assert.match(overlap.caveat.el,/δεν αποτελεί διασταύρωση/);
});
test('USGS ratio card appears only when minimum evidence is met',()=>{
 const base={current24h:10,previous6Days:24,dailyBaseline:4,ratio:2.5,sampleDays:7,cutoffMagnitude:4.5,updatedAt:stamp};
 const d=detectDiscoveries([],base,5,5).discoveries;
 assert.equal(d[0].kind,'measured');assert.equal(d[0].metric,'2.5×');
 const low=detectDiscoveries([],{...base,current24h:1,ratio:.25},5,5);
 assert.ok(!low.discoveries.some(x=>x.id.startsWith('quake-pulse')));
});
test('offline source becomes disclosure, not fabricated news',()=>{
 const d=detectDiscoveries([],null,20,14).discoveries;
 assert.equal(d.length,1);assert.equal(d[0].kind,'source-health');assert.equal(d[0].metric,'14/20');
});
