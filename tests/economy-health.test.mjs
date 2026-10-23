import test from 'node:test';import assert from 'node:assert/strict';
import {assessMacro,MACRO_INDICATORS,MACRO_REGIONS,summarizeMacro} from '../lib/economy-health.ts';
const p=(value,year=2025)=>({value,year});
test('missing or stale observations never receive fabricated positive verdict',()=>{
 assert.equal(assessMacro('NY.GDP.MKTP.KD.ZG',null,null,2026).status,'unknown');
 assert.equal(assessMacro('NY.GDP.MKTP.KD.ZG',p(7,2019),null,2026).status,'unknown');
});
test('economic contraction and high inflation are risk signals',()=>{
 assert.equal(assessMacro('NY.GDP.MKTP.KD.ZG',p(-1),p(2,2024),2026).status,'bad');
 assert.equal(assessMacro('FP.CPI.TOTL.ZG',p(9),p(4,2024),2026).status,'bad');
 assert.equal(assessMacro('FP.CPI.TOTL.ZG',p(-1),p(1,2024),2026).trend,'deteriorating');
});
test('inflation falling toward 2%, and unemployment falling, count as improvements',()=>{
 assert.equal(assessMacro('FP.CPI.TOTL.ZG',p(2.2),p(5,2024),2026).trend,'improving');
 assert.equal(assessMacro('SL.UEM.TOTL.ZS',p(4),p(5.6,2024),2026).trend,'improving');
});
test('no synthetic overall score or positive rating on absent data',()=>{
 const out=summarizeMacro(MACRO_INDICATORS.map(i=>({code:i.code,current:null,previous:null,history:[]})),2026);
 assert.equal(out.available,0);assert.equal(out.counts.unknown,MACRO_INDICATORS.length);
 assert.equal(new Set(MACRO_REGIONS.map(r=>r.code)).size,MACRO_REGIONS.length);
});