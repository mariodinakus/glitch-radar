import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assessRevision,updateHeadlineHistory} from '../lib/matrix-detection.ts';
test('Black Cat discounts tiny numerical corrections',()=>{
 assert.equal(assessRevision('M 3.7 · 49 km NW of Toyah, Texas','M 3.8 · 49 km NW of Toyah, Texas').level,'routine');
});
test('Black Cat prioritizes major reframing, not all revisions',()=>{
 const result=assessRevision('Officials confirm peace deal signed after weeks of talks','Government denies agreement as fighting resumes on the border');
 assert.equal(result.level,'substantive');
});
test('Archive ignores reused index pages whose headline is a rotating alert',()=>{
 const old=[{source:'NOAA',url:'https://www.swpc.noaa.gov/products/alerts-watches-and-warnings',title:'Alert K04 issued Wednesday morning',seenAt:'2026-10-20T09:00:00Z'}];
 const now=[{source:'NOAA',url:old[0].url,title:'Warning K05 extended Thursday afternoon'}];
 const x=updateHeadlineHistory(old,now);
 assert.equal(x.changes.length,0);
});