import type {QuakeBaseline} from './intelligence';
// Source: USGS GeoJSON weekly M4.5 feed. Exact seven-day snapshot (UTC timestamps).
type Week={features?:{properties:{time:number;mag:number}}[]};
export async function getQuakeBaseline():Promise<QuakeBaseline|null>{const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),6500);try{
 const res=await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson',{next:{revalidate:900},signal:controller.signal});if(!res.ok)return null;
 const json=await res.json() as Week;const time=Date.now(),recent=time-86400000,week=time-7*86400000;
 const relevant=(json.features||[]).filter(x=>Number.isFinite(x.properties.time)&&x.properties.time>=week&&Number.isFinite(x.properties.mag)&&x.properties.mag>=4.5);
 const current24h=relevant.filter(x=>x.properties.time>=recent).length;const previous6Days=relevant.filter(x=>x.properties.time<recent).length;
 const dailyBaseline=previous6Days/6;return {current24h,previous6Days,dailyBaseline,ratio:dailyBaseline?current24h/dailyBaseline:0,sampleDays:7,cutoffMagnitude:4.5,updatedAt:new Date(time).toISOString()};
 }catch{return null}finally{clearTimeout(timeout)}}
