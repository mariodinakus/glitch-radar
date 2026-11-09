/**
 * Freshness is measured against the provider's last quote timestamp, NEVER the
 * API request time. Weekends/holidays are tolerated for non-crypto markets.
 */
export type QuoteFreshness='current'|'stale'|'expired'|'unavailable';
export function quoteFreshness(symbol:string, timestamp:string|null|undefined, now:number):QuoteFreshness{
 if(!timestamp||!Number.isFinite(now)||now<=0)return 'unavailable';
 const at=Date.parse(timestamp);
 if(!Number.isFinite(at))return 'unavailable';
 const age=now-at;
 if(age< -3600000)return 'unavailable';
 if(age>30*86400000)return 'expired';
 const maxAge=/^(BTC|ETH|SOL)-USD$/.test(symbol)?48:120;
 return age>maxAge*3600000?'stale':'current';
}
