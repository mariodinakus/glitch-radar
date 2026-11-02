import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('GLITCH ships an English-first document with dark theme forced',()=>{
 const layout=read('app/layout.tsx');
 assert.match(layout,/<html lang="en" data-theme="dark">/);
 const css=read('app/glitch-news.css');
 assert.match(css,/--bg:#050506;--bg2:#090a0d;--card:#0e0f13;--card2:#15161d/);
});

test('market cards use GLITCH dark palette, never light fallback surfaces',()=>{
 const css=read('components/MarketIntelligence.module.css');
 assert.match(css,/\.root\{color-scheme:dark;background:var\(--card/);
 assert.match(css,/\.quote\{[^}]*background:var\(--card2/);
 assert.match(css,/\.macroCard\{[^}]*background:var\(--card2/);
 assert.doesNotMatch(css,/var\(--panel,#fff\)|var\(--soft,#f3f6f6\)|var\(--ink,#182631\)/);
});

test('market, macro and intelligence copy are English UI',()=>{
 for(const path of ['components/MarketIntelligence.tsx','components/MacroNowStrip.tsx','components/IntelligenceSuite.tsx']){
  const source=read(path);
  assert.doesNotMatch(source,/[\u0370-\u03ff\u1f00-\u1fff]/u,path+' contains Greek UI text');
 }
 const news=read('components/GlitchNews.tsx');
 assert.match(news,/const \[lang\]=useState<Lang>\('en'\)/);
 assert.match(news,/target:'en'/);
 assert.match(news,/englishCopy\[st\.id\]\?\.title/);
});
