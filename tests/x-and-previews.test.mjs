import test from 'node:test';
import assert from 'node:assert/strict';
import {parseXTrends,parseGetXapiTrends} from '../lib/trends.ts';
import {readableExcerpt} from '../lib/news.ts';

test('official X trends are attributed only to X with search URLs and counts',()=>{
 const results=parseXTrends({data:[{trend_name:'#ClimateAction',tweet_count:1520},{trend_name:'AI Research'}]},'WORLD');
 assert.equal(results.length,2);
 assert.equal(results[0].provider,'x');
 assert.equal(results[0].tweetCount,1520);
 assert.ok(results[0].url.startsWith('https://x.com/search?q='));
 assert.equal(results[1].tweetCount,null);
});
test('third-party GetXAPI exposes ranked genuine X topic names without fabricating counts',()=>{
 const results=parseGetXapiTrends({status:'success',trends:[{name:'World Series',rank:2,tweet_volume:null},{name:'#breaking',rank:1,tweet_volume:1200}]},'US');
 assert.equal(results.length,2);
 assert.equal(results[0].name,'#breaking');
 assert.equal(results[0].tweetCount,1200);
 assert.equal(results[1].tweetCount,null);
 assert.equal(results[1].provider,'x');
});
test('invalid X response is not presented as trends',()=>{
 assert.throws(()=>parseGetXapiTrends({random:1},'GR'));
 assert.throws(()=>parseXTrends({data:null},'WORLD'));
});
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
