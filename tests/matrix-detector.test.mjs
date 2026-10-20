import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canonicalArticle,headlineFingerprint,updateHeadlineHistory,detectMatrixPatterns} from '../lib/matrix-detection.ts';
import {isEnglishForeignOutlet} from '../lib/source-policy.ts';

test('Only foreign English-language publisher headlines enter the feed',()=>{
 assert.equal(isEnglishForeignOutlet('BBC World','Greece votes in a closely watched election','https://www.bbc.com/news/world-europe-123'),true);
 assert.equal(isEnglishForeignOutlet('ΕΡΤ Ειδήσεις','Εξελίξεις στη χώρα','https://www.ertnews.gr/test'),false);
 assert.equal(isEnglishForeignOutlet('Naftemporiki','Economic forecasts rise across Europe','https://www.naftemporiki.gr/test'),false);
 assert.equal(isEnglishForeignOutlet('Times of India','India announces a new trade policy','https://timesofindia.indiatimes.com/test'),true);
 assert.equal(isEnglishForeignOutlet('DW','Οι εξελίξεις στον κόσμο','https://dw.com/test'),false);
});
test('Black Cat compares stable URLs without treating query trackers as different stories',()=>{
 assert.equal(canonicalArticle('https://example.com/news/123/?utm_medium=email'),'example.com/news/123');
 const prior=[{source:'BBC World',url:'https://bbc.com/news/123?utm_source=rss',title:'Officials say they have reached a ceasefire',seenAt:'2026-10-19T10:00:00.000Z'}];
 const fresh=[{source:'BBC World',url:'https://bbc.com/news/123?utm_campaign=feed',title:'Officials say negotiations continue after ceasefire talks',timestamp:'2026-10-20T10:00:00.000Z'}];
 const diff=updateHeadlineHistory(prior,fresh,'2026-10-20T11:00:00.000Z');
 assert.equal(diff.changes.length,1);
 assert.equal(diff.changes[0].before,prior[0].title);
 assert.equal(diff.changes[0].after,fresh[0].title);
 assert.equal(updateHeadlineHistory(diff.records,fresh).changes.length,0);
});
test('Repeated identical headlines require two outlets; no fabricated anomalies',()=>{
 const reports=[
 {source:'BBC World',title:'Officials confirm major ceasefire talks resume after weeks of fighting',url:'https://bbc.com/a'},
 {source:'The Guardian',title:'Officials confirm major ceasefire talks resume after weeks of fighting',url:'https://guardian.com/a'}
 ];
 const st={id:'a',headline:reports[0],reports,sources:['BBC World','The Guardian'],importance:80};
 const findings=detectMatrixPatterns([st]);
 assert.ok(findings.some(x=>x.kind==='repeat'&&x.sources.length===2));
 assert.equal(detectMatrixPatterns([{...st,reports:[reports[0]],sources:['BBC World']}]).filter(x=>x.kind==='repeat').length,0);
 assert.equal(headlineFingerprint('NEW REPORT: One.  Two!'),'new report one two');
});
