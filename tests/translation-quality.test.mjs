import assert from 'node:assert/strict';
import {test} from 'node:test';
import {needsTranslation,validTranslation,tidyNewsExcerpt} from '../lib/translation-quality.ts';

test('English headlines are translated to Greek instead of showing untranslated on Greek UI',()=>{
 assert.equal(needsTranslation('Russian missile strikes near Kyiv as talks continue','el'),true);
 assert.equal(needsTranslation('Η Ρωσία επεκτείνει τις επιθέσεις στην Ουκρανία','el'),false);
 assert.equal(needsTranslation('Η Microsoft και η OpenAI παρουσίασαν νέα υπηρεσία','el'),false);
 assert.equal(needsTranslation('Ο Τραμπ λέει: Russia strikes Ukraine as talks fail','el'),true);
});
test('English UI detects Greek publisher headlines',()=>{
 assert.equal(needsTranslation('Σημαντικές εξελίξεις στην ελληνική οικονομία','en'),true);
 assert.equal(needsTranslation('The world economy grows in 2026','en'),false);
});
test('Rejected provider warnings and pseudo-translations cannot be cached',()=>{
 const en='Russian missile strike kills three in Kyiv';
 assert.equal(validTranslation(en,'Ρωσικό πυραυλικό πλήγμα σκοτώνει τρεις ανθρώπους στο Κίεβο','el'),true);
 assert.equal(validTranslation(en,en,'el'),false);
 assert.equal(validTranslation(en,'MYMEMORY WARNING: QUOTA EXCEEDED','el'),false);
 assert.equal(validTranslation(en,'Russia strike — Κίεβο','el'),false);
 assert.equal(validTranslation('Τρία νέα μέτρα για την οικονομία','Three new measures for the economy','en'),true);
});
test('Repeated Greek RSS headlines and trailing publisher noise are removed',()=>{
 const head='Οι τιμές της ενέργειας αυξάνονται';
 const desc='Οι τιμές της ενέργειας αυξήθηκαν σήμερα. Οι τιμές της ενέργειας αυξάνονται - Η ΝΑΥΤΕΜΠΟΡΙΚΗ';
 assert.equal(tidyNewsExcerpt(desc,head),'Οι τιμές της ενέργειας αυξήθηκαν σήμερα.');
 assert.equal(tidyNewsExcerpt('Η είδηση ανακοινώθηκε σήμερα. www.ertnews.gr'),'Η είδηση ανακοινώθηκε σήμερα.');
});
