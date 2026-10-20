import assert from 'node:assert/strict';
import {test} from 'node:test';
import {conflictProfiles} from '../lib/conflict-sides.ts';
const keyConflicts=['ukraine','sudan','iran','gaza','congo','yemen','myanmar','taiwan'];
test('Core conflicts have two well-attributed sides without treating supporters as combatants',()=>{
 for(const id of keyConflicts){
  const p=conflictProfiles[id];
  assert.ok(p, 'missing '+id);
  assert.equal(p.camps.length,2);
  assert.ok(p.camps.every(c=>c.nameEl&&c.nameEn&&c.roleEl&&c.roleEn));
  assert.ok(p.sources.length>0);
  assert.ok(p.sources.every(x=>x.url.startsWith('https://')));
  assert.ok(p.camps.every(c=>c.support.every(s=>['documented','reported','historical'].includes(s.basis))));
 }
});
test('Disputed backing explicitly remains reported, not certified direct combat participation',()=>{
 const sudan=conflictProfiles.sudan;
 assert.equal(sudan.camps[1].support[0].basis,'reported');
 const taiwan=conflictProfiles.taiwan;
 assert.equal(taiwan.kind,'tension');
});
