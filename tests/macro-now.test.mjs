import test from 'node:test';
import assert from 'node:assert/strict';
import {parseBls,parseEcb,isMacroPeriodOutdated} from '../lib/macro-now.ts';

test('BLS parser calculates published annual CPI rate, payroll change and unemployment',()=>{
 const months=[];
 for(let i=0;i<13;i++){
  const d=new Date(Date.UTC(2026,9-i,1));
  const ym=[d.getUTCFullYear(),String(d.getUTCMonth()+1).padStart(2,'0')];
  months.push({year:String(ym[0]),period:'M'+ym[1],value:String(320-i*1.5)});
 }
 const b={status:'REQUEST_SUCCEEDED',Results:{series:[
  {seriesID:'CUUR0000SA0',data:months},
  {seriesID:'LNS14000000',data:[{year:'2026',period:'M10',value:'4.5'},{year:'2026',period:'M09',value:'4.4'}]},
  {seriesID:'CES0000000001',data:[{year:'2026',period:'M10',value:'161000'},{year:'2026',period:'M09',value:'160900'}]}
 ]}};
 const results=parseBls(b);
 assert.equal(results.length,3);
 assert.equal(results.find(x=>x.id==='us-unemployment')?.value,4.5);
 assert.equal(results.find(x=>x.id==='us-jobs')?.value,100);
 assert.ok(results.find(x=>x.id==='us-cpi')?.value>0);
 assert.equal(parseBls({status:'REQUEST_FAILED'}).length,0);
});
test('ECB CSV parser reads the latest verified euro area and Greece readings',()=>{
 const csv='KEY,REF_AREA,TIME_PERIOD,OBS_VALUE\nA,U2,2026-08,2.2\nA,U2,2026-09,2.4\nB,GR,2026-09,3.1\nB,GR,2026-10,3.3';
 const rows=parseEcb(csv);
 assert.equal(rows.length,2);
 assert.equal(rows.find(x=>x.id==='ea-hicp')?.value,2.4);
 assert.equal(rows.find(x=>x.id==='gr-hicp')?.period,'2026-10');
});

test('a recently checked API must not make an old macro observation look current',()=>{
 const asOf=Date.parse('2026-11-09T12:00:00Z');
 assert.equal(isMacroPeriodOutdated('2025-12',asOf),true);
 assert.equal(isMacroPeriodOutdated('2026-09',asOf),false);
 assert.equal(isMacroPeriodOutdated('2026-10',asOf),false);
 assert.equal(isMacroPeriodOutdated('bad',asOf),true);
});
