'use client';
import {useEffect,useMemo,useState} from 'react';
import {ArrowUpRight,Clock3,Eye,RefreshCcw} from 'lucide-react';
import type {Story} from '@/lib/stories';
type Snapshot={at:string;urls:string[]};
const KEY='glitch.return-signal.v1';
function read():Snapshot|null{
 try{const v=JSON.parse(localStorage.getItem(KEY)||'null') as Snapshot|null;
  return v&&Array.isArray(v.urls)&&typeof v.at==='string'&&Number.isFinite(Date.parse(v.at))?v:null;
 }catch{return null}
}
function take(stories:Story[]):Snapshot{return {at:new Date().toISOString(),urls:stories.slice(0,350).map(s=>s.headline.url)}}
export default function ChangeRadar({stories,onOpen}:{stories:Story[];onOpen:(s:Story)=>void}){
 const [baseline,setBaseline]=useState<Snapshot|null>(null),[ready,setReady]=useState(false);
 useEffect(()=>{
  if(!stories.length||ready)return;
  const old=read();setBaseline(old);
  if(!old)try{localStorage.setItem(KEY,JSON.stringify(take(stories)))}catch{}
  setReady(true);
 },[stories,ready]);
 useEffect(()=>{
  if(!ready)return;
  const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(take(stories)))}catch{}};
  window.addEventListener('pagehide',save);return()=>window.removeEventListener('pagehide',save);
 },[stories,ready]);
 const fresh=useMemo(()=>{
  if(!baseline)return [];
  const known=new Set(baseline.urls);
  return stories.filter(s=>!known.has(s.headline.url)&&Date.parse(s.lastAt)>=Date.parse(baseline.at)-3600000)
   .sort((a,b)=>b.importance-a.importance||Date.parse(b.lastAt)-Date.parse(a.lastAt)).slice(0,24);
 },[stories,baseline]);
 const ack=()=>{const next=take(stories);try{localStorage.setItem(KEY,JSON.stringify(next))}catch{}setBaseline(next)};
 return <section className="change-radar" aria-label="News since last visit">
  <div className="cr-header"><div><span className="cr-eyebrow"><Clock3 size={14}/> GLITCH / THE RETURN SIGNAL</span><h2>What changed since you left<em>?</em></h2>
   <p>{baseline?'Compared with the saved headlines from '+new Date(baseline.at).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'}):'First visit establishes your baseline. On your next visit, the developments you missed will appear here.'}</p></div>
   <div className="cr-count"><strong>{baseline?fresh.length:'—'}</strong><span>{baseline?'new stories sampled':'first session'}</span></div>
  </div>
  <div className="cr-stories">{fresh.length?fresh.slice(0,4).map(s=><button className="cr-story" key={s.id} onClick={()=>onOpen(s)}><span className="cr-dot"/><div><small>{s.headline.source} · {s.sources.length} sampled publishers</small><strong>{s.headline.title}</strong></div><ArrowUpRight size={17}/></button>):
   <p className="cr-empty"><Eye size={15}/> {baseline?'No newly sampled headline groups since your previous visit. This is not a complete world-news history.':'Your private news comparison will start with this session.'}</p>}</div>
  <div className="cr-bottom"><small>Browser-local snapshot · identifies new headlines, not verified changes in the underlying event</small>
   {baseline&&<button onClick={ack}><RefreshCcw size={14}/> Mark caught up</button>}</div>
 </section>;
}