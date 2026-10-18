import type {MarketQuote} from './markets';

export type MarketLens='all'|'ai'|'companies'|'economy'|'politics'|'energy'|'science';
const sport=/\b(nba|nfl|nhl|mlb|ncaa|wnba|uefa|fifa|premier league|champions league|europa league|super bowl|world series|world cup|soccer|football match|basketball|tennis|baseball|cricket|rugby|hockey|boxing|mma|ufc|golf|grand slam|formula 1|f1 race|touchdowns?|quarterback|playoffs?|coaches?|home runs?|medals?|olympics?|tournament|esports?|valorant|counter.strike|team wins?|score \d|vs\.?\s+[A-Z])/i;
const categories:{key:Exclude<MarketLens,'all'>;rx:RegExp}[]=[
 {key:'ai',rx:/\b(artificial intelligence|generative ai|ai model|ai company|ai agents?|agi|superintelligence|chatgpt|openai|anthropic|claude|gemini ai|deepmind|nvidia|llm|gpt-?\d|robotaxi|humanoid robots?|semiconductors?|chips? exports?|datacenters?)\b/i},
 {key:'companies',rx:/\b(apple|microsoft|google|alphabet|meta platforms?|facebook|amazon|tesla|spacex|nvidia|openai|anthropic|samsung|byd|tsmc|boeing|airbus|berkshire|jpmorgan|goldman sachs|blackrock|shell|exxon|aramco|netflix|disney|uber|stock market cap|ipo|acquisition|merger|earnings|revenue|profits?|ceo|market cap)\b/i},
 {key:'economy',rx:/\b(federal reserve|fed (?:rate|chair|cut)|interest rates?|rate cuts?|rate hikes?|recession|inflation|cpi|gdp|unemployment|us economy|eu economy|treasury yields?|stock market|bond yields?|tariffs?|trade deal|trade war|financial crisis|central bank|ecb|s&p 500|nasdaq|dow jones)\b/i},
 {key:'politics',rx:/\b(election|president|prime minister|parliament|congress|white house|senate|democrats?|republicans?|trump|biden|putin|zelensky|netanyahu|macron|ukraine|russia|iran|israel|gaza|ceasefire|sanctions?|peace deal|china|taiwan|nato|eu referendum|government shutdown)\b/i},
 {key:'energy',rx:/\b(oil|brent|wti|crude|opec|natural gas|lng|nuclear power|uranium|electricity|renewables?|solar power|fusion energy|battery storage|wind power|energy prices?)\b/i},
 {key:'science',rx:/\b(nasa|space ?x|rocket launch|satellite|moon mission|mars landing|quantum computing|biotechnology|drug approval|clinical trial|fda approval|vaccines?|climate change|global temperature)\b/i}
];
export function marketLenses(quote:Pick<MarketQuote,'question'|'category'>):MarketLens[]{
 const text=quote.question+' '+quote.category;
 if(sport.test(text)||/\b(sports?|basketball|football|soccer|baseball|hockey|tennis|esports)\b/i.test(quote.category))return [];
 return categories.filter(c=>c.rx.test(text)).map(c=>c.key);
}
export function relevantMarketQuotes(quotes:MarketQuote[]):MarketQuote[]{
 const dedup=new Set<string>();
 return quotes.filter(q=>{
  if(!marketLenses(q).length || !(q.probability>0&&q.probability<1) || !q.sourceUrl.startsWith('https://'))return false;
  const key=q.venue+':'+q.question.trim().toLowerCase();
  if(dedup.has(key))return false;
  dedup.add(key);return true;
 }).sort((a,b)=>(b.volume24h??0)-(a.volume24h??0));
}
