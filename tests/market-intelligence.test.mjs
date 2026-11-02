import test from 'node:test';
import assert from 'node:assert/strict';
import {parseIcsDate,parseOfficialCalendar,parseBeaJson} from '../lib/economic-calendar.ts';
import {marketOutlook} from '../lib/market-outlook.ts';

test('official calendars convert US daylight savings correctly',()=>{
 assert.equal(parseIcsDate('20261106T083000','America/New_York')?.at,'2026-11-06T13:30:00.000Z');
 assert.equal(parseIcsDate('20260706T083000','America/New_York')?.at,'2026-07-06T12:30:00.000Z');
 assert.equal(parseIcsDate('20261104T133000Z')?.at,'2026-11-04T13:30:00.000Z');
 assert.equal(parseIcsDate('not-a-date'),null);
});
test('BLS ICS parses folds, filters to important release, drops out-of-window events',()=>{
 const raw='BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:Consumer Price In\n dex, October 2026\nDTSTART;TZID=America/New_York:20261110T083000\nEND:VEVENT\nBEGIN:VEVENT\nSUMMARY:Random BLS nonfinancial event\nDTSTART:20261111T083000\nEND:VEVENT\nEND:VCALENDAR';
 const e=parseOfficialCalendar(raw,'BLS',new Date('2026-11-02T12:00:00Z'),20);
 assert.equal(e.length,1);
 assert.equal(e[0].title,'Consumer Price Index, October 2026');
 assert.equal(e[0].at,'2026-11-10T13:30:00.000Z');
 assert.equal(e[0].importance,'high');
 assert.equal(parseOfficialCalendar(raw,'BLS',new Date('2026-11-15T12:00:00Z')).length,0);
});
test('BEA fallback loads only future official release entries without duplicates',()=>{
 const raw={'Gross Domestic Product':{release_dates:['2026-11-25T13:30:00+00:00','2026-11-25T13:30:00+00:00','2026-09-25T12:30:00+00:00']},file_last_updated:'2026-10-31'};
 const e=parseBeaJson(raw,new Date('2026-11-02T12:00:00Z'));
 assert.equal(e.length,1);
 assert.equal(e[0].source,'BEA');
 assert.equal(e[0].importance,'high');
});
test('outlook creates transparent, ordered scenarios with positive prices',()=>{
 const spark=Array.from({length:22},(_,i)=>100*Math.exp(0.008*i+0.007*Math.sin(i)));
 const q={symbol:'BTC-USD',price:spark.at(-1),time:'2026-11-02T12:00:00.000Z',spark};
 const o=marketOutlook(q,new Date('2026-11-02T13:00:00Z'));
 assert.ok(o);
 assert.ok(o.paths[0].low<o.paths[0].center);
 assert.ok(o.paths[0].center<o.paths[0].high);
 assert.equal(o.paths[1].horizon,5);
 assert.ok(o.volatilityPct>0);
});
test('outlook refuses stale and insufficient observations',()=>{
 const short={symbol:'BTC-USD',price:100,time:'2026-11-02T12:00:00.000Z',spark:[99,100]};
 const stale={symbol:'BTC-USD',price:100,time:'2026-10-20T12:00:00.000Z',spark:Array.from({length:22},(_,i)=>100+i+Math.sin(i))};
 assert.equal(marketOutlook(short,new Date('2026-11-02T13:00:00Z')),null);
 assert.equal(marketOutlook(stale,new Date('2026-11-02T13:00:00Z')),null);
});
