import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Markets screen renders exactly one market quote board',()=>{
 const source=read('components/GlitchNews.tsx');
 const start=source.indexOf('function MarketsView(');
 const end=source.indexOf('/* ───────────── war room',start);
 const view=source.slice(start,end);
 assert.ok(start>=0&&end>start);
 assert.equal((view.match(/<MarketIntelligence/g)||[]).length,1);
 assert.equal((view.match(/<IndicatorCard|<WarIndicatorCard/g)||[]).length,0);
 assert.doesNotMatch(view,/GROUPS\.map|INDICATORS\.filter|className="ind-grid"/);
 assert.match(view,/Prediction markets/);
 assert.match(view,/Markets & economy news/);
});

test('Home shows one compact consolidated panel, Economy remains macro-focused',()=>{
 const source=read('components/GlitchNews.tsx');
 assert.equal((source.match(/<MarketIntelligence compact/g)||[]).length,1);
 assert.equal((source.match(/<EconomyHealthDesk compact/g)||[]).length,0);
 assert.match(source,/section==='economy'\?<><MacroNowStrip\/><EconomyHealthDesk\/>/);
 assert.match(source,/WarIndicatorCard/);
});

test('One Markets dashboard includes all category filters and quote symbols',()=>{
 const market=read('components/MarketIntelligence.tsx');
 assert.match(market,/const MARKET_FILTERS/);
 for(const name of ['Key movers','Stock indices','Energy','Commodities','Currencies','Crypto','Rates & risk','All markets'])
  assert.ok(market.includes(name),'Missing category '+name);
 assert.match(market,/marketGroup==='all'\?INDICATORS\.map/);
 assert.match(market,/INDICATORS\.filter\(i=>i\.group===marketGroup\)/);
 const css=read('components/MarketIntelligence.module.css');
 assert.match(css,/\.marketFilters\{/);
 assert.match(css,/\.marketFilterActive\{/);
});
