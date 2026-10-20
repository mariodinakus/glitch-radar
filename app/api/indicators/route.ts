import {NextResponse} from 'next/server';
import {INDICATORS} from '@/lib/indicators';
export const runtime='nodejs';
export const revalidate=300;

/** Live-ish global indicators (≈15-min delayed exchange data) via Yahoo Finance chart endpoint. */
type Quote={symbol:string;price:number|null;prev:number|null;change:number|null;currency:string|null;time:string|null;spark:number[]};
async function one(symbol:string):Promise<Quote>{
 for(const host of ['query1','query2']){
  const ctl=new AbortController();const tm=setTimeout(()=>ctl.abort(),7000);
  try{
   const r=await fetch(`https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`,{signal:ctl.signal,next:{revalidate:300},
    headers:{'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36','Accept':'application/json'}});
   if(!r.ok)continue;
   const d=await r.json() as {chart?:{result?:{meta?:{regularMarketPrice?:number;currency?:string;regularMarketTime?:number;chartPreviousClose?:number};indicators?:{quote?:{close?:(number|null)[]}[]}}[]}};
   const res=d.chart?.result?.[0];if(!res?.meta)continue;
   const closes=(res.indicators?.quote?.[0]?.close||[]).filter((x):x is number=>typeof x==='number'&&Number.isFinite(x));
   const price=res.meta.regularMarketPrice??closes.at(-1)??null;
   // previous session close: if the last close equals today's price, compare with the one before it
   let prev:number|null=closes.length>=2?closes.at(-2)!:res.meta.chartPreviousClose??null;
   if(closes.length>=1&&price!==null&&Math.abs(closes.at(-1)!-price)/price>0.0005)prev=closes.at(-1)!;
   const change=price!==null&&prev?((price-prev)/prev)*100:null;
   return {symbol,price,prev,change,currency:res.meta.currency||null,time:res.meta.regularMarketTime?new Date(res.meta.regularMarketTime*1000).toISOString():null,spark:closes.slice(-22)};
  }catch{}finally{clearTimeout(tm)}
 }
 return {symbol,price:null,prev:null,change:null,currency:null,time:null,spark:[]};
}
export async function GET(){
 const quotes=await Promise.all(INDICATORS.map(i=>one(i.symbol)));
 return NextResponse.json({updatedAt:new Date().toISOString(),quotes,source:'Yahoo Finance (καθυστέρηση ~15′)'},{headers:{'Cache-Control':'public, s-maxage=300, stale-while-revalidate=900'}});
}
