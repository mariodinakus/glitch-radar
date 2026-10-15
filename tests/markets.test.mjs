import test from 'node:test';import assert from 'node:assert/strict';
import {normalizePolymarket,normalizeKalshi,headlineOverlap} from '../lib/markets.ts';
test('Polymarket only normalizes active two-sided yes/no markets',()=>{
 const sample=[{id:'17',slug:'big-event',title:'What happens?',active:true,markets:[{id:'5',question:'Will the rate fall?',active:true,closed:false,outcomes:'["Yes","No"]',outcomePrices:'["0.73","0.27"]',volume24hr:'1300',volumeNum:'10000'}]},{slug:'multi',markets:[{id:'10',outcomes:'["One","Two"]',outcomePrices:'[".5",".5"]'}]}];
 const r=normalizePolymarket(sample);assert.equal(r.length,1);assert.equal(r[0].probability,.73);assert.equal(r[0].volume24h,1300);assert.match(r[0].sourceUrl,/polymarket.com\/event\/big-event/)
});
test('Kalshi midpoint and reference delta are correctly parsed',()=>{
 const r=normalizeKalshi({markets:[{ticker:'KXTEST-26',event_ticker:'KXTEST',status:'open',title:'Will yields rise?',yes_bid_dollars:'0.43',yes_ask_dollars:'0.47',last_price_dollars:'0.44',previous_price_dollars:'0.42',volume_24h_fp:'1050'}]});
 assert.equal(r.length,1);assert.equal(r[0].priceKind,'midpoint');assert.equal(r[0].probability,.45);assert.equal(r[0].changeReferencePP,3);assert.equal(r[0].volume24h,1050);
});
test('Unavailable or non-binary prices never appear as probability',()=>{
 assert.equal(normalizePolymarket([{slug:'x',markets:[{outcomes:'["Yes","No"]',outcomePrices:'["1.9","-0.9"]'}]}]).length,0);
 assert.equal(normalizeKalshi({markets:[{ticker:'KXONE',title:'one',status:'open'}]}).length,0);
});
test('Headline overlap needs two content-bearing tokens',()=>{
 assert.equal(headlineOverlap('Will Federal Reserve lower interest rates?',['Federal Reserve cuts interest rates after meeting','Storm leaves 3 injured']),1);
 assert.equal(headlineOverlap('Will Federal Reserve lower interest rates?',['Market prices change today']),0);
});
