import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rssField,rssPlainText,googleNewsPreview} from '../lib/rss-text.ts';
import {eventKind} from '../lib/editorial.ts';

test('escaped Google News links never display raw HTML or URLs',()=>{
 const input='&lt;a href="https://news.google.com/rss/articles/CBMiabc123?oc=5" target="_blank"&gt;Winter of the Crow review&lt;/a&gt;&nbsp;&nbsp;&lt;font color="#666"&gt;The Arts Desk&lt;/font&gt;';
 const output=rssPlainText(input);
 assert.equal(output,'Winter of the Crow review The Arts Desk');
 assert.ok(!output.includes('href='));
 assert.ok(!output.includes('https://'));
});
test('RSS decoding supports CDATA, numeric entities and plain text',()=>{
 const item='<item><title><![CDATA[France protests &amp; rallies &#8211; live]]></title></item>';
 assert.equal(rssField(item,'title'),'France protests & rallies – live');
 assert.match(googleNewsPreview('<a href="bad">test</a>'),/Συγκεντρωτική αναφορά/);
});
test('a review of Cold War fiction is not reported as war',()=>{
 const fake={title:'Winter of the Crow review - Lesley Manville in a Cold War thriller',summary:'Review',category:'world'};
 const real={title:'Airstrikes reported amid war in Ukraine',summary:'Reuters reports new airstrikes',category:'world'};
 const protest={title:'Thousands join anti-government demonstrations in France',summary:'Protest',category:'world'};
 assert.equal(eventKind(fake),'other');
 assert.equal(eventKind(real),'conflict');
 assert.equal(eventKind(protest),'protest');
});
