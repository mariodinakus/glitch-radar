import {test} from 'node:test';
import assert from 'node:assert/strict';
import {glitchScore,countEvidence,originTrace} from '../lib/glitch-score.ts';

const rep=(source,title,url,ts='2026-10-20T10:00:00.000Z')=>({id:source+url,source,title,url,timestamp:ts});
const story=(reports,extra={})=>({id:'s',headline:reports[0],reports,sources:[...new Set(reports.map(r=>r.source))],importance:50,...extra});

test('Conflicting casualty figures from two outlets raise a counts reason',()=>{
 const reports=[rep('BBC World','Strike kills 12 civilians in border town','https://bbc.com/a'),rep('Al Jazeera World','Strike on border town kills 31 people, officials say','https://aj.com/a')];
 const g=glitchScore(story(reports));
 assert.ok(g.reasons.some(r=>r.kind==='counts'));
 assert.ok(g.score>=20);
});
test('Identical figures from two outlets do not raise a counts reason',()=>{
 const reports=[rep('BBC World','Strike kills 12 civilians in border town','https://bbc.com/a'),rep('Al Jazeera World','Attack in border town leaves 12 dead','https://aj.com/a')];
 assert.ok(!glitchScore(story(reports)).reasons.some(r=>r.kind==='counts'));
});
test('A quiet multi-source story scores zero',()=>{
 const reports=[rep('BBC World','Leaders meet to discuss regional security arrangements','https://bbc.com/a'),rep('The Guardian','Talks open on a new security framework for the region','https://g.com/a')];
 const g=glitchScore(story(reports));
 assert.equal(g.score,0);assert.equal(g.level,'none');
});
test('Thousands separators and tiny numbers are handled',()=>{
 const rows=countEvidence([{source:'A',title:'Death toll rises to 1,250 after floods',url:'u'},{source:'B',title:'1 killed in crash',url:'v'}]);
 assert.equal(rows.length,1);assert.equal(rows[0].value,'1250');
});
test('Origin trace needs 3 outlets and names the earliest',()=>{
 const two=story([rep('A','x one two three four','https://a/1'),rep('B','y','https://b/1')]);
 assert.equal(originTrace(two),null);
 const three=story([rep('A','t1','https://a/1','2026-10-20T10:30:00.000Z'),rep('B','t2','https://b/1','2026-10-20T10:00:00.000Z'),rep('C','t3','https://c/1','2026-10-20T11:00:00.000Z')]);
 const o=originTrace(three);
 assert.equal(o.source,'B');assert.equal(o.followers,2);
});
