import test from 'node:test';
import assert from 'node:assert/strict';
import {readableExcerpt} from '../lib/news.ts';
import {parseGoogleTrends} from '../lib/trends.ts';

test('publisher RSS preview has no arbitrary 260-character cutoff',()=>{
 const source='This is a full factual publisher summary. '.repeat(11);
 assert.equal(readableExcerpt(source),source.trim());
});
test('when a summary is truly oversized it breaks at a word boundary',()=>{
 const source='High-impact source record confirms relevant evidence today. '.repeat(100);
 const excerpt=readableExcerpt(source,330);
 assert.ok(excerpt.length<=331);
 assert.match(excerpt,/\.$|…$/);
 assert.ok(excerpt.length>180);
});

test('Google trends RSS only identifies Google as the source',()=>{
const rss='<rss><channel><item><title>Πλημμύρες</title><pubDate>Thu, 15 Oct 2026 10:00:00 GMT</pubDate></item></channel></rss>';
const parsed=parseGoogleTrends(rss,'GR');assert.equal(parsed.length,1);assert.equal(parsed[0].provider,'google');assert.equal(parsed[0].name,'Πλημμύρες');
});
