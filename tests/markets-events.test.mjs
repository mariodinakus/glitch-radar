import test from 'node:test';import assert from 'node:assert/strict';
import {normalizeKalshi,normalizePolymarket} from '../lib/markets.ts';
test('Kalshi event payload yields valid open priced child with correct dollar interpretation',()=>{
 const data={events:[{title:'Will inflation fall?',markets:[{ticker:'KXTEST-1',event_ticker:'KXTEST',title:'Will inflation fall?',status:'open',yes_bid_dollars:'0.4100',yes_ask_dollars:'0.4300',last_price_dollars:'0.45',volume_24h_fp:'1250',volume_fp:'6000'}]}]};
 const q=normalizeKalshi(data);assert.equal(q.length,1);assert.equal(q[0].probability,.42);assert.equal(q[0].volume24h,1250);assert.equal(q[0].priceKind,'midpoint');
});
test('Kalshi unpriced and 0/1 markets are omitted, not printed as 0%',()=>{assert.equal(normalizeKalshi({events:[{title:'Event',markets:[{ticker:'Q-1',title:'Some event will occur?',status:'open',yes_bid_dollars:'0.0000',yes_ask_dollars:'1.0000',last_price_dollars:null}]}]}).length,0)});
test('Polymarket JSON encoded prices are parsed by YES index, not assumed position',()=>{const r=normalizePolymarket([{slug:'macro-event',active:true,closed:false,markets:[{id:'1',question:'Will a macro event happen?',active:true,closed:false,outcomes:'["No","Yes"]',outcomePrices:'["0.75","0.25"]',volume24hr:100}]}]);assert.equal(r[0]?.probability,.25)});
