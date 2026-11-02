'use client';
import {useEffect,useMemo,useState} from 'react';
import {Activity,ArrowRight,CalendarDays,Clock3,ExternalLink,RefreshCw,ShieldAlert,TrendingUp} from 'lucide-react';
import {INDICATORS,indicatorBySymbol} from '@/lib/indicators';
import type {IndicatorGroup} from '@/lib/indicators';
import {marketOutlook,type MarketQuote} from '@/lib/market-outlook';
import type {CalendarEvent} from '@/lib/economic-calendar';
import css from './MarketIntelligence.module.css';
import MacroNowStrip from './MacroNowStrip';

type Props={quotes:MarketQuote[];compact?:boolean;onExpand?:()=>void};
type CalendarResponse={generatedAt:string;horizonDays:number;events:CalendarEvent[];sources:{name:string;status:'ok'|'unavailable';url:string}[];methodology:string};
const FOCUS=['^GSPC','^STOXX50E','BZ=F','EURUSD=X','BTC-USD','ETH-USD'];
const EXPANDED=['^GSPC','^IXIC','^STOXX50E','GD.AT','BZ=F','CL=F','TTF=F','GC=F','EURUSD=X','USDJPY=X','BTC-USD','ETH-USD','SOL-USD'];
const MARKET_FILTERS:{id:'featured'|'all'|IndicatorGroup;label:string}[]=[
 {id:'featured',label:'Key movers'},{id:'indices',label:'Stock indices'},{id:'energy',label:'Energy'},{id:'metals',label:'Commodities'},
 {id:'fx',label:'Currencies'},{id:'crypto',label:'Crypto'},{id:'risk',label:'Rates & risk'},{id:'all',label:'All markets'}
];
const FORECAST_SYMBOLS=['^GSPC','^STOXX50E','GD.AT','BZ=F','CL=F','EURUSD=X','BTC-USD','ETH-USD','SOL-USD'];
const number=(v:number,digits=2)=>v.toLocaleString('en-GB',{minimumFractionDigits:digits,maximumFractionDigits:digits});
function formatPrice(symbol:string,v:number):string{
 const spec=indicatorBySymbol(symbol);
 const digits=spec?.digits??(v>=1000?0:v<10?4:2);
 const value=number(v,digits);
 return spec?.unit==='%'?value+'%':spec?.unit==='¢'?value+'¢':(spec?.unit||'')+value;
}
const dateDisplay=(iso:string,precise=true)=>new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',timeZone:'Europe/Athens',...(precise?{hour:'2-digit',minute:'2-digit'}:{})}).format(new Date(iso));
const countdown=(at:string,now:number)=>{
 if(!now)return '—';
 const minutes=Math.max(0,Math.ceil((Date.parse(at)-now)/60000));
 return minutes<60?'in '+minutes+'m':minutes<1440?'in '+Math.floor(minutes/60)+'h '+minutes%60+'m':'in '+Math.ceil(minutes/1440)+'d';
};
export default function MarketIntelligence({quotes,compact=false,onExpand}:Props){
 const [calendar,setCalendar]=useState<CalendarResponse|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState(false);
 const [horizon,setHorizon]=useState<7|30|45>(7);
 const [marketGroup,setMarketGroup]=useState<'featured'|'all'|IndicatorGroup>('featured');
 const [selection,setSelection]=useState<string>('^GSPC');
 const [forecastDays,setForecastDays]=useState<1|5>(5);
 const [now,setNow]=useState(0);
 useEffect(()=>{
  setNow(Date.now());
  const id=setInterval(()=>{if(document.visibilityState==='visible')setNow(Date.now())},60000);
  return()=>clearInterval(id);
 },[]);
 useEffect(()=>{
  let alive=true;const controller=new AbortController();
  const update=async()=>{
   try{
    const response=await fetch('/api/economic-calendar',{signal:controller.signal});
    if(!response.ok)throw Error('Economic calendar not available');
    const payload=await response.json() as CalendarResponse;
    if(alive){setCalendar(payload);setError(false)}
   }catch{if(alive&&!controller.signal.aborted)setError(true)}
   finally{if(alive)setLoading(false)}
  };
  void update();
  const id=setInterval(()=>{if(document.visibilityState==='visible')void update()},30*60000);
  return()=>{alive=false;clearInterval(id);controller.abort()};
 },[]);
 const quoteMap=useMemo(()=>new Map(quotes.map(q=>[q.symbol,q])),[quotes]);
 const selectedQuote=quoteMap.get(selection);
 const model=useMemo(()=>selectedQuote?marketOutlook(selectedQuote,now?new Date(now):new Date()):null,[selectedQuote,now]);
 const scenario=model?.paths.find(p=>p.horizon===forecastDays);
 const upcoming=useMemo(()=>calendar?.events.filter(e=>Date.parse(e.at)>now-60000&&Date.parse(e.at)<now+horizon*86400000).slice(0,compact?3:14)||[],[calendar,horizon,compact,now]);
 const availableSources=calendar?.sources.filter(s=>s.status==='ok').length??0;
 const chosen=compact?FOCUS:marketGroup==='featured'?EXPANDED:marketGroup==='all'?INDICATORS.map(i=>i.symbol):INDICATORS.filter(i=>i.group===marketGroup).map(i=>i.symbol);
 return <section className={css.root} aria-label="GLITCH Market Intelligence">
  <div className={css.heading}>
   <div>
    <span className={css.eyebrow}><Activity size={13}/> GLITCH / MARKET INTELLIGENCE</span>
    <h2>{compact?'Markets & what’s next':'Markets. Signals. What comes next.'}<em>.</em></h2>
    <p>{compact?'Market prices and the next major economic releases.':'Stocks · oil & gas · currencies · crypto · official releases · statistical scenarios'}</p>
   </div>
   {compact&&onExpand&&<button className={css.expand} onClick={onExpand}>Explore markets <ArrowRight size={15}/></button>}
  </div>
  {!compact&&<div className={css.marketFilters} role="group" aria-label="Market categories">{MARKET_FILTERS.map(filter=><button key={filter.id} aria-pressed={marketGroup===filter.id} className={marketGroup===filter.id?css.marketFilterActive:''} onClick={()=>setMarketGroup(filter.id)}>{filter.label}</button>)}</div>}
  <div className={css.quoteGrid}>
   {chosen.map(symbol=>{
    const q=quoteMap.get(symbol);const name=indicatorBySymbol(symbol)?.en||symbol;
    const changed=q?.change??null;
    const raw=(q?.time&&now)?now-Date.parse(q.time):null;
    const stale=raw!==null&&(raw<0||raw>(/^(BTC|ETH|SOL)-USD$/.test(symbol)?48:120)*3600000);
    return <a className={css.quote} key={symbol} href={'https://finance.yahoo.com/quote/'+encodeURIComponent(symbol)} target="_blank" rel="noopener noreferrer">
     <div className={css.quoteTop}><span>{name}</span><ExternalLink size={11}/></div>
     <strong>{q?.price!==null&&q?.price!==undefined?formatPrice(symbol,q.price):'—'}</strong>
     <div className={css.quoteFoot}>
      <span className={changed===null?'':changed>=0?css.up:css.down}>{changed===null?'NO DATA':(changed>0?'+':'')+number(changed)+'%'}</span>
      <span>{!q?.time?'UNAVAILABLE':stale?'STALE':dateDisplay(q.time)}</span>
     </div>
    </a>;
   })}
  </div>
  <MacroNowStrip compact={compact}/>
  {!compact&&<div className={css.forecast}>
   <div className={css.sectionHeading}>
    <div><span className={css.eyebrow}><TrendingUp size={13}/> FORECAST RADAR / EXPERIMENTAL</span><h3>Statistical scenarios, not certainties</h3></div>
    <div className={css.switch}>{([1,5] as const).map(day=><button key={day} className={forecastDays===day?css.active:''} onClick={()=>setForecastDays(day)} aria-pressed={forecastDays===day}>{day===1?'1 session':'5 sessions'}</button>)}</div>
   </div>
   <div className={css.symbols}>{FORECAST_SYMBOLS.map(symbol=><button key={symbol} aria-pressed={selection===symbol} className={selection===symbol?css.selected:''} onClick={()=>setSelection(symbol)}>{indicatorBySymbol(symbol)?.en||symbol}</button>)}</div>
   {model&&scenario&&selectedQuote?.price!==null&&selectedQuote?.price!==undefined?<div className={css.scenario}>
    <div className={css.signal}><small>MECHANICAL BASELINE</small><b>{formatPrice(selection,scenario.center)}</b><span>Observed: {formatPrice(selection,selectedQuote.price)}</span></div>
    <div className={css.signal}><small>ILLUSTRATIVE RANGE</small><b>{formatPrice(selection,scenario.low)} – {formatPrice(selection,scenario.high)}</b><span>{forecastDays} {(/^(BTC|ETH|SOL)-USD$/.test(selection)?'calendar days':'trading sessions')} · NOT a probability interval</span></div>
    <div className={css.signal}><small>RECENT MOMENTUM</small><b>{model.direction==='up'?'UPWARD':model.direction==='down'?'DOWNWARD':'MIXED'}</b><span>Daily historical volatility: {number(model.volatilityPct)}%</span></div>
   </div>:<div className={css.empty}><ShieldAlert size={16}/> Current, sufficient price history is unavailable for this symbol. No forecast displayed.</div>}
   <p className={css.disclaimer}>Method: last 5 daily log returns (momentum, capped at one daily historical standard deviation), 10–21 daily returns (volatility), ±1.645 × stdev × √h as an illustrative range. Not backtested or calibrated; news, gaps and market regime changes can invalidate it. 5 sessions are not necessarily 5 calendar days. Not financial advice.</p>
  </div>}
  <div className={css.calendar}>
   <div className={css.sectionHeading}>
    <div><span className={css.eyebrow}><CalendarDays size={13}/> OFFICIAL ECONOMIC CALENDAR</span><h3>Coming up next</h3><p>See when the next major releases are scheduled — Athens time (Europe/Athens).</p></div>
    {!compact&&<div className={css.switch}>{([7,30,45] as const).map(days=><button key={days} className={horizon===days?css.active:''} aria-pressed={horizon===days} onClick={()=>setHorizon(days)}>{days}d</button>)}</div>}
   </div>
   {calendar&&<div className={css.sourceLine}><Clock3 size={13}/> {availableSources}/{calendar.sources.length} official schedules available · Checked {dateDisplay(calendar.generatedAt)}</div>}
   {(loading&&!calendar)&&<div className={css.empty}><RefreshCw size={15}/> Checking official release schedules…</div>}
   {(error||calendar?.sources.some(s=>s.status!=='ok'))&&<div className={css.warning}>Some official calendars are unavailable. Only verified returned events are shown.</div>}
   {(!loading&&!upcoming.length)&&<div className={css.empty}>No confirmed events found in this {compact?'upcoming':horizon+'-day'} window. No dates have been estimated.</div>}
   <div className={css.eventList}>{upcoming.map(event=><a className={css.event} key={event.id} href={event.sourceUrl} target="_blank" rel="noopener noreferrer">
    <div className={css.eventDate}><strong>{dateDisplay(event.at,event.precision==='minute')}</strong><small>{countdown(event.at,now)}</small></div>
    <div className={css.eventText}><div><span className={css.source}>{event.source} · UNITED STATES</span>{event.importance==='high'&&<span className={css.high}>HIGH IMPACT WATCH</span>}</div><strong>{event.title}</strong>{!compact&&<small>Watch: {event.watch}</small>}</div>
    <ExternalLink size={14}/>
   </a>)}</div>
   <div className={css.links}><a href="https://ec.europa.eu/eurostat/web/main/news/euro-indicators/release-calendar" target="_blank" rel="noopener noreferrer">Eurostat calendar ↗</a><a href="https://www.ecb.europa.eu/press/calendars/mgcgc/html/index.en.html" target="_blank" rel="noopener noreferrer">ECB meetings ↗</a><a href="https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm" target="_blank" rel="noopener noreferrer">Fed meetings ↗</a></div>
   <p className={css.disclaimer}>Dates come from official BEA/BLS feeds and can change. US release coverage only; ECB, Eurostat and Fed are linked for confirmation, not silently mixed into the automated calendar. Updates approximately hourly while available. Market quotes come from Yahoo Finance and may be delayed, unavailable or stale.</p>
  </div>
 </section>;
}
