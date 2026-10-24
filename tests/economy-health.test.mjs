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
test('World Bank US code maps to the USA dashboard and does not leak to Greece',async()=>{
 const {extractWdiHistory}=await import('../lib/economy-health.ts');
 const rows=[
  {country:{id:'US',value:'United States'},countryiso3code:'USA',indicator:{id:'NY.GDP.MKTP.KD.ZG'},date:'2025',value:2.8},
  {country:{id:'GR',value:'Greece'},countryiso3code:'GRC',indicator:{id:'NY.GDP.MKTP.KD.ZG'},date:'2025',value:1.9},
  {country:{id:'US'},countryiso3code:'USA',indicator:{id:'FP.CPI.TOTL.ZG'},date:'2025',value:2.2},
  {country:{id:'US'},countryiso3code:'USA',indicator:{id:'NY.GDP.MKTP.KD.ZG'},date:'2024',value:2.5}
 ];
 assert.deepEqual(extractWdiHistory(rows,'USA','NY.GDP.MKTP.KD.ZG',2026),[{year:2025,value:2.8},{year:2024,value:2.5}]);
 assert.deepEqual(extractWdiHistory(rows,'GRC','NY.GDP.MKTP.KD.ZG',2026),[{year:2025,value:1.9}]);
});
test('World Bank provider aggregate codes map to WLD and Euro area',async()=>{
 const {extractWdiHistory}=await import('../lib/economy-health.ts');
 const rows=[
  {country:{id:'1W'},indicator:{id:'FP.CPI.TOTL.ZG'},date:'2024',value:3.8},
  {country:{id:'XC'},indicator:{id:'FP.CPI.TOTL.ZG'},date:'2024',value:2.4},
  {country:{id:'CN'},indicator:{id:'FP.CPI.TOTL.ZG'},date:'2024',value:0.2},
  {country:{id:'GR'},indicator:{id:'FP.CPI.TOTL.ZG'},date:'2024',value:null},
  {country:{id:'1W'},indicator:{id:'FP.CPI.TOTL.ZG'},date:'2012',value:100}
 ];
 assert.deepEqual(extractWdiHistory(rows,'WLD','FP.CPI.TOTL.ZG',2026),[{year:2024,value:3.8}]);
 assert.deepEqual(extractWdiHistory(rows,'EMU','FP.CPI.TOTL.ZG',2026),[{year:2024,value:2.4}]);
 assert.deepEqual(extractWdiHistory(rows,'CHN','FP.CPI.TOTL.ZG',2026),[{year:2024,value:0.2}]);
 assert.equal(extractWdiHistory(rows,'GRC','FP.CPI.TOTL.ZG',2026).length,0);
});

test('ISO-2 fallback and duplicated annual records produce one real observation per year',async()=>{
 const {extractWdiHistory}=await import('../lib/economy-health.ts');
 const rows=[
  {country:{id:'US'},indicator:{id:'NY.GDP.MKTP.KD.ZG'},date:'2025',value:2.3},
  {country:{id:'US'},indicator:{id:'NY.GDP.MKTP.KD.ZG'},date:'2025',value:2.3},
  {country:{id:'US'},indicator:{id:'NY.GDP.MKTP.KD.ZG'},date:'2024',value:2.0},
  {country:{id:'GR'},indicator:{id:'NY.GDP.MKTP.KD.ZG'},date:'2025',value:null}
 ];
 const history=extractWdiHistory(rows,'USA','NY.GDP.MKTP.KD.ZG',2026);
 assert.deepEqual(history,[{year:2025,value:2.3},{year:2024,value:2}]);
 assert.deepEqual(extractWdiHistory(rows,'GRC','NY.GDP.MKTP.KD.ZG',2026),[]);
});
