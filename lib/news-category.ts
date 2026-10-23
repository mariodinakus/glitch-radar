import type {Category} from './types';

/**
 * Title-first RSS categorisation. The feed's section is a weak prior, not proof
 * of what an individual article reports. Excerpts are deliberately not used as
 * decisive evidence because they commonly mention secondary subjects.
 */
const health=/\b(cancers?|melanoma|tumou?rs?|vaccin(?:es?|ation)|patients?|hospitals?|medical|clinical trials?|diseases?|treatments?|therap(?:y|ies)|surgery|surgeons?|doctors?|medicines?|prescriptions?|drug approvals?|healthcare|nhs|covid|infections?)\b/i;
const economics=/\b(share prices?|stocks?|stock market|shares?|earnings|revenues?|profits?|losses|inflation|interest rates?|central banks?|gdp|recession|budgets?|tax(?:es|ation)?|tariffs?|investors?|market selloff|acquisitions?|mergers?|bankruptc(?:y|ies)|econom(?:y|ic|ics)|debt|trading|sales|funding|financ(?:e|ial|ing))\b/i;
const protest=/\b(protests?|protesters?|demonstrations?|riots?|rallies|anti-government|walkouts?|strikes? against|civil unrest|marches against)\b/i;
const disaster=/\b(earthquakes?|tsunamis?|flood(?:s|ing)?|wildfires?|hurricanes?|typhoons?|cyclones?|droughts?|heatwaves?|storm surges?|volcanic eruptions?)\b/i;
const climate=/\b(climate change|global warming|carbon emissions?|greenhouse gases?|ocean warming|extreme heat|environmental crisis)\b/i;
const tech=/\b(artificial intelligence|generative ai|machine learning|chatgpt|openai|anthropic|deepmind|large language models?|semiconductors?|microchips?|cybersecurity|ransomware|software|robotics?|data cent(?:er|re)s?|ai agents?)\b/i;
const energy=/\b(oil prices?|crude oil|gas prices?|renewable energy|solar power|wind farms?|electricity grid|nuclear reactors?|hydrogen fuel|energy markets?)\b/i;
const culture=/\b(film review|movie review|book review|album review|new trailer|box office|tv series|theatre production)\b/i;

export function classifyNews(base:Category,title:string,_summary=''):Category {
 const headline=title.trim();
 if(!headline)return base;
 if(base==='sports'||base==='culture'||base==='space')return base;
 // A market story about a health/technology business is still a market story.
 const financial=economics.test(headline);
 const medical=health.test(headline);
 if(medical&&!financial)return 'health';
 if(protest.test(headline)&&!financial)return 'world';
 if(disaster.test(headline)&&!financial)return 'climate';
 if(climate.test(headline)&&!financial)return 'climate';
 if(financial)return 'economy';
 if(energy.test(headline))return 'energy';
 if(tech.test(headline))return 'ai';
 if(culture.test(headline))return 'culture';
 if(base==='economy'&&/^(?:why|how|what to know about)\b/i.test(headline))return 'world';
 return base;
}
