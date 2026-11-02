/**
 * Transparent mechanical reference model, NOT a validated investment forecast.
 * Last five log-return momentum projects a central path; dispersion uses
 * 20-session historical volatility. Bands are illustrative scenario ranges,
 * not calibrated probabilities or prediction intervals.
 */
export type MarketQuote={symbol:string;price:number|null;time:string|null;spark:number[]};
export type Outlook={symbol:string;asOf:string;observations:number;volatilityPct:number;momentumPct:number;direction:'up'|'down'|'flat';paths:{horizon:1|5;center:number;low:number;high:number}[];method:'momentum-vol-v1'};
export function marketOutlook(q:MarketQuote,now=new Date()):Outlook|null{
 const history=q.spark.filter(x=>Number.isFinite(x)&&x>0).slice(-22);
 if(history.length<12||q.price===null||!Number.isFinite(q.price)||q.price<=0||!q.time)return null;
 const last=Date.parse(q.time);
 const isCrypto=/^(BTC|ETH|SOL)-USD$/.test(q.symbol);
 if(!Number.isFinite(last)||last>now.getTime()+3600000||now.getTime()-last>(isCrypto?48:120)*3600000)return null;
 const returns=history.slice(1).map((x,i)=>Math.log(x/history[i])).filter(Number.isFinite);
 if(returns.length<10)return null;
 const mean=returns.reduce((a,b)=>a+b,0)/returns.length;
 const variance=returns.reduce((a,b)=>a+(b-mean)**2,0)/Math.max(1,returns.length-1);
 const vol=Math.sqrt(variance);
 if(!Number.isFinite(vol)||vol<0.000001)return null;
 const recent=returns.slice(-5);
 // Cap a short-term momentum extrapolation at 1x recent daily volatility.
 // This avoids explosive forecasts for brief spikes, not model calibration.
 const drift=Math.max(-vol,Math.min(vol,recent.reduce((a,b)=>a+b,0)/recent.length));
 const direction:Outlook['direction']=drift>vol*.2?'up':drift< -vol*.2?'down':'flat';
 const paths=([1,5] as const).map(horizon=>{
  const center=q.price!*Math.exp(drift*horizon);
  const band=1.645*vol*Math.sqrt(horizon);
  return {horizon,center,low:center*Math.exp(-band),high:center*Math.exp(band)};
 });
 return {symbol:q.symbol,asOf:q.time,observations:history.length,volatilityPct:vol*100,momentumPct:drift*100,direction,paths,method:'momentum-vol-v1'};
}
